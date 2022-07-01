#!/bin/bash

# must have this or it complains 'malformed header'
echo -e "Content-type:text/html\n"

# for a simple GET request, the parameters are stored in QUERY_STRING
#echo "QUERY_STRING is $QUERY_STRING"
# for a POST request they're stored in POST_STRING

#echo "QUERY_STRING is ${QUERY_STRING}"
QUERY_STRING=${QUERY_STRING:-"a=last_trace"}
PATTERN='a=(.*)'
[[ ${QUERY_STRING} =~ ${PATTERN} ]]
if [ $? -ne 0 ]; then
	echo "unrecognised trace type: '"${QUERY_STRING}"'"
fi
TRACE=${BASH_REMATCH[1]}

# retrieve the set of commands for the current run
psql -U postgres -d rundb -t -c "SELECT timestamp from webpage WHERE name='"${TRACE}"' ORDER BY timestamp DESC LIMIT 1"

