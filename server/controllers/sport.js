const soap = require('soap');
const fs = require('fs');
var url = 'http://labss2.fiit.stuba.sk/pis/ws/Students/Team014sport?WSDL';

const getAll = () => {
	return soap.createClientAsync(url)
	.then((client) => {
		console.log("Tu sa este dostane - getAll - sport")
  		return client.getAllAsync();
	},(error) => console.log("Error:",error))
}

module.exports = {
	getAll
}



