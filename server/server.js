const path = require('path'); //netreba instalovat
const http = require('http'); //netreba instalovat
const express = require('express');
const bodyParser = require('body-parser');
const hbs = require('hbs');

const {Elo, Match, OrganizatorsList,Player,Playerslist,Roundslist,Sport,Tournament} = require('../models/index.js');


const publicPath = path.join(__dirname, '../public' );
const port = process.env.PORT || 3000;

var app = express();
var server = http.createServer(app);

app.set('views',path.join(__dirname,'../public'))
app.set("view engine", 'hbs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(publicPath));

app.get('/', (req, res) => {
	res.render('index');
});


//BP01
app.get('/registrate', (req, res) => {
	res.render('registrate');
});

app.post('/registrate', (req, res) => {
	console.log(req.body)
	Player.create(req.body)
		.then(player => {
			console.log("Player> ", player.dataValues);
			res.render('confirmation',player.dataValues);
		})
		.catch(error => {
			console.log("error> ", error);
		})
	console.log(req.body);
});

app.post('/registrate/:id', (req, res) => {
	console.log(req.body)
	Player.update(req.body, {
			returning: true,
			where:{
				id: req.params.id
			}
	})
	.then(player => {
		console.log("Potvrdeny ", player.dataValues);
		res.redirect('http://localhost:3000/')
		// res.render('index', {id: req.params.id});
	})
	.catch(error => {
		console.log("error> ", error);
	})
	console.log(req.body);
});

//BP02
app.get('/logTo', (req, res) => {
	res.render('browseTournaments');
});

app.get('/filter', (req, res) => {
	Tournament.findAll({
		where: {
	  		name: req.query.name,
	  		date: req.query.date
	  	//  sportId: req.params.sportId
			}
	   // include: [{model: Tournament, as:'tournaments'}]
	})
	.then((tournaments) => {
		res.render('filterList', {tournaments: tournaments});
	})
	.catch(error => {
		console.log(error)
	})
});

app.post('/logTo/:id', (req, res) => {
	return PlayersList.create({
		"playerId": 1,
		"tournamentId": req.params.id,
		"confirmed": false
	})
	.then(result => {
		PlayersList.findAll({
			where: {
	  			tournamentId: req.params.id,
	  	//  sportId: req.params.sportId
			}
		})
	})
	.then(result => {
		res.redirect('http://localhost:3000/confirmPlayers',result)
	})
});

//BP03
app.get('/tournament/create', (req, res) => {
	res.render('createTournament');
});

app.get('/tournament/create/:id', (req, res) => {
	Tournament.findByPk(req.params.id)
	.then(tournament => {
		console.log('tournament: ',tournament.dataValues)
		res.render('createTournament',{"tournament": tournament.dataValues});
	})
});

app.post('/tournament/create', (req, res) => {
	Tournament.create(req.body)
	.then(tournament => {
		return OrganizatorsList.create({
			"playerId": 1,
			"tournamentId": tournament.dataValues.id
		})
	})
	.then(result => {
		res.redirect('http://localhost:3000/')
	})
	
});

app.get('/tournament/listOld', (req, res) => {
	Player.findAll({
		where: {
	  		id: 1
			},
	    include: [{model: Tournament, as:'tournaments'}]
	})
	.then((player) => {
		let tournaments = [];
		getAllTournaments(player[0].tournaments, tournaments)
		console.log('Render');
		res.render('listOld', {tournaments: tournaments});
	})
	.catch(error => {
		console.log(error)
	})
});

server.listen(port, () => {
	console.log(`App je na porte ${port}`);
});

//BP04



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





