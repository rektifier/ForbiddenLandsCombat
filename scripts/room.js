var isRoomAdmin = false;
var currentUser;
var currentRoom;
var latestMessage = '';
var userMessages = {};
var currentRoomName;

currentRoomName = getParameterByName('room');
if (currentRoomName === null || currentRoomName === "") {
    window.location.href = "login.html";
}



function updateUserListOrder() {
    console.log('updateUserListOrder()');
    //populate new users object
    //
    var users = {};
    if ($("#userslist li").each(function (index) {
        var text = $(this).attr('id');
        //var text = $(this).text();
        users[text] = { "name": text, "sortOrder": index }
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

        var combatClass = 'notincombat';

        if (user.inCombat) {
            combatClass = 'incombat';
        }

        $("#userslist").append('<li id="' + key + '" class="list-group-item list-group-item-action ' + combatClass + '">' + user.name + '</li>');

    }
}

function removeUserFromList(username) {
    console.log('removeUserFromList(' + username + ')');
    $('#userslist li').filter(function () { return $.attr('id')([this]) === username; }).remove();
}

function initGame() {

    //initUserListeners(currentUser);
    //
    var cardsRef = database.ref('rooms/' + currentRoomName + '/cards/');
    var messageRef = database.ref('rooms/' + currentRoomName + '/message/');
    var usersRef = database.ref('rooms/' + currentRoomName + '/users/');
    var currentUserRef = database.ref('rooms/' + currentRoomName + '/users/' + currentUser.displayName);

    //get user if we have one
    //
    currentUserRef.once("value").then(function (snapshot) {

        if (snapshot.exists()) {

            var user = snapshot.val();
            userMessages = user.messages;

        } else {
            database.ref('rooms/' + currentRoom.name + '/users/' + currentUser.displayName).set({ "name": currentUser.displayName, "messages": {}, "sortOrder": 99, "inCombat":false });
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
        console.log('child_removed');
        var removedUser = snapshot.val();

        removeUserFromList(removedUser.name);

        if (removedUser.name !== currentUser.displayName) {
            //showAlert.displayInfo(removedUser.name + " left the fight!");
            //showAlert.setInfo(removedUser.name + " left the fight!");
        }
    });

    //when a new user i connected
    usersRef.on("child_added", function (snapshot, prevChildKey) {
        console.log('child_added');
        var newUser = snapshot.val();

        //addUserToList(newUser.name);

        if (newUser.name !== currentUser.displayName) {
            //showAlert.displayInfo(newUser.name + " joined the fight!");
            //showAlert.setInfo(newUser.name + " joined the fight!");
        }

    });

    usersRef.on("child_changed", function (snapshot) {
        console.log('child_updated');

        var user = snapshot.val();
        var key = snapshot.key;
  

        var menuitem = $("#userslist li").find('#'+key);

        $(menuitem).toggleClass('notincombat');
        $(menuitem).toggleClass('incombat');
        

        if (user.name === currentUser.displayName) {
            
            //is user in combat? activate the cards!

            //else deactivate the cards!

            if(user.inCombat)
            {
                console.log("activate the cards!");
            }
            else{
                console.log("deactivate the cards!");
            }
        }

    });

    usersRef.orderByChild("sortOrder").on("value", function (querySnapshot) {
        console.log('sortOrder');

        $("#userslist").empty();

        querySnapshot.forEach(function (userSnapshot) {
            var userId = userSnapshot.key;
            var user = userSnapshot.val();
            console.log(user);

            addUserToList(userId, user);
        });

    });


    cardsRef.on('value', function (cardsSnapshot) {
        console.log('cards');

        $("#playground").empty();

        cardsSnapshot.forEach(function (cardSnapshot) {
            var cardId = cardSnapshot.key;
            var card = cardSnapshot.val();
            console.log(card);

            var cardSrc = getCardSrcById('baksida');
            if (card.isVisible) {
                cardSrc = getCardSrcById(cardId);
            }

            $("#playground").append('<img src="' + cardSrc + '" width="175" class="cardimage-playground">');
        });

    });


}



$(document).ready(function () {


    firebase.auth().onAuthStateChanged(function (user) {

        if (user) {
            window.user = user;

            //load current room
            //
            database.ref('rooms/' + currentRoomName).once("value").then(function (snapshot) {

                if (snapshot.exists()) {

                    currentRoom = snapshot.val();

                    $("#roomNameHeader").html(currentRoomName);

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
                        window.location.href = "login.html";
                    }

                } else {
                    window.location.href = "login.html";
                }
            });
        } else {
            window.location.href = "login.html";
        }
    });

    $("#leave-room-button").click(function (e) {
        e.preventDefault();

        // var user = firebase.auth().currentUser;
        // if (user) {
        database.ref('rooms/' + currentRoom.name + '/users/' + currentUser.displayName).remove();
        // }

        //firebase.auth().signOut();
        window.location.href = "login.html";

    });

    // $("#kick-user-button").click(function(e){
    // //$(".kick-user-button").click(function (e) {
    //     e.preventDefault();

    //     var userTokick = $(this).closest('li').attr('id');

    //     // var user = firebase.auth().currentUser;
    //     // if (user) {
    //     database.ref('rooms/' + currentRoom.name + '/users/' + userTokick).remove();
    //     // }

    //     //firebase.auth().signOut();

    // });



    $("#info-alert").hide();
    $(".admingroup").hide();

    $(".cardimage").click(function (e) {
        e.preventDefault();


        console.log(this);
    });




    function activateAdminFeatures() {

        $(".admingroup").show();

        $("#userslist").sortable({
            revert: true,
            update: function (event, ui) {
                updateUserListOrder();
            }
        }).disableSelection();;

  
        $("#userslist").on('click','li',function(){

            $(this).toggleClass('notincombat');
            $(this).toggleClass('incombat');

            var isInCombat = !$(this).hasClass('notincombat');
            var user = $(this).attr('id');

            firebase.database().ref().child('/rooms/' + currentRoom.name + '/users/' + user).update({ inCombat: isInCombat });

            console.log(this);
        });



        //$("#userslist").disableSelection();
        $("#kickActionDroppable").droppable({
            accept: "#userslist > li",
            classes: {
                "ui-droppable-active": "ui-state-highlight",
                "ui-droppable-hover": "bg-danger"
            },
            drop: function (event, ui) {
                var userToKick = ui.draggable[0].id;
                database.ref('rooms/' + currentRoom.name + '/users/' + userToKick).remove();
            }
        });

        

        $("#add-enemy-button").click(function (e) {
            e.preventDefault();

            var enemyName = $("#add-enemy-input").val();

            //add enemy to room
            //
            database.ref('rooms/' + currentRoom.name + '/users/' + enemyName).set({ "name": enemyNamePrefix + enemyName, "sortOrder": 99, "inCombat":false }).then(() => {
                $("#add-enemy-input").val('');
            });
        });



    }


});


