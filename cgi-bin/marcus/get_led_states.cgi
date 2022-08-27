#!/bin/bash

# must have this or it complains 'malformed header'
echo -e "Content-type:text/html\n"

# retrieve the set of commands for the current run

# make a dummy value in case query fails.
DUMMYVALUE='{"LEDB": 2, "LEDG": 2, "LEDR": 2, "LEDW": 2, "LED385L": 2, "LED275J_A": 2, "LED275J_B": 2, "LEDRGBAnnode": 2}'

# FIXME change 'ledStatuses' to 'ledStates'
STATES=$(psql -U postgres -d rundb -t -c "SELECT values from webpage WHERE name='ledStatuses'")
#echo "state is ${STATES}"
if [ $? -ne 0 ] || [ -z "${STATES}" ]; then
	# query failed. return dummy value
	#echo "psql query failed: return $?, states ${STATES}"
	STATES=${DUMMYVALUE}
fi

# check that the format of the returned result is what we expect
#PATTERN=' ?\{"LEDB": ?[01], ?"LEDG": ?[01], ?"LEDR": ?[01], ?"LEDW": ?[01], ?"LED385L": ?[01], ?"LED275J_A": ?[01], ?"LED275J_B": ?[01], ?"LEDRGBAnnode": ?[01] ?\}'
PATTERN=' ?\{("LED[^"]+": ?[01][, ]+?)+\}'
[[ ${STATES} =~ ${PATTERN} ]]
if [ $? -ne 0 ]; then
	# regex didn't match. hmmm.
	#echo "psql response '${STATES}' didn't match expected pattern"
	STATES=${DUMMYVALUE}
fi

# drop the quotes - we don't need them
STATES=$(tr -d '"' <<< ${STATES})

# drop preceding and trailing curly braces
STATES=${STATES#' {'}
STATES=${STATES%'}'}

# parse into an array
readarray -t -d ',' LEDARR <<< "${STATES}"

# each entry can be split into LED name and state
PATTERN='LED([^:]+): ([01])'

# declare a map that we'll use to santize our results
declare -A MYMAP
# note that keys aren't included in the regex match
MYMAP["B"]=2
MYMAP["G"]=2
MYMAP["R"]=2
MYMAP["W"]=2
MYMAP["385L"]=2
MYMAP["275J_A"]=2
MYMAP["275J_B"]=2
MYMAP["RGBAnnode"]=2

# loop over LEDs and make indicators
let i=-1
while [ true ]; do
	let i=$i+1
	LINE=${LEDARR[$i]}
	
	if [ -z "${LINE}" ]; then
		#echo "command $i is empty"
		#continue;
		break;
	fi
	
	# split name and state
	[[ $LINE =~ $PATTERN ]]
	# match checks
	if [ $? -ne 0 ]; then
		#echo "bash regex failed to match led state '"${LINE}"'"
		continue
	elif [ "${BASH_REMATCH[2]}" != '0' ] && [ "${BASH_REMATCH[2]}" != '1' ]; then
		#echo "bash unrecognised LED state ${BASH_REMATCH[2]}"
		continue
	fi
	
	# check if this is a recognised LED
	if [ ! -z "${MYMAP[${BASH_REMATCH[1]}]}" ]; then
		# update the value
		#echo "setting MYMAP entry '${BASH_REMATCH[1]}' to '${BASH_REMATCH[2]}'"
		MYMAP[${BASH_REMATCH[1]}]="${BASH_REMATCH[2]}"
	#else
		#echo "unknown LED '${BASH_REMATCH[1]}'"
	fi # else unknown LED. skip it?
	
done

# loop again over all LEDs again - having done the above we now know
# that our array contains elements for all of and only our known LEDs
for LEDNAME in "${!MYMAP[@]}"; do

	LEDSTATE=${MYMAP[${LEDNAME}]}
	#echo "LEDNAME is ${LEDNAME}, LEDSTATE is ${LEDSTATE}"
	
	# make the indicator
	echo -n '<input class="form-check-input" type="checkbox" id="ledswitch_'${LEDNAME}'"'
	if [ ${LEDSTATE} -eq 1 ]; then
		echo 'checked>'
	elif [ ${LEDSTATE} -ne 0 ]; then
		# make the checkbox state indeterminate
		echo '> <script>var checkbox = document.getElementById("ledswitch_'${LEDNAME}'"); checkbox.indeterminate = true; </script>'
	else
		# default state is unchecked
		echo '>'
	fi
	echo '<label class="form-check-label" for="ledswitch_'${LEDNAME}'">'${LEDNAME}'</label>'
	echo '<br>'
	
done
