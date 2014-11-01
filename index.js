var express = require('express'),
	Exec = require('./models').Exec,
	mongoose = require('mongoose'),
	bodyParser = require('body-parser'),
	elasticsearch = require('elasticsearch');


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





// get all data
// curl http://localhost:4000/api/execs
app.get('/api/execs', function (req, res) {
	Exec.find({}, function (err, execs) {
		if (err) {
			res.status(503).send('Unable to fetch records' + '\n');
		}
		else {
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
			res.json(execs);
		}
	});
});

// curl -XPOST http://localhost:4000/api/execs/search/ -d '{"search":""}' -H "Content-Type: application/json"
app.post('/api/execs/search/', function (req, res) {
	var searchString = req.body.search || '';
	// making elasticsearch query
	client.search({
		index: "execs",
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





app.get('/api/blog/:slug', function (req, res) {
	var slug = req.params.slug;
	res.send('Viewing blog by slug: ' + slug + '\n');
});

app.post('/api/search', function (req, res) {
	var q = req.params.q;
	res.send('You are searching: ' + q + '\n');
});

app.listen(4000, function () {
	console.log('Server is ready!');
});
