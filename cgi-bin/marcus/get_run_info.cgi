#!/bin/bash

# must have this or it complains 'malformed header'
echo -e "Content-type:text/html\n"

# dummy values in case queries fail
DUMMYVALUE='{"runnum":-1,"start":"1970-01-01T00:00:00.000000","stop":"1970-01-01T00:00:00.000000","runconfig":-1,"notes":"\nFailed to fetch run number from database.","git_tag":""}'

# first retrieve the run number for the current run from the webpage table
RUN=$(psql -U postgres -d rundb -t -c "SELECT values FROM webpage WHERE name='run_number'")
if [ $? -ne 0 ] || [ -z "${RUN}" ]; then
	echo ${DUMMYVALUE}
	exit 1;
fi

# bash threw a weird i think because of a preceding space that it only showed sometimes.
# so explicitly convert it to number
let RUN=$(echo ${RUN})
#echo "RUN is ${RUN}"
DUMMYVALUE='{"runnum":-1,"start":"1970-01-01T00:00:00.000000","stop":"1970-01-01T00:00:00.000000","runconfig":-1,"notes":"\nFailed to fetch details for run '"${RUN}"' from database.","git_tag":""}'

# easiest way to pass a set of variables back to php is to print a json string,
# and then decode it in php with 'json_decode'
CONFIGS=$(psql -U postgres -d rundb -A -t -c "SELECT row_to_json(row) from (SELECT * FROM run WHERE runnum='${RUN}') row")
if [ $? -ne 0 ] || [ -z "${CONFIGS}" ]; then
	echo $DUMMYVALUE
	exit 1;
fi

# run batch regex match to ensure the returned response matches our expectation
PATTERN='\{"runnum":[0-9]+,"start":"[0-9]{4}\-[0-9]{2}\-[0-9]{2}[T ][0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]+","stop":"[0-9]{4}\-[0-9]{2}\-[0-9]{2}[T ][0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]+","runconfig":[0-9]+,"notes":"[^"]+","git_tag":"[^"]+"}'
[[ ${CONFIGS} =~ ${PATTERN} ]]
if [ $? -ne 0 ]; then
	echo $DUMMYVALUE
	exit 1
fi
echo "$CONFIGS"
