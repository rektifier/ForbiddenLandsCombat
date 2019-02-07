
var currentUser;
var currentRoom;

var database = firebase.database();


// Shortcuts to DOM Elements.
//var messageForm = document.getElementById('message-form');
var loginDiv = document.getElementById('login');
var roomDiv = document.getElementById('room');
var roomselect = document.getElementById('login-rooms-select');
var usernameInput = document.getElementById('login-username-input');
var signInButton = document.getElementById('login-button');




var bootstrapAlert = function () { }
bootstrapAlert.info = function (message, type, header) {
    $('#alert_placeholder').html('<div class="alert alert-' + type + '"><a href="#" class="close" data-dismiss="alert" aria-label="close">×</a><strong>' + header + '</strong> ' + message + '</div>');
}


//################ ROOM ###########################


database.ref('rooms').on("child_added",function(snapshot){

    //update list of users in a room.
    var room = snapshot.val();

});

function loadUsersList(){

    if(currentRoom)
    {
          database.ref('rooms/'+currentRoom+'/users').on("child_added", function(snapshot, prevChildKey) {
            var newUser = snapshot.val();       
            console.log(newUser);   
            $("#userslist").append('<li class="list-group-item">'+ newUser.name +'</li>');
          });
    }
}


function addUserToRoom(){

    database.ref('rooms/'+currentRoom+'/users/'+currentUser).update({"name":currentUser});

}

//################ ROOM END ###########################

function initGame(){

    loadUsersList();

    addUserToRoom();

}

//################ LOGIN  ###########################

function loadRoomDropdown(){
    database.ref('rooms').once("value").then(function(snapshot) {
        //var key = snapshot.key; 
        if(snapshot.exists()){

            snapshot.forEach(function(child) {
                var room = child.val();  
                $("#login-rooms-select").append($("<option></option>").attr("value",room.name).text(room.name));  
              });
        }
      });
}

     // Bind Sign in button.
     signInButton.addEventListener('click', function() {

        loginDiv.style.display = 'none'; 
        roomDiv.style.display = 'block';

        currentUser = usernameInput.value;

        initGame();
    });

// #################### LOGIN END ###############################



//Using set() overwrites data at the specified location, including any child nodes.
//
function writeUserData(userId, name) {
    database.ref('users/' + userId).set({
      username: name
    });
  }

 

//$(function () {
$(document).ready(function(){  

    console.log("document ready");
    roomDiv.style.display = 'none'; 

    loadRoomDropdown();
  

    $("#login-rooms-select").change(function(){
        var selectedRoom = $(this).children("option:selected").val();
        currentRoom = selectedRoom;
        console.log("You have selected the room - " + selectedRoom);
    });


/*
    // Bind Sign out button.
    signOutButton.addEventListener('click', function() {
      firebase.auth().signOut();
    });

    myPostsMenuButton.onclick = function() {
        //showSection(userPostsSection, myPostsMenuButton);
      };
      myTopPostsMenuButton.onclick = function() {
        //showSection(topUserPostsSection, myTopPostsMenuButton);
      };
*/
});