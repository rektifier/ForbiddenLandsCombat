
var currentUser;
var currentRoom;

var database = firebase.database();

var cards = {

};


// Shortcuts to DOM Elements.
//var messageForm = document.getElementById('message-form');
var loginDiv = document.getElementById('login');
var roomDiv = document.getElementById('room');
var roomselect = document.getElementById('login-rooms-select');
var usernameInput = document.getElementById('login-username-input');
var signInButton = document.getElementById('login-button');
var leaveRoomButton = document.getElementById('leave-rrom-button');

/*
function allowDrop(ev) {
    ev.preventDefault();
  }
  
  function drag(ev) {
    ev.dataTransfer.setData("text", ev.target.id);
  }
  
  function drop(ev) {
    ev.preventDefault();
    var data = ev.dataTransfer.getData("text");
    ev.target.appendChild(document.getElementById(data));
  }

*/
  
var showAlert = function () { }
showAlert.info = function (message) {
    
    $("#alerttext").text(message);
    $("#info-alert").show();

    $("#info-alert").fadeTo(2000, 500).slideUp(500, function(){
            $("#info-alert").slideUp(500);
         });  

    //$('#alert_placeholder').html('<div class="alert alert-' + type + '"><a href="#" class="close" data-dismiss="alert" aria-label="close">×</a><strong>' + header + '</strong> ' + message + '</div>');
}


//################ ROOM ###########################


function loadUsersList(){

    if(currentRoom)
    {
        var usersRef = database.ref('rooms/'+currentRoom+'/users');
        usersRef.on("child_added", function(snapshot, prevChildKey) {
            var newUser = snapshot.val();       
            console.log(newUser);   
            $("#userslist").append('<li class="list-group-item">'+ newUser.name +'</li>');

            showAlert.info(newUser.name + " joined the fight!");
        });


        usersRef.onDisconnect().remove();


    }
}


function addUserToRoom(user){

    database.ref('rooms/'+currentRoom+'/users/'+currentUser).update({"name":user});
}


//################ ROOM END ###########################

function initGame(){

    loadUsersList();

    addUserToRoom(currentUser);

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

    if (typeof currentRoom !== 'undefined')
    {
        if(usernameInput.value !== null)
        {
            loginDiv.style.display = 'none'; 
            roomDiv.style.display = 'block';
        
            currentUser = usernameInput.value;

            localStorage.setItem("user",currentUser);
        
            initGame();
        }
    }


});

// #################### LOGIN END ###############################


 

//$(function () {
$(document).ready(function(){  

    var room = localStorage.getItem("room");
    var user = localStorage.getItem("user");

    if(room !== null)
    {
        currentRoom = room;
    }

    if(user !== null)
    {
        currentUser = user;
    }

    if(room !== null && user != null)
    {
        loginDiv.style.display = 'none'; 
        roomDiv.style.display = 'block';

        initGame();
        return;
    }

    console.log("document ready");

    roomDiv.style.display = 'none'; 

    loadRoomDropdown();
  

    $("#login-rooms-select").change(function(){

        var selectedRoom = $(this).children("option:selected").val();
        currentRoom = selectedRoom;

        localStorage.setItem("room",currentRoom);

        console.log("You have selected the room - " + selectedRoom);

    });


    leaveRoomButton.addEventListener('click', function() {
        
    });


});


