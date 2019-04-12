const soap = require('soap');
const fs = require('fs');
var url = 'http://labss2.fiit.stuba.sk/pis/ws/Students/Team014player?WSDL';
var urlAssingToTournament = 'http://labss2.fiit.stuba.sk/pis/ws/Students/Team014zoznamHracov?WSDL';


const create = (player) => {
	let args = {
		team_id: "014",
		team_password: "fkAq7Z",
		player: player	
	};
	return soap.createClientAsync(url)
	.then((client) => {
  		return client.insertAsync(args);
	})
}
 /*example volania
 createPlayer({
	name: "Filip1",
	lastName: "Bakos",
	nickName: "filip",
	email: "f@f.sk",
	birth: "1554729823",
	pohlavie: "muz",
	narodnost: "Slovenska",
	password: "123456",
})
.then((player) => {
	console.log(player)
})
*/

const getAll = () => {
	return soap.createClientAsync(url)
	.then((client) => {
  		return client.getAllAsync();
	})
}

const getById = (id) => {
	return soap.createClientAsync(url)
	.then((client) => {
  		return client.getByIdAsync({id: id});
	})
}

const update = (id, player) => {
	let args = {
		team_id: "014",
		team_password: "fkAq7Z",
		entity_id: id,
		player: player	
	};
	return soap.createClientAsync(url)
	.then((client) => {
  		return client.updateAsync(args);
	})
}


const createAssingment = (playerId, tournamentId) => {
	let args = {
		team_id: "014",
		team_password: "fkAq7Z",
		zoznamHracov: {
			name: '-',
			playerId: playerId,
			tournamentId: tournamentId
		}	
	};
	return soap.createClientAsync(urlAssingToTournament)
	.then((client) => {
  		return client.insertAsync(args);
	})
}

const updateAssingment = (entityId) => {
	let args = {
		team_id: "014",
		team_password: "fkAq7Z",
		entity_id: entityId,
		zoznamHracov: {
			confirmed: true
		}
	};
	return soap.createClientAsync(urlAssingToTournament)
	.then((client) => {
  		return client.updateAsync(args);
	})
}

const getAssingments = () => {
	return soap.createClientAsync(urlAssingToTournament)
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
	getAssingments,
	updateAssingment
}



