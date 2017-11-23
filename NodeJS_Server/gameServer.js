var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var fs = require('fs');
var path = require('path')

var gameIsRunning = false; //Is true if game is runing
var numberOfRounds = 0; //Number of rounds that will be played
var drawerIndex = 0; //Index of the person drawing
var currentRound = 1; //The number of the round that is played ATM
var word = ""; //The word that is being guessed
var roundTime; //Index for the round timeout
var displayTime //Index for the display timeout
var roundTimeDisplayStamp = 0;
var roundTimer; //Function for the round timeout
var displayTimer; //Function for the display timeout
var clueGiven = []; //The clues that are given to the players
var wordIsBeingPicked = false; //Is true if the person drawing is till picking a word
var connectionCounter = 1; //Number of players connected this session

var endOfRound = null; //This will be the function for the end of a round
var pointsGiven; //Points given depending on the word
var numberOfHits; //Number of correct guesses for a turn
var connections=[]; //An array of all connected sockets
var samostalniki = ""; //All the words that can be chosen

// Reads the file and uses callback function on the data gathered
function read(file, callback) {
    fs.readFile(file, 'utf8', function(err, data) {
        if (err) {
            console.log(err);
        }
        callback(data);
    });
}
//Read the list of words from a file
var output = read(__dirname+"/../Resources/words.txt", function(data) {
    samostalniki=data;
    samostalniki = samostalniki.split("\r");
    for(var i=0; i<samostalniki.length; i++){
      samostalniki[i] = samostalniki[i].substring(1, samostalniki[i].length);
      if(samostalniki[i].length<=2)
        samostalniki.splice(i,1);
    }
});
//Assign server a port and start it
var port = 2020;
server.listen(port);
console.log("Server runing... on port "+port);

//On a new client connecting
app.get('/',function(request, response){
  //Give him the index.html
  response.sendFile(path.resolve(__dirname+'/../index.html'))
});
//Assign the app to use parent directory of the server directory
app.use(express.static(__dirname+"/../"));


io.sockets.on('connection', function(socket){
  console.log("New Connection");
  connections.push(socket);
  console.log('Connected: %s sockets connected', connections.length);

  //Disconnect
  socket.on('disconnect', function(data){
    //Remove socker from the list
    connections.splice(connections.indexOf(socket), 1);
    console.log('Disconnect: %s sockets connected', connections.length);

    //If socket was in the game update uservers
    if(socket.username) {
      updateUsers();
    }

    //If no more users reset the game state
    if(connections.length < 1){
      clearTimeout(roundTime);
      clearTimeout(displayTime);
      gameIsRunning = false;
      wordIsBeingPicked = false;
    }
    //If there are still users and current one was daring
    else if(socket.isDrawing){
      //End round
      endOfRound();
    }
  });

  //New user
  socket.on('newUser', function(data, callback){
    var usernameAvaliable = true;
    for(var i=0; i < connections.length; i++)
        if(connections[i].username == data)
            usernameAvaliable = false;

    if(usernameAvaliable && connections.length < 10){
      if(connections.length == 1)
        socket.hasAdminPrivilage = true;
      callback(true);
      socket.username = data;
      socket.pointsScored = 0;
      socket.isDrawing = false;
      socket.countID = connectionCounter++;
    }
    else{
      callback(false);
      connections.splice(connections.indexOf(socket), 1);
      console.log('Disconnect: %s sockets connected', connections.length);
    }
  });

  //New user is ready for the game
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

  //Assign user connection all needed gameActions
  setGameActions(socket);
  updateUsers();
});





//Gives all connected clients an update on all users status
function updateUsers(){
  var users=[];
  for(var i=0; i<connections.length; i++){
    users[i]={};
    users[i].username = connections[i].username;
    users[i].pointsScored = connections[i].pointsScored;
    users[i].isDrawing = connections[i].isDrawing;
    users[i].countID = connections[i].countID;
  }
  io.sockets.emit("updateUsers", users);
}





function setGameActions(socket){
  //set initial status for the game
  socket.on("loadGame", function(data){
    gameIsRunning = true;
    numberOfRounds = data;
    drawerIndex = 0;
    currentRound = 1;
    numberOfHits = 0;

    //Assign display Timer
    displayTimer = function(sockets){
      var secLeft = Math.round((roundTime._idleTimeout - (new Date() - roundTimeDisplayStamp))/1000)
      sockets.emit("displayTimer", secLeft+"s")
      if((secLeft == 90 && word.length > 3) || secLeft == 40){
        if(secLeft == 90)
          clueGiven = [];
        giveOutClue();
      }
      displayTime = setTimeout(function(){if(gameIsRunning) displayTimer(sockets)}, 1000);
    }
    //Reset round
    drawingTimer = function(sockets){
      roundTimeDisplayStamp = new Date();
      roundTime = setTimeout(endOfRound, 120000);
    }
    io.sockets.emit("gameStart");
  });


  //guess recieved from player
  socket.on('sendGuess', function(data, callback){
    //If the msg isn't from the drawer and the guesser hasn't guessed the  word yet
    if(!socket.isDrawing && !socket.hasGuessedThisRound && !wordIsBeingPicked){
      //IF guess is correct
      if(data.toUpperCase() == word.toUpperCase()){

        //Number of prev hits this round determines the score the player gets
        if(numberOfHits>0)
          socket.pointsScored += Math.round(pointsGiven * (0.75/numberOfHits));
        else
          socket.pointsScored += Math.round(pointsGiven);

        numberOfHits++; //Increment number of hits this turn
        socket.hasGuessedThisRound = true; //Mark that the player has already guessed correctly this turn
        callback(false, true);

        //Alert other player of a new guess
        io.sockets.emit('newGuess', {msg: "Ugotovil sem!", username: socket.username, isDrawing: socket.isDrawing});
        io.sockets.emit('correctGuess', socket.username);

        //Update users since points updated
        updateUsers();

        //If all user guess correctly end round prematuraly
        if(numberOfHits >= connections.length-1){
          endOfRound();
        }
      }
      //If word is close
      else if((word.toUpperCase().indexOf(data.toUpperCase())>=0 && (data.length >= (word.length/2)))|| data.toUpperCase().indexOf(word.toUpperCase())>=0){
        callback(true, false);
        io.sockets.emit('newGuess', {msg: data, username: socket.username, isDrawing: socket.isDrawing});
      }
      //If guess is off
      else {
        io.sockets.emit('newGuess', {msg: data, username: socket.username, isDrawing: socket.isDrawing});
        callback(false, false);
      }
    }
    //If msg is from some1 who is drawing or already guessed Only emit it if it isn't the guessing word
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
    updateUsers();
  });


  //Update noneDrawing players' pictures
  socket.on("updateCanvasPicture", function(data){
    io.sockets.emit("getCanvasPicture", data);
  });


  //The player drawing has picked a word
  socket.on("wordPicked", function(data){
    //Assign the word as the guessing word
    word = data;

    //Calculate the points socred depending on the length of the word
    if(word.length-3 >= 0)
      pointsGiven = Math.round(500 + (200*(word.length-3)));
    else {
      pointsGiven = 500;
    }

    //Check if word has a space
    var space = word.indexOf(" ");
    wordIsBeingPicked = false;

    //Emit the 1st clue (Length of the picked word)
    io.sockets.emit("WordClueLength", {lng: word.length, space: space});

    //Clear timeouts and start new timers for the new round
    clearTimeout(roundTime);
    clearTimeout(displayTime);
    drawingTimer(io.sockets);
    displayTimer(io.sockets);
    })


  //The player drawing needs to get words to pick from
  socket.on("getWordChoices", function(callback){
    if(wordIsBeingPicked){return};

    wordIsBeingPicked = true;

    //Pick 10 random words
    var chosenIndexes = [];
    while(chosenIndexes.length < 10){
      var randomNumber = Math.floor((Math.random() * samostalniki.length-1));
      if(chosenIndexes.indexOf(randomNumber) == -1)
        chosenIndexes.push(randomNumber);
    }
    //Get the words from the 10 randomly picked indeyes
    var words = []
    for(var i = 0; i<chosenIndexes.length; i++){
      words[i] = samostalniki[chosenIndexes[i]];
    }
    callback(words);
  });


  //New connection needs to get updated on the word of the game
  socket.on("giveMeClue", function(callback){
    var space = word.indexOf(" ");
    callback({lng: word.length, space: space});
  })


  //When a round ends
  endOfRound = function(){
    //Give out the word that was being guessed
    io.sockets.emit("theWordWas", word);
    //Clear round timers
    clearTimeout(roundTime);
    clearTimeout(displayTime);
    //Increment the index that indicated the drawing player
    drawerIndex++;
    //If new drawrIndex is out of bounds
    if(drawerIndex >= connections.length){
      //And current round was the final round
      if(currentRound>=numberOfRounds){
        //Game Ends
        clearTimeout(roundTime);
        clearTimeout(displayTime);
        gameIsRunning = false;
        wordIsBeingPicked = false;

        //Give users the scoreBoard
        var users=[];
        for(var i=0; i<connections.length; i++){
          users[i]={};
          users[i].username = connections[i].username;
          users[i].pointsScored = connections[i].pointsScored;
          users[i].isDrawing = connections[i].isDrawing;
          users[i].countID = connections[i].countID;
        }
        users.sort(function (a, b) { return b.pointsScored - a.pointsScored})
        io.sockets.emit("gameEnded", users);
      }
      else{
        //This was not the final round
        //Reset round status
        wasDrawerIndexReset = true;
        drawerIndex = 0;
        currentRound++;
      }
    }

    //Give score to the drawing player
    for(var i=0; i<connections.length; i++){
      if(connections[i].isDrawing)
      if(connections.length > 3){
        connections[i].pointsScored += Math.round(pointsGiven*0.38*numberOfHits);
      }
      else if(connections.length == 2){
        connections[i].pointsScored += Math.round(pointsGiven*numberOfHits);
      }
      else {
        connections[i].pointsScored += Math.round(pointsGiven*0.50*numberOfHits);
      }
      updateUsers();
    }
    //Set number of hits to 0 for the next round
    numberOfHits = 0;
    //Start new timeout for the next round
    setTimeout(function(){io.sockets.emit("newRound")}, 5000);
  }


  //Sends clues about the word to all users
  var giveOutClue = function(){
    //Pick random number and get index of possible space
    var randomNumber = Math.floor((Math.random() * word.length-1));
    var space = word.indexOf(" ");

    //Pick as long as we pick a number we already picked or we picked a number representing the index of space
    while(clueGiven.indexOf(randomNumber) != -1 || space == randomNumber)
      randomNumber = Math.floor((Math.random() * word.length-1));

    //We picked the number Push it onto the clues given
    clueGiven.push(randomNumber);

    //Get the latters and senc the clue
    var latters = [];
    for(var i = 0; i< clueGiven.length; i++){
      latters.push(word[clueGiven[i]]);
    }
    io.sockets.emit("givingExtraClue", {lng: word.length, space: space, clueSpot: clueGiven, latters:latters})
  }
}
