var socket = io.connect("http://localhost:3000");
socket.on("onconnect", function(data){
  var userid = data.id;
  console.log("connected.  Userid is " + userid);
});

socket.on("host", function(data){
  var game = data.game;
  console.log("You are the host of game " + game);
});

socket.on("client", function(data){
  var game = data.game;
  console.log("You are the client of game " + game);
});
