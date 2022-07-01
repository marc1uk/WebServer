#!/bin/bash

# must have this or it complains 'malformed header'
echo -e "Content-type:text/html\n\n"

# retrieve the set of commands for the current run
COMMANDS=$(psql -U postgres -d rundb -t -c "SELECT values from webpage WHERE name='scheduler_commands'")
#echo "commands is ${COMMANDS}"

# this is a json array: `[ "command 1", "command 2", "command 3" ]`
COMMANDS=" ${COMMANDS# [}"   # trim leading ' ['
COMMANDS=${COMMANDS%]}

# XXX this is a lazy splitting method, which is only suitable because we know
# there will be no commas (delimiters) within the entries themselves.

# remove all the enclosing quotations
COMMANDS=$(tr -d '"' <<< ${COMMANDS})

# convert it into a bash array, splitting by comma
# the -t prevents the delimiting comma being included as part of the array entries
readarray -t -d ',' CMD_ARRAY <<< ${COMMANDS}

#echo "COMMANDS: ${COMMANDS}"

# we'll also get the number of the current command, and the progress through any loops.
PROGRESS_MAP=$(psql -U postgres -d rundb -t -c "SELECT values from webpage WHERE name='scheduler_progress'")
#something like `{"loop_counts": [0], "command_step": 0, "current_command": 26}`

# we'll parse it with a bash regex. These are done by `[[ $string =~ $pattern ]]`
# it should return 0 on successful match. submatches are in `${BASH_REMATCH[i]}`
# N.B. Use variables to encapsulate input string and pattern. In particular, if the pattern
# is quoted, then it won't work (by design - see https://tiswww.case.edu/php/chet/bash/FAQ E14)
# to allow meta-characters and spaces to work as expected, define your pattern as a variable.
PATTERN=' \{"loop_counts": \[([0-9]*)\], "command_step": ([0-9]+), "current_command": ([0-9]+)\}'
# n.b. { , } and [ , ] are regex operators, so need to be escaped.
#echo "matching pattern '"${PATTERN}"' to string '"${PROGRESS_MAP}"'"

# do the match - again, no quotes!
[[ ${PROGRESS_MAP} =~ ${PATTERN} ]]
if [ $? -ne 0 ]; then
	echo "bash match to scheduler_progress failed!"
	echo "PROGRESS_MAP was '${PROGRESS_MAP}' vs pattern '${PATTERN}'"
	exit 1
fi

# loop over array elements and echo them as html table rows

# for some reason the array size is not correct...
#echo "looping over ${#CMD_ARRAY} elements"
#for i in `seq 0 ${#CMD_ARRAY}`; do

# so just loop until we find an empty entry, i guess
let i=0
while [ true ]; do
	LINE=${CMD_ARRAY[$i]}
	
	if [ -z "${LINE}" ]; then
		#echo "command $i is empty"
		#continue;
		break;
	fi
	
	# mark the current command as active
	if [ $i -eq ${BASH_REMATCH[3]} ]; then
		echo '  <tr class="table-primary text-light" id="activeCommand"><td>'"${LINE}"'</td></tr>'
	else
		echo '  <tr><td>'"${LINE}"'</td></tr>'
	fi
	
	let i=$i+1
done

#TODO we can indicate the number of loops and how many iterations have been done,
# but it's gonna be a bit odd. Basically start at the current_command,
# and scan backwards for instances of 'loop_start X' where X is either a number
# or nothing (infinite loop). At each of these, the number of iterations performed so far
# is the last element from loop_counts. Then drop that element, and continue the scan.
# for all instances of 'loop_start' after the current command, the number of iterations
# performed is of course 0.
# these can be indicated by e.g. adding a right-aligned badge to a second column in the table
# <td><span class="badge bg-danger">6/10</span></td> for 6/10 iterations
