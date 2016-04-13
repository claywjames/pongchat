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

var ball = {
  height : 30,
  width : 30,
  xPosition : 435,
  yPosition : 285,
  xVelocity : 5,
  yVelocity : 5,
  updatePosition : function(){
    if(ball.yPosition < 10 || ball.yPosition > 560){
      ball.yVelocity *= -1;
    };
    ball.xPosition += ball.xVelocity;
    ball.yPosition += ball.yVelocity;
  },
  draw : function(){
    context.fillRect(ball.xPosition, ball.yPosition, ball.width, ball.height);
  },
  reset : function(){
    ball.xVelocity = 0;
    ball.yVelocity = 0;
    ball.xPosition = 435;
    ball.yPosition = Math.floor(Math.random() * (521) + 30); //Generates random number from 30-550
    setTimeout(function(){
      ball.xVelocity = 5;
      ball.yVelocity = 5;
    },500);
  }
};

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

function detectCollisions(){
  pOneXMatch = ((playerOneBumper.xPosition + 25) >= ball.xPosition) && ball.xPosition > 0;
  pTwoXMatch = (playerTwoBumper.xPosition <= (ball.xPosition + 30)) && ((ball.xPosition + 30) < 900);
  pOneYMatch = (ball.yPosition <= (playerOneBumper.yPosition + 120)) && ((ball.yPosition + 30) >= playerOneBumper.yPosition);
  pTwoYMatch = (ball.yPosition <= (playerTwoBumper.yPosition + 120)) && ((ball.yPosition + 30) >= playerTwoBumper.yPosition);
  if(pOneXMatch && pOneYMatch){
    ball.xVelocity *= -1;
  };
  if(pTwoXMatch && pTwoYMatch){
    ball.xVelocity *= -1;
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
  if(keyInput.w) playerOneBumper.moveUp();
  if(keyInput.s) playerOneBumper.moveDown();
  if(keyInput.up) playerTwoBumper.moveUp();
  if(keyInput.down) playerTwoBumper.moveDown();
  ball.updatePosition();
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

mainloop();
