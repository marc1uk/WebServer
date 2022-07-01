#!/bin/bash

# must have this or it complains 'malformed header'
echo -e "Content-type:text/html\n"

#echo "QUERY_STRING is ${QUERY_STRING}"
QUERY_STRING=${QUERY_STRING:-"a=last_trace"}
PATTERN='a=(.*)'
[[ ${QUERY_STRING} =~ ${PATTERN} ]]
if [ $? -ne 0 ]; then
	echo "unrecognised trace type: '"${QUERY_STRING}"'"
fi
TRACE=${BASH_REMATCH[1]}

# print out array of wavelengths,
#psql -U postgres -d rundb -A -t -c psql -A -t -c "SELECT values::json->'xvals' FROM webpage WHERE name='last_trace';"
#psql -U postgres -d rundb -A -t -c psql -A -t -c "SELECT values::json->'yvals' FROM webpage WHERE name='last_trace';"
#psql -U postgres -d rundb -A -t -c psql -A -t -c "SELECT values::json->'yerrs' FROM webpage WHERE name='last_trace';"
psql -U postgres -d rundb -A -t -c "SELECT values FROM webpage WHERE name='"${TRACE}"' ORDER BY timestamp DESC LIMIT 1;"
