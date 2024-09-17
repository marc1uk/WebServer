#!/bin/bash

CGIDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# check hardware status; power on, spectrometer connected, etc.
# invoke cgi script, using tail -n -2 to strip first two lines, which are for html only
POWERSTATE=$(${CGIDIR}/get_power_state.cgi | tail -n -2 | tr -d '"' | xargs echo -n );
PUMPSTATE=$(${CGIDIR}/get_pump_state.cgi | tail -n -2 | tr -d '"' | xargs echo -n );
PWMBOARD=$(${CGIDIR}/get_pwmboard_state.cgi | tail -n -2 | tr -d '"' | xargs echo -n );
SPECTROMETER=$(${CGIDIR}/get_spectrometer_state.cgi | tail -n -2 | tr -d '"' | xargs echo -n );

# check ToolChain is running
APPLICATION_NAME="GAD_ToolChain"
if [ $(ssh pi ps aux | grep $APPLICATION_NAME | grep -v sudo | grep -v gdb | grep -v grep | grep -v defunct | wc -l) -lt 1 ]; then
	TOOLCHAINRUNNING=0
else
	TOOLCHAINRUNNING=1
fi

# we'll also check that the valves are opening and closing regularly
# for a simple boolean check we'll simply ask that they have been both
# on for >0 and <15 minutes of the last 30.
# We could potentially tighten this if we know our duty cycle well.
INMINSOPEN=$(psql -d rundb -U postgres -At -c "SELECT SUM((values->'invalve')::integer) FROM webpage WHERE name='gpio_status' AND timestamp>(now() - '30 minutes'::interval)")
OUTMINSOPEN=$(psql -d rundb -U postgres -At -c "SELECT SUM((values->'outvalve')::integer) FROM webpage WHERE name='gpio_status' AND timestamp>(now() - '30 minutes'::interval)")
if [ ${INMINSOPEN:-0} -gt 0  ] && [ ${INMINSOPEN:-0} -lt 15 ]; then
	INVALVEOK=1
else
	INVALVEOK=0
fi
if [ ${OUTMINSOPEN:-0} -gt 0 ] && [ ${OUTMINSOPEN:-0} -lt 15 ]; then
	OUTVALVEOK=1
else
	OUTVALVEOK=0
fi

# TEMPORARY OVERRIDE FIXME until we add the valves back into the toolchain
INVALVEOK=1
OUTVALVEOK=1

echo "toolchain status: ${TOOLCHAINRUNNING} ${POWERSTATE} ${PUMPSTATE} ${PWMBOARD} ${SPECTROMETER} ${INVALVEOK} ${OUTVALVEOK}"
ALLOK=1
if [ ${TOOLCHAINRUNNING} -ne 1 ] || [ "${POWERSTATE}" != "ON" ] || [ "${PUMPSTATE}" != "ON" ] || [ "${PWMBOARD}" != "ONLINE" ] || [ "${SPECTROMETER}" != "ONLINE" ] || [ "${INVALVEOK}" != "1" ] || [ "${OUTVALVEOK}" != "1" ]; then
    ALLOK=0
fi

# let's check the age of the most recently generated data file
MOST_RECENT_FILE=$(${CGIDIR}/find_most_recent.sh)
if [ $? -ne 0 ] || [ -z "${MOST_RECENT_FILE}" ]; then
	# error - use unix epoch time
	FILETIME=$(date -u --date='@0' --iso-8601=seconds)
else
	# get the time of last modification
	FILETIME=$(ls --full-time "${MOST_RECENT_FILE}" | awk '{print $6, $7}')
fi
# calculate age of this timestamp
LASTFILEAGESECS=$(( `date +%s` - `date -d "${FILETIME}" +%s` ))

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
CURRENTTIMEUTC=$(TZ=GMT date +%"Y-%m-%d %H:%M:%S")
echo "current time in UTC is ${CURRENTTIME}"
CURRENTTIMEUTCSECS=$(TZ=GMT date +%s) # in seconds since unix epoch
CURRENTTIMEJST=$(TZ=Asia/Tokyo date +%"Y-%m-%d %H:%M:%S")
echo "current time JST is ${CURRENTTIMEJST}"

# get time of last trace
QUERY="SELECT timestamp::timestamp with time zone AT time zone 'UTC' from webpage WHERE name='last_trace' ORDER BY timestamp DESC LIMIT 1"
LASTTRACETIMEUTC=$(psql -U postgres -d rundb -t -c "${QUERY}" | xargs echo -n )
LASTTRACETIMEUTCSECS=$(TZ=GMT date --date="${LASTTRACETIMEUTC}" +%s) # convert to seconds
echo "last trace time UTC was ${LASTTRACETIMEUTC}"

# convert last trace time to JST
LASTTRACETIME=$(TZ=Asia/Tokyo date --date="${LASTTRACETIMEUTC} GMT" +%"Y-%m-%d %H:%M:%S")
echo "in JST that's ${LASTTRACETIME}"

# calculate time since last trace
LASTTRACETDIFF=$(($(echo "${CURRENTTIMEUTCSECS}")-$(echo "${LASTTRACETIMEUTCSECS}")))   # calculate seconds from now
echo "time between current time ${CURRENTTIMEUTC} and last trace time ${LASTTRACETIMEUTC} in seconds: ${LASTTRACETDIFF}"

#PROP="values->'conc_and_err'->0"    # for gd concentration
#PROP="values->'concfit_success'"    # for measurement success / failure
#PROP="timestamp"                    # for measurement time

# get last measurement times from all methods with LED A
LEDNAME="275_A"
QUERY="SELECT timestamp::timestamp with time zone AT time zone 'UTC' FROM data WHERE name='gdconcmeasure' AND ledname='${LEDNAME}' ORDER BY timestamp DESC LIMIT 1"
GDRAWTIMEA=$(psql -U postgres -d rundb -t -c "${QUERY}" | xargs echo -n )
GDRAWTIMESECSA=$(TZ=GMT date --date="${GDRAWTIMEA}" +%s)
GDRAWTDIFFA=$(($(echo "${CURRENTTIMEUTCSECS}")-$(echo "${GDRAWTIMESECSA}")))
QUERY="SELECT values->'absfit_success' FROM data WHERE name='gdconcmeasure' AND ledname='${LEDNAME}' ORDER BY timestamp DESC LIMIT 1" # or 'datafit_success'
GDRAWOKA=$(psql -U postgres -d rundb -t -c "${QUERY}" | xargs echo -n )

# get last measurement times from all methods with LED B
LEDNAME="275_B"
QUERY="SELECT timestamp::timestamp with time zone AT time zone 'UTC' FROM data WHERE name='gdconcmeasure' AND ledname='${LEDNAME}' ORDER BY timestamp DESC LIMIT 1"
GDRAWTIMEB=$(psql -U postgres -d rundb -t -c "${QUERY}" | xargs echo -n )
GDRAWTIMESECSB=$(TZ=GMT date --date="${GDRAWTIMEB}" +%s)
GDRAWTDIFFB=$(($(echo "${CURRENTTIMEUTCSECS}")-$(echo "${GDRAWTIMESECSB}")))
QUERY="SELECT values->'absfit_success' FROM data WHERE name='gdconcmeasure' AND ledname='${LEDNAME}' ORDER BY timestamp DESC LIMIT 1"
GDRAWOKB=$(psql -U postgres -d rundb -t -c "${QUERY}" | xargs echo -n )

# to minimise the amount of information we only really need to check the oldest timestamp
# so make an array of the timestamps in seconds since unix epoch
TDIFFARR=(${GDRAWTIMESECSA} ${GDRAWTIMESECSB})
# find the minimum - i.e. the oldest one. This prints a 1-based index
OLDESTINDEX=$(echo "${TDIFFARR[*]}" | tr ' ' '\n' | awk 'NR==1{min=$0}NR>1 && $1<min{min=$1;pos=NR}END{print pos}')
# fix to 0-based index
let OLDESTINDEX=${OLDESTINDEX}-1
# get the corresponding timestamp
TSTAMPARR=("${GDRAWTIMEA}" "${GDRAWTIMEB}")
TDIFFARR=(${GDRAWTDIFFA} ${GDRAWTDIFFB})
OLDESTGDTIME="${TSTAMPARR[${OLDESTINDEX}]}"
OLDESTGDTDIFF="${TDIFFARR[${OLDESTINDEX}]}"

# all transparency measurements are calculated at the same time - all LEDs are recorded,
# then MatthewTransparency sums the dark-subtracted traces and divides by a pure reference
QUERY="SELECT timestamp::timestamp with time zone AT time zone 'UTC' FROM data WHERE name='transparency_samples' ORDER BY timestamp DESC LIMIT 1"
TRANSPTIME=$(psql -U postgres -d rundb -t -c "${QUERY}" | xargs echo -n )
TRANSPTIMESECS=$(TZ=GMT date --date="${TRANSPTIME}" +%s)
TRANSPTDIFF=$(($(echo "${CURRENTTIMEUTCSECS}")-$(echo "${TRANSPTIMESECS}")))

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
BOTHFITSOK=1
# this is not something we need to report on the shift page, it's too unreliable for now
#BOTHFITSOK=$( [ "${GDRAWOKA}" == "1" ] && [ "${GDRAWOKB}" == "1" ] && echo "1" )
GDRAWOKA=$(formatstatus ${GDRAWOKA})
PUREOKB=$(formatstatus ${PUREOKB})
GDRAWOKB=$(formatstatus ${GDRAWOKB})
BOTHFITSOK=$(formatstatus ${BOTHFITSOK})

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


# 30" in seconds. bad status if no measurement in 30 minutes.
# maybe we should be more generous as this isn't really even twice
# the time between measurements, so if one measurement fails thats it...
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

formattdiffmins(){
    # accepts tdiff in seconds, converts to mins with colouring
    DUMMYVALUE="-1:-1"
    TDIFF=$1
    TDIFFOK=$(( ${TDIFF} < ${TDIFFLIMIT} ))
    MINS=$( echo "scale=0; ${TDIFF}/60" | bc );     # integer minutes
    if [ ${TDIFFOK} -eq 1 ]; then
      printf "#color[8]{%d}" ${MINS}
    else
      printf "#color[2]{%d}" ${MINS}
    fi
}

# now fixed earlier in a hopefully better way
#LASTTRACETIME=$(formattime "${LASTTRACETIME}" '+8')
#LASTTRACETDIFF=$(formattdiff "${LASTTRACETDIFF}" "-8")

echo "formatting times"
CURRENTTIME=$(formattime "${CURRENTTIME}")
LASTTRACETIME=$(formattime "${LASTTRACETIME}")
LASTTRACETDIFFMINS=$(formattdiffmins "${LASTTRACETDIFF}")
echo "LASTTRACETDIFF is ${LASTTRACETDIFF} secs or ${LASTTRACETDIFFMINS} mins"
LASTTRACETDIFF=$(formattdiff "${LASTTRACETDIFF}")
GDRAWTIMEA=$(formattime "${GDRAWTIMEA}")
GDRAWTDIFFA=$(formattdiff "${GDRAWTDIFFA}")
GDRAWTIMEB=$(formattime "${GDRAWTIMEB}")
GDRAWTDIFFB=$(formattdiff "${GDRAWTDIFFB}")
OLDESTGDTIME=$(formattime "${OLDESTGDTIME}")
OLDESTGDTDIFFMINS=$(formattdiffmins "${OLDESTGDTDIFF}")
echo "OLDESTGDTDIFF is ${OLDESTGDTDIFF} secs or ${OLDESTGDTDIFFMINS} mins"
OLDESTGDTDIFF=$(formattdiff "${OLDESTGDTDIFF}")
TRANSPTIME=$(formattime "${TRANSPTIME}")
TRANSPTDIFFMINS=$(formattdiffmins "${TRANSPTDIFF}")
echo "TRANSPTDIFF is ${TRANSPTDIFF} secs or ${TRANSPTDIFFMINS} mins"
TRANSPTDIFF=$(formattdiff "${TRANSPTDIFF}")
LASTFILETDIFFMINS=$(formattdiffmins "${LASTFILEAGESECS}")
echo "LASTFILETDIFF is ${LASTFILEAGESECS} secs or ${LASTFILETDIFFMINS} mins"
LASTFILETDIFF=$(formattdiff "${LASTFILEAGESECS}")
echo "formatting done"

########################################

DUMMYGDONLY=0
if [ ${DUMMYGDONLY} -eq 0 ] && [ -n $1 ] && [ "$1" == "dummy" ]; then
	RANDMINS=$(seq 3 1 10 | shuf | head -n1)
	RANDSECS=$(seq 0 1 60 | shuf | head -n1)
	LASTTRACETDIFF=$(printf "#color[8]{00:%02d:%02d}" ${RANDMINS} ${RANDSECS})
	RANDMINS=$(seq 13 1 17 | shuf | head -n1)
	RANDSECS=$(seq 0 1 60 | shuf | head -n1)
	OLDESTGDTDIFF=$(printf "#color[8]{00:%02d:%02d}" ${RANDMINS} ${RANDSECS})
	let RANDSECS=${RANDSECS}+$(seq 0 1 60 | shuf | head -n1)
	if [ ${RANDSECS} -gt 60 ]; then
		let RANDSECS=${RANDSECS}-60;
		let RANDMINS=${RANDMINS}+1;
	fi
	TRANSPTDIFF=$(printf "#color[8]{00:%02d:%02d}" ${RANDMINS} ${RANDSECS})
	let RANDSECS=${RANDSECS}+$(seq 0 1 60 | shuf | head -n1)
	if [ ${RANDSECS} -gt 60 ]; then
		let RANDSECS=${RANDSECS}-60;
		let RANDMINS=${RANDMINS}+1;
	fi
	LASTFILETDIFF=$(printf "#color[8]{00:%02d:%02d}" ${RANDMINS} ${RANDSECS})
	STATUSSTRING="#color[8]{Running}"
elif [ ${DUMMYGDONLY} -eq 1 ] && [ -n $1 ] && [ "$1" == "dummy" ]; then
	RANDMINS=$(seq 13 1 17 | shuf | head -n1)
	RANDSECS=$(seq 0 1 60 | shuf | head -n1)
	OLDESTGDTDIFF=$(printf "#color[8]{00:%02d:%02d}" ${RANDMINS} ${RANDSECS})
fi

########################################

# ok, print the output string to text file

# n.b. use #bf{mytext} to toggle bold - will set or invert depending on default
# colour codes for greyed out text: black->16, blue->38, green->30, red->45, very red->2
# XXX is it worth plotting all these timestamps? is it sufficient to have just
# one timestamp per LED? entries are made even if the fitting fails right,
# which would show up on the graph..
#bf{#color[2]{GAD CURRENTLY UNDERGOING MAINTENANCE, ABNORMALITIES CAN BE SAFELY IGNORED}}
cat << EOF > ${CGIDIR}/gadstatus.txt

#bf{#color[9]{Check this timestamp is within 10 minutes of the current time}}
Checks Last Updated (JST):            #bf{#color[8]{${CURRENTTIMEJST}}}

#bf{#color[9]{Check ToolChain is running}}
ToolChain Status:                     #bf{${STATUSSTRING}}

#bf{#color[9]{Check times since last measurement are less than 30 minutes}}
Minutes Since Last Trace:                #bf{${LASTTRACETDIFFMINS}}
Minutes Since Last Gd Concentration:     #bf{${OLDESTGDTDIFFMINS}}
Minutes Since Last Transparency:         #bf{${TRANSPTDIFFMINS}}
Minutes Since Last File:                 #bf{${LASTFILETDIFFMINS}}

#bf{#color[9]{Check fits are OK}}
Fit Status:                           ${BOTHFITSOK}
EOF

# i guess we don't need all the timestamps....
#Current Time:                   #bf{#color[8]{${CURRENTTIME}}}
#Last Trace Time:                #bf{${LASTTRACETIME}} | Time Difference: #bf{${LASTTRACETDIFF}}
#Last Gd Concentration Time:     #bf{${OLDESTGDTIME}} | Time Difference: #bf{${OLDESTGDTDIFF}}
#Last Transparency Time:         #bf{${TRANSPTIME}} | Time Difference: #bf{${TRANSPTDIFF}}

# we can reduce the amount of shown information by just checking the age of the oldest timestamp
#Last GD Time [LED A, raw]:      #bf{${GDRAWTIMEA}} | Time Difference: #bf{${GDRAWTDIFFA}}
#Last GD Time [LED B, raw]:      #bf{${GDRAWTIMEB}} | Time Difference: #bf{${GDRAWTDIFFB}}

# these should account for both pure fit and abs fit
#color[16]{Fit Status [LED A, absfit]:}      ${GDRAWOKA}
#color[16]{Fit Status [LED B, absfit]:}      ${GDRAWOKB}

# we don't need to check these separately as they're prerequisites for the abs fit to succeed
#color[16]{Fit Status [LED A]:}     ${PUREOKA} TODO datafit
#color[16]{Fit Status [LED B]:}     ${PUREOKB} TODO datafit

# further reduction, combine these


# simple root application to build an image from this text
# FIXME these applications output to pwd
# FIXME also don't hard-code the setup path
cd /home/gad/GDConcMeasure/
. Setup.sh
cd ${CGIDIR}
${CGIDIR}/makeStatusFile ${CGIDIR}/gadstatus.txt

# invoke the application to generate the gd history graph
HISTLENGTH=21   # we get ~7 measurements every 2 hours, so for egads, 6 hours=21 measurements

${CGIDIR}/makeGdConcHistory ${HISTLENGTH} ${1}
convert ${CGIDIR}/gdconcs.png ${CGIDIR}/gdconc_overlay.png -composite +antialias ${CGIDIR}/gdconc_dummy.png

${CGIDIR}/makeGdConcHistory ${HISTLENGTH} ${1}
# overlay a shaded region showing the acceptable area
convert ${CGIDIR}/gdconcs.png ${CGIDIR}/gdconc_overlay.png -composite +antialias ${CGIDIR}/gdconc_history.png

# make a transparency history plot
${CGIDIR}/makeTranspHistory ${HISTLENGTH} ${1}
# overlay a shaded region
convert ${CGIDIR}/transps.png ${CGIDIR}/transps_overlay.png -composite +antialias ${CGIDIR}/transparency_history.png
