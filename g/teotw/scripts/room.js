var isRoomAdmin = false;
var currentUser;
var currentRoom;
var currentRoomName;
var adminAction = '';
var isInCombat = false;

var latestDiceRoll = null;
// var latestDiceRoll = {
//     message:'',
//     sender:'',
//     createdOn:''
// };


function updateDbWithUserListOrder() {
    console.log('updateDbWithUserListOrder()');

    var users = {};
    if ($("#userslist li").each(function (index) {
        var text = $(this).attr('id');

        var name = $(this).ignore("a").text();
        var isInCombat = $(this).hasClass('incombat');
        users[text] = { "name": name, "sortOrder": index, "inCombat": isInCombat }
    }));

    database.ref(roomConfig.gameRoot+'/rooms/' + currentRoomName + '/users/').update(users);
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

        $("#userslistwithmenu").append('<div class="btn-group dropright"><button type="button" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">' + user.name + '</button><div class="dropdown-menu"><button class="dropdown-item" type="button">Add to fight</button><button class="dropdown-item" type="button">Send message</button><div class="dropdown-divider"></div><button class="dropdown-item" type="button">Kick from room</button></div></div>');
    }
}

function removeUserFromList(username) {
    console.log('removeUserFromList(' + username + ')');

    var user = $("#userslist").find('li#' + username);
    if (user !== 'undefined' && user !== null && user.length > 0) {
        $(user).remove();
    }
}



// function sendMessage(text){

//     database.ref(roomConfig.gameRoot+'/messages/' + currentRoomName).push({

//         createdOn: firebase.database.ServerValue.TIMESTAMP,
//         message: text,
//         sender:currentUser.displayName

//     }).catch(function(error){
//         console.error('Error writing new message to Firebase Database', error);
//     });
// }

function sendDiceRoll(text){

    database.ref(roomConfig.gameRoot+'/dicerolls/' + currentRoomName).push({

        createdOn: firebase.database.ServerValue.TIMESTAMP,
        message: text,
        sender:currentUser.displayName

    }).catch(function(error){
        console.error('Error writing new message to Firebase Database', error);
    });
}

// function createChatMessage(sender,message,createdOn){
//     var messageTemplate = '<li class="list-group-item-light"><div class="chat-body1"><p><small>'+sender+':<br>'+message+'<i><br>('+createdOn+')</i></small></p></div></li>';
//     return messageTemplate;
// }

function createDiceRollsMessage(sender,message,createdOn, isLatest){
    var messageTemplate = '';

    if(isLatest){
        messageTemplate = '<li><div class="card bg-light mb-3"><div class="card-header">'+sender+' <small><i>('+createdOn+')</i></small></div><div class="card-body"><p class="card-text">'+message+'</p></div></div></li>';
    }
    else{
        messageTemplate = '<li><div class="card"><div class="card-body small"><p class="card-text">'+sender+' <small><i>'+createdOn+'</i></small><br>'+message+'</p></div></div></li>';
    }
    return messageTemplate;
}

// function scrollChatMessagesToBottom() {
//     var list = document.getElementById('chat-messages');
//     if(list !== null){
//         list.scrollTop = list.scrollHeight;
//     }    
// }
// function scrollDiceRollsToBottom() {
//     var list = document.getElementById('dicerolls-messages');
//     if(list !== null){
//         list.scrollTop = list.scrollHeight;
//     }    
// }
// function appendChatMessage(message,sender,createdOn){
//     var messDate = moment(createdOn).format('YYYY-MM-DD kk:mm');
//     var result = createChatMessage(sender,message, messDate);
//     $('#chat-messages').prepend(result);  
// }

function appendDiceRollsMessage(message,sender,createdOn,isLatest){
    var messDate = moment(createdOn).format('YYYY-MM-DD kk:mm');
    var result = createDiceRollsMessage(sender, message, messDate, isLatest);

    if(latestDiceRoll !== null){
        $('#dicerolls-messages li:first-child').remove();
        var resultOfLatest = createDiceRollsMessage(latestDiceRoll.sender, latestDiceRoll.message, latestDiceRoll.createdOn, false);
        $('#dicerolls-messages').prepend(resultOfLatest);  
    }
    
    latestDiceRoll = {message:message,sender:sender,createdOn:messDate};

    $('#dicerolls-messages').prepend(result);  
}

function initGame() {

    console.log('init game');

    var diceRollsRef = database.ref(roomConfig.gameRoot+'/dicerolls/' + currentRoomName);
    var usersRef = database.ref(roomConfig.gameRoot+'/rooms/' + currentRoomName + '/users/');
    var conflictRef = database.ref(roomConfig.gameRoot+'/rooms/' + currentRoomName + '/conflict/');

    if(isRoomAdmin === false)
    {
        var currentUserRef = database.ref(roomConfig.gameRoot+'/rooms/' + currentRoomName + '/users/' + currentUser.displayName);
    
        //get user if we have one
        //
        currentUserRef.once("value").then(function (snapshot) {
            console.log('currentUserRef.once');
    
            if (snapshot.exists()) {
                var user = snapshot.val();
            } else {
                database.ref(roomConfig.gameRoot+'/rooms/' + currentRoom.name + '/users/' + currentUser.displayName).set({ "name": currentUser.displayName, "messages": {}, "sortOrder": 99, "inCombat": false });
            }
        });
    
        currentUserRef.onDisconnect().remove();
    }

    
    var startOfDay = moment().startOf('day').valueOf();//unix time format ( ms ) //.format("x");
    var startNow = moment().valueOf();
    // //chat messages
    // //
    // messageRef.orderByChild('createdOn').startAt(startOfDay).once("value").then(function (snapshot) {
    //     console.log('messageRef.orderByChild(createdOn).startAt(startOfDay).once');
    //     if (snapshot.exists()) {
    //         snapshot.forEach(function (messSnap) {
    //             var mess = messSnap.val();
    //             appendChatMessage(mess.message,mess.sender,mess.createdOn);
    //         });
    //         scrollChatMessagesToBottom();            
    //     }
    // });
    
    // messageRef.orderByChild('createdOn').startAt(startNow).on('child_added', function(snapshot) {
    //     console.log('messageRef.orderByChild(createdOn).startAt(startNow).on(child_added');
    //     var mess = snapshot.val();
    //     appendChatMessage(mess.message,mess.sender,mess.createdOn);
    //     scrollChatMessagesToBottom();
    // });

    //dice rolls
    //
    // diceRollsRef.orderByChild('createdOn').limitToLast(100).startAt(startOfDay).once("value").then(function (snapshot) {
    //     console.log('diceRollsRef.orderByChild(createdOn).startAt(startOfDay).once');
    //     if (snapshot.exists()) {
    //         snapshot.forEach(function (messSnap) {
    //             var mess = messSnap.val();
    //             appendDiceRollsMessage(mess.message,mess.sender,mess.createdOn);
    //         });
    //         // scrollDiceRollsToBottom();            
    //     }
    // });
    
    diceRollsRef.orderByChild('createdOn').limitToLast(roomConfig.maxNrOfDiceRollsInList).startAt(startOfDay).on('child_added', function(snapshot) {
        console.log('diceRollsRef.orderByChild(createdOn).startAt(startNow).on(child_added');
        var mess = snapshot.val();

        appendDiceRollsMessage(mess.message,mess.sender,mess.createdOn,true);
        // scrollDiceRollsToBottom();
    });


    //remove user when disconnected
    //
    usersRef.on("child_removed", function (snapshot) {
        console.log('on.child_removed');
        var removedUser = snapshot.val();

        database.ref(roomConfig.gameRoot+'/rooms/' + currentRoomName + '/conflict/' + snapshot.key).remove();

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



        });

    });
}


function cleanDBData(){

    console.log('Clean old db data.')

    //clear old room data
    //
    //12 hours ago
    //
    var cutOff = moment().subtract(12,'hours').valueOf();

    database.ref(roomConfig.gameRoot+'/dicerolls/' + currentRoomName).orderByChild('createdOn').endAt(cutOff).once("value").then(function (snapshot) {

        if (snapshot.exists()) {
            snapshot.ref.remove();
        }
    });
    
}

$(document).ready(function () {
    
    const roller = new DiceRoller();

    currentRoomName = getParameterByName('room');
    if (currentRoomName === null || currentRoomName === "") {// || currentUser === undefined || currentUser.displayName === '') {
        redirectToLogin();
    }

    $("#info-alert").hide();
    $(".admingroup").hide();


    // user logged in
    //
    firebase.auth().onAuthStateChanged(function (user) {

        if (user) {
            window.user = user;

            currentuser = user;

            //load current room
            //
            database.ref(roomConfig.gameRoot+'/rooms/' + currentRoomName).once("value").then(function (snapshot) {

                if (snapshot.exists()) {

                    currentRoom = snapshot.val();
                    


                    //$("#roomNameHeader").html('<strong>' + currentRoomName + ' <small>( owned by ' + currentRoom.owner + ' )</small></strong>');
                     
                    $("#roomNameHeader").html('<strong>' + currentRoom.name + '</strong><blockquote class="blockquote"><p class="mb-0" id="roomTitle"><small>'+currentRoom.title+'</small></p><footer class="blockquote-footer"a><small>' + currentRoom.owner + ' in <cite title="Source Title">'+roomConfig.gameName+'</cite></small></footer></blockquote>');

                    //load current user
                    //
                    currentUser = firebase.auth().currentUser;
                    if (currentUser != null) {

                        cleanDBData();

                        //$("#navbarDropdown").text(currentUser.displayName);
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
            database.ref(roomConfig.gameRoot+'/rooms/' + currentRoom.name + '/conflict/' + currentUser.displayName).remove().then();
            database.ref(roomConfig.gameRoot+'/rooms/' + currentRoom.name + '/users/' + currentUser.displayName).remove().then();
        }
        redirectToLogin();
    });



    $("#btn-throw-dice").click(function (e) {
        console.log('btn-throw-dice.click');
        e.preventDefault();

        var positiveDice = [];
        var negativeDice = [];

        //get nr of red
        var nrOfPositive = $('input[name=dice-positive]:checked').val();
        var nrOfNegative = $('input[name=dice-negative]:checked').val();

        var positiveResult = '';
        var negativeResult = '';
        var totalResult = '';


       
       if(isEmpty(nrOfPositive) == false && nrOfPositive !== "0") {
            diceRollPositive = new DiceRoll(nrOfPositive);
            diceRollPositive.rolls[0].forEach(function(result){
                positiveDice.push(result);             
            });

            totalResult = 'Positive: [' + positiveDice.join(",") + ']';
        }

        if(isEmpty(nrOfNegative) == false && nrOfNegative !== "0") {            
            diceRollNegative = new DiceRoll(nrOfNegative);
            diceRollNegative.rolls[0].forEach(function(result){
                negativeDice.push(result);            
            });
            totalResult += ', Negative: [' + negativeDice.join(",") + ']';
        }

        if(positiveDice.length > 1 && negativeDice.length > 1){

            var p = positiveDice.length
            while (p--) {
                
                var n = negativeDice.length;
                while(n--){

                    if (positiveDice[p] == negativeDice[n]) {
                        positiveDice.splice(p,1);
                        negativeDice.splice(n,1);
                    }                    
                } 
            }

            totalResult += '<br><br>Result: Positive ['+positiveDice.join(",")+']<br>Stress: '+negativeDice.length +' point';
        }




        if(totalResult.length > 0){
            sendDiceRoll(totalResult);
        }        
        
        //reset all active labels
        //
        $(".btn-group input").prop("checked", false);
        $(".btn-group").find(">:first-child").addClass('active').siblings().removeClass('active');
        $(".btn-group").find(">:first-child").children('input').first().prop("checked", true);
    });    

    //room settings
    //
    $("#btn-settings-save").click(function (e) {
        console.log('btn-settings-save.click');
        e.preventDefault();

        var owner = $("#settingsRoomOwner").val();
        var roomname = $("#settingsRoomName").val();
        var title = $("#settingsRoomTitle").val();

        database.ref(roomConfig.gameRoot+'/rooms/' + currentRoomName).update({ "owner": owner, "name": roomname, "title":title});

        $("#roomNameHeader").html('<strong>' + roomname+ '</strong><blockquote class="blockquote"><p class="mb-0" id="roomTitle"><small>'+title+'</small></p><footer class="blockquote-footer"a><small>' + owner + ' in <cite title="Source Title">'+roomConfig.gameName+'</cite></small></footer></blockquote>');

    });

    $(".delete-feature").click(function (e) {
        console.log('delete-feature.click');
        e.preventDefault();

        alert('detele');
    });

    $('.selectable').click(function(event) {
        
        var statvalue = $(this).data('statvalue');
        console.log('clicked ' + statvalue)
      });

    $('label').click(function () {
        $('span', this).text(function(i, text){
            return text === "-" ? "+" : "-";
        });
    });

    $('.btn-add-feature').click(function(event) {
        
        var statvalue = $(this).data('statvalue');
        console.log('clicked ' + statvalue)
      });
    

    //admin fearur41
    //
     function activateAdminFeatures() {

        $(".admingroup").show();
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

                    database.ref(roomConfig.gameRoot+'/rooms/' + currentRoom.name + '/users/' + userToKick).remove();
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

          

   


        // ############## click events ##############
        //
  
   

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

                firebase.database().ref().child(roomConfig.gameRoot+'/rooms/' + currentRoom.name + '/users/' + user).update({ inCombat: isInCombat });

                if (isInCombat === true) {
                    //add user to combat
                    firebase.database().ref().child(roomConfig.gameRoot+'/rooms/' + currentRoom.name + '/conflict/' + user).set({ "userid": user });
                } else {
                    //remove user from combat
                    firebase.database().ref().child(roomConfig.gameRoot+'/rooms/' + currentRoom.name + '/conflict/' + user).remove();
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
            database.ref(roomConfig.gameRoot+'/rooms/' + currentRoom.name + '/users/' + enemyName).set({ "name": roomConfig.enemyNamePrefix + enemyName + roomConfig.enemyNameSuffix, "sortOrder": 99, "inCombat": false }).then(() => {
                $("#add-enemy-input").val('');
            });
        });




        


    }

});