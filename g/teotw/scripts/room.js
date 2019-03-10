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
            redirectToLogin(roomConfig.gameRoot);
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




$(document).ready(function () {
    
    const roller = new DiceRoller();

    currentRoomName = getParameterByName('room');
    if (currentRoomName === null || currentRoomName === "") {// || currentUser === undefined || currentUser.displayName === '') {
        redirectToLogin(roomConfig.gameRoot);
    }

    $("#info-alert").hide();
    $(".admingroup").hide();
    $('#settings-button').hide();


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
                        redirectToLogin(roomConfig.gameRoot);
                    }

                } else {
                    redirectToLogin(roomConfig.gameRoot);
                }
            });
        } else {
            redirectToLogin(roomConfig.gameRoot);
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
        redirectToLogin(roomConfig.gameRoot);
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

            database.ref(roomConfig.gameRoot+'/rooms/' + currentRoomName + '/conflict/' + currentFighter + '/cards/' + cardId).remove();

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

            database.ref(roomConfig.gameRoot+'/rooms/' + currentRoomName + '/conflict/' + currentFighter + '/cards/' + cardId).set({ "isVisible": false, "cardid": cardId, "name": fightcard.name, "sortOrder": nrOfCard });

        }
    });

    $("#btn-dice-pride").click(function (e) {
        console.log('btn-throw-dice.click');
        e.preventDefault();

        const diceRoll = new DiceRoll('1d12');

        var nrOfHits = artefactDiceSuccess[diceRoll.total-1];
        var result = 'Stolthet:[' + diceRoll.total+ ']' + ' Lyckat: ' + nrOfHits ;

        sendDiceRoll(result);
    });

    $("#btn-throw-dice").click(function (e) {
        console.log('btn-throw-dice.click');
        e.preventDefault();

        var diceRoll;

        //get nr of red
        var nrOfDiceGE = $('input[name=dice-ge]:checked').val();
        var nrOfDiceFV = $('input[name=dice-fv]:checked').val();
        var nrOfDiceVA = $('input[name=dice-va]:checked').val();

        var nrOfMight = $('input[name=dice-art-might]:checked').val();
        var nrOfEpic = $('input[name=dice-art-epic]:checked').val();
        var nrOfLegendary = $('input[name=dice-art-leg]:checked').val();

        var nrOfT6 = $("#input-dice-T6").val();
        var nrOfT8 = $("#input-dice-T8").val();
        var nrOfT10 = $("#input-dice-T10").val();
        var nrOfT12 = $("#input-dice-T12").val();

        var T6Resource = $("#input-dice-resource-T6").val();
        var T8Resource = $("#input-dice-resource-T8").val();
        var T10Resource = $("#input-dice-resource-T10").val();
        var T12Resource = $("#input-dice-resource-T12").val();


        
        
        
        
       // $("#input-dice-artefact")

        var totalResult = '';

        /*
2 rader, färgade artefakttärningar

        artefakttärningar
        ----
T8 grön mäktig(t)
T10 ljusblå episk(t)
T12 orange legendarisk(t)/stolthet(t)

Lars, [20.02.19 15:12]
T8: ett lyckade på 6, ett lyckande på 7, två lyckande på 8

Lars, [20.02.19 15:13]
T10: ett lyckade på 6, ett lyckande på 7, två lyckande på 8, två lyckande på 9, tre lyckande på 10

Lars, [20.02.19 15:13]
T12: ett lyckade på 6, ett lyckande på 7, två lyckande på 8, två lyckande på 9, tre lyckande på 10, tre lyckande på 11, fyra lyckande på 12

        */
       if(isEmpty(nrOfDiceGE) == false && nrOfDiceGE !== "0")
        {
            var miss = 0;
            var hit = 0;
            diceRoll = new DiceRoll(nrOfDiceGE);
            var output = [];

            diceRoll.rolls[0].forEach(function(result){
                output.push(result);
                if(result == 1){miss++;}
                if(result == 6){hit++;}               
            });

            var geResult = 'GE: [' + output.join(",") + ']' + ' Lyckat: ' + hit + ', Fummel: ' + miss;

            totalResult += geResult + '<br>';
        }

        if(isEmpty(nrOfDiceFV) == false && nrOfDiceFV !== "0")
        {            
            var hit = 0;
            diceRoll = new DiceRoll(nrOfDiceFV);
            var output = [];

            diceRoll.rolls[0].forEach(function(result){
                output.push(result);
                if(result == 6){hit++;}               
            });
            
            var fvResult = 'FV: [' + output.join(",") + ']' + ' Lyckat: ' + hit;

            totalResult += fvResult + '<br>';
        }

        if(isEmpty(nrOfDiceVA) == false && nrOfDiceVA !== "0")
        {
            var miss = 0;
            var hit = 0;
            diceRoll = new DiceRoll(nrOfDiceVA);
            var output = [];

            diceRoll.rolls[0].forEach(function(result){
                output.push(result);
                if(result == 6){hit++;}
                if(result == 1){miss++;}            
            });
            
            var vaResult = ' V: [' + output.join(",") + ']' + ' Lyckat: ' + hit + ', Fummel: ' + miss;

            totalResult += vaResult + '<br>';
        }

        if(isEmpty(nrOfMight) == false && nrOfMight !== "0")
        {
            var output = [];
            var hit = 0;

            diceRoll = new DiceRoll(nrOfMight);
            diceRoll.rolls[0].forEach(function(result){
                output.push(result);                
                hit += artefactDiceSuccess[result-1];
            });
            
            var result = 'Mäktig: [' + output.join(",") + ']' + ' Lyckat: ' + hit ;
            totalResult += result + '<br>';
        }

        if(isEmpty(nrOfEpic) == false && nrOfEpic !== "0"){
            var output = [];
            var hit = 0;

            diceRoll = new DiceRoll(nrOfEpic);
            diceRoll.rolls[0].forEach(function(result){
                output.push(result);                
                hit += artefactDiceSuccess[result-1];
            });
            
            var result = 'Episk: [' + output.join(",") + ']' + ' Lyckat: ' + hit ;
            totalResult += result + '<br>';
        }

        if(isEmpty(nrOfLegendary) == false && nrOfLegendary !== "0"){
            var output = [];
            var hit = 0;

            diceRoll = new DiceRoll(nrOfLegendary);
            diceRoll.rolls[0].forEach(function(result){
                output.push(result);                
                hit += artefactDiceSuccess[result-1];
            });
            
            var result = 'Legendarisk: [' + output.join(",") + ']' + ' Lyckat: ' + hit ;
            totalResult += result;
        }

        // var diceRoll;
        // if(nrOfT6 != "0"){
        //     diceRoll = new DiceRoll(nrOfT6);
        //     totalResult += diceRoll.output + '<br>';
        // }
        // if(nrOfT8 != "0"){
        //     diceRoll = new DiceRoll(nrOfT8);
        //     totalResult += diceRoll.output + '<br>';
        // }
        // if(nrOfT10 != "0"){
        //     diceRoll = new DiceRoll(nrOfT10);
        //     totalResult += diceRoll.output + '<br>';
        // }
        // if(nrOfT12 != "0"){
        //     diceRoll = new DiceRoll(nrOfT12);
        //     totalResult += diceRoll.output + '<br>';
        // }

        if(totalResult.length > 0){
            sendDiceRoll(totalResult);
        }        
        
        //reset all active labels
        //
        $(".btn-group input").prop("checked", false);
        $(".btn-group").find(">:first-child").addClass('active').siblings().removeClass('active');
        $(".btn-group").find(">:first-child").children('input').first().prop("checked", true);
    });    

    $(".btn-dice").click(function (e) {
        console.log('.btn-dice.click');
        e.preventDefault();

        var typeOfDice = $(this).data('typeofdice');
        var diceRoll = new DiceRoll(typeOfDice);

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


    }

});