const soap = require('soap');
const fs = require('fs');
var url = 'http://labss2.fiit.stuba.sk/pis/ws/NotificationServices/Email?WSDL';
var urlMatches = 'http://labss2.fiit.stuba.sk/pis/ws/Students/Team014zapas?WSDL';


const notifyPlayer = (playerEmail, subject, message) => {
	let args = {
		team_id: "014",
		password: "fkAq7Z",
		email: playerEmail,
		subject:  subject,
		message: message
	};
	console.log(args);
	return soap.createClientAsync(url)
	.then((client) => {
		
  		return client.notifyAsync(args);
	})
	.then(result => {
		console.log("Poslany mail na : ", playerEmail)
	})
	.catch(error => console.log("Error"));
}







module.exports = {
	notifyPlayer
}



