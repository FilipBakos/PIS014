const soap = require('soap');
const fs = require('fs');
var url = 'http://labss2.fiit.stuba.sk/pis/ws/Students/Team014hodnotenie?WSDL';

const getAll = () => {
	return soap.createClientAsync(url)
	.then((client) => {
  		return client.getAllAsync();
	})
}

const create = (playerId, elo, sportId) => {
	let args = {
		team_id: "014",
		team_password: "fkAq7Z",
		hodnotenie: {
			name: '',
			playerId: playerId,
			elo: elo,
			sportId: sportId
		}	
	};
	return soap.createClientAsync(url)
	.then((client) => {
  		return client.insertAsync(args);
	})
}

const update = (entityId, elo) => {
	let args = {
		team_id: "014",
		team_password: "fkAq7Z",
		entity_id: entityId,
		hodnotenie: {
			elo: elo
		}	
	};
	return soap.createClientAsync(url)
	.then((client) => {
  		return client.updateAsync(args);
	})
}

module.exports = {
	getAll,
	create,
	update
}



