//This file contains the game logic and can be run on both the client and the server
if(typeof window === "undefined") var server = true;

var bumper = function(xPosition){
  //The constructor of the user-controlled paddle object
  this.height = 120;
  this.width = 25;
  this.xPosition = xPosition;
  this.yPosition = 0;
  if(server) this.pastStates = Array(60).fill(0); //records the past y-positions of a bumper for networking purposes
  this.moveDown = function(){
    if(this.yPosition <= 465){
      this.yPosition += 15;
    } else if(this.yPosition < 480){
      this.yPosition += (480 - this.yPosition);
    }
  }

  this.moveUp = function(){
    if(this.yPosition >= 15){
      this.yPosition -=15;
    } else if(this.yPosition > 0){
      this.yPosition -= this.yPosition;
    }
  }

  this.draw = function(){
    context.fillRect(this.xPosition, this.yPosition, this.width, this.height);
  }
}

var ball = function(){
  //The constructor of the pong Ball object
  this.height = 30;
  this.width = 30;
  this.xPosition = 435;
  this.yPosition = 285;
  this.angle = (Math.random()*50*Math.PI)/180; //a random angle from 0-60 degrees; in radians
  this.velocity = 10;
  this.xVelocity = Math.random() < .5 ? this.velocity*Math.cos(this.angle) : -this.velocity*Math.cos(this.angle);
  this.yVelocity = Math.random() < .5 ? this.velocity*Math.sin(this.angle) : -this.velocity*Math.sin(this.angle);
  if(server) this.pastStates = Array(60).fill([435, 285]); //records the past positions of the gameBall for networking purposes

  this.updatePosition = function(){
    if(server){
      this.pastStates.push([this.xPosition, this.yPosition]);
      if(this.pastStates.length > 60) this.pastStates.splice(0,1);
    }
    if(this.yPosition < 10 || this.yPosition > 560){
      this.yVelocity *= -1;
    };
    this.xPosition += this.xVelocity;
    this.yPosition += this.yVelocity;
  },

  this.draw = function(){
    context.fillRect(this.xPosition, this.yPosition, this.width, this.height);
  },

  this.set = function(){
    this.velocity = 10;
    this.angle = ((Math.random()*50)*Math.PI)/180;
    this.xVelocity = Math.random() < .5 ? this.velocity*Math.cos(this.angle) : -this.velocity*Math.cos(this.angle);
    this.yVelocity = Math.random() < .5 ? this.velocity*Math.sin(this.angle) : -this.velocity*Math.sin(this.angle);
  },

  this.reset = function(){
    this.xVelocity = 0;
    this.yVelocity = 0;
    this.xPosition = 435;
    this.yPosition = Math.floor(Math.random() * (521) + 30); //Generates random number from 30-550
    setTimeout(this.set.bind(this),500); //didn't use anonymous function so that the called function could use 'this' keyword
  }
};

function detectCollisions(b1, b2, gameBall){
  var pOneXMatch = ((b1.xPosition + 25) >= gameBall.xPosition) && gameBall.xPosition > 0;
  var pTwoXMatch = (b2.xPosition <= (gameBall.xPosition + 30)) && ((gameBall.xPosition + 30) < 900);
  var pOneYMatch = (gameBall.yPosition <= (b1.yPosition + 120)) && ((gameBall.yPosition + 30) >= b1.yPosition);
  var pTwoYMatch = (gameBall.yPosition <= (b2.yPosition + 120)) && ((gameBall.yPosition + 30) >= b2.yPosition);
  if((pOneXMatch && pOneYMatch) && (gameBall.xVelocity < 0)){
    //Player one hit gameBall
    //calculating rebound angle based on where the gameBall hit the bumper
    var intersection = (b1.yPosition + 60) - (gameBall.yPosition + 15);
    var normalizedIntersection = intersection/180;
    var angleDegrees = normalizedIntersection*75;
    var angleRadians = (angleDegrees*Math.PI)/180;
    gameBall.angle = angleRadians;
    gameBall.xVelocity = gameBall.velocity*Math.cos(gameBall.angle);
    gameBall.yVelocity = -gameBall.velocity*Math.sin(gameBall.angle);
    return true;
  };
  if((pTwoXMatch && pTwoYMatch) && (gameBall.xVelocity > 0)){
    //Player two hit gameBall
    //calculating rebound angle based on where the gameBall hit the bumper
    var intersection = (b2.yPosition + 60) - (gameBall.yPosition + 15);
    var normalizedIntersection = intersection/180;
    var angleDegrees = normalizedIntersection*75;
    var angleRadians = (angleDegrees*Math.PI)/180;
    gameBall.angle = angleRadians;
    gameBall.xVelocity = -gameBall.velocity*Math.cos(gameBall.angle);
    gameBall.yVelocity = -gameBall.velocity*Math.sin(gameBall.angle);
    return true;
  };
  return false;
};

function win(player){
  //executes neccessary commands in case of a win
  gameActive = false;
  bottomDisplay.style.display = "block";
  bottomDisplay.innerHTML = player + " Wins!";
  var playAgain = document.createElement("div");
  document.getElementById("playAgain").style.display = "block";
}

function detectScores(p1, p2, gameBall){
  if((gameBall.xPosition < 10) && (gameBall.xVelocity < 0)){
    //Player two scored
    if(server){
      gameBall.reset();
      return "p2";
    }else{
      p2.incrementScore();
      if(p2.score == 10) win("Player Two");
    }
    gameBall.reset();
  }else if((gameBall.xPosition > 860) && (gameBall.xVelocity > 0)){
    //Player one scored
    if(server){
      gameBall.reset();
      return "p1";
    }else{
      p1.incrementScore();
      if(p1.score == 10) win("Player One");
    }
    gameBall.reset();
  }
};

//Allows the following functions to be used by the server
if(typeof module != "undefined"){
  module.exports.bumper = bumper;
  module.exports.ball = ball;
  module.exports.detectCollisions = detectCollisions;
  module.exports.detectScores = detectScores;
}

if(!server){
  //If the code is being run by the client
  var bottomDisplay = document.getElementById("bottomDisplay"); //Gives instructions to the player
  var canvas = document.getElementById("pong");
  var context = canvas.getContext("2d");
  context.fillStyle = "white";
  context.setLineDash([10,5]);
  context.strokeStyle = "white";
  context.font = "30px monospace, serif";

  if(window.location.pathname == "/twoplayer_online"){
    //If the player is playing another player over the internet
    var onlinePong = true;
    var role = null; //client / host of game
    var game = null; //game id
    var updateIndex = 0; //used to loop through frames given by server in array form
    var opponentFound = false;
    var opponentPositions = Array(4).fill(0); //variable updated by server and looped through with updateIndex;
    var gameBallPositions = Array(4).fill([435, 285]); //variable updated by server and looped through with updateIndex;
    //Adds the client.js file to the pong html file
    var client_script = document.createElement("script");
    client_script.setAttribute("src", "client.js");
    document.body.appendChild(client_script);
    //Adds chat button to pong html file
    var chat = document.createElement("div");
    chat.innerHTML = "Chat"
    chat.setAttribute("id", "chat-button");
    chat.onclick = function(){alert("This feature is still in develop")}
    document.body.appendChild(chat);
    function createChat(){
      //Adds the chat iframe to the pong html file
      var iframe = document.createElement("iframe");
      iframe.setAttribute("src", "chat.html");
      document.body.appendChild(iframe);
    }
  }

  document.addEventListener("keydown", function(event){
    if(event.keyCode == 87){
      keyInput.w = true;
    } else if(event.keyCode == 83){
      keyInput.s = true;
    } else if(event.keyCode == 38){
      event.preventDefault(); //prevent arrow keys from scrolling screen
      keyInput.up = true;
    } else if(event.keyCode == 40){
      event.preventDefault();
      keyInput.down = true;
    }
  })
  document.addEventListener("keyup", function(event){
    if(event.keyCode == 87){
      keyInput.w = false;
    } else if(event.keyCode == 83){
      keyInput.s = false;
    } else if(event.keyCode == 38){
      keyInput.up = false;
    } else if(event.keyCode == 40){
      keyInput.down = false;
    }
  })
  var keyInput = {
    w : false,
    s : false,
    up : false,
    down : false
  };

  var score = function(playerID){
    //Constructor for the score object
    this.score = 0;
    this.scoreString = "00";
    this.incrementScore = function(){
      this.score += 1;
      this.scoreString = this.score < 10 ? "0" + this.score.toString() : this.score.toString();
    }
  }

  function update(){
    if(onlinePong){
      var up = (keyInput.w || keyInput.up) ? true : false;
      var down = (keyInput.s || keyInput.down) ? true : false;

      //Sending updates to the server
      //uses client side prediction to reduce lag
      if(up && !down){
        if(role == "host"){
          socket.emit("host_update", {request: "up", t: Date.now()})
          playerOneBumper.moveUp()
        }else{
          socket.emit("client_update", {request: "up", t: Date.now()})
          playerTwoBumper.moveUp()
        }
      }else if(!up && down){
        if(role == "host"){
          socket.emit("host_update", {request: "down", t: Date.now()})
          playerOneBumper.moveDown()
        }else{
          socket.emit("client_update", {request: "down", t: Date.now()})
          playerTwoBumper.moveDown()
        }
      }
      else{
        if(role == "host"){
          socket.emit("host_update", {request: "none", t: Date.now()})
        }else{
          socket.emit("client_update", {request: "none", t: Date.now()})
        }
      }

      //updating positions based on server-provided info
      if(role == "host"){
        playerTwoBumper.yPosition = opponentPositions[updateIndex];
      }else{
        playerOneBumper.yPosition = opponentPositions[updateIndex];
      }
      gameBall.xPosition = gameBallPositions[updateIndex][0];
      gameBall.yPosition = gameBallPositions[updateIndex][1];
      if(updateIndex < 3) updateIndex += 1;

      //implementing client side prediction on collisions
      if(detectCollisions(playerOneBumper, playerTwoBumper, gameBall)){
        for(var i = updateIndex; i < 5; i++){
          gameBall.updatePosition();
          gameBallPositions[i] = [gameBall.xPosition, gameBall.yPosition];
        }
      }
    }else{
      //For a game played on one computer
      detectCollisions(playerOneBumper, playerTwoBumper, gameBall)
      detectScores(playerOneScore, playerTwoScore, gameBall)
      if(keyInput.w) playerOneBumper.moveUp()
      if(keyInput.s) playerOneBumper.moveDown()
      if(keyInput.up) playerTwoBumper.moveUp()
      if(keyInput.down) playerTwoBumper.moveDown()
      gameBall.updatePosition()
    }
  }

  function draw(){
    playerOneBumper.draw()
    playerTwoBumper.draw()
    gameBall.draw()
    context.fillText(playerOneScore.scoreString, 405, 50);
    context.fillText(playerTwoScore.scoreString, 460, 50);
    //draw dashed line down center of canvas
    context.beginPath()
    context.moveTo(450, 0);
    context.lineTo(450, 600);
    context.stroke();
  }

  function mainloop(){
    context.clearRect(0, 0, 900, 600) //erase canvas
    update()
    draw()
    console.log(gameActive);
    if(gameActive) window.requestAnimationFrame(mainloop)
  }

  var playAgainButton = document.getElementById("playAgain")
  playAgainButton.onclick = startGame
  function startGame(){
    playAgainButton.style.display = "none";
    context.clearRect(0, 0, 900, 600)
    playerOneBumper = new bumper(0)
    playerTwoBumper = new bumper(875)
    gameBall = new ball()
    playerOneScore = new score()
    playerTwoScore = new score()
    draw()
    bottomDisplay.innerHTML = "Press The Spacebar When Ready";
  }
  startGame()
  var gameActive = false;
  document.addEventListener("keydown", function(event){
    if(event.keyCode == 32 && gameActive == false){
      //if the space bar is pressed before the game has started(used to communicate player readiness)
      if(onlinePong){
        if(opponentFound){
          bottomDisplay.innerHTML = "Ready. Waiting on opponent";
          socket.emit("ready")
        }
      }else{
        gameActive = true;
        bottomDisplay.style.display = "none";
        mainloop()
      }
    };
  });
}
