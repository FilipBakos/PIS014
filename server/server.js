const path = require('path'); //netreba instalovat
const http = require('http'); //netreba instalovat
const express = require('express');
const bodyParser = require('body-parser');
const hbs = require('hbs');
const dateFormat = require('dateformat');

// const {Elo, Match, OrganizatorsList,Player,Playerslist,Roundslist,Sport,Tournament} = require('../models/index.js');
const Player = require('./controllers/playerController.js');
const Tournament = require('./controllers/tournamentController.js');
const Rounds = require('./controllers/roundController.js');
const notify = require('./controllers/notify.js');


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
		 //  	tournamentId = 0;
			// lastRound = 0;
		  	table = [];
		  }
		})
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
	// Player.getAssingments(id, req.params.id)
	// .then(result => {
	// 	console.log(result);
	// })
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
		res.render('listTournaments', {tournaments: tournaments});
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
		res.render('confirmPlayers',{players: players, id: req.params.id})
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
		res.render('listTournamentsStart', {tournaments: tournaments});
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
				res.render('listRounds', {round:lastRound,matches: matches});
			else 
				res.render('listRounds', {pavuk:true,round:lastRound,matches: matches});
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
		res.redirect('http://localhost:3000/tournament/round');

	})
	.catch(error => {
		console.log("Error => ");
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
	return new Promise((resolve, reject) => {
		let matches1 = [];
		let promises = [];
		for (let i=0; i< players.length/2; i++) {
			matches1.push({a: players[i], b:players[players.length-i-1]})
		}
		console.log("Zapasy: ", matches1);	
		Rounds.createRound(lastRound+1, tournamentId)
		.then(result => {
			matches1.forEach((match) => {
				promises.push(
					Rounds.createMatch(match.a,match.b,result[0].id)
					.then(res => console.log("Vytvoreny match"))
					.catch(err => console.log("Error"))
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
		// console.log("Tournament: ",result[0])
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




let parovanieFunctions = {
	svajciarsky: doSomething,
	pavuk: pavuk,
	roundRobin: roundRobin
}







