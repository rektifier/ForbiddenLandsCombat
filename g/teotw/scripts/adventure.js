var isRoomAdmin = false;
var currentUser;
var adventureId;
var currentAdventure;
var currentAdventureTitle;
var adminAction = '';
var isInCombat = false;
var currentCharacterSheet = [];

var latestDiceRoll = null;
// var latestDiceRoll = {
//     message:'',
//     owner:'',
//     createdOn:''
// };



// var stat_attribute = {
//     category:'attribute',
//     name:'dexterity',
//     type:'physical',
//     value:'5'
// }

// var stat_stress = {
//     category:'stress',
//     type:'physical',
//     value:'-'
// }

// var stat_feature = {
//     category:'feature',
//     name:'Bara ett ben..',
//     type:'physical',
//     value:'-'
// }

// var stat_trauma = {
//     category:'trauma',
//     createdday:2,
//     name:'Bruten fot',
//     type:'physical',
//     value:'7'
// }



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

        if (isRoomAdmin) {
            $("#userslist").append('<div class="btn-group dropright"><button type="button" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">' + user.name + '</button><div class="dropdown-menu"><button class="dropdown-item" type="button">Add to fight</button><button class="dropdown-item" type="button">Send message</button><div class="dropdown-divider"></div><button class="dropdown-item" type="button">Kick from room</button></div></div>');
        } else {
            $("#userslist").append('<li id="' + key + '" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center">' + user.name + '</li>');
        }

    }
}

function removeUserFromList(username) {
    console.log('removeUserFromList(' + username + ')');

    var user = $("#userslist").find('li#' + username);
    if (user !== 'undefined' && user !== null && user.length > 0) {
        $(user).remove();
    }
}



function sendDiceRoll(text) {

    database.ref('/rolls/').push({

        adventureId:adventureId,
        createdOn: firebase.database.ServerValue.TIMESTAMP,
        message: text,
        owner: currentUser.displayName

    }).catch(function (error) {
        console.error('Error writing new message to Firebase Database', error);
    });
}


function createDiceRollsMessage(sender, message, createdOn, isLatest) {
    var messageTemplate = '';

    if (isLatest) {
        messageTemplate = '<li><div class="card bg-light mb-3"><div class="card-header">' + sender + ' <small><i>(' + createdOn + ')</i></small></div><div class="card-body"><p class="card-text">' + message + '</p></div></div></li>';
    }
    else {
        messageTemplate = '<li><div class="card"><div class="card-body small"><p class="card-text">' + sender + ' <small><i>' + createdOn + '</i></small><br>' + message + '</p></div></div></li>';
    }
    return messageTemplate;
}

function appendDiceRollsMessage(message, owner, createdOn, isLatest) {
    var messDate = moment(createdOn).format('YYYY-MM-DD kk:mm');
    var result = createDiceRollsMessage(owner, message, messDate, isLatest);

    if (latestDiceRoll !== null) {
        $('#dicerolls-messages li:first-child').remove();
        var resultOfLatest = createDiceRollsMessage(latestDiceRoll.owner, latestDiceRoll.message, latestDiceRoll.createdOn, false);
        $('#dicerolls-messages').prepend(resultOfLatest);
    }

    latestDiceRoll = { message: message, owner: owner, createdOn: messDate };

    $('#dicerolls-messages').prepend(result);
}

function printStat(stat){

    switch (stat.category) {

        case 'attribute':
            $("#attribute_"+stat.type+'_'+stat.name).html(stat.value);
            $('[name="radio'+stat.name+'"]').removeAttr('checked');
            $("input[name=radio"+stat.name+"][value=" + stat.value + "]").prop('checked', true);
            break;

        case 'stress':
            for (let index = 0; index < 9; index++) {
                $('#'+stat.type+'-stress-'+index).attr('checked', false);
            }

            for (let index = 1; index < stat.value+1; index++) {                
                $('#'+stat.type+'-stress-'+index).attr('checked', true);
            }            
            break;
        
        case 'trauma':
            
            break;
        
        case 'feature':
            
            break;                    
    
        default:
            break;
    }

}

function initGame() {

    console.log('init game');

    var diceRollsRef = database.ref('rolls').orderByChild('adventureId').equalTo(adventureId);
    var usersRef = database.ref('/adventures/' + adventureId + '/members/');

    if (isRoomAdmin === false) {

        var characterSheetRef = database.ref('/charactersheets/' + adventureId +'/' + currentUser.uid);

        var currentUserRef = database.ref('/adventures/' + adventureId + '/members/' + currentUser.uid);
        currentUserRef.once('value', function (snapshot){
            if(snapshot.exists()){
                var member = snapshot.val();
                $("#inputDisplayName").val(member.name);
            }else{
                $("#inputDisplayName").val(currentUser.displayName);
            }
        });

        //currentUserRef.onDisconnect().remove();
        
        //get user if we have one
        //
        characterSheetRef.on('child_added',function (snapshot) {
            console.log('characterSheetRef.on');

            if (snapshot.exists()) {               
                    var userstat = snapshot.val();
                    console.log(userstat);

                    currentCharacterSheet.push({key:snapshot.key,stat:userstat});
                    printStat(userstat);   
            }else{
                console.log('Could not find a charactersheet. Lets create one!');

                for (let index = 0; index < characterAttributes.length; index++) {
                    const stat = characterAttributes[index];

                    //database.ref('/charactersheets/' + adventureId +'/' + currentUser.uid).put();
                    database.ref('/charactersheets/' + adventureId +'/' + currentUser.uid).push({

                        category:'attribute',
                        name: stat.name,
                        type: stat.type,
                        value: 1
                
                    }).catch(function (error) {
                        console.error('Error writing new message to Firebase Database', error);
                    });

                    
                    
                }
            }
        });

        characterSheetRef.on("child_removed", function (snapshot) {
            console.log('on.child_removed');
            var removedKey = snapshot.ke;

            
        });

        characterSheetRef.on("child_changed", function (snapshot) {
            console.log('characterSheetRef.on.child_changed');
            var changedMember = snapshot.val();
            var changedUserId = snapsh.key;

           
            
        });
        
    }


    // var startOfDay = moment().startOf('day').valueOf();//unix time format ( ms ) //.format("x");
    // var startNow = moment().valueOf();
   
    
    //diceRollsRef.orderByChild('createdOn').limitToLast(roomConfig.maxNrOfDiceRollsInList).startAt(startOfDay).on('child_added', function (snapshot) {
    diceRollsRef.limitToLast(roomConfig.maxNrOfDiceRollsInList).on('child_added', function (snapshot) {
        console.log('diceRollsRef.orderByChild(createdOn).limitToLast(roomConfig.maxNrOfDiceRollsInList).on(child_added');
        var mess = snapshot.val();

        appendDiceRollsMessage(mess.message, mess.owner, mess.createdOn, true);
    });


    //remove user when disconnected
    //
    usersRef.on("child_removed", function (snapshot) {
        console.log('on.child_removed');
        var removedUser = snapshot.val();

        removeUserFromList(removedUser.displayName);

        if (snapshot.key === currentUser.displayName && isRoomAdmin === false) {
            redirectToLogin();
        }
    });
    

    usersRef.on("child_changed", function (snapshot) {
        console.log('on.child_changed');
        
        var userId = snapshot.key;
        var user = snapshot.val();

        $("#"+userId).text(user.name);

        if(userId === currentUser.uid){
            $("#inputDisplayName").val(user.name);
        }
        console.log(user);
    });

    usersRef.on("child_added", function (snapshot) {
        console.log('on.child_added');
        
        var userId = snapshot.key;
        var user = snapshot.val();
        console.log(user);

        if (!(isRoomAdmin && userId === currentUser.uid)) {
            addUserToList(userId, user);
            if(userId === currentUser.uid){
                $("#inputDisplayName").val(user.name);
            }
        }


    });

    

}

// //ToDo: kan ej ha flera index i samma struktur. se över datat så att 
// // vi kan rensa gamla dice rolls
// function cleanDBData() {
//     console.log('Clean old db data.')

//     //clear old room data 24 hours ago
//     //
//     var cutOff = moment().subtract(24, 'hours').valueOf();
//     database.ref('/rolls/').orderByChild('createdOn').endAt(cutOff).once("value").then(function (snapshot) {
//         if (snapshot.exists()) {
//             console.log('we have old dice rolls. removing..');
//             snapshot.ref.remove();
//         }
//     });
// }

// Initiate firebase auth.
function initFirebaseAuth() {
    // Listen to auth state changes.
    firebase.auth().onAuthStateChanged(authStateObserver);
}

function authStateObserver(user) {

    if (user) {
        console.log('User is logged in');
        currentUser = firebase.auth().currentUser;

        //load current adventure
        //
        database.ref('/adventures/' + adventureId).once("value").then(function (snapshot) {

            if (snapshot.exists()) {

                currentAdventure = snapshot.val();

                $("#roomNameHeader").html('<strong>' + currentAdventure.title + '</strong><blockquote class="blockquote"><footer class="blockquote-footer"a><small> by ' + currentAdventure.owner + ' in <cite title="Source Title">' + currentAdventure.game + '</cite></small></footer></blockquote>');

                //load current user
                //
                // vi tar det här vid ett senare tillfälle..
                //cleanDBData();


                //is the logged in user the room admin?
                //
                if (currentAdventure.owner === currentUser.displayName) {
                    isRoomAdmin = true;

                    $("#settingsRoomOwner").val(currentAdventure.owner);
                    $("#settingsRoomName").val(currentAdventure.name);
                    $("#settingsRoomTitle").val(currentAdventure.title);

                    activateAdminFeatures();
                }

                initGame();

            } else {
                redirectToLogin();
            }
        });
    } else {
        console.log('User is not logged in');
        redirectToLogin();
    }

}

//admin fearur41
//
function activateAdminFeatures() {

    $(".admingroup").show();
    $("#add-enemy-button").prop("disabled", true);

    $('#add-enemy-input').keyup(validateAddEnemyButton);

    function validateAddEnemyButton() {

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
                // updateDbWithUserListOrder();
            }
        },
        stop: function (event, ui) {
            console.log('userslist.sortable stop event ');
            if (adminAction === 'killFighter') {
                $(this).sortable("cancel");

                var userToKick = ui.item[0].id

                database.ref(roomConfig.gameRoot + '/rooms/' + currentAdventure.name + '/users/' + userToKick).remove();
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



    // //fight button in users list
    // //
    // $("#userslist").on('click', 'a', function () {

    //     console.log('click.btn-user-fight');

    //     var li = $(this).parent();

    //     $(li).toggleClass('incombat');

    //     var nrOfPlayersInFight = $("#userslist .incombat").length;
    //     if (nrOfPlayersInFight > roomConfig.maxNrOfPlayersInFight) {
    //         //toggle back the combat class
    //         //
    //         $(li).toggleClass('incombat');

    //     } else {
    //         var isInCombat = $(li).hasClass('incombat');
    //         var user = $(li).attr('id');

    //         firebase.database().ref().child(roomConfig.gameRoot + '/rooms/' + currentAdventure.name + '/users/' + user).update({ inCombat: isInCombat });

    //         if (isInCombat === true) {
    //             //add user to combat
    //             firebase.database().ref().child(roomConfig.gameRoot + '/rooms/' + currentAdventure.name + '/conflict/' + user).set({ "userid": user });
    //         } else {
    //             //remove user from combat
    //             firebase.database().ref().child(roomConfig.gameRoot + '/rooms/' + currentAdventure.name + '/conflict/' + user).remove();
    //         }
    //     }

    //     console.log(li);
    // });

    $("#add-enemy-button").click(function (e) {

        console.log('add-enemy-button.click ');
        e.preventDefault();

        var enemyName = $("#add-enemy-input").val();

        //add enemy to room
        //
        database.ref(roomConfig.gameRoot + '/rooms/' + currentAdventure.name + '/users/' + enemyName).set({ "name": roomConfig.enemyNamePrefix + enemyName + roomConfig.enemyNameSuffix, "sortOrder": 99, "inCombat": false }).then(() => {
            $("#add-enemy-input").val('');
        });
    });
}


$(document).ready(function () {

    const roller = new DiceRoller();

    adventureId = getParameterByName('id');
    if(isEmpty(adventureId)){
        redirectToLogin();
    }

    $("#info-alert").hide();
    $(".admingroup").hide();

    // initialize Firebase
    initFirebaseAuth();

    //leave the room
    //
    $("#leave-room-button").click(function (e) {
        console.log('leave room');
        e.preventDefault();

        $("body").css("cursor", "progress");

        //if its a regular user, remove user from the room
        //and redirect to index
        //
        if (isRoomAdmin === false) {
            //database.ref('/adventures/' + currentAdventure.name + '/members/' + currentUser.displayName).remove().then();
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
        var totalResult = '';

        if (isEmpty(nrOfPositive) == false && nrOfPositive !== "0") {
            diceRollPositive = new DiceRoll(nrOfPositive);
            diceRollPositive.rolls[0].forEach(function (result) {
                positiveDice.push(result);
            });

            totalResult = 'Positive: [' + positiveDice.join(",") + ']';
        }

        if (isEmpty(nrOfNegative) == false && nrOfNegative !== "0") {
            diceRollNegative = new DiceRoll(nrOfNegative);
            diceRollNegative.rolls[0].forEach(function (result) {
                negativeDice.push(result);
            });
            totalResult += '<br>Negative: [' + negativeDice.join(",") + ']';
        }

        if (positiveDice.length > 1 && negativeDice.length > 1) {
            var p = positiveDice.length
            while (p--) {
                var n = negativeDice.length;
                while (n--) {
                    if (positiveDice[p] == negativeDice[n]) {
                        positiveDice.splice(p, 1);
                        negativeDice.splice(n, 1);
                    }
                }
            }
            totalResult += '<br><br>Result: Positive [' + positiveDice.join(",") + ']<br>Stress: ' + negativeDice.length + ' point';
        }

        if (totalResult.length > 0) {
            sendDiceRoll(totalResult);
        }

        //reset all active labels
        //
        $(".btn-group input").prop("checked", false);
        $(".btn-group").find(">:first-child").addClass('active').siblings().removeClass('active');
        $(".btn-group").find(">:first-child").children('input').first().prop("checked", true);
    });

    // //ToDO: fixa så att admin kan sätta day, owner och title på adventure
    // //room settings
    // //
    // $("#btn-settings-save").click(function (e) {
    //     console.log('btn-settings-save.click');
    //     e.preventDefault();

    //     var owner = $("#settingsRoomOwner").val();
    //     var roomname = $("#settingsRoomName").val();
    //     var title = $("#settingsRoomTitle").val();

    //     database.ref('/adventures/' + adventureId).update({ "owner": owner, "title": day, "title": day });

    //     $("#roomNameHeader").html('<strong>' + roomname + '</strong><blockquote class="blockquote"><p class="mb-0" id="roomTitle"><small>' + title + '</small></p><footer class="blockquote-footer"a><small>' + owner + ' in <cite title="Source Title">' + roomConfig.gameName + '</cite></small></footer></blockquote>');

    // });


    

    $("#btn-attributes-save").click(function (e) {
        console.log('btn-attributes-save.click');
       e.preventDefault();
        

        var characterName = $("#inputDisplayName").val();

        database.ref('/adventures/' + adventureId + '/members/' + currentUser.uid).update({ name: characterName});

        var radiovitality = $("input[name='radiovitality']:checked").val();
        var radiodexterity = $("input[name='radiodexterity']:checked").val();
        var radiowillpower = $("input[name='radiowillpower']:checked").val();
        var radiologic = $("input[name='radiologic']:checked").val();        
        var radiocharisma = $("input[name='radiocharisma']:checked").val();    
        var radioempathy = $("input[name='radioempathy']:checked").val();    

        
        $('#settingsModal').modal('toggle');


    });
    

    $(".delete-feature").click(function (e) {
        console.log('delete-feature.click');
        e.preventDefault();

        alert('detele');
    });

    $('.selectable').click(function (e) {
        var statvalue = $(this).data('statvalue');
        console.log('clicked ' + statvalue)
    });

    $('label').click(function () {
        $('span', this).text(function (i, text) {
            return text === "-" ? "+" : "-";
        });
    });

    $('.btn-add-feature').click(function (e) {
        console.log('.btn-add-feature.clicked ');

        var featureName = $(this).parent('div').siblings('div').find('.input-add-feature').val();
        console.log(featureName);

        if(isEmpty(featureName) == false){
            var statype = $(this).data('statype');
            var positiveOrNegative = $(this).parent('div').siblings('div').find('.span-add-feature').text();

            console.log(statype);
            console.log(positiveOrNegative);
        }
        else{
            e.stopPropagation();
        }
    });



});