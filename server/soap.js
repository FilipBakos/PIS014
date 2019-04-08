  var soap = require('soap');
  const fs = require('fs');
  var url = 'http://labss2.fiit.stuba.sk/pis/ws/GeoServices/Cities?WSDL';
  var args = {name: 'Bratislava'}

  soap.createClientAsync(url).then((client) => {
  	// console.log(client)
    return client.getByNameAsync(args);
  })
  .then((result) => {
  	console.log(result[0].city);
  });