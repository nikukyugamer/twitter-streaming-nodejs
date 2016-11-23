var http = require('http');
var server = http.createServer();
var io = require('socket.io').listen(server);
var fs = require('fs');
var twitterToken = require('./assets/twitter_token');
var LISTEN_PORT = 11084;

// ストリーミングを開始する
serverStart();
socketIoOn();
streamingStart('刀剣乱舞');

function route(req, res) {
  var url = req.url;
  console.log(url);

  if (url == '/') {
    fs.readFile('./index.html', 'UTF-8', function(err, data) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.write(data);
      res.end();
    });
  } else if (url == '/favicon.ico') {
      var buffer = fs.readFileSync('./assets/favicon.ico');
      res.writeHead(200, { 'Content-Type': 'image/vnd.microsoft.icon' });
      res.end(buffer);
  } else if (url == '/main.css') {
      var buffer = fs.readFileSync('./assets/main.css');
      res.writeHead(200, { 'Content-Type': 'text/css' });
      res.end(buffer);
  } else if (url == '/action.js') {
      var buffer = fs.readFileSync('./assets/action.js');
      res.writeHead(200, { 'Content-Type': 'application/javascript' });
      res.end(buffer);
  }
}

function serverStart() {
  server.on('request', (req, res) => route(req, res));
  server.listen(LISTEN_PORT);
  console.log('Server is running...');
}

function socketIoOn() {
  io.sockets.on('connection', function(socket) {
    socket.on('msg', function(data) {
      io.sockets.emit('msg', data);
    });
    socket.on('disconnect', function() {
      console.log('Socket disconnected');
    });
  });
  console.log('Socket.IO is running...');
}

function streamingStart(trackWord) {
  twitterToken.stream('statuses/filter', { 'track': trackWord }, function(stream) {
    stream.on('data', function(data) {

      // ツイート（一つ）から表示する内容を選別する（HTMLタグ含）
      var user_icon_with_img_tag = '<img src="' + data.user.profile_image_url_https+ '">';
      var user_uri = 'https://twitter.com/' + data.user.screen_name;
      var user_icon_with_link = '<a href="' + user_uri + '" target="_blank">' + user_icon_with_img_tag + '</a>';
      var screen_name_with_link = '<a href="' + user_uri + '" target="_blank">' + '@' + data.user.screen_name + '</a>';

      var tweet_uri = 'https://twitter.com/' + data.user.screen_name + '/status/' + String(data.id_str);

      var tweet_created_at_jst = new Date(data.created_at);
      var tweet_youbi = '日月火水木金土'[new Date(tweet_created_at_jst.toLocaleString()).getDay()];
      var tweet_created_at_jp_style_day = zeroPadding(tweet_created_at_jst.getFullYear(), 4) + '/' + zeroPadding((tweet_created_at_jst.getMonth()+1), 2) + '/' + zeroPadding(tweet_created_at_jst.getDate(), 2) + '(' + tweet_youbi + ')';
      var tweet_created_at_jp_style_time = zeroPadding(tweet_created_at_jst.getHours(), 2) + ":" + zeroPadding(tweet_created_at_jst.getMinutes(), 2) + ":" + zeroPadding(tweet_created_at_jst.getSeconds(), 2);
      var tweet_created_at_jp_style = tweet_created_at_jp_style_day + ' ' + tweet_created_at_jp_style_time;
      var tweet_day_and_time_with_link = '<a href="' + tweet_uri + '" target="_blank">' + tweet_created_at_jp_style + '</a>';

      var tweet_text = data.text;

      var client_name = data.source
      var client_name_without_htmltag = client_name.replace(/<("[^"]*"|'[^']*'|[^'">])*>/g,'')

      // 表示する内容をひとつの変数にまとめる
      var show_contents = '';
      show_contents += '<div class="each_tweet">';
      show_contents += user_icon_with_link + ' ' + screen_name_with_link + ' ' + tweet_day_and_time_with_link + ' (via ' + client_name_without_htmltag + ')<br />';
      show_contents += tweet_text + '<br />';
      show_contents += '</div>';

      io.sockets.emit('msg', show_contents);
    });
  });
}

// Thanks to http://qiita.com/_shimizu/items/2cb49daf2eb8ffb30690
function zeroPadding(number, length){
  return (Array(length).join('0') + number).slice(-length);
}
