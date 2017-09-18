function chat_guessChatLoad(socket){
  var guessForm = $("#guessForm");
  var userGuess = $("#userGuess");
  var chat = $("#chat");

  guessForm.submit(function(e){
    e.preventDefault();
    socket.emit("sendGuess", userGuess.val());
    userGuess.val("");
  });

  socket.on('newGuess', function(data){
    console.log(data);
    chat.append("<p>"+data.msg+"</p>");
  });
};
