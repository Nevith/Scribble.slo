var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var fs = require('fs');
var path = require('path')

var gameIsRunning = false;
var numberOfRounds = 0;
var drawerIndex = 0;
var currentRound = 1;
var word = "testtesttest";
var roundTime;
var roundTimeDisplayStamp = 0;
var roundTimer;
var displayTimer;

var pointsGiven;
var numberOfHits;
users=[];
connections=[];
var samostalniki = "";

function read(file, callback) {
    fs.readFile(file, 'utf8', function(err, data) {
        if (err) {
            console.log(err);
        }
        callback(data);
    });
}
var output = read(__dirname+"/../Resources/words.txt", function(data) {
    console.log(data);
    samostalniki=data;
    samostalniki = samostalniki.split("\r");
    for(var i=0; i<samostalniki.length; i++)
      samostalniki[i] = samostalniki[i].substring(1, samostalniki[i].length);
    console.log("---------------------------------");
    console.log(samostalniki);
});

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

    if(connections.length < 1){
      clearTimeout(roundTimer);
      clearTimeout(displayTimer);
      gameIsRunning = false;
    }
  });
  //New user
  socket.on('newUser', function(data, callback){
    if(users.indexOf(data) == -1 && users.length < 10){
      callback(true);
      socket.username = data;
      socket.pointsScored = 0;
      socket.isDrawing = false;
      var newUser = {username: socket.username, pointsScored: 0}
      users.push(newUser);
      if(users.indexOf(newUser) == 0){
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
      callback(true, gameIsRunning);
    }
    else{
      callback(false, gameIsRunning);
    }
    }
  })
  setGameActions(socket);
});

function updateUsers(){
  for(var i=0; i<connections.length; i++){
    if(users[i] && connections[i]){
      users[i].pointsScored = connections[i].pointsScored;
      users[i].isDrawing = connections[i].isDrawing;
    }
  }
  io.sockets.emit("updateUsers", users);
}

function setGameActions(socket){
  //loadGame
  socket.on("loadGame", function(data){
    gameIsRunning = true;
    numberOfRounds = data;
    drawerIndex = 0;
    currentRound = 1;
    numberOfHits = 0;
    displayTimer = function(sockets){
      var secLeft = Math.round((roundTime._idleTimeout - (new Date() - roundTimeDisplayStamp))/1000)
      sockets.emit("displayTimer", secLeft+"s")
      setTimeout(function(){if(gameIsRunning) displayTimer(sockets)}, 1000);
    }
    //Reset round
    drawingTimer = function(sockets){
      roundTimeDisplayStamp = new Date();
      roundTime = setTimeout(function(){
        drawerIndex++;
        if(drawerIndex >= connections.length){
          if(currentRound>=numberOfRounds){
            //Game Ends
            clearTimeout(roundTimer);
            clearTimeout(displayTimer);
            gameIsRunning = false;
            for(var i=0; i<connections.length; i++){
              if(users[i] && connections[i]){
                users[i].pointsScored = connections[i].pointsScored;
              }
            }
            users.sort(function (a, b) { return b.pointsScored - a.pointsScored})
            sockets.emit("gameEnded", users);
          }
          else{
            wasDrawerIndexReset = true;
            drawerIndex = 0;
            currentRound++;
          }
        }
        for(var i=0; i<connections.length; i++){
          if(connections[i].isDrawing)
            connections[i].pointsScored += pointsGiven*0.35*numberOfHits;
            updateUsers();
        }
        numberOfHits = 0;
        if(gameIsRunning)
          drawingTimer(sockets);
        sockets.emit("newRound");
      }, 180000);
    }
    io.sockets.emit("gameStart");
  });
  //sendGuess
  socket.on('sendGuess', function(data, callback){
    if(!socket.isDrawing && !socket.hasGuessedThisRound){
      if(data.toUpperCase() == word.toUpperCase()){
        if(numberOfHits>0)
          socket.pointsScored += pointsGiven / (numberOfHits*0.75);
        else
          socket.pointsScored += pointsGiven
        numberOfHits++;
        socket.hasGuessedThisRound = true;
        callback(false, true);
        io.sockets.emit('newGuess', {msg: "Ugotovil sem!", username: socket.username, isDrawing: socket.isDrawing});
        io.sockets.emit('correctGuess', socket.username);
        updateUsers();
      }
      else if(word.toUpperCase().indexOf(data.toUpperCase())>=0 && (data.length >= (word.length/2))){
        callback(true, false);
        io.sockets.emit('newGuess', {msg: data, username: socket.username, isDrawing: socket.isDrawing});
      }
      else {
        io.sockets.emit('newGuess', {msg: data, username: socket.username, isDrawing: socket.isDrawing});
        callback(false, false);
      }
    }
    else if(data.toUpperCase() != word.toUpperCase()){
      io.sockets.emit('newGuess', {msg: data, username: socket.username, isDrawing: socket.isDrawing});
    }
  });
  //SetUpAllusers
  socket.on('getRoundData', function(callback){
    var roundInformation = currentRound + " / " + numberOfRounds;
    if(connections.indexOf(socket) == drawerIndex){
      socket.isDrawing = true;
      callback(true, roundInformation);
    }
    else{
      socket.hasGuessedThisRound = false;
      socket.isDrawing = false;
      callback(false, roundInformation);
    }
    if(connections.indexOf(socket)==connections.length-1)
      updateUsers();
  });
  //Update nonDrawing players' pictures
  socket.on("updateCanvasPicture", function(data){
    io.sockets.emit("getCanvasPicture", data);
  });

  socket.on("wordPicked", function(data){
    word = data;
    if(word.length-3 >= 0)
      pointsGiven = 500 + (200*(word.length-3))
    else {
      pointsGiven = 500;
    }
    var space = word.indexOf(" ");
    io.sockets.emit("WordClueLength", {lng: word.length, space: space});
    drawingTimer(io.sockets);
    displayTimer(io.sockets);
    })

  socket.on("getWordChoices", function(callback){
    var chosenIndexes = [];
    while(chosenIndexes.length < 10){
      var randomNumber = Math.floor((Math.random() * samostalniki.length-1));
      if(chosenIndexes.indexOf(randomNumber) == -1)
        chosenIndexes.push(randomNumber);
    }
    var words = []
    for(var i = 0; i<chosenIndexes.length; i++){
      words[i] = samostalniki[chosenIndexes[i]];
    }
    callback(words);
  });
}
