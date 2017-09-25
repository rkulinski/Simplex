//Created by Robert Kuliński
//Server side 
var http = require('http'),
	url = require('url'),
	request = require('request'),
	queryString = require('querystring'),
	sql = require('mssql');


var config = {  
    user: 'admin',
    password: '.admin',
    server: 'localhost', 
	database: 'solutions',
	port: 55395
}; 

sql.connect(config).then(function() {
	console.log("Connected");
}).catch(function(err) {
	if (err) {
	  console.log('SQL Connection Error: ' + err);
	}
});


function SaveObjToSql(obj) {
		var request = new sql.Request();
		var query_str = 'INSERT INTO ZBIOR_ROZWIAZAN (Solutions) VALUES (\''+obj+'\')';
		console.log(query_str);
		request.query(query_str).then(function(recordset) {
		  console.log('Recordset: ' + recordset);
		  console.log('Affected: ' + request.rowsAffected);
		}).catch(function(err) {
		  console.log('Request error: ' + err);
		});
}

function SelectMin(p1, p2) {
	var min = 0;
	(p1 < p2) ? min = p1: min = p2;
	return min;
}

function FindCrossPoint(equasion1_coefs, equasion2_coefs) {
	var  p1 = (equasion1_coefs.a0*equasion2_coefs.a2/equasion2_coefs.a0 - equasion1_coefs.a2)/(equasion1_coefs.a0*equasion2_coefs.a1/equasion2_coefs.a0 - equasion1_coefs.a1),
	p2 =(equasion1_coefs.a2 -equasion1_coefs.a1*p1)/equasion1_coefs.a0;
	
	return [p1, p2];
}

function CalculatePoints(gv) {
	response_array = [];
	return new Promise(function (resolve, reject) {
		setTimeout(() => {

			for (var i = 1, len = gv.length; i < len; i++) { //we skip target function
				response_array.push({
					"x1is0": [(gv[i].a2 / gv[i].a1), 0],
					"x2is0": [0, (gv[i].a2 / gv[i].a0)]
				});
			}

			response_array.push({
					"p0": [0, SelectMin((gv[1].a2 / gv[1].a0), (gv[2].a2 / gv[2].a0))] ,
					"p1": FindCrossPoint(gv[1], gv[2]),
					"p2": [SelectMin((gv[1].a2 / gv[1].a1), (gv[2].a2 / gv[2].a1)), 0] 
			});
			console.log(response_array[response_array.length -1]);
			SaveObjToSql(JSON.stringify(response_array[response_array.length -1])); //Save to SQL server
			resolve(JSON.stringify(response_array));
		}, 1500);
	});
}

var express = require('express'),
	bodyParser = require('body-parser'),
	app = express();

app.use(bodyParser.json());
app.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
});

app.post('/', function (request, response, next) {
	var obj_response = request.body;
	CalculatePoints(obj_response).then(res => response.send(res));
});

app.listen(8080);