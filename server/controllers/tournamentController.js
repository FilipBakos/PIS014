const soap = require('soap');
var urlTournament = 'http://labss2.fiit.stuba.sk/pis/ws/Students/Team014turnaj?WSDL';
var urlAssing = 'http://labss2.fiit.stuba.sk/pis/ws/Students/Team014zoznamOrganizator?WSDL';

const create = (tournament) => {
	let args = {
		team_id: "014",
		team_password: "fkAq7Z",
		turnaj: tournament	
	};
	return soap.createClientAsync(urlTournament)
	.then((client) => {
  		return client.insertAsync(args);
	})
}


const getAll = () => {
	return soap.createClientAsync(urlTournament)
	.then((client) => {
  		return client.getAllAsync();
	})
}

const getById = (id) => {
	return soap.createClientAsync(urlTournament)
	.then((client) => {
  		return client.getByIdAsync({id: id});
	})
}

const update = (id, tournament) => {
	let args = {
		team_id: "014",
		team_password: "fkAq7Z",
		entity_id: id,
		turnaj: tournament	
	};
	return soap.createClientAsync(urlTournament)
	.then((client) => {
  		return client.updateAsync(args);
	})
}

const createAssingment = (playerId, tournamentId) => {
	let args = {
		team_id: "014",
		team_password: "fkAq7Z",
		zoznamOrganizator: {
			name: '-',
			playerId: playerId,
			tournamentId: tournamentId
		}	
	};
	console.log(args)
	return soap.createClientAsync(urlAssing)
	.then((client) => {
  		return client.insertAsync(args);
	})
}


const getAllByPlayerId = () => {
	return soap.createClientAsync(urlAssing)
	.then((client) => {
  		return client.getAllAsync();
	})
}

module.exports = {
	create,
	getAll,
	update,
	getById,
	createAssingment,
	getAllByPlayerId
}



