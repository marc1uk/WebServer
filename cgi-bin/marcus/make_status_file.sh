#!/bin/bash

CGIDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# invoke cgi script, using tail -n -2 to strip first two lines, which are for html only
POWERSTATE=$(${CGIDIR}/get_power_state.cgi | tail -n -2 | tr -d '"' | xargs echo -n );
PUMPSTATE=$(${CGIDIR}/get_pump_state.cgi | tail -n -2 | tr -d '"' | xargs echo -n );
PWMBOARD=$(${CGIDIR}/get_pwmboard_state.cgi | tail -n -2 | tr -d '"' | xargs echo -n );
SPECTROMETER=$(${CGIDIR}/get_spectrometer_state.cgi | tail -n -2 | tr -d '"' | xargs echo -n );


APPLICATION_NAME="GAD_ToolChain"
if [ $(ps aux | grep $APPLICATION_NAME | grep -v sudo | grep -v gdb | grep -v grep | grep -v defunct | wc -l) -lt 1 ]; then
	TOOLCHAINRUNNING=0
else
	TOOLCHAINRUNNING=1
fi

ALLOK=1
if [ ${TOOLCHAINRUNNING} -ne 1 ] || [ "${POWERSTATE}" != "ON" ] || [ "${PUMPSTATE}" != "ON" ] || [ "${PWMBOARD}" != "ONLINE" ] || [ "${SPECTROMETER}" != "ONLINE" ]; then
    ALLOK=0
fi

#INVALVE=$(QUERY_STRING='a=inlet' ${CGIDIR}/get_valve_state.cgi | tail -n -2);
#OUTVALVE=$(QUERY_STRING='a=outlet' ${CGIDIR}/get_valve_state.cgi | tail -n -2);
# bad if not an expected state? we could also allow "UNKNOWN" which may happen during powerup...
#if [ "${INVALVE}" != "OPEN" ] && [ "${INVALVE}" != "CLOSED" ]; then
#    ALLOK=0
#elif [ "${OUTVALVE}" != "OPEN" ] && [ "${OUTVALVE}" != "CLOSED" ]; then
#    ALLOK=0
#fi

#LEDSTATES=$(${CGIDIR}/get_led_states.cgi | tail -n -2);
# check on LED states? Tbh these can be either on or off depending on
# where we are in the measurement cycle, so can't do much with them.

# reference time - now
CURRENTTIME=$(date +%"Y-%m-%d %H:%M:%S")
CURRENTTIMESECS=$(date +%s)

# get time of last trace
QUERY="SELECT timestamp from webpage WHERE name='last_trace' ORDER BY timestamp DESC LIMIT 1"
LASTTRACETIME=$(psql -U postgres -d rundb -t -c "${QUERY}" | xargs echo -n )
LASTTRACETIMESECS=$(date --date="${LASTTRACETIME}" +%s)                           # convert to seconds
LASTTRACETDIFF=$(($(echo "${CURRENTTIMESECS}")-$(echo "${LASTTRACETIMESECS}")))   # calculate seconds from now

#PROP="values->'conc_and_err'->0"    # for gd concentration
#PROP="values->'concfit_success'"    # for measurement success / failure
#PROP="timestamp"                    # for measurement time

# get last measurement times from all methods with LED A
LEDNAME="275_A"
QUERY="SELECT timestamp FROM data WHERE name='gdconcmeasure' AND values->'method'='\"raw\"' AND ledname='${LEDNAME}' ORDER BY timestamp DESC LIMIT 1"
GDRAWTIMEA=$(psql -U postgres -d rundb -t -c "${QUERY}" | xargs echo -n )
GDRAWTIMESECSA=$(date --date="${GDRAWTIMEA}" +%s)
GDRAWTDIFFA=$(($(echo "${CURRENTTIMESECS}")-$(echo "${GDRAWTIMESECSA}")))
QUERY="SELECT values->'concfit_success' FROM data WHERE name='gdconcmeasure' AND values->'method'='\"raw\"' AND ledname='${LEDNAME}' ORDER BY timestamp DESC LIMIT 1"
GDRAWOKA=$(psql -U postgres -d rundb -t -c "${QUERY}" | xargs echo -n )

QUERY="SELECT timestamp FROM data WHERE name='gdconcmeasure' AND values->'method'='\"simple\"' AND ledname='${LEDNAME}' ORDER BY timestamp DESC LIMIT 1"
GDSIMPLETIMEA=$(psql -U postgres -d rundb -t -c "${QUERY}" | xargs echo -n )
GDSIMPLETIMESECSA=$(date --date="${GDSIMPLETIMEA}" +%s)
GDSIMPLETDIFFA=$(($(echo "${CURRENTTIMESECS}")-$(echo "${GDSIMPLETIMESECSA}")))
QUERY="SELECT values->'concfit_success' FROM data WHERE name='gdconcmeasure' AND values->'method'='\"simple\"' AND ledname='${LEDNAME}' ORDER BY timestamp DESC LIMIT 1"
GDSIMPLEOKA=$(psql -U postgres -d rundb -t -c "${QUERY}" | xargs echo -n )

QUERY="SELECT timestamp FROM data WHERE name='gdconcmeasure' AND values->'method'='\"complex\"' AND ledname='${LEDNAME}' ORDER BY timestamp DESC LIMIT 1"
GDCOMPLEXTIMEA=$(psql -U postgres -d rundb -t -c "${QUERY}" | xargs echo -n )
GDCOMPLEXTIMESECSA=$(date --date="${GDCOMPLEXTIMEA}" +%s)
GDCOMPLEXTDIFFA=$(($(echo "${CURRENTTIMESECS}")-$(echo "${GDCOMPLEXTIMESECSA}")))
QUERY="SELECT values->'concfit_success' FROM data WHERE name='gdconcmeasure' AND values->'method'='\"complex\"' AND ledname='${LEDNAME}' ORDER BY timestamp DESC LIMIT 1"
GDCOMPLEXOKA=$(psql -U postgres -d rundb -t -c "${QUERY}" | xargs echo -n )

# get last measurement times from all methods with LED B
LEDNAME="275_B"
QUERY="SELECT timestamp FROM data WHERE name='gdconcmeasure' AND values->'method'='\"raw\"' AND ledname='${LEDNAME}' ORDER BY timestamp DESC LIMIT 1"
GDRAWTIMEB=$(psql -U postgres -d rundb -t -c "${QUERY}" | xargs echo -n )
GDRAWTIMESECSA=$(date --date="${GDRAWTIMEB}" +%s)
GDRAWTDIFFB=$(($(echo "${CURRENTTIMESECS}")-$(echo "${GDRAWTIMESECSA}")))
QUERY="SELECT values->'concfit_success' FROM data WHERE name='gdconcmeasure' AND values->'method'='\"raw\"' AND ledname='${LEDNAME}' ORDER BY timestamp DESC LIMIT 1"
GDRAWOKB=$(psql -U postgres -d rundb -t -c "${QUERY}" | xargs echo -n )

QUERY="SELECT timestamp FROM data WHERE name='gdconcmeasure' AND values->'method'='\"simple\"' AND ledname='${LEDNAME}' ORDER BY timestamp DESC LIMIT 1"
GDSIMPLETIMEB=$(psql -U postgres -d rundb -t -c "${QUERY}" | xargs echo -n )
GDSIMPLETIMESECSA=$(date --date="${GDSIMPLETIMEB}" +%s)
GDSIMPLETDIFFB=$(($(echo "${CURRENTTIMESECS}")-$(echo "${GDSIMPLETIMESECSA}")))
QUERY="SELECT values->'concfit_success' FROM data WHERE name='gdconcmeasure' AND values->'method'='\"simple\"' AND ledname='${LEDNAME}' ORDER BY timestamp DESC LIMIT 1"
GDSIMPLEOKB=$(psql -U postgres -d rundb -t -c "${QUERY}" | xargs echo -n )

QUERY="SELECT timestamp FROM data WHERE name='gdconcmeasure' AND values->'method'='\"complex\"' AND ledname='${LEDNAME}' ORDER BY timestamp DESC LIMIT 1"
GDCOMPLEXTIMEB=$(psql -U postgres -d rundb -t -c "${QUERY}" | xargs echo -n )
GDCOMPLEXTIMESECSA=$(date --date="${GDCOMPLEXTIMEB}" +%s)
GDCOMPLEXTDIFFB=$(($(echo "${CURRENTTIMESECS}")-$(echo "${GDCOMPLEXTIMESECSA}")))
QUERY="SELECT values->'concfit_success' FROM data WHERE name='gdconcmeasure' AND values->'method'='\"complex\"' AND ledname='${LEDNAME}' ORDER BY timestamp DESC LIMIT 1"
GDCOMPLEXOKB=$(psql -U postgres -d rundb -t -c "${QUERY}" | xargs echo -n )

# all transparency measurements are calculated at the same time - all LEDs are recorded,
# then MatthewTransparency sums the dark-subtracted traces and divides by a pure reference
QUERY="SELECT timestamp FROM data WHERE name='transparency_samples' ORDER BY timestamp DESC LIMIT 1"
TRANSPTIME=$(psql -U postgres -d rundb -t -c "${QUERY}" | xargs echo -n )
TRANSPTIMESECS=$(date --date="${TRANSPTIME}" +%s)
TRANSPTDIFF=$(($(echo "${CURRENTTIMESECS}")-$(echo "${TRANSPTIMESECS}")))


################

# format values for printing

# convert online status from bool to string
if [ ${ALLOK} -eq 1 ]; then
    STATUSSTRING="#color[8]{Running}"
else
    STATUSSTRING="#color[2]{Stopped}"
fi

# convert fit status from bool to string
formatstatus(){
    STATUS=$1
    if [ "${STATUS}" == "1" ]; then
        echo "#bf{#color[8]{Success}}";
    else
        echo "#bf{#color[2]{Failed}}";
    fi
}

PUREOKA=$(formatstatus ${PUREOKA})
GDRAWOKA=$(formatstatus ${GDRAWOKA})
GDSIMPLEOKA=$(formatstatus ${GDSIMPLEOKA})
GDCOMPLEXOKA=$(formatstatus ${GDCOMPLEXOKA})
PUREOKB=$(formatstatus ${PUREOKB})
GDRAWOKB=$(formatstatus ${GDRAWOKB})
GDSIMPLEOKB=$(formatstatus ${GDSIMPLEOKB})
GDCOMPLEXOKB=$(formatstatus ${GDCOMPLEXOKB})

# round to nearest minute
formattime(){
    DUMMYVALUE="1970-01-01 00:00"
    TIME=$1
    #echo "" > /dev/tty
    #echo "Formatting time ${TIME}" > /dev/tty
    # e.g. '2022-06-09 04:28:47.600042'
    
    # check format matches - probably unnecessary
    PATTERN='[0-9]{4}\-[0-9]{2}\-[0-9]{2}[T ][0-9]{2}:[0-9]{2}:[0-9]{2}'
    [[ ${TIME} =~ ${PATTERN} ]]
    if [ $? -ne 0 ]; then
            #echo "return value did not match a timestamp format"
            #echo ${DUMMYVALUE}
            TIME=${DUMMYVALUE}
    else
            #echo ${TIME}
            :
    fi
    
    # accept a timezone offset
    if [ $# -gt 1 ]; then
        let SHIFT=${2}
        #echo "accounting for timezone shift of ${SHIFT} hours from ${HOURS}"  > /dev/tty
        TIME=$(date --date="${TIME} ${SHIFT} hours" +%"Y-%m-%d %H:%M:%S")
        #echo "updated timestamp is ${TIME}" > /dev/tty
    fi
    
    # return the timestamp to the nearest minute
    echo "${TIME:0:16}"
}

TDIFFLIMIT=1800
# convert seconds into hours, minutes, seconds
# and formats colour based on being more or less than TDIFFLIMIT
formattdiff(){
    DUMMYVALUE="-1:-1"
    TDIFF=$1
    #echo "" > /dev/tty
    #echo "TDIFF is ${TDIFF}" > /dev/tty
    if [ $# -gt 1 ]; then
        # accept a timezone offset
        let SHIFT=$(( ${2} * 3600 ))
        #echo "shifting TDIFF ${TDIFF} by ${2} hours or ${SHIFT} secs" > /dev/tty
        TDIFF=$( echo "scale=0; ${TDIFF}${SHIFT}" | bc );
        #echo "shifted TDIFF is ${TDIFF}" > /dev/tty
        if [ ${TDIFF} -gt 86400 ]; then TDIFF=$(( ${TDIFF} - 86400 )); fi
        TDIFF=$(echo "scale=0; ${TDIFF}%86400" | bc );
        #echo "taking remainder from 24 hours is ${TDIFF}" > /dev/tty
        TDIFF=${TDIFF/#-}   # drop sign if present
        #echo "dropped sign is ${TDIFF}" > /dev/tty
    fi
    TDIFFOK=$(( ${TDIFF} < ${TDIFFLIMIT} ))
    SECS=$( echo "scale=0; ${TDIFF}%60" | bc );     # remaining seconds
    #echo "remaining seconds is ${SECS}" > /dev/tty
    MINS=$( echo "scale=0; ${TDIFF}/60" | bc );     # integer minutes
    #echo "total minutes is ${MINS}" > /dev/tty
    HOURS=$( echo "scale=0; ${MINS}/60" | bc );     # integer hours
    #echo "which maps to ${HOURS}" > /dev/tty
    MINS=$( echo "scale=0; ${MINS}%60" | bc );      # remainder minutes
    #echo "and ${MINS} remaining minutes" > /dev/tty
#    if [ $# -gt 1 ]; then
#        # accept a timezone offset
#        let SHIFT=${2}
#        HOURS=$( echo "scale=0; ${HOURS}${SHIFT}" | bc );
#        HOURS=$(echo "scale=0; (${HOURS}-24)%24" | bc );
#        HOURS=${HOURS/#-}   # drop sign if present
#    fi
    if [ ${TDIFFOK} -eq 1 ]; then
      printf "#color[8]{%02d:%02d:%02d}" ${HOURS} ${MINS} ${SECS}
    else
      printf "#color[2]{%02d:%02d:%02d}" ${HOURS} ${MINS} ${SECS}
    fi
}

# 30" in seconds. bad status if no measurement in 30 minutes.
# maybe we should be more generous as this isn't really even twice
# the time between measurements, so if one measurement fails thats it...
CURRENTTIME=$(formattime "${CURRENTTIME}")
LASTTRACETIME=$(formattime "${LASTTRACETIME}" '+8')
# last trace time is currently different as it's the only one which uses
# the postgres now() function to get the time, which is evidently in a different
# timezone as the rest of the main GDConcMeasure application which gets timestamps
# from boost in UTC
LASTTRACETDIFF=$(formattdiff "${LASTTRACETDIFF}" "-8")
GDRAWTIMEA=$(formattime "${GDRAWTIMEA}")
GDRAWTDIFFA=$(formattdiff "${GDRAWTDIFFA}")
GDSIMPLETIMEA=$(formattime "${GDSIMPLETIMEA}")
GDSIMPLETDIFFA=$(formattdiff "${GDSIMPLETDIFFA}")
GDCOMPLEXTIMEA=$(formattime "${GDCOMPLEXTIMEA}")
GDCOMPLEXTDIFFA=$(formattdiff "${GDCOMPLEXTDIFFA}")
GDRAWTIMEB=$(formattime "${GDRAWTIMEB}")
GDRAWTDIFFB=$(formattdiff "${GDRAWTDIFFB}")
GDSIMPLETIMEB=$(formattime "${GDSIMPLETIMEB}")
GDSIMPLETDIFFB=$(formattdiff "${GDSIMPLETDIFFB}")
GDCOMPLEXTIMEB=$(formattime "${GDCOMPLEXTIMEB}")
GDCOMPLEXTDIFFB=$(formattdiff "${GDCOMPLEXTDIFFB}")

########################################

# ok, print the output string to text file

# n.b. use #bf{mytext} to toggle bold - will set or invert depending on default
# colour codes for greyed out text: black->16, blue->38, green->30, red->45
# XXX is it worth plotting all these timestamps? is it sufficient to have just
# one timestamp per LED? entries are made even if the fitting fails right,
# which would show up on the graph..
cat << EOF > gadstatus.txt
#bf{#color[9]{Check status is 'Running'}}
Status: #bf{${STATUSSTRING}}

#bf{#color[9]{Check that timestamps are within 30 minutes of reference time}}
Current Time:                   #bf{#color[8]{${CURRENTTIME}}}
Last Trace Time:                #bf{${LASTTRACETIME}} | Time Difference: #bf{${LASTTRACETDIFF}}
Last GD Time [LED A, raw]:      #bf{${GDRAWTIMEA}} | Time Difference: #bf{${GDRAWTDIFFA}}
Last GD Time [LED A, simple]:   #bf{${GDSIMPLETIMEA}} | Time Difference: #bf{${GDSIMPLETDIFFA}}
Last GD Time [LED A, complex]:  #bf{${GDCOMPLEXTIMEA}} | Time Difference: #bf{${GDCOMPLEXTDIFFA}}
Last GD Time [LED B, raw]:      #bf{${GDRAWTIMEB}} | Time Difference: #bf{${GDRAWTDIFFB}}
Last GD Time [LED B, simple]:   #bf{${GDSIMPLETIMEB}} | Time Difference: #bf{${GDSIMPLETDIFFB}}
Last GD Time [LED B, complex]:  #bf{${GDCOMPLEXTIMEB}} | Time Difference: #bf{${GDCOMPLEXTDIFFB}}

#bf{#color[9]{Check fits are OK}}
Fit Status [LED A]:  ${GDCOMPLEXOKA}
Fit Status [LED B]:  ${GDCOMPLEXOKB}
EOF

# these are pretty meaningless, since raw does no fit
# and simple fit is trivial
#color[16]{Fit Status [LED A, raw]:}      ${GDRAWOKA}
#color[16]{Fit Status [LED A, simple]:}   ${GDSIMPLEOKA}
#color[16]{Fit Status [LED B, raw]:}      ${GDRAWOKB}
#color[16]{Fit Status [LED B, simple]:}   ${GDSIMPLEOKB}
# we probably don't need these separately
# since they're rolled into the complex fit status
#color[16]{Fit Status [LED A]:}     ${PUREOKA}
#color[16]{Fit Status [LED B]:}     ${PUREOKB}

# simple root application to build an image from this text
./makeStatusFile gadstatus.txt

# invoke the application to generate the gd history graph
./makeGdConcHistory
# overlay a shaded region showing the acceptable area
convert gdconcs.png gdconc_overlay.png -composite +antialias gdconc_history.png

# make a transparency history plot
./makeTranspHistory
# overlay a shaded region
convert transps.png transps_overlay.png -composite +antialias transparency_history.png
