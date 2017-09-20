var socket = null;

function chat_guessChatLoad(webSocketInstance){
  socket = webSocketInstance
  var guessForm = $("#guessForm");
  var userGuess = $("#userGuess");
  var chat = $("#chat");

  socket.on("updateUsers", function(data){
    var orderedListHTML = '';
    var colorString = "";
    for(var i=0; i<data.length; i++){
      var username = data[i].username;
      if(username.length > 6)
        username = username.substring(0,5)+"...";
      if(data[i].isDrawing)
        colorString = "rgba(200,200,255, 0.50)";
      else
        colorString = "rgba(215,200,255, 0.15)";
      var hash = "[#" + data[i].countID + "]"
      orderedListHTML += "<li style='background-color:"+colorString+"' class='list-group-item'><strong>"+username+"</strong><small>"+hash+"</small>:  <strong>"+data[i].pointsScored+"</strong></li>"
    }
    $("#players").html(orderedListHTML);
  });

  guessForm.submit(function(e){
    e.preventDefault();
    var newGuess = userGuess.val();
    if(newGuess.length > 1){
      socket.emit("sendGuess", newGuess, function(isClose, isTrue){
          if(isClose){
            $("#picturePlayerGuesses").append("<p style='color:white; font-size:120%'>"+newGuess.toUpperCase()+"</p>")
            document.getElementById("picturePlayerGuesses").scrollTop = document.getElementById("picturePlayerGuesses").scrollHeight;
          }
          else if(isTrue){
            $("#picturePlayerGuesses").append("<p style='color:blue; font-size:120%'>"+newGuess.toUpperCase()+"</p>")
            document.getElementById("picturePlayerGuesses").scrollTop = document.getElementById("picturePlayerGuesses").scrollHeight;
          }
          else{
            $("#picturePlayerGuesses").append("<p>"+newGuess.toUpperCase()+"</p>");
            document.getElementById("picturePlayerGuesses").scrollTop = document.getElementById("picturePlayerGuesses").scrollHeight;
          }
      });
    }
    userGuess.val("");
  });

  socket.on('newGuess', function(data){
    var username = data.username;
    if(username.length > 6)
      username = username.substring(0,6);
    chat.append("<p><strong style='font-size: 120%'>"+username+": </strong>"+data.msg+"</p>");
    document.getElementById("chat").scrollTop = document.getElementById("chat").scrollHeight;
  });
};
