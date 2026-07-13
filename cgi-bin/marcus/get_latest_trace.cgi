#!/bin/bash

# must have this or it complains 'malformed header'
echo -e "Content-type:text/html\n"

#LOGFILE=/tmp/getlatesttrace.log
LOGFILE=/dev/null
date > ${LOGFILE}

# return a dummy value on error
DUMMYSTRING='{"xvals":[],"yvals":[],"xerrs":[],"yerrs":[]}'

#echo "QUERY_STRING is ${QUERY_STRING}"
QUERY_STRING=${QUERY_STRING:-"a=last_trace&b=0"}
PATTERN='a=([^&]+)&b=(.*)'
[[ ${QUERY_STRING} =~ ${PATTERN} ]]
if [ $? -ne 0 ]; then
	#echo "unrecognised trace type: '"${QUERY_STRING}"'"
	echo "${DUMMYSTRING}"
	exit 1;
fi
TRACE=${BASH_REMATCH[1]}
DEBUG=${BASH_REMATCH[2]}
echo "measurement '${TRACE}'" >> ${LOGFILE}
echo "DEBUG is '${DEBUG}'"  >> ${LOGFILE}

DEBUGCRIT=""
if [ "${DEBUG}" == "true" ]; then
	# latest trace is stored in webpage table which doesn't have a run number field so we put it in the data field
	#DEBUGCRIT="encode(data,'escape')::json->'run'>10000 AND"
	# for the moment not all entries have this format, and casting to JSON throws an error if its not valid
	# (this not only skips such rows but kills the whole query)
	# so we have this crazy over-complicated thing
	DEBUGCRIT="data IS NOT NULL AND SUBSTRING(encode(data,'escape')::text,1,1)='{' AND (encode(data,'escape')::json->>'run')::int > 10000 AND"
fi
echo "DEBUGCRIT is '${DEBUGCRIT}'"  >> ${LOGFILE}

QUERY="SELECT values::json->'xvals' FROM webpage WHERE ${DEBUGCRIT} name='${TRACE}' ORDER BY id DESC LIMIT 1;"; # order by timestamp
echo "query will be '${QUERY}'" >> ${LOGFILE}

# print out array of wavelengths,
RETX=$(psql -U postgres -d rundb -A -t -c "${QUERY}")
# we definitely need an x-array
if [ $? -ne 0 ] || [ -z "${RETX}" ]; then
	#echo "no x array"
	echo ${DUMMYSTRING}
	exit 1;
fi
#echo "got X"
QUERY="SELECT values::json->'yvals' FROM webpage WHERE ${DEBUGCRIT} name='${TRACE}' ORDER BY id DESC LIMIT 1;" # order by timestamp
echo "query will be '${QUERY}'" >> ${LOGFILE}
RETY=$(psql -U postgres -d rundb -A -t -c "${QUERY}" )
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
	echo "failed to match x array pattern" >> ${LOGFILE}
	echo "RET: '${RETX}'" >> ${LOGFILE}
	echo "PATTERN: '${PATTERN}'" >> ${LOGFILE}
	echo ${DUMMYSTRING}
	exit 1;
fi
#echo "x matches pattern "
[[ ${RETY} =~ ${PATTERN} ]]
if [ $? -ne 0 ]; then
	echo "failed to match y array pattern" >> ${LOGFILE}
	echo "RET: '${RETY}'" >> ${LOGFILE}
	echo "PATTERN: '${PATTERN}'" >> ${LOGFILE}
	echo ${DUMMYSTRING}
	exit 1;
fi
#echo "y matches pattern"

RET='{"xvals":'"${RETX}, "'"yvals":'"${RETY}"

# we may optionally have x and y error arrays
RETEX=$(psql -U postgres -d rundb -A -t -c "SELECT values::json->'xerrs' FROM webpage WHERE ${DEBUGCRIT} name='"${TRACE}"' ORDER BY id DESC LIMIT 1;")
RETEXOK=$?
RETEY=$(psql -U postgres -d rundb -A -t -c "SELECT values::json->'yerrs' FROM webpage WHERE ${DEBUGCRIT} name='"${TRACE}"' ORDER BY id DESC LIMIT 1;")
RETEYOK=$?
#RET=$(psql -U postgres -d rundb -A -t -c "SELECT values FROM webpage WHERE name='"${TRACE}"' ORDER BY timestamp DESC LIMIT 1;")

if [ ${RETEXOK} -eq 0 ] && [ ! -z "${RETEX}" ]; then
	# add x error array
	echo "adding x err array" >> ${LOGFILE}
	RET="${RET},"'"xerr":'"${RETEX}"
fi
if [ ${RETEYOK} -eq 0 ] && [ ! -z "${RETEY}" ]; then
	# add y error array
	echo "adding y err array" >> ${LOGFILE}
	RET="${RET},"'"yerr":'"${RETEY}"
fi

# add closing curly brace
RET="${RET}}"
echo "${RET}"
