#!/bin/bash

# must have this or it complains 'malformed header'
echo -e "Content-type:text/html\n"

DUMMYVAL="{\"output_file\":\"unknown\"}";

# first retrieve the run number for the current run from the webpage table
RUN=$(psql -U postgres -d rundb -t -c "SELECT values FROM webpage WHERE name='run_number'")
if [ $? -ne 0 ] || [ -z "${RUN}" ]; then
	RUN="-1"
else
	# bash threw a weird i think because of a preceding space that it only showed sometimes.
	# so explicitly convert it to number
	let RUN=$(echo ${RUN})
	#echo "RUN is ${RUN}"
fi

# get pure water reference spectrum file
PUREREFFILE=$(psql -U postgres -d rundb -A -t -c "SELECT values::json->'filename' AS filename FROM data WHERE name='purewater_filename' AND run = ${RUN}")
if [ $? -ne 0 ] || [ -z "${PUREREFFILE}" ] || [ "$PUREREFFILE" == '""' ]; then
	PUREREFFILE="\"error\""
fi

CALIBCURVEVER=$(psql -U postgres -d rundb -A -t -c "SELECT values AS version FROM data WHERE name='calibration_version' AND run = ${RUN}")
if [ $? -ne 0 ] || [ -z "${CALIBCURVEVER}" ]; then
	CALIBCURVEVER="-1"
fi

OUTFILE=$(psql -U postgres -d rundb -A -t -c "SELECT values::json->'filename' AS filename FROM webpage WHERE name='output_filename'")
if [ $? -ne 0 ] || [ -z "${OUTFILE}" ] || [ "$OUTFILE" == '""' ]; then
	OUTFILE="\"error\""
fi

# convert to JSON for passing to php
JSONSTR='{ "purewater_filename": '${PUREREFFILE}', "calib_curve_ver":'${CALIBCURVEVER}', "output_file": '${OUTFILE}' }'

echo ${JSONSTR}
