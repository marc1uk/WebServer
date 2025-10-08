#!/bin/bash

# must have this or it complains 'malformed header'
echo -e "Content-type:text/html\n"

# for a simple GET request, the parameters are stored in QUERY_STRING
#echo "QUERY_STRING is $QUERY_STRING"
# for a POST request they're stored in POST_STRING

# start with a dummy return
DUMMYVALUE="UNKNOWN"

PATTERN='a=(.*)'
[[ ${QUERY_STRING} =~ ${PATTERN} ]]
if [ $? -ne 0 ]; then
	#echo "unrecognised valve type"
	echo ${DUMMYVALUE}
	exit 1;
fi
VALVE=${BASH_REMATCH[1]}
if [ -z "${VALVE}" ]; then
	echo ${DUMMYVALUE}
	exit 1
fi

# retrieve the set of commands for the current run
#STATE=$(psql -U postgres -d rundb -t -c "SELECT values from webpage WHERE name='valvestate_${VALVE}'")
STATE=$(psql -U postgres -d rundb -t -c "SELECT values->'${VALVE}_valve' from webpage WHERE name='gpio_status' ORDER BY timestamp DESC LIMIT 1")
if [ $? -ne 0 ] || [ -z "${STATE}" ]; then
	echo ${DUMMYVALUE}
	exit 1
fi

# for new gpio_status_new.sh script
###################################
#echo "state is ${STATE}"
# e.g. 0 or 1
if [ ${STATE} -eq 0 ]; then
	echo -n '"OFF"'
else
	echo -n '"ON"'
fi

exit

# below old version from Valve tool
###################################
#echo "state is ${STATE}"
# e.g. {"state": "CLOSED"}

PATTERN=' \{"state": ("[^"]+")\}'

[[ $STATE =~ $PATTERN ]]
if [ $? -ne 0 ]; then
	#echo "bash regex failed to match pumpstate"
	echo ${DUMMYVALUE}
	exit 1
elif [ "${BASH_REMATCH[1]}" != '"OPEN"' ] && [ "${BASH_REMATCH[1]}" != '"CLOSED"' ]; then
	#echo "bash unrecognised valvestate ${BASH_REMATCH[1]}"
	echo ${DUMMYVALUE}
	exit 1
fi

echo -n ${BASH_REMATCH[1]}
