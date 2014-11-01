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
	console.log('Kodemon server listening on ' + server.address().address + ':' + server.address().port);
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
			res.json(execs);
		}
	});
});

// curl -XPOST http://localhost:4000/api/execs/search/ -d '{"search":""}' -H "Content-Type: application/json"
app.post('/api/execs/search/', function (req, res) {
	var searchString = req.body.search || '';
	// making elasticsearch query
	client.search({
		index: 'execs',
		body: {
			query: {
				match: {
					_all: searchString
				}
			}
		}
	}, function (err, response) {
		if (err) {
			res.status(500).send('Try again later' + '\n');
		}
		else if (response.hits.total === 0) {
			res.status(404).send('No executions found with search string ' + searchString + '\n');
		}
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
			res.json(execs);
			console.log('search was made and found ' + execs.length + ' executions with search string: "' + searchString + '"');
		}
	});
	
});



app.listen(4000, function () {
	console.log('Server is ready!');
});
