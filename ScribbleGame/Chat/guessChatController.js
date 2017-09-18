var socket = null;

function chat_guessChatLoad(webSocketInstance){
  socket = webSocketInstance
  var guessForm = $("#guessForm");
  var userGuess = $("#userGuess");
  var chat = $("#chat");

  socket.on("updateUsers", function(data){
    var orderedListHTML = '';
    for(var i=0; i<data.length; i++){
      orderedListHTML += "<li style='background-color: rgba(215,200,255, 0.3)' class='list-group-item'><strong>"+data[i]+"</strong></li>"
    }
    $("#players").html(orderedListHTML);
  });


  guessForm.submit(function(e){
    e.preventDefault();
    socket.emit("sendGuess", userGuess.val());
    userGuess.val("");
  });
  socket.on('newGuess', function(data){
    chat.append("<p><strong style='font-size: 150%'>"+data.username+":  </strong>"+data.msg+"</p>");
  });
};
