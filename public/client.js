var socket = io.connect("http://localhost:3000");
socket.on("onconnect", function(data){
  var userid = data.id;
  console.log("connected.  Userid is " + userid);
});
