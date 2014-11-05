var express = require('express'),
	Exec = require('./models').Exec,
	mongoose = require('mongoose'),
	bodyParser = require('body-parser'),
	elasticsearch = require('elasticsearch'),
	dgram = require('dgram');


var client = new elasticsearch.Client({
	host: 'localhost:9200'
});

app = express();

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());

var connectMongo = function () {
	mongoose.connect('mongodb://localhost/exec', { keepAlive: 1 });
	console.log('Connecting to mongodb');
};
mongoose.connection.on('disconnected', connectMongo);
connectMongo();



// UDP packet catch
var server = dgram.createSocket('udp4');
server.on('message', function (msg, rinfo) {
	// Form the new data with correct names in object
	var json = JSON.parse(msg);
	var newExec = {
		token: json.token,
		key: json.key,
		executionTime: json.execution_time,// <-- all because of this guy
		timestamp: json.timestamp
	};
	// Save object in mongodb
	var exec = new Exec(newExec);
	exec.save(function (err, newExec) {
		if (err) {
			console.log('503: Unable to insert execution' + '\n');
		}
		else {
			console.log('201: POST /api/execs');
			//res.status(201).json(newExec);
		}
	});
});
server.on('listening', function () {
	console.log('Kodemon UDP server listening on ' + server.address().address + ':' + server.address().port);
});
server.bind(4000);





// get all data
// curl http://localhost:4000/api/execs
app.get('/api/execs', function (req, res) {
	Exec.find({}, function (err, execs) {
		if (err) {
			res.status(503).send('Unable to fetch records' + '\n');
		}
		else {
			console.log('GET /api/execs');
			res.json(execs);
		}
	});
});

// insert exec
// curl -XPOST http://localhost:4000/api/execs -d '{"key":"[key]","executionTime":"[executionTime]","token":"[token]"}' -H "Content-Type: application/json"
app.post('/api/execs', function (req, res) {
	var exec = new Exec(req.body);
	exec.save(function (err, newExec) {
		if (err) {
			res.status(503).send('Unable to insert execution' + '\n');
		}
		else {
			console.log('POST /api/execs');
			res.status(201).json(newExec);
		}
	});
});


// Get all tokens distinctively
// curl http://localhost:4000/api/execs/tokens
app.get('/api/execs/tokens', function (req, res) {
	Exec.find({}, function (err, execs) {
		if (err) {
			res.status(503).send('Unable to fetch records' + '\n');
		}
		else {
			var tokens = [];
			for (var i = 0; i < execs.length; i++) {
				if (tokens.indexOf(execs[i].token) === -1) {
					tokens.push(execs[i].token);
				}
			}
			console.log('GET /api/execs/tokens');
			res.jsonp(tokens);
		}
	});
});

// Get all execs with a given token
// curl http://localhost:4000/api/execs/token/[token]
app.get('/api/execs/token/:token', function (req, res) {
	var token = req.params.token;
	Exec.find({ token: token }, function (err, execs) {
		if (err) {
			res.status(500).send('Try again later' + '\n');
		}
		else if (execs.length === 0) {
			res.status(404).send('No executions found with token ' + token + '\n');
		}
		else {
			console.log('GET /api/execs/token/' + token);
			res.jsonp(execs);
		}
	});
});

// curl -XPOST http://localhost:4000/api/execs/search/ -d '{"search":"test-token"}' -H "Content-Type: application/json"
app.get('/api/execs/search/:token', function (req, res) {
	//console.log(req.body);
	//var searchString = req.body.search || '';
	var token = req.params.token;
	// making elasticsearch query
	client.search({
		'index': 'execs',
		'doc_type': 'exec',
		'body': {
			'query': {
				'match': {
					'token': token
				}
			}
		}
	}, function (err, response) {
		if (err) {
			res.status(500).send('Try again later' + '\n');
		}/*
		else if (response.hits.total === 0) {
			res.status(404).send('No executions found with token ' + token + '\n');
		}*/
		else {
			// build it with clean data
			var hits = response.hits.hits;
			var execs = [];
			for (var i = 0; i < hits.length; i++) {
				execs.push({
					id: hits[i]._id,
					token: hits[i]._source.token,
					key: hits[i]._source.key,
					executionTime: hits[i]._source.executionTime,
					timestamp: hits[i]._source.timestamp
				});
			}
			console.log('search was made and found ' + execs.length + ' executions with token: "' + token + '"');
			res.jsonp(execs);
		}
	});
	
});

app.get('/api/execs/search/:token/range/:from/:to', function (req, res) {
	var token = req.params.token;
	var from = req.params.from;
	var to = req.params.to;
	// making elasticsearch query
	client.search({
		'index': 'execs',
		'doc_type': 'exec',
		'body': {
			'query': {
				'match': {
					'token': token
				},
				'range': {
					'timestamp': {
						'from': from,//'1970-01-17T09:01:01.730Z'
						'to': to//'1970-01-17T09:01:04.730Z'
					}
				}
			}
		}
	}, function (err, response) {
		if (err) {
			res.status(500).send('Try again later' + '\n');
		}/*
		else if (response.hits.total === 0) {
			res.status(404).send('No executions found with token ' + token + '\n');
		}*/
		else {
			// build it with clean data
			var hits = response.hits.hits;
			var execs = [];
			for (var i = 0; i < hits.length; i++) {
				execs.push({
					id: hits[i]._id,
					token: hits[i]._source.token,
					key: hits[i]._source.key,
					executionTime: hits[i]._source.executionTime,
					timestamp: hits[i]._source.timestamp
				});
			}
			console.log('search was made and found ' + execs.length + ' executions with token: "' + token + '"');
			res.jsonp(execs);
		}
	});
	
});


app.get('/api/execs/search/activity/:from/:to', function (req, res) {
	var from = req.params.from;
	var to = req.params.to;
	// making elasticsearch query
	client.search({
		'index': 'execs',
		'doc_type': 'exec',
		'body': {
			'query': {
				'range': {
					'timestamp': {
						'from': from,//'1970-01-17T09:01:01.730Z'
						'to': to//'1970-01-17T09:01:04.730Z'
					}
				}
			}
		}
	}, function (err, response) {
		if (err) {
			res.status(500).send('Try again later' + '\n');
		}/*
		else if (response.hits.total === 0) {
			res.status(404).send('No executions found with token ' + token + '\n');
		}*/
		else {
			// build it with clean data
			var hits = response.hits.hits;
			var execs = [];
			for (var i = 0; i < hits.length; i++) {
				execs.push({
					id: hits[i]._id,
					token: hits[i]._source.token,
					key: hits[i]._source.key,
					executionTime: hits[i]._source.executionTime,
					timestamp: hits[i]._source.timestamp
				});
			}
			res.jsonp(execs);
		}
		console.log('activity search was made and found ' + response.hits.hits.length + ' executions with range: { from: "' + from.toString() + '", to: "' + to.toString() + '" }');
	});
	
});




app.listen(4000, function () {
	console.log('Server is ready!');
});
