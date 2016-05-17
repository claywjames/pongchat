var bottomDisplay = document.getElementById("bottomDisplay");
if(window.location.href == "http://localhost:3000/twoplayer_online"){
  var onlinePong = true;
  var role = null;
  var game = null;
  var opponentFound = false;
  var client_script = document.createElement("script");
  client_script.setAttribute("src", "client.js");
  document.body.appendChild(client_script);
}


var canvas = document.getElementById("pong");
var context = canvas.getContext("2d");

document.addEventListener("keydown", function(event){
  if(event.keyCode == 87){
    keyInput.w = true;
  } else if(event.keyCode == 83){
    keyInput.s = true;
  } else if(event.keyCode == 38){
    keyInput.up = true;
  } else if(event.keyCode == 40){
    keyInput.down = true;
  };
});
document.addEventListener("keyup", function(event){
  if(event.keyCode == 87){
    keyInput.w = false;
  } else if(event.keyCode == 83){
    keyInput.s = false;
  } else if(event.keyCode == 38){
    keyInput.up = false;
  } else if(event.keyCode == 40){
    keyInput.down = false;
  };
});
var keyInput = {
  w : false,
  s : false,
  up : false,
  down : false
};

var bumper = function(xPosition){
  this.height = 120;
  this.width = 25;
  this.xPosition = xPosition;
  this.yPosition = 0;
  this.moveDown = function(){
    if(this.yPosition <= 465){
      this.yPosition += 15;
    } else if(this.yPosition < 480){
      this.yPosition += (480 - this.yPosition);
    };
  };
  this.moveUp = function(){
    if(this.yPosition >= 15){
      this.yPosition -=15;
    } else if(this.yPosition > 0){
      this.yPosition += this.yPosition;
    };
  };
  this.draw = function(){
    context.fillRect(this.xPosition, this.yPosition, this.width, this.height);
  };
}
var playerOneBumper = new bumper(0)
var playerTwoBumper = new bumper(875)

var ball = function(){
  this.height = 30;
  this.width = 30;
  this.xPosition = 435;
  this.yPosition = 285;
  this.angle = (Math.random()*70*Math.PI)/180;
  this.velocity = 10;
  this.xVelocity = Math.random() < .5 ? this.velocity*Math.cos(this.angle) : -this.velocity*Math.cos(this.angle);
  this.yVelocity = Math.random() < .5 ? this.velocity*Math.sin(this.angle) : -this.velocity*Math.sin(this.angle);
  this.updatePosition = function(){
    if(this.yPosition < 10 || this.yPosition > 560){
      this.yVelocity *= -1;
    };
    this.xPosition += this.xVelocity;
    this.yPosition += this.yVelocity;
  },
  this.draw = function(){
    context.fillRect(this.xPosition, this.yPosition, this.width, this.height);
  },
  this.reset = function(){
    this.xVelocity = 0;
    this.yVelocity = 0;
    this.xPosition = 435;
    this.yPosition = Math.floor(Math.random() * (521) + 30); //Generates random number from 30-550
    setTimeout(function(){
      ball.velocity = 10;
      ball.angle = ((Math.random()*70)*Math.PI)/180;
      ball.xVelocity = Math.random() < .5 ? ball.velocity*Math.cos(ball.angle) : -ball.velocity*Math.cos(ball.angle);
      ball.yVelocity = Math.random() < .5 ? ball.velocity*Math.sin(ball.angle) : -ball.velocity*Math.sin(ball.angle);
    },500);
  }
};
var ball = new ball();

var score = function(playerID){
  var player = document.getElementById(playerID);
  this.score = parseInt(player.innerHTML, 10);
  this.incrementScore = function(){
    this.score += 1;
    player.innerHTML = this.score;
  };
}
var playerOneScore = new score("playerOneScore");
var playerTwoScore = new score("playerTwoScore");

var reboundInfo = {
  intersection : 0,
  normalizedIntersection : 0,
  angleDegrees : 0,
  angleRadians : 0
}
function detectCollisions(){
  pOneXMatch = ((playerOneBumper.xPosition + 25) >= ball.xPosition) && ball.xPosition > 0;
  pTwoXMatch = (playerTwoBumper.xPosition <= (ball.xPosition + 30)) && ((ball.xPosition + 30) < 900);
  pOneYMatch = (ball.yPosition <= (playerOneBumper.yPosition + 120)) && ((ball.yPosition + 30) >= playerOneBumper.yPosition);
  pTwoYMatch = (ball.yPosition <= (playerTwoBumper.yPosition + 120)) && ((ball.yPosition + 30) >= playerTwoBumper.yPosition);
  if((pOneXMatch && pOneYMatch) && (ball.xVelocity < 0)){
    if(ball.velocity < 15) ball.velocity += .5;
    reboundInfo.intersection = (playerOneBumper.yPosition + 60) - (ball.yPosition + 15);
    reboundInfo.normalizedIntersection = reboundInfo.intersection/180;
    reboundInfo.angleDegrees = reboundInfo.normalizedIntersection*75;
    reboundInfo.angleRadians = (reboundInfo.angleDegrees*Math.PI)/180;
    ball.angle = reboundInfo.angleRadians;
    ball.xVelocity = ball.velocity*Math.cos(ball.angle);
    ball.yVelocity = -ball.velocity*Math.sin(ball.angle);
  };
  if((pTwoXMatch && pTwoYMatch) && (ball.xVelocity > 0)){
    if(ball.velocity < 15) ball.velocity += .5;
    reboundInfo.intersection = (playerTwoBumper.yPosition + 60) - (ball.yPosition + 15);
    reboundInfo.normalizedIntersection = reboundInfo.intersection/180;
    reboundInfo.angleDegrees = reboundInfo.normalizedIntersection*75;
    reboundInfo.angleRadians = (reboundInfo.angleDegrees*Math.PI)/180;
    ball.angle = reboundInfo.angleRadians;
    ball.xVelocity = -ball.velocity*Math.cos(ball.angle);
    ball.yVelocity = -ball.velocity*Math.sin(ball.angle);
  };
};

function detectScores(){
  if(ball.xPosition < 10){
    playerTwoScore.incrementScore();
    ball.reset();
  } else if(ball.xPosition > 860){
    playerOneScore.incrementScore();
    ball.reset();
  };
};

function update(){
  detectCollisions();
  detectScores();
  if(onlinePong){
    if(role == "host"){
      if(keyInput.w || keyInput.up) playerOneBumper.moveUp();
      if(keyInput.s || keyInput.down) playerOneBumper.moveDown();
    } else if(role == "client"){
      if(keyInput.w || keyInput.up) playerTwoBumper.moveUp();
      if(keyInput.s || keyInput.down) playerTwoBumper.moveDown();
    }
  }else{
    if(keyInput.w) playerOneBumper.moveUp();
    if(keyInput.s) playerOneBumper.moveDown();
    if(keyInput.up) playerTwoBumper.moveUp();
    if(keyInput.down) playerTwoBumper.moveDown();
  }
  if(!onlinePong || role == "host") ball.updatePosition();
  if(onlinePong && role == "host"){
    socket.emit("host_update", {
      position: playerOneBumper.yPosition,
      ballX: ball.xPosition,
      ballY: ball.yPosition
    });
  }else if(onlinePong && role == "client"){
    socket.emit("client_update", {
      position: playerTwoBumper.yPosition
    });
  }
}

function draw(){
  playerOneBumper.draw();
  playerTwoBumper.draw();
  ball.draw();
}

function mainloop(){
  context.clearRect(0, 0, 900, 600);
  update();
  draw();
  window.requestAnimationFrame(mainloop);
}

draw();
var gameActive = false;
document.addEventListener("keydown", function(event){
  if(event.keyCode == 32 && gameActive == false){
    if(onlinePong && opponentFound){
      console.log(role + " ready");
      bottomDisplay.innerHTML = "Ready. Waiting on opponent";
      socket.emit("ready", {gameID : game, user : role});
    }else{
      gameActive = true;
      bottomDisplay.style.display = "none";
      mainloop();
    }
  };
});
