#!/bin/bash

# define a dummy set of commands
COMMANDS="DUMMY COMMANDS TO TEST CGI SCRIPT
start
power up
pump on
start_loop 100
valve outlet open
valve inlet open
wait 60
valve inlet close
valve outlet close
wait 60
measure Dark
measure Dark
measure Dark
measure UV275_A
measure Dark
measure UV275_B
save stability
wait 600
loop
pump off
power down
quit"


# turn it into an array
readarray CMD_ARRAY <<< ${COMMANDS}
# note the above results in trailing newlines on each entry, try `echo "${CMD_ARRAY[0]}"`
#IFS=' ' read -a CMD_ARRAY -r -d '\n' <<< ${COMMANDS}    # this doesn't, but can't handle spaces within lines

#echo "Content-type:text/html"

HEADER='
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="../../marcus/bootstrap-5.1.3-dist/css/bootstrap.min.css" rel="stylesheet">
  </head>
  <body>
  
  <table class="table table-striped table-hover">
  <tbody>
'

FOOTER='
  </tbody>
  </table>
  
</body>
</html>
'

#HEADER='
#    <table class="table table-striped table-hover">
#    <tbody>
#'

#FOOTER='
#    </tbody>
#    </table>
#'

#HEADER=''
#FOOTER=''

echo "${HEADER}"

# loop over array elements and echo them as html rows
#echo "looping over ${#CMD_ARRAY} elements"
for i in `seq 1 ${#CMD_ARRAY}`; do
	LINE=$(tr -d '\n' <<< ${CMD_ARRAY[$i]})
	if [ -z "${LINE}" ]; then
		#echo "command $i is empty"
		continue;
	fi
	echo '  <tr><td>'"${LINE}"'</td></tr>'
done

echo "${FOOTER}"

