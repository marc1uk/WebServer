#!/bin/bash

# must have this or it complains 'malformed header'
echo -e "Content-type:text/html\n"

# dummy values in case queries fail
DUMMYVALUE='{"runnum":-1,"start":"1970-01-01T00:00:00.000000","stop":"1970-01-01T00:00:00.000000","runconfig":-1,"notes":"\nFailed to fetch run number from database.","git_tag":"", "purewater_filename":"unused", "calib_curve_ver":-1, "output_file":"unknown" }'

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
CONFIGS=$(psql -U postgres -d rundb -A -t -c "SELECT row_to_json(row) from (SELECT * FROM run WHERE runnum=${RUN}) row")
if [ $? -ne 0 ] || [ -z "${CONFIGS}" ]; then
	echo $DUMMYVALUE
	exit 1;
fi

# run batch regex match to ensure the returned response matches our expectation
PATTERN='\{"runnum":[0-9]+,"start":"[0-9]{4}\-[0-9]{2}\-[0-9]{2}[T ][0-9]{2}:[0-9]{2}:[0-9]{2}\.?[0-9]*","stop":("[0-9]{4}\-[0-9]{2}\-[0-9]{2}[T ][0-9]{2}:[0-9]{2}:[0-9]{2}\.?[0-9]*")*[null]*,"runconfig":[0-9]+,"notes":"[^"]+","git_tag":"[^"]+"\}'
[[ ${CONFIGS} =~ ${PATTERN} ]]
if [ $? -ne 0 ]; then
	#echo "return '${CONFIGS}' did not match pattern '${PATTERN}'"
	echo $DUMMYVALUE
	exit 1
fi

#echo "$CONFIGS"
# configs is a json object with runnum, start, stop, runconfig, notes, and git_tag properties.
# let's add some more

# get pure water reference spectrum file
#PUREREFFILE=$(psql -U postgres -d rundb -A -t -c "SELECT values::json->'filename' AS filename FROM data WHERE name='purewater_filename' AND run = ${RUN}")
#if [ $? -ne 0 ] || [ -z "${PUREREFFILE}" ] || [ "$PUREREFFILE" == '""' ]; then
#	PUREREFFILE="\"error\""
#fi

#CALIBCURVEVER=$(psql -U postgres -d rundb -A -t -c "SELECT values AS version FROM data WHERE name='calibration_version' AND run = ${RUN}")
#if [ $? -ne 0 ] || [ -z "${CALIBCURVEVER}" ]; then
#	CALIBCURVEVER="-1"
#fi

OUTFILE=$(psql -U postgres -d rundb -A -t -c "SELECT values::json->'filename' AS filename FROM webpage WHERE name='output_filename'")
if [ $? -ne 0 ] || [ -z "${OUTFILE}" ] || [ "$OUTFILE" == '""' ]; then
	OUTFILE="\"error\""
fi

# convert to JSON for passing to php
#JSONSTR='{ "purewater_filename": '${PUREREFFILE}', "calib_curve_ver":'${CALIBCURVEVER}', "output_file": '${OUTFILE}' }'
JSONSTR='{ "output_file": '${OUTFILE}' }'

#echo ${JSONSTR}

# combine our two json objects
CONFIGS="${CONFIGS:1:-1}"
JSONSTR="${JSONSTR:1:-1}"
RETURNSTRING="{${CONFIGS}, ${JSONSTR}}"

echo -n "${RETURNSTRING}"
