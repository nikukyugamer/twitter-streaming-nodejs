$(function() {
  var socket = io.connect();

  socket.on("msg", function(data) {
    $("div#tweets_area").prepend(data);
  });

  $('#clear_button').mousedown(function() {
    $("#tweets_area").empty();
  });
});
