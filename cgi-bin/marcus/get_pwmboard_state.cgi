#!/bin/bash

# must have this or it complains 'malformed header'
echo -e "Content-type:text/html\n"

# retrieve the set of commands for the current run
STATE=$(psql -U postgres -d rundb -t -c "SELECT values from webpage WHERE name='pwm_connected'")

#echo "state is ${STATE}"
# e.g. {"state": "ONLINE"}

PATTERN=' \{"state": ("[^"]+")\}'

[[ $STATE =~ $PATTERN ]]
if [ $? -ne 0 ]; then
	echo "bash regex failed to match pumpstate"
	exit 1
elif [ "${BASH_REMATCH[1]}" != '"ONLINE"' ] && [ "${BASH_REMATCH[1]}" != '"OFFLINE"' ]; then
	echo "bash unrecognised pwm board state ${BASH_REMATCH[1]}"
	exit 1
fi

if [ "${BASH_REMATCH[1]}" == '"ONLINE"' ]; then
	echo -n 'checked'
fi

