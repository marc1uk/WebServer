#!/bin/bash

# must have this or it complains 'malformed header'
echo -e "Content-type:text/html\n"

# retrieve the set of commands for the current run
STATE=$(psql -U postgres -d rundb -t -c "SELECT values from webpage WHERE name='powerstate'")
if [ $? -ne 0 ] || [ -z "${STATE}" ]; then
	STATE=' {"state": "UNKNOWN" }'
fi

#echo "state is ${STATE}"
# e.g. {"state": "ON"}

PATTERN=' \{"state": ("[^"]+")\}'

[[ $STATE =~ $PATTERN ]]
if [ $? -ne 0 ]; then
	#echo "bash regex failed to match powerstate"
	#exit 1
	STATE='"UNKNOWN"'
elif [ "${BASH_REMATCH[1]}" != '"ON"' ] && [ "${BASH_REMATCH[1]}" != '"OFF"' ]; then
	#echo "bash unrecognised powerstate ${BASH_REMATCH[1]}"
	#exit 1
	STATE='"UNKNOWN"'
else
	STATE="${BASH_REMATCH[1]}"
fi

if [ "${STATE}" == '"ON"' ]; then
	echo -n 'class="btn btn-success" value="ON"'
elif [ "${STATE}" == '"OFF"' ]; then
	echo -n 'class="btn btn-danger active" value="OFF"'
else
	echo -n 'class="btn btn-warning active" value="UNKNOWN"'
fi
