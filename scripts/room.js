var isRoomAdmin = false;
var currentUser;
var currentRoom;
var latestMessage = '';
var userMessages = {};
var currentRoomName;
var adminAction = '';
var isInFight = false;





currentRoomName = getParameterByName('room');
if (currentRoomName === null || currentRoomName === "") {
    redirectToLogin();
}



function updateDbWithUserListOrder() {
    console.log('updateDbWithUserListOrder()');
    
    var users = {};
    if ($("#userslist li").each(function (index) {
        var text = $(this).attr('id');

        var name = $(this).ignore("a").text();
        var isInCombat = $(this).hasClass('incombat');
        users[text] = { "name": name, "sortOrder": index, "inCombat":isInCombat }
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
        var fightBtn = '';

        if(isRoomAdmin)
        {
            fightBtn  = '<a href="javascript:void(0)" class="badge badge-warning btn-user-fight">Fight</a>';
        }

        if (user.inCombat) {
            combatClass = 'incombat';
        }

        $("#userslist").append('<li id="' + key + '" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center ' + combatClass + '">' + user.name + fightBtn + '</li>');

    }
}

function removeUserFromList(username) {
    console.log('removeUserFromList(' + username + ')');
    
    var user = $("#userslist").find('li#'+username);
    if(user !== 'undefined' && user !== null && user.length > 0)
    {
        $(user).remove();
    }
}

function redirectToLogin(){
    window.location.href = "login.html";
}

function initGame() {

    console.log('init game');
    //initUserListeners(currentUser);
    //
    var cardsRef = database.ref('rooms/' + currentRoomName + '/cards/');
    var messageRef = database.ref('rooms/' + currentRoomName + '/message/');
    var usersRef = database.ref('rooms/' + currentRoomName + '/users/');
    var currentUserRef = database.ref('rooms/' + currentRoomName + '/users/' + currentUser.displayName);

    //get user if we have one
    //
    currentUserRef.once("value").then(function (snapshot) {

        console.log('currentUserRef.once');
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

        if (snapshot.key === currentUser.displayName && isRoomAdmin === false) {
            redirectToLogin();            
        }

        if(removedUser.inCombat){
            showPlayground(snapshot.key);
        }else{
            hidePlayground(snapshot.key);
        }
    });

    //when a new user i connected
    usersRef.on("child_added", function (snapshot, prevChildKey) {
        console.log('child_added');
        var newUser = snapshot.val();

        //addUserToList(newUser.name);

        if(newUser.inCombat){
            showPlayground(snapshot.key);
        }else{
            hidePlayground(snapshot.key);
        }

        if (newUser.name !== currentUser.displayName) {
            //showAlert.displayInfo(newUser.name + " joined the fight!");
            //showAlert.setInfo(newUser.name + " joined the fight!");
        }

    });

    usersRef.on("child_changed", function (snapshot) {
        console.log('child_updated');

        var user = snapshot.val();
        var userKey = snapshot.key;
  

        var menuitem = $("#userslist li").find('#'+userKey);

        $(menuitem).toggleClass('notincombat');
        $(menuitem).toggleClass('incombat');
        
        if(user.inCombat === false)
        {
            hidePlayground(userKey);
        }else{
            showPlayground(userKey);
        }

        if(userKey === currentUser.displayName)
        {
            if(user.inCombat){
                $(".btn-select-card").prop('disabled', false);
            }else{
                $(".btn-select-card").prop('disabled', true);
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

        //get users in combat so we can see whos nr 1 and whos nr 2
        //
        var list ={}; 
        
        var cards = cardsSnapshot.val();
        var nrOfCards = Object.keys(cards).length;
        
        if(nrOfCards > 3){
            $("#btn-start-fight").prop('disabled', false);

        }else{
            $("#btn-start-fight").prop('disabled', true);
        }

        // nrOfCards.length

        cardsSnapshot.forEach(function (cardSnapshot) {
            var cardId = cardSnapshot.key;
            var card = cardSnapshot.val();

            console.log(card);

            //ToDo:
            //go to the users playground and empty
            //$("#playground ").empty();



            var cardSrc = fightingCards['baksida'].src;
            if (card.isVisible) {
                cardSrc = fightingCards[cardId].src
            }

            showCard(cardId,card);
        });

    });


}

function showPlayground(owner){

    var currentPlayground = detectPlayground(owner);

    if(currentPlayground !== null)
    {
        $(currentPlayground).show();

        $(currentPlayground).find(".playground-title").text(owner);
        // $(currentPlayground).find(".title-nr-card-1").show();
        // $(currentPlayground).find(".title-nr-card-2").text('');
        $(currentPlayground).find(".card-played-1").hide();
        $(currentPlayground).find(".card-played-2").hide();
    }


}

function hidePlayground(owner){
    var currentPlayground = detectPlayground(owner);

    if(currentPlayground !== null){
        $(currentPlayground).hide();
    }
    
}

function detectPlayground(owner)
{
    for (let index = 1; index < 3; index++) {

        if($("#playground-player-"+index).is(":visible")){

            var title = $("#playground-player-" + index + " .playground-title").text();

            if(title == owner){
                return $("#playground-player-" + index);
            }
    
        }else{
            return $("#playground-player-" + index);
        }        
    }

    return null;
}

function showCard(cardId,card){

    var currentPlayground = detectPlayground(card.owner);

    if(currentPlayground !== null)
    {

    }
}

function hidePlaygrounds(){

    $("#playground-player-1").hide();
    $("#playground-player-2").hide();
    // $("#playground-player-1 .playground-title").text('');
    // $("#playground-player-1 .title-nr-card-1").text('');
    // $("#playground-player-1 .title-nr-card-2").text('');
    // $("#playground-player-1 .card-played-1").hide();
    // $("#playground-player-1 .card-played-2").hide();

    //$("#playground-player-1 .card-played-1").attr('src','images/baksida.jpg');
    //$("#playground-player-1 .card-played-2").attr('src','images/baksida.jpg');
    
    
}

$(document).ready(function () {


   hidePlaygrounds();


    

   // user logged in
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
                        redirectToLogin();
                    }

                } else {
                    redirectToLogin();
                }
            });
        } else {
            redirectToLogin();
        }
    });

    //leave the room
    //
    $("#leave-room-button").click(function (e) {
        console.log('leave room');
        e.preventDefault();

        database.ref('rooms/' + currentRoom.name + '/users/' + currentUser.displayName).remove();

        redirectToLogin();

    });




    $("#info-alert").hide();
    $(".admingroup").hide();

    $(".btn-select-card").prop('disabled', true);


    //admin fearures
    //
    function activateAdminFeatures() {

        

        $(".admingroup").show();

        $("#userslist").sortable({
            delay: 150,
            axis: "y",
            opacity: 0.8,
            connectWith: "ul",
            sort: function() {
                if ($(this).hasClass("cancel")) {
                    $(this).sortable("cancel");
                }
            },
            update: function (event, ui) {
                console.log('userslist.sortable update event ');
                if(adminAction === '')
                {
                    updateDbWithUserListOrder();
                }
            },
            stop:function (event, ui) {
                console.log('userslist.sortable stop event ');
                if(adminAction === 'killFighter')
                {
                    $(this).sortable("cancel");

                    var userToKick = ui.item[0].id

                    database.ref('rooms/' + currentRoom.name + '/users/' + userToKick).remove();
                    adminAction = '';
                }
                
            },
            receive:function (event, ui) {
                console.log('userslist.sortable stop event ');
            },
            remove:function (event, ui) {
                console.log('userslist.sortable remove event ');
            }
            
        }).disableSelection();

        $(".list-group-item").draggable({
            helper: 'clone',
            revert : 'invalid',
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


        $("#btn-start-fight").click(function(e){                
                console.log('brt-fight!');
        });    
        
        //fight button
        //
        $("#userslist").on('click','a',function(){           
            console.log('btn-user-fight');

            var li = $(this).parent();

            $(li).toggleClass('notincombat');
            $(li).toggleClass('incombat');

            var nrOfPlayersInFight = $("#userslist .incombat").length;
            if(nrOfPlayersInFight > roomConfig.maxNrOfPlayersInFight)
            {
                $(li).toggleClass('notincombat');
                $(li).toggleClass('incombat');
            }else{
                var isInCombat = !$(li).hasClass('notincombat');
                var user = $(li).attr('id');
    
                firebase.database().ref().child('/rooms/' + currentRoom.name + '/users/' + user).update({ inCombat: isInCombat });


            }



            console.log(li);
         });  
        


        

        $("#add-enemy-button").click(function (e) {

            console.log('add-enemy-button.click ');
            e.preventDefault();

            var enemyName = $("#add-enemy-input").val();

            //add enemy to room
            //
            database.ref('rooms/' + currentRoom.name + '/users/' + enemyName).set({ "name": roomConfig.enemyNamePrefix + enemyName + roomConfig.enemyNameSuffix, "sortOrder": 99, "inCombat":false }).then(() => {
                $("#add-enemy-input").val('');
            });
        });

        $("#btn-random-initiative").click(function (e) {

            console.log('btn-random-initiative.click ');
            e.preventDefault();

            var userList = $("#userslist li");

            if($(userList).length > 1)
            {
                shuffleArray(userList);

                var users = {};
                if ($(userList).each(function (index) {
                    var text = $(this).attr('id');

                    var name = $(this).ignore("a").text();
                    var isInCombat = $(this).hasClass('incombat');
                    users[text] = { "name": name, "sortOrder": index, "inCombat":isInCombat }
                }));

                database.ref('rooms/' + currentRoomName + '/users/').update(users);
            }            
        });

    }

});