var isRoomAdmin = false;
var currentUser;
var currentRoom;
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

function sendMessage(text){

    database.ref('messages/' + currentRoomName).push({

        createdOn: firebase.database.ServerValue.TIMESTAMP,
        message: text,
        sender:currentUser.displayName

    }).catch(function(error){
        console.error('Error writing new message to Firebase Database', error);
    });
}

function sendDiceRoll(text){

    database.ref('dicerolls/' + currentRoomName).push({

        createdOn: firebase.database.ServerValue.TIMESTAMP,
        message: text,
        sender:currentUser.displayName

    }).catch(function(error){
        console.error('Error writing new message to Firebase Database', error);
    });
}

function createChatMessage(sender,message,createdOn){
    var messageTemplate = '<li class="list-group-item-light"><div class="chat-body1"><p><small>'+sender+':<br>'+message+'<i><br>('+createdOn+')</i></small></p></div></li>';
    return messageTemplate;
}

function createDiceRollsMessage(sender,message,createdOn){
    var messageTemplate = '<li class="list-group-item-light"><div class="chat-body1"><p><small>'+sender+':<br>'+message+'<i><br>('+createdOn+')</i></small></p></div></li>';
    return messageTemplate;
}

function scrollChatMessagesToBottom() {
    var list = document.getElementById('chat-messages');
    if(list !== null){
        list.scrollTop = list.scrollHeight;
    }    
}
function scrollDiceRollsToBottom() {
    var list = document.getElementById('dicerolls-messages');
    if(list !== null){
        list.scrollTop = list.scrollHeight;
    }    
}
function appendChatMessage(message,sender,createdOn){
    var messDate = moment(createdOn).format('YYYY-MM-DD kk:mm');
    var result = createChatMessage(sender,message, messDate);
    $('#chat-messages').append(result);  
}
function appendDiceRollsMessage(message,sender,createdOn){
    var messDate = moment(createdOn).format('YYYY-MM-DD kk:mm');
    var result = createDiceRollsMessage(sender,message, messDate);
    $('#dicerolls-messages').append(result);  
}

function initGame() {

    console.log('init game');

    var diceRollsRef = database.ref('dicerolls/' + currentRoomName);
    var messageRef = database.ref('messages/' + currentRoomName);
    var usersRef = database.ref('rooms/' + currentRoomName + '/users/');
    var conflictRef = database.ref('rooms/' + currentRoomName + '/conflict/');

    if(isRoomAdmin === false)
    {
        var currentUserRef = database.ref('rooms/' + currentRoomName + '/users/' + currentUser.displayName);
    
        //get user if we have one
        //
        currentUserRef.once("value").then(function (snapshot) {
            console.log('currentUserRef.once');
    
            if (snapshot.exists()) {
                var user = snapshot.val();
            } else {
                database.ref('rooms/' + currentRoom.name + '/users/' + currentUser.displayName).set({ "name": currentUser.displayName, "messages": {}, "sortOrder": 99, "inCombat": false });
            }
        });
    
        currentUserRef.onDisconnect().remove();
    }

    
    var startOfDay = moment().startOf('day').valueOf();//unix time format ( ms ) //.format("x");
    var startNow = moment().valueOf();
    //chat messages
    //
    messageRef.orderByChild('createdOn').startAt(startOfDay).once("value").then(function (snapshot) {
        console.log('messageRef.orderByChild(createdOn).startAt(startOfDay).once');
        if (snapshot.exists()) {
            snapshot.forEach(function (messSnap) {
                var mess = messSnap.val();
                appendChatMessage(mess.message,mess.sender,mess.createdOn);
            });
            scrollChatMessagesToBottom();            
        }
    });
    
    messageRef.orderByChild('createdOn').startAt(startNow).on('child_added', function(snapshot) {
        console.log('messageRef.orderByChild(createdOn).startAt(startNow).on(child_added');
        var mess = snapshot.val();
        appendChatMessage(mess.message,mess.sender,mess.createdOn);
        scrollChatMessagesToBottom();
    });

    //dice rolls
    //
    diceRollsRef.orderByChild('createdOn').startAt(startOfDay).once("value").then(function (snapshot) {
        console.log('diceRollsRef.orderByChild(createdOn).startAt(startOfDay).once');
        if (snapshot.exists()) {
            snapshot.forEach(function (messSnap) {
                var mess = messSnap.val();
                appendDiceRollsMessage(mess.message,mess.sender,mess.createdOn);
            });
            scrollDiceRollsToBottom();            
        }
    });
    
    diceRollsRef.orderByChild('createdOn').startAt(startNow).on('child_added', function(snapshot) {
        console.log('diceRollsRef.orderByChild(createdOn).startAt(startNow).on(child_added');
        var mess = snapshot.val();
        appendDiceRollsMessage(mess.message,mess.sender,mess.createdOn);
        scrollDiceRollsToBottom();
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

            if(!(isRoomAdmin && userId === currentUser.displayName)){
                addUserToList(userId, user);
            }
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
                    $(playground).find(".card-played-" + card.sortOrder).attr('data-cardid', card.cardid);
                    $(playground).find(".card-played-" + card.sortOrder).attr('data-owner', userId);

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
    
    const roller = new DiceRoller();

    currentRoomName = getParameterByName('room');
    if (currentRoomName === null || currentRoomName === "") {// || currentUser === undefined || currentUser.displayName === '') {
        redirectToLogin();
    }

    $("#info-alert").hide();
    $(".admingroup").hide();
    $('#settings-button').hide();
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
                    


                    //$("#roomNameHeader").html('<strong>' + currentRoomName + ' <small>( owned by ' + currentRoom.owner + ' )</small></strong>');

                    $("#roomNameHeader").html('<strong>' + currentRoom.name + '</strong><blockquote class="blockquote"><p class="mb-0" id="roomTitle"><small>'+currentRoom.title+'</small></p><footer class="blockquote-footer"a><small>' + currentRoom.owner + ' in <cite title="Source Title">Svärdets Sång</cite></small></footer></blockquote>');

                    //load current user
                    //
                    currentUser = firebase.auth().currentUser;
                    if (currentUser != null) {

                        $("#navbarDropdown").text(currentUser.displayName);
                        //is the logged in user the room admin?
                        //
                        if (currentRoom.owner === currentUser.displayName) {
                            isRoomAdmin = true;

                            $("#settingsRoomOwner").val(currentRoom.owner);
                            $("#settingsRoomName").val(currentRoom.name);
                            $("#settingsRoomTitle").val(currentRoom.title);
                            
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

        $("body").css("cursor", "progress");

        //if its a regular user, remove user from the room
        //and redirect to index
        //
        if(isRoomAdmin === false){
            database.ref('rooms/' + currentRoom.name + '/conflict/' + currentUser.displayName).remove().then();
            database.ref('rooms/' + currentRoom.name + '/users/' + currentUser.displayName).remove().then();
        }
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


    $("#btn-throw-dice").click(function (e) {
        console.log('btn-throw-dice.click');
        e.preventDefault();

        //get nr of red
        var nrOfDiceGE = $('input[name=dice-ge]:checked').val();
        var nrOfDiceFV = $('input[name=dice-fv]:checked').val();
        var nrOfDiceVA = $('input[name=dice-va]:checked').val();

        var totalResult = '';

        //get nr of white

        //get nr of black

        //roll the dice

        if(nrOfDiceGE !== "0")
        {
            var miss = 0;
            var hit = 0;
            const diceRoll = new DiceRoll(nrOfDiceGE+'d6');
            var output = [];

            diceRoll.rolls[0].forEach(function(result){
                output.push(result);
                if(result == 1){miss++;}
                if(result == 6){hit++;}               
            });

            var geResult = 'GE:[' + output.join(",") + ']' + ' Lyckat: ' + hit + ', Fummel: ' + miss;

            totalResult += geResult + '<br>';
        }

        if(nrOfDiceFV !== "0")
        {            
            var hit = 0;
            const diceRoll = new DiceRoll(nrOfDiceFV+'d6');
            var output = [];

            diceRoll.rolls[0].forEach(function(result){
                output.push(result);
                if(result == 6){hit++;}               
            });
            
            var fvResult = 'FV:[' + output.join(",") + ']' + ' Lyckat: ' + hit;

            totalResult += fvResult + '<br>';
        }

        if(nrOfDiceVA !== "0")
        {
            var miss = 0;
            var hit = 0;
            const diceRoll = new DiceRoll(nrOfDiceVA+'d6');
            var output = [];

            diceRoll.rolls[0].forEach(function(result){
                output.push(result);
                if(result == 6){hit++;}
                if(result == 1){miss++;}            
            });
            
            var vaResult = ' VV:[' + output.join(",") + ']' + ' Lyckat: ' + hit + ', Fummel: ' + miss;

            totalResult += vaResult;
        }

        if(totalResult.length > 0){
            sendDiceRoll(totalResult);
        }
    });    

    $(".btn-dice").click(function (e) {
        console.log('.btn-dice.click');
        e.preventDefault();

        var typeOfDice = $(this).data('typeofdice');
        const diceRoll = new DiceRoll(typeOfDice);

        sendDiceRoll(diceRoll.output);        
    });    
    


    //admin fearur41
    //
    function activateAdminFeatures() {

        $('settings-button').show();
        $(".admingroup").show();
        $(".btn-select-card").prop('disabled', false);
        $("#add-enemy-button").prop("disabled", true);

        $('#add-enemy-input').keyup(validateAddEnemyButton);
    
        function validateAddEnemyButton(){
         
            if ($('#add-enemy-input').val().length > 0) {
                $("#add-enemy-button").prop("disabled", false);
            }
            else {
                $("#add-enemy-button").prop("disabled", true);
            }
        }

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
        function showPlayedCards(cardOrder,roomName){

            $(".card-played-" + cardOrder).each(function(index){

                var cardOwner = $(this).data('owner');
                var cardId = $(this).data('cardid');

                if(cardOwner !== undefined && cardId !== undefined)
                {
                    firebase.database().ref().child('/rooms/' + roomName + '/conflict/' + cardOwner+"/cards/"+cardId).update({ isVisible: true });
                }
            });  
        }

        $("#btn-start-fight-1").click(function (e) {
            console.log('brt-fight!');

            var nr1CardsPlayed = $(".card-played-1:visible").length;
            var nr2CardsPlayed = $(".card-played-2:visible").length;

            //is all the cards played?
            if(nr1CardsPlayed === 2 && nr2CardsPlayed === 2){
                showPlayedCards(1,currentRoom.name)
            }
        });

        $("#btn-start-fight-2").click(function (e) {
            console.log('brt-fight!');

            var nr1CardsPlayed = $(".card-played-1:visible").length;
            var nr2CardsPlayed = $(".card-played-2:visible").length;

            //is all the cards played?
            if(nr1CardsPlayed === 2 && nr2CardsPlayed === 2){
                showPlayedCards(2,currentRoom.name)
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

        //room settings
        //
        $("#btn-settings-save").click(function (e) {
            console.log('btn-settings-save.click');
            e.preventDefault();

            var owner = $("#settingsRoomOwner").val();
            var roomname = $("#settingsRoomName").val();
            var title = $("#settingsRoomTitle").val();

            database.ref('rooms/' + currentRoomName).update({ "owner": owner, "name": roomname, "title":title});

            $("#roomNameHeader").html('<strong>' + roomname+ '</strong><blockquote class="blockquote"><p class="mb-0" id="roomTitle"><small>'+title+'</small></p><footer class="blockquote-footer"a><small>' + owner + ' in <cite title="Source Title">Svärdets Sång</cite></small></footer></blockquote>');

        });


    }

});