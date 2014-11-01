var mongoose = require('mongoose'),
	elasticsearch = require('elasticsearch');

var client = new elasticsearch.Client({
	host: 'localhost:9200'
});

/*
key:
	Combined from the name of the python file,
	where the function resides, and the function name.
execution_time:
	The time it took to execute the function.
timestamp:
	Epoch timestamp when the function was executed
token:
	Can be used to identify whom is sending the message.
	The token can represent a project, system or a customer.
	By default this value is set to "test-token".
*/
var execSchema = new mongoose.Schema({
	key: { type: String, required: true },
	executionTime: { type: Number, required: true },
	timestamp: { type: Date, default: Date.now },
	token: { type: String, default: 'test-token' }
});

// example of pre save function in mongoose
/*execSchema.pre('save', function (next) {
	// Do stuff before saving data!
	next();
});*/

// http://localhost:9200/execs/exec/
execSchema.post('save', function (rookieExec) {
	client.index({
		index: 'execs',
		type: 'exec',
		id: String(rookieExec._id),
		body: rookieExec
	}, function (error, response) {
		if (error) {
			console.log('ERROR in mongoose post save function to save elasticsearch.' + '\n');
		} else {
			console.log('Great success! - id: ' + response._id + '\n');
		}
	});
});

var Exec = mongoose.model('Exec', execSchema);
module.exports = { 'Exec': Exec };
