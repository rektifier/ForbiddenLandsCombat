var isRoomAdmin = false;
var currentUser;
var currentRoom;
var currentRoomName;
var adminAction = '';
var isInCombat = false;

var latestDiceRoll = null;
//var diceToReroll = null;

var diceToReroll = {
    nrOfHits:0,
    nrOfMiss:0,
    ge:0,
    fv:0,
    va:0,
    might:0,
    epic:0,
    legendary:0,
    modifier:0
}




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



// function sendMessage(text){

//     database.ref('messages/' + currentRoomName).push({

//         createdOn: firebase.database.ServerValue.TIMESTAMP,
//         message: text,
//         sender:currentUser.displayName

//     }).catch(function(error){
//         console.error('Error writing new message to Firebase Database', error);
//     });
// }

// function sendDiceRoll(text){

//     database.ref('dicerolls/' + currentRoomName).push({

//         createdOn: firebase.database.ServerValue.TIMESTAMP,
//         message: text,
//         sender:currentUser.displayName

//     }).catch(function(error){
//         console.error('Error writing new message to Firebase Database', error);
//     });
// }

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

    var diceRollsRef = database.ref('dicerolls/' + currentRoomName);
    var messageRef = database.ref('messages/' + currentRoomName);
    var usersRef = database.ref('rooms/' + currentRoomName + '/users/');
    var conflictRef = database.ref('rooms/' + currentRoomName + '/conflict/');

    var roomRef = database.ref('rooms/' + currentRoomName + '/info/')

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

    roomRef.on('value', function(roomSnapshot){

        console.log('room info');

        var info = roomSnapshot.val();
        var day = info.day;
        var quarterDay = info.quarterDay;

        console.log(info);

        $("#nrOfDays").text(day);
        $(".quarterDay").children('button').removeClass('active');
        $(".quarterDay").children('button').eq(quarterDay).addClass('active');
    });

    
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
    $(".quarterDay").children('button').removeClass('active');
    

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

    $("#btn-dice-pride").click(function (e) {
        console.log('btn-throw-dice.click');
        e.preventDefault();

        const diceRoll = new DiceRoll('1d12');
        var nrOfHits = artefactDiceSuccess[diceRoll.total-1];
        var hitResult = '';

        for (let index = 0; index < nrOfHits; index++) {
            hitResult += '<img src="images/dice_hit.png" height="25">';                
        }
        var result = 'Stolthet:[' + diceRoll.total+ '] ' + hitResult;

        sendDiceRoll(result);
    });

    $("#btn-dice-reroll").click(function (e) {
        console.log('btn-throw-dice.click');
        e.preventDefault();


        var results = getTheRollResult(diceToReroll.ge,diceToReroll.fv,diceToReroll.va,diceToReroll.might,diceToReroll.epic,diceToReroll.legendary,diceToReroll.modifier);
        if(results.length > 0){
            sendDiceRoll(results);
        } 
    });

    

    function getTheRollResult(nrOfDiceGE,nrOfDiceFV,nrOfDiceVA,nrOfMight,nrOfEpic,nrOfLegendary,modifier){

        var diceRoll;

        var totalResult = '';


        diceToReroll.ge = nrOfDiceGE;
        diceToReroll.fv = nrOfDiceFV;
        diceToReroll.va = nrOfDiceVA;
        diceToReroll.might = nrOfMight;
        diceToReroll.epic = nrOfEpic;
        diceToReroll.legendary = nrOfLegendary;
        diceToReroll.modifier = modifier;


        if(isEmpty(diceToReroll.modifier) == false && diceToReroll.modifier > 0){

            // diceToReroll.modifier = modifier;
            totalResult = 'Modifikation: [-'+modifier+']<br>';

            // for (let index = 0; index < diceToReroll.modifier; index++) {
            //     if(nrOfDiceFV > 0) {
            //         nrOfDiceFV--;
            //         modifier--;
            //     }else{
            //         break;
            //     }          
            // }
            
            // while (modifier--) {    
            //     if(nrOfDiceFV > 0) {
            //         nrOfDiceFV--;
            //     }else{
            //         break;
            //     }
            // }
        } 
            
        if(isEmpty(diceToReroll.ge) == false && diceToReroll.ge !== "0")
        {
            var miss = '';
            var hit = '';
            diceRoll = new DiceRoll(diceToReroll.ge+'d6');
            var output = [];

            diceRoll.rolls[0].forEach(function(result){
                output.push(result);
                if(result == 1){
                    diceToReroll.nrOfMiss++;
                    diceToReroll.ge--;
                    miss += '<img src="images/dice_miss.png" height="25">';
                }
                if(result == 6){
                    diceToReroll.ge--;
                    if(diceToReroll.modifier > 0){
                        diceToReroll.modifier--;
                        //hit += 'X';
                    }else{
                        diceToReroll.nrOfHits++;                        
                        hit += '<img src="images/dice_hit.png" height="25">';
                    }                    
                }               
            });

            var geResult = 'GE: [' + output.join(",") + '] ' + hit + ' ' + miss;

            totalResult += geResult + '<br>';
        }

        if(isEmpty(diceToReroll.fv) == false && diceToReroll.fv !== "0")
        {            
            var hit = '';
            diceRoll = new DiceRoll(diceToReroll.fv+'d6');
            var output = [];

            diceRoll.rolls[0].forEach(function(result){
                output.push(result);
                if(result == 6){
                    diceToReroll.fv--;
                    diceToReroll.nrOfHits++;
                    hit += '<img src="images/dice_hit.png" height="25">';
                }              
            });
            
            var fvResult = 'FV: [' + output.join(",") + '] ' + hit;

            totalResult += fvResult + '<br>';
        }

        if(isEmpty(diceToReroll.va) == false && diceToReroll.va !== "0")
        {
            var miss = '';
            var hit = '';
            diceRoll = new DiceRoll(diceToReroll.va +'d6');
            var output = [];

            diceRoll.rolls[0].forEach(function(result){
                output.push(result);
                if(result == 1){
                    diceToReroll.nrOfMiss++;
                    diceToReroll.va--;
                    miss += '<img src="images/dice_miss.png" height="25">';
                }
                if(result == 6){
                    diceToReroll.nrOfHits++;
                    diceToReroll.va--;
                    hit += '<img src="images/dice_hit.png" height="25">';
                }          
            });
            
            var vaResult = ' V: [' + output.join(",") + '] ' + hit + ' ' + miss;

            totalResult += vaResult + '<br>';
        }

        if(isEmpty(diceToReroll.might) == false && diceToReroll.might !== "0")
        {
            var output = [];
            var hit = 0;
            var hitResult = '';

            diceRoll = new DiceRoll(diceToReroll.might +'d8');
            diceRoll.rolls[0].forEach(function(result){
                output.push(result);                
                hit += artefactDiceSuccess[result-1];
            });

            for (let index = 0; index < hit; index++) {
                diceToReroll.nrOfHits++;
                hitResult += '<img src="images/dice_hit.png" height="25">';                
            }

            diceToReroll.might = 0;
            
            var result = 'Mäktig: [' + output.join(",") + '] ' + hitResult ;
            totalResult += result + '<br>';
        }

        if(isEmpty(diceToReroll.epic) == false && diceToReroll.epic !== "0"){
            var output = [];
            var hit = 0;
            var hitResult = '';

            diceRoll = new DiceRoll(diceToReroll.epic +'d10');
            diceRoll.rolls[0].forEach(function(result){
                output.push(result);                
                hit += artefactDiceSuccess[result-1];
            });

            for (let index = 0; index < hit; index++) {
                diceToReroll.nrOfHits++;
                hitResult += '<img src="images/dice_hit.png" height="25">';                
            }

            diceToReroll.epic = 0;
            
            var result = 'Episk: [' + output.join(",") + '] ' + hit ;
            totalResult += result + '<br>';
        }

        if(isEmpty(diceToReroll.legendary) == false && diceToReroll.legendary !== "0"){
            var output = [];
            var hit = 0;
            var hitResult = '';

            diceRoll = new DiceRoll(diceToReroll.legendary +'d12');
            diceRoll.rolls[0].forEach(function(result){
                output.push(result);                
                hit += artefactDiceSuccess[result-1];
            });

            for (let index = 0; index < hit; index++) {
                diceToReroll.nrOfHits++;
                hitResult += '<img src="images/dice_hit.png" height="25">';                
            }

            diceToReroll.legendary = 0;
            
            var result = 'Legendarisk: [' + output.join(",") + '] ' + hit ;
            totalResult += result;
        }

        var hitandmissresult = 'Result: ';
        for (let index = 0; index < diceToReroll.nrOfHits; index++) {
            hitandmissresult += '<img src="images/dice_hit.png" height="25">';                
        }

        for (let index = 0; index < diceToReroll.nrOfMiss; index++) {
            hitandmissresult += '<img src="images/dice_miss.png" height="25">';                
        }

        totalResult += '<br>' +  hitandmissresult;


        return totalResult;
    }

    $("#btn-throw-dice").click(function (e) {
        console.log('btn-throw-dice.click');
        e.preventDefault();

        //get nr of red
        var nrOfDiceGE = $('input[name=dice-ge]:checked').val();
        var nrOfDiceFV = $('input[name=dice-fv]:checked').val();
        var nrOfDiceVA = $('input[name=dice-va]:checked').val();

        var nrOfMight = $('input[name=dice-art-might]:checked').val();
        var nrOfEpic = $('input[name=dice-art-epic]:checked').val();
        var nrOfLegendary = $('input[name=dice-art-leg]:checked').val();

        var modifier = $("#drp-modifier").val();

        //reset all active labels
        //
        $(".btn-group input").prop("checked", false);
        $(".btn-group").find(">:first-child").addClass('active').siblings().removeClass('active');
        $(".btn-group").find(">:first-child").children('input').first().prop("checked", true);
        $("#drp-modifier").find(">:first-child").prop("selected",true);

        //nollställ inför press
        //
        diceToReroll.nrOfHits = 0;
        diceToReroll.nrOfMiss= 0;

        var results = getTheRollResult(nrOfDiceGE,nrOfDiceFV,nrOfDiceVA,nrOfMight,nrOfEpic,nrOfLegendary,modifier);
        if(results.length > 0){
            sendDiceRoll(results);
        } 
       
    });    

    $(".resource-dice").click(function (e) {
        console.log('.btn-dice.click');
        e.preventDefault();

        var typeOfDice = $(this).data('typeofdice');
        var diceRoll = new DiceRoll(typeOfDice);

        var result = '';
        if(diceRoll.total === 1 || diceRoll.total === 2) {
            result = 'Resurs: ' + diceRoll.output + ' - Sänk resurs';
        }else{
            result = 'Resurs: ' + diceRoll.output + ' - Ingen effekt';
        }

        sendDiceRoll(result);        
    });    
    


    //admin fearur41
    //
    function activateAdminFeatures() {

        $('#settings-button').show();
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

        $("#nextQuarterDay").click(function (e) {
            console.log('nextQuarterDay.click');
            e.preventDefault();
            
            var day = $("#nrOfDays").text();
            var quarterDay = $(".quarterDay .active").data('quarterdayid');

            if(quarterDay === 0){
                if(day > 0){
                    day = day-1;
                    quarterDay = 3;                    
                }
            }else{
                quarterDay--;
            }

            database.ref('rooms/' + currentRoomName + '/info').update({ "quarterDay": quarterDay, "day":day});

        });

        $("#previousQuarterDay").click(function (e) {
            console.log('previousQuarterDay.click');
            e.preventDefault();

            //get current  day and quarterday
            var day = $("#nrOfDays").text();
            var quarterDay = $(".quarterDay .active").data('quarterdayid');

            if(quarterDay === 3){
                day++;
                quarterDay = 0;                    
            }else{
                quarterDay++;
            }
            database.ref('rooms/' + currentRoomName + '/info').update({ "quarterDay": quarterDay, "day":day});
        });


    }

});