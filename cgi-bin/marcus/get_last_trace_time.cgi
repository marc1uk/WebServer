#!/bin/bash

# must have this or it complains 'malformed header'
echo -e "Content-type:text/html\n"

# for a simple GET request, the parameters are stored in QUERY_STRING
#echo "QUERY_STRING is $QUERY_STRING"
# for a POST request they're stored in POST_STRING

DUMMYVALUE="1970-01-01 00:00:00.000000"

#echo "QUERY_STRING is ${QUERY_STRING}"
QUERY_STRING=${QUERY_STRING:-"a=last_trace"}
PATTERN='a=(.*)'
[[ ${QUERY_STRING} =~ ${PATTERN} ]]
if [ $? -ne 0 ]; then
	echo "unrecognised trace type: '"${QUERY_STRING}"'"
fi
TRACE=${BASH_REMATCH[1]}
TRACE=`echo ${TRACE} | xargs echo -n`

# retrieve the set of commands for the current run
RETURN=$(psql -U postgres -d rundb -t -c "SELECT timestamp from webpage WHERE name='"${TRACE}"' ORDER BY timestamp DESC LIMIT 1")
# '2022-06-09 04:28:47.600042'

# check it matches
if [ $? -eq 0 ]; then
	PATTERN='[0-9]{4}\-[0-9]{2}\-[0-9]{2}[T ][0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]+'
	[[ ${RETURN} =~ ${PATTERN} ]]
	if [ $? -ne 0 ]; then
		#echo "return value did not match a timestamp format"
		#echo ${DUMMYVALUE}
		RETURN=${DUMMYVALUE}
	else
		#echo ${RETURN}
		:
	fi
else
	#echo "postgres query failure"
	#echo ${DUMMYVALUE}
	RETURN=${DUMMYVALUE}
fi

echo "\"${RETURN}\""
