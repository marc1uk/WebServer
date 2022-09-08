#!/bin/bash

# must have this or it complains 'malformed header'
echo -e "Content-type:text/html\n"

# return a dummy value on error
DUMMYSTRING='{"xvals":[],"yvals":[],"xerrs":[],"yerrs":[]}'

#echo "QUERY_STRING is ${QUERY_STRING}"
QUERY_STRING=${QUERY_STRING:-"a=last_trace"}
PATTERN='a=(.*)'
[[ ${QUERY_STRING} =~ ${PATTERN} ]]
if [ $? -ne 0 ]; then
	#echo "unrecognised trace type: '"${QUERY_STRING}"'"
	echo "${DUMMYSTRING}"
	exit 1;
fi
TRACE=${BASH_REMATCH[1]}
#echo "known measurement '${TRACE}'"

# print out array of wavelengths,
RETX=$(psql -U postgres -d rundb -A -t -c "SELECT values::json->'xvals' FROM webpage WHERE name='"${TRACE}"' ORDER BY timestamp DESC LIMIT 1;")
# we definitely need an x-array
if [ $? -ne 0 ] || [ -z "${RETX}" ]; then
	#echo "no x array"
	echo ${DUMMYSTRING}
	exit 1;
fi
#echo "got X"
RETY=$(psql -U postgres -d rundb -A -t -c "SELECT values::json->'yvals' FROM webpage WHERE name='"${TRACE}"' ORDER BY timestamp DESC LIMIT 1;")
# we definitely need a y array
if [ $? -ne 0 ] || [ -z "${RETY}" ]; then
	#echo "no y array"
	echo ${DUMMYSTRING}
	exit 1;
fi
#echo "got Y"

# check validity of the x and y arrays
#PATTERN='\{"xvals": ?\[[0-9, .]+\], ?"yvals": ?\[[0-9, .-]\][^}]*?}'
#PATTERN='\{"xvals": ?\[[0-9, .]+\], ?"yerrs": ?\[[0-9, .-]+\], ?"yvals": ?\[[0-9, .-]+\][^}]*?}'
PATTERN='\[[0-9, .-]+\]'
# XXX NOTE: bash RE has weird handling of characters in brackets: \ does not escape and is taken literally,
# so we have to use location to match things like . and -
# see https://pubs.opengroup.org/onlinepubs/9699919799/basedefs/V1_chap09.html point 7
# https://stackoverflow.com/questions/55377810/bash-regex-with-hyphen-and-dot
[[ ${RETX} =~ ${PATTERN} ]]
if [ $? -ne 0 ]; then
	#echo "failed to match x array pattern"
	#echo "RET: '${RETX}'"
	#echo "PATTERN: '${PATTERN}'"
	echo ${DUMMYSTRING}
	exit 1;
fi
#echo "x matches pattern "
[[ ${RETY} =~ ${PATTERN} ]]
if [ $? -ne 0 ]; then
	#echo "failed to match y array pattern"
	#echo "RET: '${RETY}'"
	#echo "PATTERN: '${PATTERN}'"
	echo ${DUMMYSTRING}
	exit 1;
fi
#echo "y matches pattern"

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
