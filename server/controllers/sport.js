const soap = require('soap');
const fs = require('fs');
var url = 'http://labss2.fiit.stuba.sk/pis/ws/Students/Team014sport?WSDL';

const getAll = () => {
	return soap.createClientAsync(url)
	.then((client) => {
  		return client.getAllAsync();
	})
}

module.exports = {
	getAll
}



