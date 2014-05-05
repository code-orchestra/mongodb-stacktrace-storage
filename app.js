var http = require('http');
var querystring = require('querystring');

var mongodb = require('mongodb');

http.createServer(function (request, response) {
    if(request.method == 'POST') {
        processPost(request, response, function () {
            response.writeHead(200, "OK", {'Content-Type': 'text/plain'});

    		var Db = mongodb.Db, Server = mongodb.Server;
        	(new Db('integration_tests', new Server("127.0.0.1", 27017, {auto_reconnect: false, poolSize: 4}), {w:0, native_parser: false})).open (function (err, db) {
				if (err) {
					console.log (err);
					response.write(JSON.stringify({ error: err }));
					response.end();
				} else {

					db.collection("some", function (err, collection) {
						if (err) {
							console.log (err);
							response.write(JSON.stringify({ error: err }));
							response.end();
						} else {

							switch (request.url) {
								case "/save":
									var data;
									try {
										var keys = Object.keys(request.post);
										if ((keys.length == 1) && (request.post[keys[0]] == "")) {
											data = JSON.parse (keys[0]);
										}
									} catch (notJson) {
										data = request.post;
									}
									// http://mongodb.github.io/node-mongodb-native/markdown-docs/insert.html
									collection.save (data, {w:1}, function (err, record) {
										if (err) {
											console.log (err);
											response.write(JSON.stringify({ error: err }));
										} else {
											response.write(JSON.stringify(record));
										}

										response.end();
										db.close();
									});
								break;

								case "/find":
									// http://mongodb.github.io/node-mongodb-native/markdown-docs/queries.html
									var query = [];
									for (var key in request.post) {
										var condition = {};
										if (request.post[key] && (request.post[key] != "")) condition[key] = request.post[key];
										query.push (condition);
									}

									//console.log("Looking for: " + JSON.stringify({ $or: query }));
									collection.find ({ $or: query }).toArray(function (err, results){
										if (err) {
											console.log (err);
											response.write(JSON.stringify({ error: err }));
										} else {
											response.write(JSON.stringify(results));
										}

										response.end();
										db.close();
									});
								break;

								default:
									db.close();

									response.write('Unknown POST request...');
									response.end();
								break;
							}

						}
					});
				}
			});
        });
    } else {
        response.writeHead(200, "OK", {'Content-Type': 'text/html'});
		response.write(
		'<form autocomplete="off" method="post" action="/save">' +
			'ID: <input type="text" name="id"></input><br />' +
			'Time: <input type="text" name="time"></input><br />' +
			'Message: <input type="text" name="message"></input><br />' +
			'Stacktrace: <textarea name="stacktrace"></textarea><br />' +
			'<input type="submit" value="save"></input>' +
		'</form>' +
		'<br /><br />' +
		'<form autocomplete="off" method="post" action="/find">' +
			'ID: <input type="text" name="id"></input><br />' +
			'Time: <input type="text" name="time"></input><br />' +
			'Message: <input type="text" name="message"></input><br />' +
			'Stacktrace: <textarea name="stacktrace"></textarea><br />' +
			'<input type="submit" value="find"></input>' +
		'</form>'
		);
        response.end();
    }

}).listen(8888);

// http://stackoverflow.com/a/12022746/2207790
function processPost(request, response, callback) {
    var queryData = "";
    if(typeof callback !== 'function') return null;

    if(request.method == 'POST') {
        request.on('data', function(data) {
            queryData += data;
            if(queryData.length > 1e6) {
                queryData = "";
                response.writeHead(413, {'Content-Type': 'text/plain'}).end();
                request.connection.destroy();
            }
        });

        request.on('end', function() {
            request.post = querystring.parse(queryData);
            callback();
        });

    } else {
        response.writeHead(405, {'Content-Type': 'text/plain'});
        response.end();
    }
}