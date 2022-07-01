#!/bin/bash

# must have this or it complains 'malformed header'
echo -e "Content-type:text/html\n"

# first retrieve the run number for the current run from the webpage table
RUN=$(psql -U postgres -d rundb -t -c "SELECT values FROM webpage WHERE name='run_number'")
# bash threw a weird i think because of a preceding space that it only showed sometimes.
# so explicitly convert it to number
let RUN=$(echo ${RUN})
#echo "RUN is ${RUN}"

# easiest way to pass a set of variables back to php is to print a json string,
# and then decode it in php with 'json_decode'
CONFIGS=$(psql -U postgres -d rundb -A -t -c "SELECT row_to_json(row) from (SELECT * FROM run WHERE runnum='${RUN}') row")
echo "$CONFIGS"
