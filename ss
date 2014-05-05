#!/bin/bash

# $0 script path
# $1 action
# $2 subaction

function pidExists() {
	if [ -e "pidfile" ];
		then
			kill -s 0 $(cat pidfile);
			if [ !$? ];
				then return 1;
				else return 0;
			fi
		else
			return 0;
	fi
}

case "$1" in
	start)
		echo "Starting Stacktrace Storage";
		echo "  \"./nodebb stop\" to stop the Stacktrace Storage server";
		echo "  \"./nodebb log\" to view server output";
		echo "" > ./logs/output.log;
		node loader -d "$@"
		;;

	stop)
		echo "Stopping Stacktrace Storage. Goodbye!";
		kill $(cat pidfile);
		;;

	reload|restart)
		echo "Restarting Stacktrace Storage.";
		kill -1 $(cat pidfile);
		;;

	status)
		pidExists;
		if [ 0 -eq $? ];
			then
				echo "NodeBB is not running";
				echo "  \"./nodebb start\" to launch the Stacktrace Storage server";
				return 1;
			else
				echo "NodeBB Running (pid $(cat pidfile))";
				echo "  \"./nodebb stop\" to stop the Stacktrace Storage server";
				echo "  \"./nodebb log\" to view server output";
				echo "  \"./nodebb restart\" to restart Stacktrace Storage";
				return 0;
		fi
		;;

	log)
		clear;
		tail -F ./logs/output.log;
		;;

	reset)
		node loader --reset --$2
		;;

	*)
		echo "Welcome to Stacktrace Storage"
		echo $"Usage: $0 {start|stop|reload|restart|log}"
		echo ''
		column -s '	' -t <<< '
		start	Start the Stacktrace Storage server
		stop	Stops the Stacktrace Storage server
		reload	Restarts Stacktrace Storage
		restart	Restarts Stacktrace Storage
		log	Opens the logging interface (useful for debugging)
		'
		exit 1
esac
