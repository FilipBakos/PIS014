const soap = require('soap');
const fs = require('fs');
var url = 'http://labss2.fiit.stuba.sk/pis/ws/Students/Team014zoznamKol?WSDL';
var urlMatches = 'http://labss2.fiit.stuba.sk/pis/ws/Students/Team014zapas?WSDL';


const createRound = (number, tournamentId) => {
	let args = {
		team_id: "014",
		team_password: "fkAq7Z",
		zoznamKol: {
			name: number,
			tournamentId: tournamentId
		}	
	};
	console.log(args);
	return soap.createClientAsync(url)
	.then((client) => {
  		return client.insertAsync(args);
	})
}

const getAllRounds = () => {
	return soap.createClientAsync(url)
	.then((client) => {
  		return client.getAllAsync();
	})
}


const createMatch = (team1Id, team2Id, roundId) => {
	let args = {
		team_id: "014",
		team_password: "fkAq7Z",
		zapas: {
			name: '',
			team1Id: team1Id,
			team2Id: team2Id,
			roundId: roundId
		}	
	};
	return soap.createClientAsync(urlMatches)
	.then((client) => {
  		return client.insertAsync(args);
	}) 
}

const getAllMatches = () => {
	return soap.createClientAsync(urlMatches)
	.then((client) => {
  		return client.getAllAsync();
	})
}




const updateMatch = (id, scoreA, scoreB) => {
	let args = {
		team_id: "014",
		team_password: "fkAq7Z",
		entity_id: id,
		zapas: {
			scoreA: scoreA,
			scoreB: scoreB
		}	
	};
	return soap.createClientAsync(urlMatches)
	.then((client) => {
  		return client.updateAsync(args);
	})
}



module.exports = {
	createRound,
	getAllRounds,
	createMatch,
	getAllMatches,
	updateMatch
}



