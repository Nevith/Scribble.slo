var gameInstanceInit = function(socketInstance){
  //sendGuess
  socketInstance.on('sendGuess', function(data){
    io.sockets.emit('newGuess', {msg: data});
  })
};
module.exports = gameInstanceInit;
