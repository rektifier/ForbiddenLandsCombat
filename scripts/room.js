var isRoomAdmin = false;
var currentUser;
var currentRoom;
var latestMessage = '';
var userMessages = {};
var currentRoomName;
var adminAction = '';
var isInCombat = false;






function updateDbWithUserListOrder() {
    console.log('updateDbWithUserListOrder()');

    var users = {};
    if ($("#userslist li").each(function (index) {
        var text = $(this).attr('id');

        var name = $(this).ignore("a").text();
        var isInCombat = $(this).hasClass('incombat');
        users[text] = { "name": name, "sortOrder": index, "inCombat": isInCombat }
    }));

    database.ref('rooms/' + currentRoomName + '/users/').update(users);
}


function addUserToList(key, user) {

    console.log('addUserToList(' + user.name + ')');

    var exists = false;
    if ($("#userslist li").each(function (index) {

        var text = $(this).attr('id');
        if (text == key) {
            exists = true;
        }
    }));

    console.log('addUserToList(' + user.name + ') exists: ' + exists);

    if (exists === false) {

        var combatClass = '';
        var fightBtn = '';

        if (isRoomAdmin) {
            fightBtn = '<a href="javascript:void(0)" class="badge badge-warning btn-user-fight">Fight</a>';
        }

        if (user.inCombat) {
            combatClass = 'incombat';
        }

        $("#userslist").append('<li id="' + key + '" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center ' + combatClass + '">' + user.name + fightBtn + '</li>');

    }
}

function removeUserFromList(username) {
    console.log('removeUserFromList(' + username + ')');

    var user = $("#userslist").find('li#' + username);
    if (user !== 'undefined' && user !== null && user.length > 0) {
        $(user).remove();
    }
}

function redirectToLogin() {
    window.location.href = "index.html";
}

function initGame() {

    console.log('init game');

    var messageRef = database.ref('rooms/' + currentRoomName + '/message/');
    var usersRef = database.ref('rooms/' + currentRoomName + '/users/');
    var currentUserRef = database.ref('rooms/' + currentRoomName + '/users/' + currentUser.displayName);

    var conflictRef = database.ref('rooms/' + currentRoomName + '/conflict/');

    //get user if we have one
    //
    currentUserRef.once("value").then(function (snapshot) {
        console.log('currentUserRef.once');

        if (snapshot.exists()) {
            var user = snapshot.val();
            userMessages = user.messages;
        } else {
            database.ref('rooms/' + currentRoom.name + '/users/' + currentUser.displayName).set({ "name": currentUser.displayName, "messages": {}, "sortOrder": 99, "inCombat": false });
        }
    });

    currentUserRef.onDisconnect().remove();

    messageRef.on('value', function (snapshot) {
        console.log('message.on');
        var message = snapshot.val();

        if (message !== latestMessage) {
            //showAlert.displayInfo(message);
            showAlert.displayInfo(message);
        }
    });

    //remove user when disconnected
    //
    usersRef.on("child_removed", function (snapshot) {
        console.log('on.child_removed');
        var removedUser = snapshot.val();

        database.ref('rooms/' + currentRoomName + '/conflict/' + snapshot.key).remove();

        if (snapshot.key === currentUser.displayName && isRoomAdmin === false) {
            redirectToLogin();
        }
    });

    usersRef.orderByChild("sortOrder").on("value", function (querySnapshot) {
        console.log('on.sortOrder');

        $("#userslist").empty();

        querySnapshot.forEach(function (userSnapshot) {
            var userId = userSnapshot.key;
            var user = userSnapshot.val();
            console.log(user);

            addUserToList(userId, user);


        });

    });

    conflictRef.on('value', function (conflictSnapshot) {

        console.log('conflict');

        hidePlaygrounds();

        $("#userslist li").removeClass('incombat');
        $(".btn-select-card").prop('disabled', true);

        isInCombat = false;

        conflictSnapshot.forEach(function (userSnap) {


            var userId = userSnap.key;
            var conflictData = userSnap.val();
            var isEnemy = false;

            var menuitem = $("#userslist").find('li#' + userId);
            $(menuitem).addClass('incombat');

            var combatEnemy = menuitem.filter(":contains('" + roomConfig.enemyNameSuffix + "')").first();
            var isAdminEnemy = combatEnemy !== undefined && combatEnemy.length > 0 && isRoomAdmin;

            if (userId === currentUser.displayName || isAdminEnemy) {
                isInCombat = true;
            }

            //get the selected enemy
            //
            if (combatEnemy !== undefined && combatEnemy.length > 0) {
                isEnemy = true;
            }

            if (isInCombat === true) {
                $(".btn-select-card").prop('disabled', false);
            }

            var playground = detectPlayground();
            showPlayground(userId);

            if (conflictData.cards !== undefined) {

                var cards = Object.keys(conflictData.cards).map(i => conflictData.cards[i]);

                cards.forEach(function (card) {

                    var cardImg = fightingCards['baksida'];

                    if (userId === currentUser.displayName || card.isVisible === true || isEnemy === true && isRoomAdmin === true) {
                        cardImg = fightingCards[card.cardid];
                    }

                    $(playground).find(".card-played-" + card.sortOrder).show();
                    $(playground).find(".card-played-" + card.sortOrder).attr('src', cardImg.src);

                    //de/activate buttons 
                    if (isInCombat && userId === currentUser.displayName || isEnemy === true && isRoomAdmin === true) {

                        //remove active on all group buttons
                        $(".btn-select-card-" + card.sortOrder).removeClass('active');
                        $(".btn-select-card-" + card.sortOrder).prop('disabled', true);

                        //add active on the clicked button
                        $("#" + card.cardid + card.sortOrder).addClass('active');
                        $("#" + card.cardid + card.sortOrder).prop('disabled', false);
                    }
                });
            }


        });

    });
}

function showPlayground(owner) {

    var currentPlayground = detectPlayground(owner);

    if (currentPlayground !== null) {
        $(currentPlayground).show();

        $(currentPlayground).find(".playground-title").text(owner);
        $(currentPlayground).find(".card-played-1").hide();
        $(currentPlayground).find(".card-played-2").hide();
    }
}

function detectPlayground(owner) {
    for (let index = 1; index < 3; index++) {
        if ($("#playground-player-" + index).is(":visible")) {
            var title = $("#playground-player-" + index + " .playground-title").text();
            if (title == owner) {
                return $("#playground-player-" + index);
            }
        } else {
            return $("#playground-player-" + index);
        }
    }
    return null;
}

function hidePlaygrounds() {

    $("#playground-player-1").hide();
    $("#playground-player-2").hide();

    //$("#playground-player-1 .card-played-1").attr('src','images/baksida.jpg');
    //$("#playground-player-1 .card-played-2").attr('src','images/baksida.jpg');


}

function validateSelectedCards(firstCard,secondCard){
    var response = true;

    switch(firstCard){
        case typeOfCards.attackera:
            if(secondCard === typeOfCards.dubblera)
                return false;
    }

    return response;
}

$(document).ready(function () {

    currentRoomName = getParameterByName('room');
    if (currentRoomName === null || currentRoomName === "") {// || currentUser === undefined || currentUser.displayName === '') {
        redirectToLogin();
    }

    $("#info-alert").hide();
    $(".admingroup").hide();
    $(".btn-select-card").prop('disabled', true);

    hidePlaygrounds();

    // user logged in
    //
    firebase.auth().onAuthStateChanged(function (user) {

        if (user) {
            window.user = user;

            currentuser = user;

            //load current room
            //
            database.ref('rooms/' + currentRoomName).once("value").then(function (snapshot) {

                if (snapshot.exists()) {

                    currentRoom = snapshot.val();

                    $("#roomNameHeader").html('<strong>' + currentRoomName + ' <small>( owned by ' + currentRoom.owner + ' )</small></strong>');

                    //load current user
                    //
                    currentUser = firebase.auth().currentUser;
                    if (currentUser != null) {

                        $("#navbarDropdown").text(currentUser.displayName);
                        //is the logged in user the room admin?
                        //
                        if (currentRoom.owner === currentUser.displayName) {
                            isRoomAdmin = true;
                            activateAdminFeatures();
                        }

                        initGame();
                    } else {
                        redirectToLogin();
                    }

                } else {
                    redirectToLogin();
                }
            });
        } else {
            redirectToLogin();
            window.user = null;
        }
    });

    //leave the room
    //
    $("#leave-room-button").click(function (e) {
        console.log('leave room');
        e.preventDefault();

        database.ref('rooms/' + currentRoom.name + '/conflict/' + currentUser.displayName).remove();
        database.ref('rooms/' + currentRoom.name + '/users/' + currentUser.displayName).remove();

        redirectToLogin();

    });

    // select card button
    //
    $(".btn-select-card").click(function (e) {
        console.log('btn-select-card.click ');
        e.preventDefault();

        var cardId = $(this).data('cardid');
        var nrOfCard = $(this).data('cardnr');

        var isAlreadyActive = $(this).hasClass('active');

        // //set up rules for dubblera and attackera
        // //
        // if (isAlreadyActive == false) {

        //     //only check rules when we activate a card
        //     //

        //     //get the already active card
        //     //
        //     var activeBtn = $(".btn-select-card.active").first();

        //     if (activeBtn){
        //         var activeBtnCardId = $(activeBtn).data('cardid');
        //         var activeBtnNr = $(activeBtn).data('cardnr');



        //         if(activeBtnCardId == typeOfCards.attackera && cardi == typeOfCards.dubblera){
        //             //Error
        //             console.log('Du kan inte välja Dubblera om du redan har valt Attackera');
        //         }

        //     }

        // }

        var currentFighter = currentUser.displayName;
        if (isRoomAdmin) {

            //get the selected enemy89
            var combatEnemy = $("#userslist .incombat").filter(":contains('" + roomConfig.enemyNameSuffix + "')").first();
            if (combatEnemy !== undefined) {
                currentFighter = combatEnemy.attr('id');
            }
        }

        if (isAlreadyActive) {

            // remove card            
            $(".btn-select-card-" + nrOfCard).prop('disabled', false);
            $(this).toggleClass('active');

            database.ref('rooms/' + currentRoomName + '/conflict/' + currentFighter + '/cards/' + cardId).remove();

        } else {

            //only check rules when we activate a card
            //

            //get the already active card
            //
            var activeBtn = $(".btn-select-card.active").first();

            if (activeBtn.length > 0){
                var activeBtnCardId = $(activeBtn).data('cardid');
                var activeBtnNr = $(activeBtn).data('cardnr');

                // if(activeBtnCardId == typeOfCards.attackera && cardId == typeOfCards.dubblera){
                //     //Error
                //     console.log('Du kan inte välja Dubblera om du redan har valt Attackera');

                //     //show message
                //     return;
                // }
            }

            // add card
            $(".btn-select-card-" + nrOfCard).prop('disabled', true);
            $(this).prop('disabled', false);
            $(this).toggleClass('active');

            var fightcard = fightingCards[cardId];

            database.ref('rooms/' + currentRoomName + '/conflict/' + currentFighter + '/cards/' + cardId).set({ "isVisible": false, "cardid": cardId, "name": fightcard.name, "sortOrder": nrOfCard });

        }
    });


    //admin fearures
    //
    function activateAdminFeatures() {

        $(".btn-select-card").prop('disabled', false);

        $(".admingroup").show();

        $("#userslist").sortable({
            delay: 150,
            axis: "y",
            opacity: 0.8,
            connectWith: "ul",
            sort: function () {
                if ($(this).hasClass("cancel")) {
                    $(this).sortable("cancel");
                }
            },
            update: function (event, ui) {
                console.log('userslist.sortable update event ');
                if (adminAction === '') {
                    updateDbWithUserListOrder();
                }
            },
            stop: function (event, ui) {
                console.log('userslist.sortable stop event ');
                if (adminAction === 'killFighter') {
                    $(this).sortable("cancel");

                    var userToKick = ui.item[0].id

                    database.ref('rooms/' + currentRoom.name + '/users/' + userToKick).remove();
                    adminAction = '';
                }

            },
            receive: function (event, ui) {
                console.log('userslist.sortable stop event ');
            },
            remove: function (event, ui) {
                console.log('userslist.sortable remove event ');
            }

        }).disableSelection();

        $(".list-group-item").draggable({
            helper: 'clone',
            revert: 'invalid',
            connectToSortable: "#userslist"
        }).disableSelection();

        $(".list-group-item-action").droppable({
            classes: {
                "ui-droppable-active": "ui-state-highlight",
                "ui-droppable-hover": "bg-danger"
            },
            drop: function (event, ui) {
                console.log('kickActionDroppable.droppable drop event ');
                adminAction = 'killFighter';
            }
        });


        // ############## click events ##############
        //
        $("#btn-start-fight").click(function (e) {
            console.log('brt-fight!');

            var nr1CardsPlayed = $(".card-played-1:visible").length;
            var nr2CardsPlayed = $(".card-played-2:visible").length;

            var is1CardsFlipped = $('.card-played-1:visible img[src*="baksida"]');
            var is2CardsFlipped = $('.card-played-2:visible img[src*="baksida"]');



            if (nr1CardsPlayed.length === 2) {
                //set cards 1 = visible
            } else {
                //set cards 1 = visible
            }
        });

        //fight button in users list
        //
        $("#userslist").on('click', 'a', function () {

            console.log('click.btn-user-fight');

            var li = $(this).parent();

            $(li).toggleClass('incombat');

            var nrOfPlayersInFight = $("#userslist .incombat").length;
            if (nrOfPlayersInFight > roomConfig.maxNrOfPlayersInFight) {
                //toggle back the combat class
                //
                $(li).toggleClass('incombat');

            } else {
                var isInCombat = $(li).hasClass('incombat');
                var user = $(li).attr('id');

                firebase.database().ref().child('/rooms/' + currentRoom.name + '/users/' + user).update({ inCombat: isInCombat });

                if (isInCombat === true) {
                    //add user to combat
                    firebase.database().ref().child('/rooms/' + currentRoom.name + '/conflict/' + user).set({ "userid": user });
                } else {
                    //remove user from combat
                    firebase.database().ref().child('/rooms/' + currentRoom.name + '/conflict/' + user).remove();
                }
            }

            console.log(li);
        });

        $("#add-enemy-button").click(function (e) {

            console.log('add-enemy-button.click ');
            e.preventDefault();

            var enemyName = $("#add-enemy-input").val();

            //add enemy to room
            //
            database.ref('rooms/' + currentRoom.name + '/users/' + enemyName).set({ "name": roomConfig.enemyNamePrefix + enemyName + roomConfig.enemyNameSuffix, "sortOrder": 99, "inCombat": false }).then(() => {
                $("#add-enemy-input").val('');
            });
        });

        $("#btn-random-initiative").click(function (e) {

            console.log('btn-random-initiative.click ');
            e.preventDefault();

            var userList = $("#userslist li");

            if ($(userList).length > 1) {
                shuffleArray(userList);

                var users = {};
                if ($(userList).each(function (index) {
                    var text = $(this).attr('id');

                    var name = $(this).ignore("a").text();
                    var isInCombat = $(this).hasClass('incombat');
                    users[text] = { "name": name, "sortOrder": index, "inCombat": isInCombat }
                }));

                database.ref('rooms/' + currentRoomName + '/users/').update(users);
            }
        });




    }

});