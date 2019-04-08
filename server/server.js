const path = require('path'); //netreba instalovat
const http = require('http'); //netreba instalovat
const express = require('express');
const bodyParser = require('body-parser');
const hbs = require('hbs');
const dateFormat = require('dateformat');

// const {Elo, Match, OrganizatorsList,Player,Playerslist,Roundslist,Sport,Tournament} = require('../models/index.js');
const Player = require('./controllers/playerController.js');
const Tournament = require('./controllers/tournamentController.js')


const publicPath = path.join(__dirname, '../public' );
const port = process.env.PORT || 3000;

let id = 0;

var app = express();
var server = http.createServer(app);

app.set('views',path.join(__dirname,'../public'))
app.set("view engine", 'hbs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(publicPath));

app.get('/', (req, res) => {
	res.render('index', {id: id});
});

app.post('/login', (req, res) => {
	Player.getAll()
	.then(result => {
		result[0].players.player.forEach((item) => {
		  if(item.email === req.body.email && item.password === req.body.password && item.confirmed){
		  	id = item.id;
		  }
		})
		if(id !== 0) {
			res.render('index', {id: id})
		} else {
			res.render('index');
		}
	})
});

app.get('/logout', (req, res) => {
	id = 0;
	res.redirect('http://localhost:3000/');
});

//BP01
app.get('/registrate', (req, res) => {
	res.render('registrate');
});

app.post('/registrate', (req, res) => {
	console.log(req.body)
	Player.create(req.body)
		.then(player => {
			req.body.id = player[0].id;
			res.redirect('http://localhost:3000/');
		})
		.catch(error => {
			console.log("error> ", error);
		})
});

//MIDDLEWARE - ci je prihlaseny
app.use(function(req, res, next) {
  if (id === 0) {
    return res.redirect('http://localhost:3000/');
  }
  next();
});

app.get('/confirmation', (req, res) => {
	let players = [];
	Player.getAll()
	.then(result => {
		result[0].players.player.forEach((item) => {
		  if(item.confirmed === false){
		  	players.push(item);
		  }
		})
		console.log(players);
		res.render('confirmation', {players: players});
	})
})

app.post('/confirmation', (req, res) => {
	console.log("Tu som")
	let promises = []
	if(req.body.confirmed){
		req.body.confirmed.forEach((item) => {
			promises.push(
				Player.getById(item)
				.then((result) => {
					result[0].player.confirmed = true;
					return Player.update(item, result[0].player)
				})
			)
		})

		Promise.all(promises)
		.then((result) => {
			res.redirect('http://localhost:3000/');
		})
	} else {
		res.redirect('http://localhost:3000/');
	}
});

//BP02
app.get('/filter', (req, res) => {
	res.render('filter');
});

app.post('/filter', (req, res) => {
	let tournaments = [];
	let tournamentsAlreadyLogged = [];
	console.log(req.body);
	Tournament.getAllByPlayerId()
	.then((result) => {
		console.log("RESULT>> ",result)
		if (result[0].zoznamorganizators) {
			result[0].zoznamorganizators.zoznamorganizator.forEach((item) => {
				tournamentsAlreadyLogged.push(item.tournamentId);
			})
		}
		console.log("already logged> ",tournamentsAlreadyLogged)
		return Tournament.getAll()
	})
	.then((result) => {
		result[0].turnajs.turnaj.forEach((item) => {
			//TOTO PREROBIT NA 3*foreach
			console.log(item.id)
			if (tournamentsAlreadyLogged.includes(item.id)){
				console.log('Uz je regnuty');
			} else if (req.body.date !== '' && req.body.name !== ''){
				if (req.body.date === dateFormat(item.date, "yyyy-mm-dd") && req.body.name === item.name){
					tournaments.push(item)
				} 
			} else if(req.body.date !== '' || req.body.name !== '') {
				if (req.body.date !== '' && req.body.date === dateFormat(item.date, "yyyy-mm-dd")){
					tournaments.push(item)
				} else if (req.body.name !== '' && req.body.name === item.name){
					tournaments.push(item)
				}
			} else {
				tournaments.push(item)
			}
		})
		res.render("listFilteredTournaments",{tournaments: tournaments});
	})
	.catch(error => {
		console.log(error)
	})
});

app.get('/connect/:id', (req, res) => {
	Player.createAssingment(id, req.params.id)
	.then(result => {
		console.log(result);
		res.redirect('http://localhost:3000/');
	})
	.catch(error => console.log(error));
});

//BP03
app.get('/tournament/create', (req, res) => {
	res.render('createTournament');
});

app.get('/tournament/create/:id', (req, res) => {
	Tournament.getById(req.params.id)
	.then(result => {
		res.render('createTournament',{"tournament": result[0].turnaj});
	})
});

app.post('/tournament/create', (req, res) => {
	Tournament.create(req.body)
	.then(tournament => {
		console.log(tournament)
		return Tournament.createAssingment(id, tournament[0].id)
	})
	.then(result => {
		res.redirect('http://localhost:3000/')
	})
});

app.get('/tournament/listOld', (req, res) => {
	let promises = [];
	let tournaments = [];
	Tournament.getAllByPlayerId()
	.then((result) => {
		if(result[0].zoznamorganizators) {
			result[0].zoznamorganizators.zoznamorganizator.forEach((item) => {
				if(item.playerId === id) {
					promises.push(
						Tournament.getById(item.tournamentId)
						.then(result => {
							console.log(result[0].turnaj)
							tournaments.push(result[0].turnaj);
						})
					)					
				}

			})	
			return Promise.all(promises)		
		} else {
			return new Error("chyba");
		}
		
	})
	.then((result) => {
		console.log(tournaments);
		res.render('listOldTournaments', {tournaments: tournaments});
	})
	.catch(error => {
		console.log(error)
	})
});

server.listen(port, () => {
	console.log(`App je na porte ${port}`);
});

//BP05
//




//funkcie
const getAllTournaments = (object, array) => {
	object.forEach((item) => {
	  let obj = {
	  	"id": item.dataValues.id,
	  	"name": item.dataValues.name,
	  	"date": item.dataValues.date,
	  	"miesto": item.dataValues.miesto,
	  	"maxC": item.dataValues.maxC,
	  	"minC": item.dataValues.minC,
	  	"parovanie": item.dataValues.parovanie,
	  	"sukromny": item.dataValues.sukromny,
	  	"date1": item.dataValues.date1
	  }
	  array.push(obj);
	})
}





