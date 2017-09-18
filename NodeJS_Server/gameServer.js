var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var fs = require('fs');
var path = require('path')

var gameIsRunning = false;
var numberOfRounds = 0;
users=[];
connections=[];

server.listen(2030);
console.log("Server runing...")


app.get('/',function(request, response){
  response.sendFile(path.resolve(__dirname+'/../index.html'))
});
app.use(express.static(__dirname+"/../"));

io.sockets.on('connection', function(socket){
  connections.push(socket);
  console.log('Connected: %s sockets connected', connections.length);

  //Disconnect
  socket.on('disconnect', function(data){
    if(socket.username) {
      users.splice(users.indexOf(socket.username), 1)
      updateUsers();
    }

    connections.splice(connections.indexOf(socket), 1);
    console.log('Disconnect: %s sockets connected', connections.length);

    if(connections.length < 1)
      gameIsRunning = false;
  });
  //New user
  socket.on('newUser', function(data, callback){
    if(users.indexOf(data) == -1 && !gameIsRunning){
      callback(true);
      socket.username = data;
      socket,pointsScored = 0;
      users.push(socket.username);
      if(users.indexOf(data) == 0){
        socket.hasAdminPrivilage = true;
      }
    }
    else{
      callback(false);
      connections.splice(connections.indexOf(socket), 1);
      console.log('Disconnect: %s sockets connected', connections.length);
    }
  });
  socket.on("newUserLoaded", function(callback){
    updateUsers()
    if(callback){
    if(socket.hasAdminPrivilage){
      callback(true);
    }
    else{
      callback(false);
    }
    }
  })

  //loadGame
  socket.on("loadGame", function(data){
    gameIsRunning = true;
    numberOfRounds = data;
    io.sockets.emit("gameStart");
  });
  //sendGuess
  socket.on('sendGuess', function(data){
    io.sockets.emit('newGuess', {msg: data, username: socket.username});
  })

  //gameInstance.gameInstanceInit(socket);
});

function updateUsers(){
  io.sockets.emit("updateUsers", users);
}
