var isRoomAdmin = false;
var currentUser;
var currentAdventureMember;
var adventureId;
var currentAdventure;
// var adminAction = '';
// var isInCombat = false;
var currentCharacterSheet;

var latestDiceRoll = null;
var diceRolls;
var auth = new Auth();
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

function addUserToList(key, user) {

    console.log('addUserToList(' + user.displayName + ')');

    var exists = false;
    if ($("#userslist div").each(function (index) {

        var text = $(this).attr('id');
        if (text == key) {
            exists = true;
        }
    }));

    console.log('addUserToList(' + user.displayName + ') exists: ' + exists);

    if (exists === false) {

        $("#userslist").append('<div id="' + key + '" class="btn-group dropright"><button type="button" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">' + user.displayName + ' <small><i>( '+user.userName+' )</i></small></button><div class="dropdown-menu"><button class="dropdown-item" type="button">Add to fight</button><button class="dropdown-item" type="button">Send message</button><div class="dropdown-divider"></div><button class="dropdown-item btn-kick-member" data-uid="'+key+'" type="button">Kick from room</button></div></div>');
    }
}

function removeUserFromList(username) {
    console.log('removeUserFromList(' + username + ')');

    var user = $("#userslist").find('div#' + username);
    if (user !== 'undefined' && user !== null && user.length > 0) {
        $(user).remove();
    }
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



function createTraumaItem(key,value,name){
    var notation = '1M';    
    if(value <= 3){
        notation = '1D';
    }else if(value <= 6){
        notation = '1V';
    }
    return '<li id="'+key+'" class="list-group-item py-1 list-group-item-danger"><input type="checkbox" data-value="'+value+'"> '+name+'('+notation+')<button type="button" class="close"><span class="delete-trauma" aria-hidden="true">&times;</span></button></li>';
}

function createFeatureItem(key,value,name){

    var colorClass = 'danger';
    if(value === '+'){
        colorClass = 'success';
    }

    return '<li id="'+key+'" class="list-group-item py-1 list-group-item-'+colorClass+'"><input type="checkbox" data-typeofdice="'+value+'"> '+name+'<button type="button" class="close"><span class="delete-feature" aria-hidden="true">&times;</span></button></li>';
}

function printStat(key,stat,eventtype){

    switch (stat.category) {

        case 'attribute':
            $("#attribute_"+stat.type+'_'+stat.name).html(stat.value);
            $('[name="radio'+stat.name+'"]').removeAttr('checked');
            $("input[name=radio"+stat.name+"][value=" + stat.value + "]").prop('checked', true);
            $('#th_'+stat.type + '_'+stat.name).data('statvalue',stat.value); //setter  img_physical_vitality
           
            break;

        case 'stress':

            //uncheck all stress
            //
            $('.checkbox-stress-'+stat.type).prop("checked",false); 
           
            //set right amount of stress
            //
            if(isEmpty(stat.value) === false && stat.value > 0)
            {
                for (let index = 1; index < stat.value+1; index++) {                
                    $('#'+stat.type+'-stress-'+index).prop("checked", true);
                } 
            }           
            break;
        
        case 'trauma':

            switch (eventtype) {
                case 'removed':
                    $('#'+key).remove();     
                break;

                case 'added':
                    var newTrauma = createTraumaItem(key,stat.value,stat.name);
                    $('#'+stat.type+'-trauma-items').append(newTrauma);
                break;     

                case 'changed':
                
                break;                    
            
                default:
                    break;
            }
            
            
            break;
        
        case 'feature':
            // physical-features-items
            switch (eventtype) {
                case 'removed':                
                    $('#'+key).remove();                
                break;

                case 'added':
                    var newFeature = createFeatureItem(key,stat.value,stat.name);
                    $('#'+stat.type+'-features-items').append(newFeature);
                
                break;         

                case 'changed':            
                break;                    
            
                default:
                    break;
            }
            
            break;                    
    
        default:
            break;
    }

}

function initGame() {

    console.log('init game');
    var startOfDay = moment().startOf('day').valueOf();

    //var diceRollsRef = database.ref('rolls').orderByChild('adventureId').equalTo(adventureId);
    var diceRollsRef = database.ref('rolls/' + adventureId);
    diceRolls = new DiceRolls(diceRollsRef,roomConfig.maxNrOfDiceRollsInList,startOfDay,appendDiceRollsMessage);
    diceRolls.cleanOldData();

    var usersRef = database.ref('/adventures/' + adventureId);

    var characterSheetsRef = database.ref('/charactersheets/' + adventureId);


    characterSheetsRef.on('child_added',function (snapshot) {
        console.log('characterSheetRef.on.child.added');

        if (snapshot.exists()) {               
                var userstat = snapshot.val();
                var statkey = snapshot.key;
                console.log(userstat);

                currentCharacterSheet.push({key:statkey,stat:userstat});
                printStat(statkey,userstat,'added');   
        }else{
            console.log('Could not find a charactersheet. Lets create one!');

            for (let index = 0; index < characterAttributes.length; index++) {
                const stat = characterAttributes[index];

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

    characterSheetsRef.on("child_removed", function (snapshot) {
        console.log('on.child_removed');
        var removedKey = snapshot.key;
        var removedStat = snapshot.val();

        removeCharacterSheetObject(removedKey);

        printStat(removedKey,removedStat,'removed');    
        
    });

    characterSheetsRef.on("child_changed", function (snapshot) {
        console.log('characterSheetRef.on.child_changed');
        var changedStat = snapshot.val();
        var changedKey = snapshot.key;

        replaceCharacterObject(changedKey,changedStat);

        printStat(changedKey,changedStat,'changed');            
    });
        
    

    
    // diceRollsRef.limitToLast(roomConfig.maxNrOfDiceRollsInList).on('child_added', function (snapshot) {
    //     console.log('diceRollsRef.orderByChild(createdOn).limitToLast(roomConfig.maxNrOfDiceRollsInList).on(child_added');
    //     var mess = snapshot.val();

    //     appendDiceRollsMessage(mess.message, mess.owner, mess.createdOn, true);
    // });


    //remove user when disconnected
    //
    usersRef.on("child_removed", function (snapshot) {
        console.log('on.child_removed');
        var removedUser = snapshot.val();
        var removedKey = snapshot.key;

        console.log(removedUser);

        removeUserFromList(removedKey);

        if (snapshot.key === currentUser.uid && isRoomAdmin === false) {
            redirectToLogin();
        }
    });
    

    usersRef.on("child_changed", function (snapshot) {
        console.log('on.child_changed');
        
        var userId = snapshot.key;
        var user = snapshot.val();

        console.log(user);

        
        if ($('#'+userId+':has(:button)').length > 0) {
            $('div#'+userId + ' button:first').text(user.displayName);
        }else{
            $("#"+userId).text(user.displayName);
        }


        if(userId === currentUser.uid){
            $("#inputDisplayName").val(user.displayName);
        }
        console.log(user);
    });

    usersRef.on("child_added", function (snapshot) {
        console.log('on.child_added');
        
        var userId = snapshot.key;
        var member = snapshot.val();
        console.log(member);

        if (!(isRoomAdmin && userId === currentUser.uid)) {
            addUserToList(userId, member);
            if(userId === currentUser.uid){
                $("#inputDisplayName").val(member.displayName);
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



function authStateObserver(user) {

    if (user) {

        if(user.isAnonymous == true){
            redirectToLogin('Please register to play TEOTW.');
        }

        console.log('User is logged in');
        currentUser = firebase.auth().currentUser;

        //load current adventure
        //
        database.ref('/adventures/' + adventureId).once("value").then(function (snapshot) {

            if (snapshot.exists()) {

                currentAdventure = snapshot.val();

                //is the logged in user the room admin?
                //
                if (currentAdventure.owner === currentUser.displayName) {
                    isRoomAdmin = true;

                    $(".adventure_owner").text(currentAdventure.owner);
                    $(".adventure_title").text(currentAdventure.title);
                    $(".adventure_game").text(currentAdventure.game);

                    $("#settingsRoomOwner").val(currentAdventure.owner);
                    $("#settingsRoomName").val(currentAdventure.name);
                    $("#settingsRoomTitle").val(currentAdventure.title);

                }else
                {
                    redirectToLogin('You are not the owner of ' + currentAdventure.title);
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


$(document).ready(function () {

    const roller = new DiceRoller();

    adventureId = getParameterByName('id');
    if(isEmpty(adventureId)){
        redirectToLogin();
    }


    // initialize Firebase user auth
    auth.initFirebaseAuth(authStateObserver);


    //leave the room
    //
    $("#leave-room-button").click(function (e) {
        console.log('leave room');
        e.preventDefault();

        $("body").css("cursor", "progress");

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
            saveDiceRoll(totalResult);
        }

        //reset all active labels
        //
        $(".btn-group input").prop("checked", false);
        $(".btn-group").find(">:first-child").addClass('active').siblings().removeClass('active');
        $(".btn-group").find(">:first-child").children('input').first().prop("checked", true);
    });




});