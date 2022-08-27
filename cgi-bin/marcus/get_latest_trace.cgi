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

# return a dummy value on error
DUMMYSTRING='{"xvals":[],"yvals":[],"xerrs":[],"yerrs":[]}'

# print out array of wavelengths,
RETX=$(psql -U postgres -d rundb -A -t -c "SELECT values::json->'xvals' FROM webpage WHERE name='"${TRACE}"' ORDER BY timestamp DESC LIMIT 1;")
# we definitely need an x-array
if [ $? -ne 0 ] || [ -z "${RETX}" ]; then
	#echo "no x array"
	echo ${DUMMYSTRING}
	exit 1;
fi
RETY=$(psql -U postgres -d rundb -A -t -c "SELECT values::json->'yvals' FROM webpage WHERE name='"${TRACE}"' ORDER BY timestamp DESC LIMIT 1;")
# we definitely need a y array
if [ $? -ne 0 ] || [ -z "${RETY}" ]; then
	#echo "no y array"
	echo ${DUMMYSTRING}
	exit 1;
fi

# check validity of the x and y arrays
#PATTERN='\{"xvals": ?\[[0-9\., ]+\], ?"yvals": ?\[[0-9\., ]\][^}]*?}'
#PATTERN='\{"xvals": ?\[[0-9\., ]+\], ?"yerrs": ?\[[0-9\., ]+\], ?"yvals": ?\[[0-9\., ]+\][^}]*?}'
PATTERN='\[[0-9\., ]+\]'
[[ ${RETX} =~ ${PATTERN} ]]
if [ $? -ne 0 ]; then
	#echo "failed to match x array pattern"
	#echo "RET: '${RET}'"
	#echo "PATTERN: '${PATTERN}'"
	echo ${DUMMYSTRING}
	exit 1;
fi
[[ ${RETY} =~ ${PATTERN} ]]
if [ $? -ne 0 ]; then
	#echo "failed to match y array pattern"
	echo ${DUMMYSTRING}
	exit 1;
fi

RET='{"xvals":'"${RETX}, "'"yvals":'"${RETY}"

# we may optionally have x and y error arrays
RETEX=$(psql -U postgres -d rundb -A -t -c "SELECT values::json->'xerrs' FROM webpage WHERE name='"${TRACE}"' ORDER BY timestamp DESC LIMIT 1;")
RETEXOK=$?
RETEY=$(psql -U postgres -d rundb -A -t -c "SELECT values::json->'yerrs' FROM webpage WHERE name='"${TRACE}"' ORDER BY timestamp DESC LIMIT 1;")
RETEYOK=$?
#RET=$(psql -U postgres -d rundb -A -t -c "SELECT values FROM webpage WHERE name='"${TRACE}"' ORDER BY timestamp DESC LIMIT 1;")

if [ ${RETEXOK} -eq 0 ] && [ ! -z "${RETEX}" ]; then
	# add x error array
	#echo "adding x err array"
	RET="${RET},"'"xerr":'"${RETEX}"
fi
if [ ${RETEYOK} -eq 0 ] && [ ! -z "${RETEY}" ]; then
	# add y error array
	#echo "adding y err array"
	RET="${RET},"'"yerr":'"${RETEY}"
fi

# add closing curly brace
RET="${RET}}"
echo "${RET}"
