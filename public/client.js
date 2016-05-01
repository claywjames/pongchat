socket.on("onconnect", function(data){
  var userid = data.id;
  console.log("connected.  Userid is " + userid);
});

socket.on("host", function(data){
  game = data.game;
  role = "host";
  console.log("You are the host of game " + game);
});

socket.on("client", function(data){
  game = data.game;
  role = "client";
  console.log("You are the client of game " + game);
});
