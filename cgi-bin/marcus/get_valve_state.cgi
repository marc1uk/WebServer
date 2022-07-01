#!/bin/bash

# must have this or it complains 'malformed header'
echo -e "Content-type:text/html\n"

# for a simple GET request, the parameters are stored in QUERY_STRING
#echo "QUERY_STRING is $QUERY_STRING"
# for a POST request they're stored in POST_STRING

PATTERN='a=(.*)'
[[ ${QUERY_STRING} =~ ${PATTERN} ]]
if [ $? -ne 0 ]; then
	echo "unrecognised valve type"
fi
VALVE=${BASH_REMATCH[1]}

# retrieve the set of commands for the current run
STATE=$(psql -U postgres -d rundb -t -c "SELECT values from webpage WHERE name='valvestate_${VALVE}'")

#echo "state is ${STATE}"
# e.g. {"state": "CLOSED"}

PATTERN=' \{"state": ("[^"]+")\}'

[[ $STATE =~ $PATTERN ]]
if [ $? -ne 0 ]; then
	echo "bash regex failed to match pumpstate"
	exit 1
elif [ "${BASH_REMATCH[1]}" != '"OPEN"' ] && [ "${BASH_REMATCH[1]}" != '"CLOSED"' ]; then
	echo "bash unrecognised valvestate ${BASH_REMATCH[1]}"
	exit 1
fi

if [ "${BASH_REMATCH[1]}" == '"OPEN"' ]; then
	echo -n 'class="btn btn-success" value="OPEN"'
else
	echo -n 'class="btn btn-danger active" value="CLOSED"'
fi


echo -n ${BASH_REMATCH[1]}

