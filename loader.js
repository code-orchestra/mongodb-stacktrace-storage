"use strict";

var	nconf = require('nconf'),
	fs = require('fs'),
	pidFilePath = __dirname + '/pidfile',
	start = function() {
		var	fork = require('child_process').fork,
			ss_start = function() {
				ss = fork('./app', process.argv.slice(2), {
						env: {
							'NODE_ENV': process.env.NODE_ENV
						}
					});

				ss.on('message', function(cmd) {
					if (cmd === 'ss:restart') {
						nbb_restart();
					}
				});
			},
			ss_stop = function() {
				ss.kill();
				if (fs.existsSync(pidFilePath)) {
					var	pid = parseInt(fs.readFileSync(pidFilePath, { encoding: 'utf-8' }), 10);
					if (process.pid === pid) {
						fs.unlinkSync(pidFilePath);
					}
				}
			},
			ss_restart = function() {
				ss.on('exit', function() {
					ss_start();
				});
				ss.kill();
			};

		process.on('SIGINT', ss_stop);
		process.on('SIGTERM', ss_stop);
		process.on('SIGHUP', ss_restart);

		ss_start();
	},
	ss;

nconf.argv();

// Start the daemon!
if (nconf.get('d')) {
	// Check for a still-active Stacktrace Storage process
	if (fs.existsSync(pidFilePath)) {
		try {
			var	pid = fs.readFileSync(pidFilePath, { encoding: 'utf-8' });
			process.kill(pid, 0);
			console.log('\n  Error: Another Stacktrace Storage is already running!');
			process.exit();
		} catch (e) {
			fs.unlinkSync(pidFilePath);
		}
	}

	// Initialise logging streams
	var	outputStream = fs.createWriteStream(__dirname + '/logs/output.log');
	outputStream.on('open', function(fd) {
		// Daemonize
		require('daemon')({
			stdout: fd
		});

		// Write its pid to a pidfile
		fs.writeFile(__dirname + '/pidfile', process.pid);

		start();
	});
} else {
	start();
}