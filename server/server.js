const path = require('path'); //netreba instalovat
const http = require('http'); //netreba instalovat
const express = require('express');
const bodyParser = require('body-parser');
const hbs = require('hbs');
const dateFormat = require('dateformat');
const flash = require('connect-flash-plus');
const session = require('express-session');

// const {Elo, Match, OrganizatorsList,Player,Playerslist,Roundslist,Sport,Tournament} = require('../models/index.js');
const Player = require('./controllers/playerController.js');
const Tournament = require('./controllers/tournamentController.js');
const Rounds = require('./controllers/roundController.js');
const notify = require('./controllers/notify.js');
const sport = require('./controllers/sport.js');
const elo = require('./controllers/elo.js');



const publicPath = path.join(__dirname, '../public' );
const port = process.env.PORT || 3000;

//nerobim to cez session, len takto globalne
//TOTO BY BOLO V SESSIONE
let id = 0;
let sqr = ['2','4','8','16','32','64','128','256'];
let table = [];
let lastRound = 0;
let tournamentId = '188784';
let type = 'roundRobin';
let matches = [];

const compare = (a,b) => {
  if (a.elo < b.elo)
    return -1;
  else 
    return 1;
  return 0;
}




var app = express();
var server = http.createServer(app);


app.set('views',path.join(__dirname,'../public'))
app.set("view engine", 'hbs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(publicPath));
app.use(session({
  secret: 'keyboard cat',
  cookie: { maxAge: 60000 }
}));
 
app.use(flash());

app.get('/', (req, res) => {
	res.render('index', {message: req.flash('info'),id: id});
});

app.post('/login', (req, res) => {
	
	Player.getAll()
	.then(result => {
		result[0].players.player.forEach((item) => {

		  if(item.email === req.body.email && item.password === req.body.password && item.confirmed){
		  	id = item.id;
		 //  	tournamentId = 0;
			// lastRound = 0;
		  	table = [];
		  }
		})
		req.flash('info', 'Boli ste prihlásený')
		res.redirect('http://localhost:3000/');
		// if(id !== 0) {
		// 	res.redirect('http://localhost:3000/');
		// } else {
		// 	res.redirect('http://localhost:3000/');
		// }
	})
});

app.get('/logout', (req, res) => {
	id = 0;
	// tournamentId = 0;
	// lastRound = 0;
	table = [];
	req.flash('info', 'Boli ste odhlasený')
	res.redirect('http://localhost:3000/');

});

//BP01
app.get('/registrate', (req, res) => {
	res.render('registrate',{message: req.flash('info')});
});

app.post('/registrate', (req, res) => {
	console.log(req.body)
	Player.create(req.body)
		.then(player => {
			req.body.id = player[0].id;
			req.flash('info', 'Boli ste zaregistrovaný')
			res.redirect('http://localhost:3000/');
		})
		.catch(error => {
			console.log("error> ", error);
		})
});

//MIDDLEWARE - ci je prihlaseny
app.use(function(req, res, next) {
  if (id === 0) {
  	req.flash('info', 'Nemáte oprávnenie')
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
		res.render('confirmation', {message: req.flash('info'),players: players});
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
			req.flash('info', 'Hráči boli potvrdený')
			res.redirect('http://localhost:3000/');
		})
	} else {
		res.redirect('http://localhost:3000/');
	}
});

//BP02
app.get('/filter', (req, res) => {
	sport.getAll()
	.then(result => {
		res.render('filter',{message: req.flash('info'),sports: result[0].sports.sport})
	})
	.catch(error => console.log(Error));
});

app.get('/tournaments', (req, res) => {
	sport.getAll()
	.then(result => {
		res.render('filter',{message: req.flash('info'),sports: result[0].sports.sport})
	})
	.catch(error => console.log(Error));
});

// app.post('/filter', (req, res) => {
// 	let tournaments = [];
// 	let tournamentsAlreadyLogged = [];
// 	console.log(req.body);
// 	Player.getAssingments()
// 	.then((result) => {
// 		console.log("RESULT>> ",result)
// 		if (result[0].zoznamhracovs) {
// 			result[0].zoznamhracovs.zoznamhracov.forEach((item) => {
// 				if(item.playerId === id) tournamentsAlreadyLogged.push(item.tournamentId);
// 			})
// 		}
// 		console.log("already logged> ",tournamentsAlreadyLogged)
// 		return Tournament.getAll()
// 	})
// 	.then((result) => {
// 		console.log("Turnaje: ",result[0].turnajs.turnaj);
// 		result[0].turnajs.turnaj.forEach((item) => {
// 			//TOTO PREROBIT NA 3*foreach
// 			// console.log(item.id)
// 			// console.log(req.body)
// 			console.log(req.body.date , ' -- ', item.date);
// 			console.log(req.body.name , ' -- ', item.name);
// 			console.log(req.body.sportId , ' -- ', item.sportId);

// 			if (tournamentsAlreadyLogged.includes(item.id)){
// 				console.log('Uz je regnuty');
// 			} else if(req.body.date !== ''){
// 				if(req.body.date === dateFormat(item.date, "yyyy-mm-dd")){
// 					if(req.body.name !== ''){
// 						if (item.name.toLowerCase().indexOf(req.body.name.toLowerCase()) > -1){
// 							if(req.body.sportId.toString() !== '0'){
// 								if (req.body.sportId.toString() === item.sportId.toString()){
// 									tournaments.push(item)
// 								}
// 							} else {
// 								tournaments.push(item)
// 							}
// 						}
// 					} else if(req.body.sportId.toString() !== '0'){
// 						if (req.body.sportId.toString() === item.sportId.toString()){
// 							tournaments.push(item)
// 						}
// 					} else  {
// 						tournaments.push(item)
// 					}
// 				}
// 			} else if(req.body.name !== ''){
// 				console.log(item.name.toLowerCase(),"--",req.body.name.toLowerCase())
// 				console.log("-->",item.name.toLowerCase().indexOf(req.body.name.toLowerCase()))
// 				if (item.name.toLowerCase().indexOf(req.body.name.toLowerCase()) > -1){
// 					if(req.body.sportId.toString() !== '0'){
// 						if (req.body.sportId.toString() === item.sportId.toString()){
// 							tournaments.push(item)
// 						}
// 					} else {
// 												console.log("tu som som")

// 						tournaments.push(item)
// 					}
// 				}
// 			} else if(req.body.sportId.toString() !== '0' && req.body.sportId.toString() !== ''){
// 				if (req.body.sportId.toString() === item.sportId.toString()){
// 					tournaments.push(item)
// 				}
// 			} else {
// 				tournaments.push(item)
// 			}
// 		})
// 		console.log("Turnaje1: ",tournaments);
// 		res.render("listFilteredTournaments",{message: req.flash('info'),tournaments: tournaments});
// 	})
// 	.catch(error => {
// 		console.log(error)
// 	})
// });

app.post('/tournaments', (req, res) => {
	let tournaments = [];
	let tournamentsAlreadyLogged = [];
	console.log(req.body);
	Player.getAssingments()
	.then((result) => {
		console.log("RESULT>> ",result)
		if (result[0].zoznamhracovs) {
			result[0].zoznamhracovs.zoznamhracov.forEach((item) => {
				if(item.playerId === id) tournamentsAlreadyLogged.push(item.tournamentId);
			})
		}
		console.log("already logged> ",tournamentsAlreadyLogged)
		return Tournament.getAll()
	})
	.then((result) => {
		console.log("Turnaje: ",result[0].turnajs.turnaj);
		result[0].turnajs.turnaj.forEach((item) => {
			//TOTO PREROBIT NA 3*foreach
			// console.log(item.id)
			// console.log(req.body)
			console.log(req.body.date , ' -- ', item.date);
			console.log(req.body.name , ' -- ', item.name);
			console.log(req.body.sportId , ' -- ', item.sportId);

			// if (tournamentsAlreadyLogged.includes(item.id)){
			// 	console.log('Uz je regnuty');
			// } else 
			if(req.body.date !== ''){
				if(req.body.date === dateFormat(item.date, "yyyy-mm-dd")){
					if(req.body.name !== ''){
						if (item.name.toLowerCase().indexOf(req.body.name.toLowerCase()) > -1){
							if(req.body.sportId.toString() !== '0'){
								if (req.body.sportId.toString() === item.sportId.toString()){
									tournaments.push(item)
								}
							} else {
								tournaments.push(item)
							}
						}
					} else if(req.body.sportId.toString() !== '0'){
						if (req.body.sportId.toString() === item.sportId.toString()){
							tournaments.push(item)
						}
					} else  {
						tournaments.push(item)
					}
				}
			} else if(req.body.name !== ''){
				console.log(item.name.toLowerCase(),"--",req.body.name.toLowerCase())
				console.log("-->",item.name.toLowerCase().indexOf(req.body.name.toLowerCase()))
				if (item.name.toLowerCase().indexOf(req.body.name.toLowerCase()) > -1){
					if(req.body.sportId.toString() !== '0'){
						if (req.body.sportId.toString() === item.sportId.toString()){
							tournaments.push(item)
						}
					} else {
												console.log("tu som som")

						tournaments.push(item)
					}
				}
			} else if(req.body.sportId.toString() !== '0' && req.body.sportId.toString() !== ''){
				if (req.body.sportId.toString() === item.sportId.toString()){
					tournaments.push(item)
				}
			} else {
				tournaments.push(item)
			}
		})
		console.log("Turnaje1: ",tournaments);
		return Tournament.getAllByPlayerId()
	})
	.then(result => {
		if(result[0].zoznamorganizators){
			result[0].zoznamorganizators.zoznamorganizator.forEach((item) => {
			
			  tournaments.forEach((turnaj) => {
			    if (turnaj.id.toString() === item.tournamentId.toString() && id.toString() === item.playerId.toString()){
			    	turnaj.organizator = true;
			    }
			  })
			})
			console.log(tournaments)
		}
		res.render("listAllTournaments",{message: req.flash('info'),tournaments: tournaments});
	})
	.catch(error => {
		console.log(error)
	})
});

app.get('/tournament/:id', (req, res) => {
	let tournament = {};
	Tournament.getById(req.params.id)
	.then(result => {
		if(result[0]){
			tournament = result[0].turnaj;
		}
		return Tournament.getAllByPlayerId()
	})
	.then(result => {
		if(result[0].zoznamorganizators){
			result[0].zoznamorganizators.zoznamorganizator.forEach((item) => {
				if (item.tournamentId.toString() === req.params.id.toString() && item.playerId.toString() === id.toString()){
					tournament.organizator = true;
				}
			})
		}
		return Player.getAssingments()
	})
	.then(result => {
		if(result[0].zoznamhracovs){
			result[0].zoznamhracovs.zoznamhracov.forEach((item) => {
			  if(tournament.id.toString() === item.tournamentId.toString() && item.playerId.toString() === id.toString()){
			  	tournament.connected = true;
			  }
			})
		}
		console.log(tournament)
		res.render('tournamentDetail',{tournament: tournament})
	})
});

app.get('/connect/:id', (req, res) => {
	// Player.getAssingments(id, req.params.id)
	// .then(result => {
	// 	console.log(result);
	// })
	let sportId;
	Tournament.getById(req.params.id)
	.then(result => {
		if(result[0].turnaj) {
			sportId = result[0].turnaj.sportId;
		}
		return Player.createAssingment(id, req.params.id)
	})
	.then(result => {
		console.log(result);
		return elo.getAll()
	})
	.then(result => {
		let value = 0;
		console.log("Result: ",result)
		if(result[0].hodnotenies) {
			result[0].hodnotenies.hodnoteny.forEach((item) => {
				console.log(item.playerId.toString(), ' -- ',id.toString(),' -- ',item.id.toString(),' -- ', sportId.toString())
				if(item.playerId.toString() === id.toString() && item.sportId.toString() === sportId.toString()) value += 1;
			})
		}
		console.log("Value: ", value);

		if(value === 0){
			elo.create(id,1000,sportId)
			.then(result => {
				req.flash('info', 'Boli ste prihlásený na turnaj')
				res.redirect('http://localhost:3000/')
			})
			.catch(error => console.log(error))
		} else {
			req.flash('info', 'Boli ste prihlásený na turnaj')
			res.redirect('http://localhost:3000/');
		}
	})
	.catch(error => console.log(error));
	
});

//BP03
app.get('/tournament/create', (req, res) => {
	sport.getAll()
	.then(result => {
		res.render('createTournament',{sports: result[0].sports.sport})
	})
	.catch(error => console.log(Error));
});

app.get('/tournament/create/:id', (req, res) => {
	let turnaj = [];
	Tournament.getById(req.params.id)
	.then(result => {
		turnaj = result[0].turnaj;
		return sport.getAll()
	})
	.then(result => {
		if(result[0].sports){
			res.render('createTournament',{message: req.flash('info'),sports: result[0].sports.sport, tournament:turnaj})
		} else {
			res.render('createTournament',{ tournament:turnaj})
		}
	})

});

app.post('/tournament/create', (req, res) => {
	Tournament.create(req.body)
	.then(tournament => {
		console.log(tournament)
		return Tournament.createAssingment(id, tournament[0].id)
	})
	.then(result => {
		req.flash('info', 'Turnaj bol vytvorený')
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
		res.render('listOldTournaments', {message: req.flash('info'),tournaments: tournaments});
	})
	.catch(error => {
		console.log(error)
	})
});
//BP04
//
app.get('/tournament/list', (req, res) => {
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
							// console.log(result[0].turnaj)
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
		// console.log(tournaments);
		res.render('listTournaments', {message: req.flash('info'),tournaments: tournaments});
	})
	.catch(error => {
		console.log(error)
	})
});

app.get('/tournament/checkIn/:id', (req, res) => {
	let players = [];
	let promises = [];
	Player.getAssingments()
	.then(result => {
		console.log("Result: ", result);
		if(result[0].zoznamhracovs) {
			// console.log(result[0])
			result[0].zoznamhracovs.zoznamhracov.forEach((item) => {
				console.log(item.tournamentId," -- ", req.params.id, " -- ", item.confirmed)
				if(item.tournamentId == req.params.id && item.confirmed === false){
					promises.push(
						Player.getById(item.playerId)
						.then((result) => {
							// console.log(result[0].player);
							players.push(result[0].player)
						})
					)
				}
			})
		}

		return Promise.all(promises);
	})
	.then(result => {
		res.render('confirmPlayers',{message: req.flash('info'),players: players, id: req.params.id})
	})
	.catch(error => console.log(error));


});

app.post('/checkIn/:id', (req, res) => {
		let promises = [];
	Player.getAssingments()
	.then(result => {
		if(result[0].zoznamhracovs) {
			result[0].zoznamhracovs.zoznamhracov.forEach((item) => {
				// console.log(req.body.confirmed ,' --- ',item.tournamentId,' === ',req.params.id.toString(),' --- ', req.body.confirmed.includes(item.playerId.toString()))
				if(req.body.confirmed && item.tournamentId.toString() === req.params.id && req.body.confirmed.includes(item.playerId.toString())){
					console.log('Tu som')
					promises.push(Player.updateAssingment(item.id)
						.then(result => {
							console.log("Updatovany", item.id);
						}))
				}
			})
		}

		Promise.all(promises)

	})
	.then((result) => {
		req.flash('info', 'Hráči boli potvrdený')
		res.redirect('http://localhost:3000/');
	})
	.catch(error => console.log(error))
});

app.get('/tournament/start', (req, res) => {
	let backURL=req.header('Referer') || '/';
	let promises = [];
	let tournaments = [];
	let numberOfConnectedPlayers = {};
	Player.getAssingments()
	.then(result => {
		if (result[0].zoznamhracovs) {
			result[0].zoznamhracovs.zoznamhracov.forEach((item) => {
				if(item.confirmed) {
					if(numberOfConnectedPlayers[item.tournamentId]) {
						numberOfConnectedPlayers[item.tournamentId] += 1;
					} else {
						numberOfConnectedPlayers[item.tournamentId] = 1;
					}
				}
			})
		}
		return Tournament.getAllByPlayerId()
	})
	.then((result) => {
		if(result[0].zoznamorganizators) {
			result[0].zoznamorganizators.zoznamorganizator.forEach((item) => {
				if(item.playerId === id) {
					promises.push(
						Tournament.getById(item.tournamentId)
						.then(result => {
							result[0].turnaj.confirmed = numberOfConnectedPlayers[item.tournamentId.toString()];
							if(result[0].turnaj.confirmed  >= result[0].turnaj.minC) {
								
								// console.log('Pole: ', sqr, ' -- ',result[0].turnaj.confirmed.toString() , ' -- ', sqr.includes(result[0].turnaj.confirmed.toString()) )
								if(result[0].turnaj.parovanie === "roundRobin") 
									result[0].turnaj.bool = true;
								else if(result[0].turnaj.parovanie === "svajciarsky" && result[0].turnaj.confirmed % 2 === 0) result[0].turnaj.bool = true;

								else if(result[0].turnaj.parovanie === "pavuk" && sqr.includes(result[0].turnaj.confirmed.toString())) result[0].turnaj.bool = true;
								else result[0].turnaj.bool = false 
							}
							else result[0].turnaj.bool = false;
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
		res.render('listTournamentsStart', {message: req.flash('info'),tournaments: tournaments});
	})
	.catch(error => {
		console.log(error)
	})
});

app.get('/tournament/start/:id', (req, res) => {
	tournamentId = req.params.id;
	Tournament.getById(req.params.id)
	.then((result) => {
		console.log(result[0].turnaj);
		type = result[0].turnaj.parovanie;
		return parovanieFunctions[result[0].turnaj.parovanie](result[0].turnaj)
	})
	.then(result => {
		req.flash('info', 'Turnaj bol odštartovaný')
		res.redirect('http://localhost:3000/tournament/round');
	})
	.catch(error => {
		console.log(error)
	})
});

app.get('/tournament/round', (req, res) => {
	console.log('Tu som');
	lastRound += 1;
	let roundId = 0;
	matches = [];
	let players = [];
	let obj = {};
	console.log("LastRound: ", lastRound)
	// if(type === 'roundRobin') {
		Rounds.getAllRounds()
		.then(result => {
			console.log(result)
			if(result[0].zoznamkols){
				result[0].zoznamkols.zoznamkol.forEach((item) => {
					console.log(item.tournamentId , ' --- ', tournamentId , ' --- ',item.name,' --- ', lastRound.toString())
					if(item.tournamentId.toString() === tournamentId.toString() && item.name === lastRound.toString()) roundId = item.id
				})
			}

			if (roundId === 0) {
				notifyPlayers(tournamentId)
				req.flash('info', 'Turnaj bol vyhodnotený')
				res.redirect('http://localhost:3000/');
			}
			return Rounds.getAllMatches()
		})
		.then(result => {
					console.log(result)

			if(result[0].zapass){
				result[0].zapass.zapa.forEach((item) => {
					if (item.roundId === roundId) {
						matches.push(item);
					}
				})
			}
			console.log("Round ID> ", roundId)
			console.log("Matches> ", matches);
			return Player.getAll()
		})
		.then(result => {
			if(result[0].players){
				result[0].players.player.forEach((player) => {
					matches.forEach((match) => {
						if (player.id === match.team1Id) match.team1 = player.nickName;
						if (player.id === match.team2Id) match.team2 = player.nickName;
					})
				})
			}
			// matches1 = matches;
			// console.log(matches1 , ' -- ', matches)
			if( type === 'roundRobin')
				res.render('listRounds', {message: req.flash('info'),round:lastRound,matches: matches});
			else 
				res.render('listRounds', {message: req.flash('info'),pavuk:true,round:lastRound,matches: matches});
		})
	// }
	
});

app.post('/pavuk/update', (req, res) => {
	let roundId = 0;
	console.log('Tu som v update');
	let promises = [];
	let promises2 = [];
	let matches1 = [];
	let matches2 = [];
	let winners = [];
	let numberOfMatches = 0;

	Rounds.getAllRounds()
	.then(result => {
		console.log(result)
		console.log("Round ID: ", roundId, " lastRound>",lastRound);
		if(result[0].zoznamkols){
			result[0].zoznamkols.zoznamkol.forEach((item) => {
				console.log(item.tournamentId , ' --- ', tournamentId , ' --- ',item.name,' --- ', lastRound.toString())
				if(item.tournamentId.toString() === tournamentId.toString() && item.name === lastRound.toString()) roundId = item.id
			})
		}
		console.log("Round ID: ", roundId)

		if (roundId === 0) {
			notifyPlayers(tournamentId);
			// updateStatistics(tournamentID);
			res.redirect('http://localhost:3000/');
		}
		return Rounds.getAllMatches()
	})
	.then(result => {
		if(result[0].zapass){
			result[0].zapass.zapa.forEach((item) => {
				if (item.roundId === roundId) {
					if(req.body[item.id + 'A']) {
						scoreA = req.body[item.id + 'A'] 
					} else {
						scoreA = 0;
					}
					if(req.body[item.id + 'B']) {
						scoreB = req.body[item.id + 'B']
					} else {
						scoreB = 0;
					}
					numberOfMatches++;
					console.log(item.scoreA, " : ",item.scoreA)
					if(scoreA > scoreB) {
						winners.push(item.team1Id)
					} else {
						winners.push(item.team2Id)
					}
					promises2.push(
						Rounds.updateMatch(item.id, scoreA, scoreB)
						.then(result => {
							console.log("Updatovany match.")
						})
						.catch(error => console.log("errorroorororo"))
					)
				}
			})
		}
		return Promise.all(promises2)	
	})
	.then(result => {
		console.log("Pocet zapasov v predchadzajucom kole -- ",numberOfMatches);
		if(numberOfMatches === 1) {
			console.log("Vyhodnotenie turnaja a uprava statistik");
			notifyPlayers(tournamentId);
			req.flash('info', 'Turnaj bol vyhodnotený')
			res.redirect('http://localhost:3000/');
			// updateStatistics(tournamentID);
		} else {
			for (let i=0; i< winners.length/2; i++) {
				matches1.push({a: winners[i], b:winners[winners.length-i-1]})
			}
			console.log("Zapasy: ", matches1);	
			return Rounds.createRound(lastRound+1, tournamentId)
			
		}
	})
	.then(result => {
		console.log("id roundu -- ", result[0].id);
		matches1.forEach((match) => {
			promises.push(
				Rounds.createMatch(match.a,match.b,result[0].id)
				.then(res => {
					console.log(res[0].id);
				})
				.catch(err => console.log("Error - ", err))
			)
		})
		return Promise.all(promises);
	})
	.then(result => {
		console.log("Tu som sa dostal, malo by presmerovat")
		req.flash('info', 'Bolo vygenerované ďalšie kolo')
		res.redirect('http://localhost:3000/tournament/round');
	})
	.catch(error => {
		console.log("Error ",error);
	})

});

app.post('/roundRobin/update', (req, res) => {
	console.log('Tu som v update');
	let roundId = 0;
	let promises = [];
	let obj = {};
	let scoreA, scoreB;
	console.log(matches);
	matches.forEach((match) => {
		if(req.body[match.id + 'A']) {
			scoreA = req.body[match.id + 'A'] 
		} else {
			scoreA = 0;
		}
		if(req.body[match.id + 'B']) {
			scoreB = req.body[match.id + 'B']
		} else {
			scoreB = 0;
		}
		console.log(scoreA,' -- ', scoreB)
		if(scoreA > scoreB) {
			console.log("A ma lepsie skore")
			table.forEach((row) => {
				if (row.id === match.team1Id) {
					row.win++;
					row.points += 3;
				}
				if (row.id === match.team2Id) {
					row.lose++;
				}
			})
		}
		else if(scoreA === scoreB) {
			table.forEach((row) => {
				if (row.id === match.team1Id || row.id === match.team2Id) {
					row.draw++;
					row.points += 1;
				}
			})
		} 
		else {
			table.forEach((row) => {
				if (row.id === match.team2Id) {
					row.win++;
					row.points += 3;
				}
				if (row.id === match.team1Id) {
					row.lose++;
				}
			})
		}
		console.log("tabulka:", table);
		promises.push(
			Rounds.updateMatch(match.id, scoreA, scoreB)
			.then(result => {
				console.log(result)
			})
			.catch(error => console.log("errorroorororo"))
		)

	})
	console.log("TU som sa dostal")


	Promise.all(promises)
	.then(result => {
		console.log("Vsecko v poradku")
		req.flash('info', 'Zápasy boli aktualizované')
		res.redirect('http://localhost:3000/tournament/round');

	})
	.catch(error => {
		console.log("Error => ");
		req.flash('info', 'Nastal error')
		res.redirect('http://localhost:3000/');
	})
});


server.listen(port, () => {
	console.log(`App je na porte ${port}`);
});


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

const createTable = (players) => {
	players.forEach((item) => {
		table.push({
			id: item,
			win: 0,
			draw: 0,
			lose: 0,
			points: 0
		})
	})
}

const generateMatches = (tournament, players) => {
	let arr = [];
	let rounds = [];
	let promises = [];
	for(let i =0; i<players.length; i++){
		rounds.push([]);
	}

	for(let i = 0; i < players.length; i++) {
		let temp = [];
		for(let j = 0; j < players.length; j++) {
			let value = i + j + 1;
			if(value > players.length) value -= players.length;
			temp.push(value);
		}	
		arr.push(temp);
	}
	for(let i = 0; i < players.length; i++) {
		for(let j=0; j < players.length; j++) {
			console.log(arr[i][j]);
		}
		console.log("-------------")
	}
	for(let i = 0; i < players.length; i++) {
		for(let j=i; j < players.length; j++) {
			if (i !== j) {
				console.log("--",arr[i][j]);
				rounds[arr[i][j]-1].push({a: players[i], b:players[j]})					
			}
		}
	}
	return new Promise((resolve, reject) => {
		rounds.forEach((item, index) => {
			promises.push(

				Rounds.createRound(index+1, tournament.id)
				.then(result => {
					let matches2 = [];
					item.forEach((item1) => {
						matches2.push(
							Rounds.createMatch(item1.a, item1.b, result[0].id)
						)
					})
					return Promise.all(matches2)
				})

			)

			Promise.all(promises)
			.then((result) => {
				resolve(rounds)
			})
			.catch(error => {
				reject(error);
			})
		})		
	})
}

const generateRound = (tournamentId, players) => {
	//tu by mohlo byt vytiahnutie vsetkych ELO, a poparovanie pre hraca a sport,
	// potom zoradenie hracov v pointer	
	let sportId = 0;
	let playersWithElo = [];
	let matches1 = [];
	let promises = [];
	return new Promise((resolve, reject) => {
		Tournament.getById(tournamentId)
		.then(result => {
			sportId = result[0].turnaj.sportId;
			return elo.getAll()
		})
		.then(result => {
			console.log("Players1: ", players);
			// console.log(result[0].hodnotenies.hodnoteny)
			result[0].hodnotenies.hodnoteny.forEach((item) => {
				// console.log(item)
				// console.log(item.sportId.toString(), ' --- ', sportId.toString());
				// console.log(players.contains(item.playerId));

				if(item.sportId.toString() === sportId.toString() && players.includes(item.playerId)){
					playersWithElo.push({id: item.playerId, elo: item.elo});
				}
			})
			playersWithElo.sort(compare);
			console.log("Players", playersWithElo)
			for (let i=0; i< playersWithElo.length/2; i++) {
				matches1.push({a: playersWithElo[i].id, b:playersWithElo[players.length/2+i].id})
			}
			console.log("Zapasy: ", matches1);	
			return Rounds.createRound(lastRound+1, tournamentId)
		})
		.then(result => {
			console.log("Tu som sa dostal")
			console.log("matches -- ", matches1)
			console.log("Result: ", result)
			matches1.forEach((match) => {
				console.log("match:",match)
				promises.push(Rounds.createMatch(match.a,match.b,result[0].id)
					.then(result => {console.log(result)})
					.catch(error => console.log(error))
				)
			})
			return Promise.all(promises);
		})
		.then(result => {
			console.log("Nagenerovane prve zapasy");
			resolve();
		})
		.catch(error => {
			reject();
		})
	})
	
}

const pavuk = (tournament) => {
	lastRound = 0;
	let players = [];
	console.log('Tu som sa dostal-- ', tournament)
	return new Promise((resolve, reject) => {
		Player.getAssingments()
		.then(result => {
			if(result[0].zoznamhracovs) {
				result[0].zoznamhracovs.zoznamhracov.forEach((item) => {
					if (item.tournamentId === tournament.id && item.confirmed) {
						players.push(item.playerId)
					}
				})
			}
			return generateRound(tournament.id, players);
		})
		.then(result => {
			console.log("Aj zapasy a aj kolo")
			resolve(result);
		})
		.catch(error => {
			reject(error);
		})
	})
}

const roundRobin = (tournament) => {
	lastRound = 0;
	let players = [];
	table=[];
	return new Promise((resolve, reject) => {
		Player.getAssingments()
		.then(result => {
			if(result[0].zoznamhracovs) {
				result[0].zoznamhracovs.zoznamhracov.forEach((item) => {
					if (item.tournamentId === tournament.id && item.confirmed) {
						players.push(item.playerId)
					}
				})
			}
			createTable(players);
			return generateMatches(tournament, players);
		})
		.then((result) => {
			console.log(result);
			resolve(result)
		})
		.catch(error => reject(error));
	})
}

const doSomething = (tournament) => {
	console.log('Prebehol svajciarsky turnaj');
}


const notifyPlayers = (tournamentId) => {
	let obj = [];
	let rounds = [];
	let matchess = [];
	let emails = [];
	Tournament.getById(tournamentId)
	.then(result => {
		obj.push({turnaj: result[0].turnaj});
		return Rounds.getAllRounds()
	})
	.then(result => {
		// console.log()
		result[0].zoznamkols.zoznamkol.forEach((item) => {
			if (item.tournamentId === obj[0].turnaj.id){
				rounds.push(item.id);
			}
		})
		return Rounds.getAllMatches()
	})
	.then(result => {
		result[0].zapass.zapa.forEach((item) => {
			if(rounds.includes(item.roundId)) {
				matchess.push(item);
			}
		})
		return Player.getAll()
	})
	.then(result => {
		console.log(result)
		console.log('======================================================================================')
		console.log(matchess,'',obj[0])
		console.log('======================================================================================')
		
		updateStatistics(matchess, obj[0].turnaj.sportId);
		result[0].players.player.forEach((player) => {
			matchess.forEach((match) => {
				if (player.id === match.team1Id) {
					emails.push(player.email)
					match.team1 = player.nickName;
				}
				if (player.id === match.team2Id) {
					emails.push(player.email)
					match.team2 = player.nickName;
				}
			})
			if(table.length > 0) {
				table.forEach((item) => {
				  if(item.id === player.id) item.id = player.nickName;
				})
			}
		})

		let message = '';
		let subject = "Vyhodnotenie turnaja " + obj[0].turnaj.name;
		matchess.forEach((item) => {
		  	message += item.team1 + " " + item.scoreA + " : " + item.scoreB + " " + item.team2 + "\r\n"
		})
		if (table.length > 0) {
			message += "\n\n Tabulka: \n"
			table.forEach((item) => {
				message += item + "\n";
			})
		}
		let setOfEmails = new Set(emails)
		setOfEmails.forEach((item) => {
			notify.notifyPlayer(item, subject, message);
		})
	})
}



const updateStatistics = (matches1, sportId1) => {
	console.log(matches1 , ' == ',sportId1)
	let players = [];
	console.log("Matches: ", matches1)
	if(table.length > 0){
		table.forEach((item) => {
			let value = item.win*5 - item.lose*2 + item.draw*2;
		  players.push({id: item.id, elo:value});
		})
	} else {
		matches1.forEach((item) => {
		  players.push(item.team1Id);
		  players.push(item.team2Id)
		})
		let setOfPlayers = new Set(players);
		players = [];
		setOfPlayers.forEach((item) => {
		  players.push({id:item, elo:0});
		})
		matches1.forEach((item) => {
			console.log(item.scoreA," -- ",item.scoreB)
			if(item.scoreA > item.scoreB){
				players.forEach((player) => {
				  if(player.id === item.team1Id) player.elo+=5;
				  if(player.id === item.team2Id) player.elo-=2;
				})
			} else if(item.scoreA < item.scoreB){
				players.forEach((player) => {
				  if(player.id === item.team1Id) player.elo-=2;
				  if(player.id === item.team2Id) player.elo+=5;
				})
			} else {
				players.forEach((player) => {
				  if(player.id === item.team1Id) player.elo+=2;
				  if(player.id === item.team2Id) player.elo+=2;
				})
			}
		})

	}
	let newElos = [];
	console.log("PLAYERS:" ,players);
	elo.getAll()
	.then(result => {
		result[0].hodnotenies.hodnoteny.forEach((item) => {
		  players.forEach((player) => {
		    if(player.id === item.playerId && item.sportId.toString() === sportId1.toString()){
		    	player.elo += item.elo;
		    	console.log("ID: ",item.id," elo: ",player.elo)
		    	newElos.push(elo.update(item.id, player.elo))
		    }
		  })
		})
		return Promise.all(newElos)
	})
	.then(result => {
		console.log("ELO Je updatovane")
	})
	.catch(error => console.log("Error:",error));
}





let parovanieFunctions = {
	svajciarsky: doSomething,
	pavuk: pavuk,
	roundRobin: roundRobin
}







