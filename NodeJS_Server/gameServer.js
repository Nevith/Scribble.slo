var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var fs = require('fs');
var path = require('path')

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
    connections.splice(connections.indexOf(socket), 1);
    console.log('Disconnect: %s sockets connected', connections.length);
  });

  //sendGuess
  socket.on('sendGuess', function(data){
    io.sockets.emit('newGuess', {msg: data});
  })


});
