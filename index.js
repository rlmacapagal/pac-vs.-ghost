//server side

var express = require('express');
var app = express();
var http = require('http').Server(app);
var port = process.env.PORT || 3000;
var io = require('socket.io')(http); //creates a new socket.io instance attached to the http server

app.use(express.static(__dirname + '/public'));

app.get('/new', function(req,res){
	res.sendFile(__dirname + '/pacman.html')
});

app.get('/', function(req,res){
	res.sendFile(__dirname + '/pacman.html') // load pacman.html
});

const MovingDirection = 
{
    up:0,
    down:1,
    left:2,
    right:3
};

let maysetintervalnaba = false;
let player1 = '';
let player2  = '';
let data;
let id;
let players = [];

io.on('connection', function(socket)
{  //Whenever someone connects this gr.ets executed; o connection, disconnection, etc., events in it, using the socket object
	
	if(player1 == '')
	{
		player1 = socket.id;
		id = player1;
		players.push(player1);
		io.emit('id', players);
		console.log(player1, "player1");
		

	}

	else if(player1 != '')
	{
		player2 = socket.id;
		id = player2;
		players.push(player2);
		io.emit('id', players);
		console.log(player2, "player2");

	}
	

	if(!maysetintervalnaba) // may tumatakbo na ba na setinterval?
	{
		maysetintervalnaba = true;
		let interval = setInterval(function (){ io.emit('render')}, 1000 / 75); 
		//setInterval(function (){ io.emit('render')}, 1000 / 75); 
	


	}
	console.log('a user connected')
	

	socket.on('update', (player, key) =>
	{
		data = player;
		console.log(player, "player" );
		console.log(key);
		console.log(data, "data");
		console.log(player1, 'player1');
		console.log(player2, 'player2');

		if(data === player1 && (key == 37 || key == 38 || key == 39 || key == 40))
		{
			console.log("player1 tira");
			io.emit('render', key);
			//console.log('aus');
		}
		

		else if (data === player2 && (key == 87 || key == 83 || key == 65 || key == 68))
		{
			console.log("player2 tira");
			io.emit('render', key);
		}
	

		else 
		{
			key = 0;
			console.log(key);
			console.log("else");
			io.emit('render', key);
		}
	


		

   });

   socket.on("gameover", () =>
   {
	//clearInterval(interval);
	io.emit('ovah');

   });

})

http.listen(port, function () {
  console.log('Server listening at port %d', port);
});

