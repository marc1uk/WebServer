#!/bin/bash

# must have this or it complains 'malformed header'
echo -e "Content-type:text/html\n"

# retrieve the set of commands for the current run
STATE=$(psql -U postgres -d rundb -t -c "SELECT values from webpage WHERE name='pwm_connected'")
if [ $? -ne 0 ] || [ -z "${STATE}" ]; then
	STATE=' {"state": "UNKNOWN" }'
fi

#echo "state is ${STATE}"
# e.g. {"state": "ONLINE"}

PATTERN=' \{"state": ("[^"]+")\}'

[[ $STATE =~ $PATTERN ]]
if [ $? -ne 0 ]; then
	#echo "bash regex failed to match powerstate"
	#exit 1
	STATE='"UNKNOWN"'
elif [ "${BASH_REMATCH[1]}" != '"ONLINE"' ] && [ "${BASH_REMATCH[1]}" != '"OFFLINE"' ]; then
	#echo "bash unrecognised powerstate ${BASH_REMATCH[1]}"
	#exit 1
	STATE='"UNKNOWN"'
else
	STATE="${BASH_REMATCH[1]}"
fi

if [ "${STATE}" == '"ONLINE"' ]; then
	echo -n 'checked >'
elif [ "${STATE}" == '"OFFLINE"' ]; then
	echo -n '>'
else
	echo '> <script>var checkbox = document.getElementById("pwmboard"); checkbox.indeterminate = true; </script>'
fi

