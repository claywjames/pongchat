if(typeof window === "undefined") var server = true;

var bumper = function(xPosition){
  this.height = 120;
  this.width = 25;
  this.xPosition = xPosition;
  this.yPosition = 0;
  if(server) this.pastStates = [
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0
  ];
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
      this.yPosition += this.yPosition;
    }
  }
  this.draw = function(){
    context.fillRect(this.xPosition, this.yPosition, this.width, this.height);
  }
}

var ball = function(){
  this.height = 30;
  this.width = 30;
  this.xPosition = 435;
  this.yPosition = 285;
  this.angle = (Math.random()*70*Math.PI)/180;
  this.velocity = 10;
  this.xVelocity = Math.random() < .5 ? this.velocity*Math.cos(this.angle) : -this.velocity*Math.cos(this.angle);
  this.yVelocity = Math.random() < .5 ? this.velocity*Math.sin(this.angle) : -this.velocity*Math.sin(this.angle);
  if(server) this.pastStates = [
    [435, 285],[435, 285],[435, 285],[435, 285],[435, 285],[435, 285],[435, 285],[435, 285],[435, 285],[435, 285],
    [435, 285],[435, 285],[435, 285],[435, 285],[435, 285],[435, 285],[435, 285],[435, 285],[435, 285],[435, 285],
    [435, 285],[435, 285],[435, 285],[435, 285],[435, 285],[435, 285],[435, 285],[435, 285],[435, 285],[435, 285],
    [435, 285],[435, 285],[435, 285],[435, 285],[435, 285],[435, 285],[435, 285],[435, 285],[435, 285],[435, 285],
    [435, 285],[435, 285],[435, 285],[435, 285],[435, 285],[435, 285],[435, 285],[435, 285],[435, 285],[435, 285],
    [435, 285],[435, 285],[435, 285],[435, 285],[435, 285],[435, 285],[435, 285],[435, 285],[435, 285],[435, 285]
  ];
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
    this.angle = ((Math.random()*70)*Math.PI)/180;
    this.xVelocity = Math.random() < .5 ? this.velocity*Math.cos(this.angle) : this.velocity*Math.cos(this.angle);
    this.yVelocity = Math.random() < .5 ? this.velocity*Math.sin(this.angle) : this.velocity*Math.sin(this.angle);
  },
  this.reset = function(){
    this.xVelocity = 0;
    this.yVelocity = 0;
    this.xPosition = 435;
    this.yPosition = Math.floor(Math.random() * (521) + 30); //Generates random number from 30-550
    setTimeout(this.set.bind(this),500);
  }
};

function detectCollisions(b1, b2, ball){
  var pOneXMatch = ((b1.xPosition + 25) >= ball.xPosition) && ball.xPosition > 0;
  var pTwoXMatch = (b2.xPosition <= (ball.xPosition + 30)) && ((ball.xPosition + 30) < 900);
  var pOneYMatch = (ball.yPosition <= (b1.yPosition + 120)) && ((ball.yPosition + 30) >= b1.yPosition);
  var pTwoYMatch = (ball.yPosition <= (b2.yPosition + 120)) && ((ball.yPosition + 30) >= b2.yPosition);
  if((pOneXMatch && pOneYMatch) && (ball.xVelocity < 0)){
    var intersection = (b1.yPosition + 60) - (ball.yPosition + 15);
    var normalizedIntersection = intersection/180;
    var angleDegrees = normalizedIntersection*75;
    var angleRadians = (angleDegrees*Math.PI)/180;
    ball.angle = angleRadians;
    ball.xVelocity = ball.velocity*Math.cos(ball.angle);
    ball.yVelocity = -ball.velocity*Math.sin(ball.angle);
    return true;
  };
  if((pTwoXMatch && pTwoYMatch) && (ball.xVelocity > 0)){
    var intersection = (b2.yPosition + 60) - (ball.yPosition + 15);
    var normalizedIntersection = intersection/180;
    var angleDegrees = normalizedIntersection*75;
    var angleRadians = (angleDegrees*Math.PI)/180;
    ball.angle = angleRadians;
    ball.xVelocity = -ball.velocity*Math.cos(ball.angle);
    ball.yVelocity = -ball.velocity*Math.sin(ball.angle);
    return true;
  };
  return false;
};

function detectScores(p1, p2, ball){
  if((ball.xPosition < 10) && (ball.xVelocity < 0)){
    if(server){
      p2 += 1;
      ball.reset();
      return "p2";
    }else{
      p2.incrementScore();
    }
    ball.reset();
  }else if((ball.xPosition > 860) && (ball.xVelocity > 0)){
    if(server){
      p1 += 1;
      ball.reset();
      return "p1";
    }else{
      p1.incrementScore();
    }
    ball.reset();
  }
};

if(typeof module != "undefined"){
  module.exports.bumper = bumper;
  module.exports.ball = ball;
  module.exports.detectCollisions = detectCollisions;
  module.exports.detectScores = detectScores;
}

if(!server){
  var bottomDisplay = document.getElementById("bottomDisplay");
  var canvas = document.getElementById("pong");
  var context = canvas.getContext("2d");
  if(window.location.pathname == "/twoplayer_online"){
    var onlinePong = true;
    var role = null;
    var game = null;
    var updateIndex = 0;
    var opponentFound = false;
    var opponentPositions = [0,0,0,0,0,0,0,0];
    var ballPositions = [[435, 285],[435, 285],[435, 285],[435, 285],[435, 285],[435, 285],[435, 285]];
    var client_script = document.createElement("script");
    client_script.setAttribute("src", "client.js");
    document.body.appendChild(client_script);
  }
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
  var playerOneBumper = new bumper(0)
  var playerTwoBumper = new bumper(875)
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
  function update(){
    if(onlinePong){
      var up = (keyInput.w || keyInput.up) ? true : false;
      var down = (keyInput.s || keyInput.down) ? true : false;
      if(up && !down){
        if(role == "host"){
          socket.emit("host_update", {request: "up", t: Date.now()});
          playerOneBumper.moveUp();
        }else{
          socket.emit("client_update", {request: "up", t: Date.now()});
          playerTwoBumper.moveUp();
        }
      }else if(!up && down){
        if(role == "host"){
          socket.emit("host_update", {request: "down", t: Date.now()});
          playerOneBumper.moveDown();
        }else{
          socket.emit("client_update", {request: "down", t: Date.now()});
          playerTwoBumper.moveDown();
        }
      }
      else{
        if(role == "host"){
          socket.emit("host_update", {request: "none", t: Date.now()});
        }else{
          socket.emit("client_update", {request: "none", t: Date.now()});
        }
      }
      if(role == "host"){
        playerTwoBumper.yPosition = opponentPositions[updateIndex];
      }else{
        playerOneBumper.yPosition = opponentPositions[updateIndex];
      }
      ball.xPosition = ballPositions[updateIndex][0];
      ball.yPosition = ballPositions[updateIndex][1];
      updateIndex += 1;
      if(detectCollisions(playerOneBumper, playerTwoBumper, ball)){
        for(var i = updateIndex; i < 5; i++){
          ball.updatePosition();
          ballPositions[i] = [ball.xPosition, ball.yPosition];
        }
      }
    }else{
      detectCollisions(playerOneBumper, playerTwoBumper, ball);
      detectScores(playerOneScore, playerTwoScore, ball);
      if(keyInput.w) playerOneBumper.moveUp();
      if(keyInput.s) playerOneBumper.moveDown();
      if(keyInput.up) playerTwoBumper.moveUp();
      if(keyInput.down) playerTwoBumper.moveDown();
      ball.updatePosition();
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
}
