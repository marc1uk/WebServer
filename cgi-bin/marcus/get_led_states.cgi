#!/bin/bash

# must have this or it complains 'malformed header'
echo -e "Content-type:text/html\n"

# retrieve the set of commands for the current run
# FIXME change 'ledStatuses' to 'ledStates'
STATES=$(psql -U postgres -d rundb -t -c "SELECT values from webpage WHERE name='ledStatuses'")

#echo "state is ${STATE}"
# e.g. ' {"LEDB": 0, "LEDG": 0, "LEDR": 0, "LEDW": 0, "LED385L": 0, "LED275J_A": 0, "LED275J_B": 0, "LEDRGBAnnode": 0}'

# drop the quotes - we don't need them
STATES=$(tr -d '"' <<< ${STATES})

# drop preceding and trailing curly braces
STATES=${STATES#' {'}
STATES=${STATES%'}'}

# parse into an array
readarray -t -d ',' LEDARR <<< ${STATES}

# each entry can be split into LED name and state
PATTERN='LED([^:]+): ([01])'

# loop over LEDs and make indicators
let i=0
while [ true ]; do
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
		echo "bash regex failed to match led state '"${LINE}"'"
		continue
	elif [ "${BASH_REMATCH[2]}" != '0' ] && [ "${BASH_REMATCH[2]}" != '1' ]; then
		echo "bash unrecognised LED state ${BASH_REMATCH[2]}"
		exit 1
	fi
	
	# make the indicator
	echo -n '<input class="form-check-input" type="checkbox" id="ledswitch_'${BASH_REMATCH[1]}'"'
	if [ ${BASH_REMATCH[2]} -eq 1 ]; then
		echo 'checked>'
	else
		echo '>'
	fi
	echo '<label class="form-check-label" for="ledswitch_'${BASH_REMATCH[1]}'">'${BASH_REMATCH[1]}'</label>'
	echo '<br>'
	
	let i=$i+1
done

