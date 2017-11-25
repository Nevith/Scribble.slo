var socket = null;

function chat_guessChatLoad(webSocketInstance){
  socket = webSocketInstance
  var guessForm = $("#guessForm");
  var userGuess = $("#userGuess");
  var chat = $("#chat");

  socket.on("updateUsers", function(data){
    //Decode data
    data = JSON.parse(CryptoJS.AES.decrypt(data, socket.key).toString(CryptoJS.enc.Utf8));

    var orderedListHTML = "";
    var colorString = "";
    //Fill in users
    for(var i=0; i<data.length; i++){
      var username = data[i].username;
      //If username is to long
      if(username.length > 6)
        username = username.substring(0,5)+"...";

      //If user is Drawing highlight
      if(data[i].isDrawing)
        colorString = "rgba(200,200,255, 0.50)";
      else
        colorString = "rgba(215,200,255, 0.15)";

      //Users ID
      var hash = "[#" + data[i].countID + "]"

      //Create <li> tag for the user and add it to the html
      orderedListHTML += "<li style='background-color:"+colorString+"' class='list-group-item'><strong>"+username+"</strong><small>"+hash+"</small>:  <strong>"+data[i].pointsScored+"</strong></li>"
    }
    //Add html to the players container
    $("#players").html(orderedListHTML);
  });

  //When users submits a guess/msg
  guessForm.submit(function(e){
    e.preventDefault();
    //Get the value of user msg
    var newGuess = userGuess.val();
    var cipheredText = CryptoJS.AES.encrypt(newGuess, socket.key);

    if(newGuess.length >= 1){
      //Send new guess with a callback function that appends it to the list of guesses correctly
      socket.emit("sendGuess", cipheredText.toString(), function(isClose, isTrue){
          if(isClose){
            $("#picturePlayerGuesses").append("<p style='color:white; font-size:120%'>"+CryptoJS.AES.decrypt(cipheredText, socket.key).toString(CryptoJS.enc.Utf8).toUpperCase()+"</p>")
            document.getElementById("picturePlayerGuesses").scrollTop = document.getElementById("picturePlayerGuesses").scrollHeight;
          }
          else if(isTrue){
            $("#picturePlayerGuesses").append("<p style='color:blue; font-size:120%'>"+CryptoJS.AES.decrypt(cipheredText, socket.key).toString(CryptoJS.enc.Utf8).toUpperCase()+"</p>")
            document.getElementById("picturePlayerGuesses").scrollTop = document.getElementById("picturePlayerGuesses").scrollHeight;
          }
          else{
            $("#picturePlayerGuesses").append("<p>"+CryptoJS.AES.decrypt(cipheredText, socket.key).toString(CryptoJS.enc.Utf8).toUpperCase()+"</p>");
            document.getElementById("picturePlayerGuesses").scrollTop = document.getElementById("picturePlayerGuesses").scrollHeight;
          }
      });
    }
    //Reset the input box
    userGuess.val("");
  });

  //When a new guess comes in
  socket.on('newGuess', function(data){
    //Decode data
    data = CryptoJS.AES.decrypt(data, socket.key).toString(CryptoJS.enc.Utf8);
    data = JSON.parse(data);
    //Get username
    var username = data.username;
    //Shorten if to long
    if(username.length > 6)
      username = username.substring(0,6);

    //Append the msg to the chat
    chat.append("<p><strong style='font-size: 120%'>"+username+": </strong>"+data.msg+"</p>");
    //Scroll down the chatbox
    document.getElementById("chat").scrollTop = document.getElementById("chat").scrollHeight;
  });
};
