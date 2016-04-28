var socket = io.connect("http://localhost:3000");
socket.on("connect", function(data){
  socket.emit("join", "client says hi");
});
