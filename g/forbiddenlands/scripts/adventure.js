var isAdmin = false;
var currentUser;
var currentAdventureMember;
var currentAdventure;
var adventureId;
var adminAction = '';
var isInCombat = false;

var currentCharacterSheet;

var diceRolls;
var latestDiceRoll = null;

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


function saveDiceRoll(message){

    var owner = currentUser.displayName;
    if(currentAdventureMember !== undefined)
    {
        if(isEmpty(currentAdventureMember.displayName) === false){
            owner = currentAdventureMember.displayName;
        }
    }
    diceRolls.sendDiceRoll(message,owner);
}

function updateDbWithUserListOrder() {
    console.log('updateDbWithUserListOrder()');

    var users = {};
    if ($("#userslist li").each(function (index) {
        var text = $(this).attr('id');

        var displayName = $(this).ignore("a").text();
        var isInCombat = $(this).hasClass('incombat');
        users[text] = { "displayName": displayName, "sortOrder": index, "inCombat": isInCombat }
    }));

    database.ref('adventures/' + adventureId + '/members/').update(users);
}


function addUserToList(key, member) {

    console.log('addUserToList(' + member.displayName + ')');

    var exists = false;
    if ($("#userslist li").each(function (index) {

        var text = $(this).attr('id');
        if (text == key) {
            exists = true;
        }
    }));

    console.log('addUserToList(' + member.displayName + ') exists: ' + exists);

    if (exists === false) {

        var combatClass = '';
        var fightBtn = '';

        if (isAdmin) {
            fightBtn = '<a href="javascript:void(0)" class="badge badge-warning btn-user-fight">Fight</a>';
        }

        if (member.inCombat) {
            combatClass = 'incombat';
        }

        $("#userslist").append('<li id="' + key + '" data-displayname="'+ member.displayName +'" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center ' + combatClass + '">' + member.displayName + fightBtn + '</li>');

    }
}

function removeUserFromList(username) {
    console.log('removeUserFromList(' + username + ')');

    var user = $("#userslist").find('li#' + username);
    if (user !== 'undefined' && user !== null && user.length > 0) {
        $(user).remove();
    }
}





function replaceHitAndMissWithImages(str){

    if(str !== null)
    {
        str = str.split("$H").join('<img src="images/dice_hit.png" height="25">');
        str = str.split("$M").join('<img src="images/dice_miss.png" height="25">');
    }

    return str;
}

function createDiceRollsMessage(owner,message,createdOn, isLatest){
    var messageTemplate = '';

    if(isLatest){
        messageTemplate = '<li><div class="card bg-light mb-3"><div class="card-header">'+owner+' <small><i>('+createdOn+')</i></small></div><div class="card-body"><p class="card-text">'+message+'</p></div></div></li>';
    }
    else{
        messageTemplate = '<li><div class="card"><div class="card-body small"><p class="card-text">'+owner+' <small><i>'+createdOn+'</i></small><br>'+message+'</p></div></div></li>';
    }
    return messageTemplate;
}


function appendDiceRollsMessage(message,owner,createdOn,isLatest){
    var messDate = moment(createdOn).format('YYYY-MM-DD kk:mm');

    message = replaceHitAndMissWithImages(message);

    var result = createDiceRollsMessage(owner, message, messDate, isLatest);

    if(latestDiceRoll !== null){
        $('#dicerolls-messages li:first-child').remove();
        var resultOfLatest = createDiceRollsMessage(latestDiceRoll.owner, latestDiceRoll.message, latestDiceRoll.createdOn, false);
        $('#dicerolls-messages').prepend(resultOfLatest);  
    }
    
    latestDiceRoll = {message:message,owner:owner,createdOn:messDate};


    $('#dicerolls-messages').prepend(result);  
}



function initGame() {

    console.log('init game');
    var startOfDay = moment().startOf('day').valueOf();

    var diceRollsRef = database.ref('rolls/' + adventureId);
    diceRolls = new DiceRolls(diceRollsRef,roomConfig.maxNrOfDiceRollsInList,startOfDay,appendDiceRollsMessage);

    var usersRef = database.ref('adventures/' + adventureId + '/members/');
    var conflictRef = database.ref('adventures/' + adventureId + '/conflict/');

    var roomRef = database.ref('adventures/' + adventureId + '/info/')

    

    if(isAdmin === true){
        diceRolls.cleanOldData();

    }else
    {
        var currentMemberRef = database.ref('adventures/' + adventureId + '/members/' + currentUser.uid);
        
        //get user if we have one
        //
        currentMemberRef.once("value").then(function (snapshot) {
            console.log('currentMemberRef.once');
    
            if (snapshot.exists()) {
                currentAdventureMember = snapshot.val();
                console.log(currentAdventureMember);
            } else {
                redirectToLogin();
                //database.ref('adventures/' + adventureId + '/members/' + currentUser.displayName).set({ "name": currentUser.displayName, "messages": {}, "sortOrder": 99, "inCombat": false });
            }
        });
    
        //currentMemberRef.onDisconnect().remove();
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
    //var startNow = moment().valueOf();
    
    
    // diceRollsRef.orderByChild('c').limitToLast(roomConfig.maxNrOfDiceRollsInList).startAt(startOfDay).on('child_added', function(snapshot) {
    //     console.log('diceRollsRef.orderByChild(createdOn).startAt(startNow).on(child_added');
    //     var mess = snapshot.val();

    //     var decompmessage = LZString.decompressFromUTF16(mess.m);
    //     var decompowner = LZString.decompressFromUTF16(mess.o);

    //     appendDiceRollsMessage(decompmessage,decompowner,mess.c,true);
    // });


    //remove user when disconnected
    //
    usersRef.on("child_removed", function (snapshot) {
        console.log('on.child_removed');

        database.ref('adventures/' + adventureId + '/conflict/' + snapshot.key).remove();

        if (snapshot.key === currentUser.uid && isAdmin === false) {
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

            if(!(isAdmin && userId === currentUser.uid)){
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
            var isAdminEnemy = combatEnemy !== undefined && combatEnemy.length > 0 && isAdmin;

            //if (userId === currentAdventureMember.displayName || isAdminEnemy) {
            if (userId === currentUser.uid || isAdminEnemy) {
                
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
            showPlayground(conflictData.displayName);

            if (conflictData.cards !== undefined) {

                var cards = Object.keys(conflictData.cards).map(i => conflictData.cards[i]);

                cards.forEach(function (card) {

                    var cardImg = fightingCards['baksida'];

                    if (userId === currentUser.uid || card.isVisible === true || isEnemy === true && isAdmin === true) {
                        cardImg = fightingCards[card.cardid];
                    }

                    $(playground).find(".card-played-" + card.sortOrder).show();
                    $(playground).find(".card-played-" + card.sortOrder).attr('src', cardImg.src);
                    $(playground).find(".card-played-" + card.sortOrder).attr('data-cardid', card.cardid);
                    $(playground).find(".card-played-" + card.sortOrder).attr('data-owner', userId);

                    //de/activate buttons 
                    if (isInCombat && userId === currentUser.uid  || isEnemy === true && isAdmin === true) {

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

function authStateObserver(user) {
    if (user) {
        currentuser = user;

        if(user.isAnonymous === true){
            redirectToLogin('Please register to play TEOTW.');
        };

        //load current room
        //
        database.ref('adventures/' + adventureId).once("value").then(function (snapshot) {

            if (snapshot.exists()) {

                currentAdventure = snapshot.val();
                
                var adventureDescription = currentAdventure.description ? currentAdventure.description : '';

                $("#roomNameHeader").html('<strong>' + currentAdventure.title + '</strong><blockquote class="blockquote"><p class="mb-0" id="roomTitle"><small>'+ adventureDescription +'</small></p><footer class="blockquote-footer"a><small>' + currentAdventure.owner + ' in <cite title="Source Title">Svärdets Sång</cite></small></footer></blockquote>');

                //load current user
                //
                currentUser = firebase.auth().currentUser;
                if (currentUser != null) {

                    $("#navbarDropdown").text(currentUser.displayName);
                    //is the logged in user the room admin?
                    //
                    if (currentAdventure.ownerId === currentUser.uid) {
                        isAdmin = true;

                        $("#settingsRoomOwner").val(currentAdventure.owner);
                        $("#settingsRoomName").val(currentAdventure.title);
                        $("#settingsRoomTitle").val(currentAdventure.description);
                        
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

                    database.ref('adventures/' + adventureId + '/members/' + userToKick).remove();
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
        function showPlayedCards(cardOrder,adventureId){

            $(".card-played-" + cardOrder).each(function(index){

                var cardOwner = $(this).data('owner');
                var cardId = $(this).data('cardid');

                if(cardOwner !== undefined && cardId !== undefined)
                {
                    firebase.database().ref().child('/adventures/' + adventureId + '/conflict/' + cardOwner+"/cards/"+cardId).update({ isVisible: true });
                }
            });  
        }

        $("#btn-start-fight-1").click(function (e) {
            console.log('brt-fight!');

            var nr1CardsPlayed = $(".card-played-1:visible").length;
            var nr2CardsPlayed = $(".card-played-2:visible").length;

            //is all the cards played?
            if(nr1CardsPlayed === 2 && nr2CardsPlayed === 2){
                showPlayedCards(1,adventureId)
            }
        });

        $("#btn-start-fight-2").click(function (e) {
            console.log('brt-fight!');

            var nr1CardsPlayed = $(".card-played-1:visible").length;
            var nr2CardsPlayed = $(".card-played-2:visible").length;

            //is all the cards played?
            if(nr1CardsPlayed === 2 && nr2CardsPlayed === 2){
                showPlayedCards(2,adventureId)
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
                var userid = $(li).attr('id');
                var displayName = $(li).data('displayname');

                if (isInCombat === true) {
                    //add user to combat
                    firebase.database().ref().child('/adventures/' + adventureId + '/conflict/' + userid).set({ "displayName": displayName });
                } else {
                    //remove user from combat
                    firebase.database().ref().child('/adventures/' + adventureId + '/conflict/' + userid).remove();
                }
            }

            console.log(li);
        });

        $("#add-enemy-button").click(function (e) {

            console.log('add-enemy-button.click ');
            e.preventDefault();

            var enemyName = $("#add-enemy-input").val();
            var enemyId = generateId();

            //add enemy to room
            //
            database.ref('adventures/' + adventureId + '/members/' + enemyId).set({ "displayName": roomConfig.enemyNamePrefix + enemyName + roomConfig.enemyNameSuffix, "sortOrder": 99, "inCombat": false }).then(() => {
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
                    var userid = $(this).attr('id');
                    var isInCombat = $(this).hasClass('incombat');
                    database.ref('adventures/' + adventureId + '/members/' + userid).update({"sortOrder": index, "inCombat": isInCombat});
                })); 
            }
        });

        //room settings
        //
        $("#btn-settings-save").click(function (e) {
            console.log('btn-settings-save.click');
            e.preventDefault();

            var owner = $("#settingsRoomOwner").val();
            var title = $("#settingsRoomName").val();
            var description = $("#settingsRoomTitle").val();

            database.ref('adventures/' + adventureId).update({ "owner": owner, "title": title, "description":description});

            $("#roomNameHeader").html('<strong>' + title+ '</strong><blockquote class="blockquote"><p class="mb-0" id="roomTitle"><small>'+description+'</small></p><footer class="blockquote-footer"a><small>' + owner + ' in <cite title="Source Title">Svärdets Sång</cite></small></footer></blockquote>');

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

            database.ref('adventures/' + adventureId + '/info').update({ "quarterDay": quarterDay, "day":day});

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
            database.ref('adventures/' + adventureId + '/info').update({ "quarterDay": quarterDay, "day":day});
        });


    }

$(document).ready(function () {
    
    const roller = new DiceRoller();

    adventureId = getParameterByName('id');
    if (adventureId === null || adventureId === "") {
        redirectToLogin();
    }

    $("#info-alert").hide();
    $(".admingroup").hide();
    $('#settings-button').hide();
    $(".btn-select-card").prop('disabled', true);
    $(".quarterDay").children('button').removeClass('active');
    

    hidePlaygrounds();

    // Listen to auth state changes.
    firebase.auth().onAuthStateChanged(authStateObserver);

    // // initialize Firebase user auth
    // auth.initFirebaseAuth(authStateObserver);

    // // user logged in
    // //
    // firebase.auth().onAuthStateChanged(function (user) {

    //     if (user) {
    //         currentuser = user;

    //         if(user.isAnonymous === true){
    //             redirectToLogin('Please register to play TEOTW.');
    //         };

    //         //load current room
    //         //
    //         database.ref('adventures/' + adventureId).once("value").then(function (snapshot) {

    //             if (snapshot.exists()) {

    //                 currentAdventure = snapshot.val();
                    
    //                 var adventureDescription = currentAdventure.description ? currentAdventure.description : '';

    //                 $("#roomNameHeader").html('<strong>' + currentAdventure.title + '</strong><blockquote class="blockquote"><p class="mb-0" id="roomTitle"><small>'+ adventureDescription +'</small></p><footer class="blockquote-footer"a><small>' + currentAdventure.owner + ' in <cite title="Source Title">Svärdets Sång</cite></small></footer></blockquote>');

    //                 //load current user
    //                 //
    //                 currentUser = firebase.auth().currentUser;
    //                 if (currentUser != null) {

    //                     $("#navbarDropdown").text(currentUser.displayName);
    //                     //is the logged in user the room admin?
    //                     //
    //                     if (currentAdventure.ownerId === currentUser.uid) {
    //                         isAdmin = true;

    //                         $("#settingsRoomOwner").val(currentAdventure.owner);
    //                         $("#settingsRoomName").val(currentAdventure.title);
    //                         $("#settingsRoomTitle").val(currentAdventure.description);
                            
    //                         activateAdminFeatures();
    //                     }

    //                     initGame();
    //                 } else {
    //                     redirectToLogin();
    //                 }

    //             } else {
    //                 redirectToLogin();
    //             }
    //         });
    //     } else {
    //         redirectToLogin();
    //         window.user = null;
    //     }
    // });

    //leave the room
    //
    $("#leave-room-button").click(function (e) {
        console.log('leave room');
        e.preventDefault();

        $("body").css("cursor", "progress");

        //if its a regular user, remove user from the room
        //and redirect to index
        //
        if(isAdmin === false){
            database.ref('adventures/' + adventureId + '/conflict/' + currentAdventureMember.displayName).remove().then();
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


        var currentFighter = currentUser.uid; //currentAdventureMember.displayName;
        if (isAdmin) {

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

            database.ref('adventures/' + adventureId + '/conflict/' + currentFighter + '/cards/' + cardId).remove();

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

            database.ref('adventures/' + adventureId + '/conflict/' + currentFighter + '/cards/' + cardId).set({ "isVisible": false, "cardid": cardId, "name": fightcard.name, "sortOrder": nrOfCard });

        }
    });

    $("#btn-dice-pride").click(function (e) {
        console.log('btn-throw-dice.click');
        e.preventDefault();

        const diceRoll = new DiceRoll('1d12');
        var nrOfHits = artefactDiceSuccess[diceRoll.total-1];
        var hitResult = '';

        for (let index = 0; index < nrOfHits; index++) {
            hitResult += '$H';//'<img src="images/dice_hit.png" height="25">';                
        }
        var result = 'Stolthet:[' + diceRoll.total+ '] ' + hitResult;

        saveDiceRoll(result);
    });

    $("#btn-dice-reroll").click(function (e) {
        console.log('btn-throw-dice.click');
        e.preventDefault();


        var results = getTheRollResult(diceToReroll.ge,diceToReroll.fv,diceToReroll.va,diceToReroll.might,diceToReroll.epic,diceToReroll.legendary,diceToReroll.modifier);
        if(results.length > 0){
            saveDiceRoll(results);
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
            totalResult = 'Modifikation: [-'+modifier+']<br>';
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
                    miss += '$M';//'<img src="images/dice_miss.png" height="25">';
                }
                if(result == 6){
                    diceToReroll.ge--;
                    if(diceToReroll.modifier > 0){
                        diceToReroll.modifier--;
                        //hit += 'X';
                    }else{
                        diceToReroll.nrOfHits++;                        
                        hit += '$H';//'<img src="images/dice_hit.png" height="25">';
                    }                    
                }               
            });

            var geResult = 'GE:[' + output.join(",") + '] ' + hit + ' ' + miss;

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
                    hit += '$H';//'<img src="images/dice_hit.png" height="25">';
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
                    miss += '$M';//'<img src="images/dice_miss.png" height="25">';
                }
                if(result == 6){
                    diceToReroll.nrOfHits++;
                    diceToReroll.va--;
                    hit += '$H';//'<img src="images/dice_hit.png" height="25">';
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

            if(hit > 0)
            {
                diceToReroll.might = 0;

                for (let index = 0; index < hit; index++) {
                    diceToReroll.nrOfHits++;
                    hitResult += '$H';               
                }
            }
            
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

            if(hit > 0)
            {
                diceToReroll.epic = 0;

                for (let index = 0; index < hit; index++) {
                    diceToReroll.nrOfHits++;
                    hitResult += '$H'             
                }
            }
            
            var result = 'Episk: [' + output.join(",") + '] ' + hitResult ;
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

            if(hit > 0)
            {
                diceToReroll.legendary = 0;

                for (let index = 0; index < hit; index++) {
                    diceToReroll.nrOfHits++;
                    hitResult += '$H';               
                }
            }

            var result = 'Legendarisk: [' + output.join(",") + '] ' + hitResult ;
            totalResult += result;
        }

        var hitandmissresult = 'Resultat: ';
        for (let index = 0; index < diceToReroll.nrOfHits; index++) {
            hitandmissresult += '$H';//'<img src="images/dice_hit.png" height="25">';                
        }

        for (let index = 0; index < diceToReroll.nrOfMiss; index++) {
            hitandmissresult += '$M';//'<img src="images/dice_miss.png" height="25">';                
        }

        totalResult += '<br>' +  hitandmissresult;

      console.log(totalResult);
      
        return totalResult.trim();
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
            saveDiceRoll(results);
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

        saveDiceRoll(result);        
    });    
    




});