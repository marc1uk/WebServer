#!/bin/bash

# must have this or it complains 'malformed header'
echo -e "Content-type:text/html\n"

# dummy value if psql fails
DUMMYVALUE='{"purefit":2,[{"method":"raw","absfit":2,"peakdiff":NAN,"gdconc":NAN},{"method":"complex","absfit":2,"peakdiff":NAN,"gdconc":NAN},{"method":"simple","absfit":2,"peakdiff":NAN,"gdconc":NAN}]'

# TODO FIXME to ensure consistency between plots and results from various other queries,
# we should retrieve the latest measurement number in the first query, then retreive
# plots and fit results with a measurement number selection criteria, rather than just getting the latest entry.

# get latest pure fit result
# XXX beware that we're using fitValid here, but not sure how accurate a metric that is.
PUREFITSTATUS=$(psql -U postgres -d rundb -t -c "SELECT values::json->'fitValid' FROM data WHERE name='pure_fit_status' ORDER BY timestamp DESC LIMIT 1")
if [ $? -ne 0 ] || [ -z "${PUREFITSTATUS}" ]; then
	PUREFITSTATUS="0"
else
	# bash threw a weird i think because of a preceding space that it only showed sometimes.
	# so explicitly convert it to number
	let PUREFITSTATUS=$(echo ${PUREFITSTATUS})
	#echo "PUREFITSTATUS is ${PUREFITSTATUS}"
fi

METHODS=( "raw" "simple" "complex" )

FITSJSON=''

for METHOD in "${METHODS[@]}"; do
	
	# get latest absorbance fit result for each fit method...
	#FITSTATUS=$(psql -U postgres -d rundb -t -c "SELECT values->'absorption_fits'->0->'fitstatus'->'fitValid' FROM data WHERE name='gdconcmeasure' AND values->'method'='\"${METHOD}\"' ORDER BY timestamp DESC LIMIT 1")
	FITSTATUS=$(psql -U postgres -d rundb -t -c "SELECT values->'absfit_success' FROM data WHERE name='gdconcmeasure' AND values->'method'='\"${METHOD}\"' ORDER BY timestamp DESC LIMIT 1")
	if [ $? -ne 0 ] || [ -z "${FITSTATUS}" ]; then
		FITSTATUS="0"
	else
		# bash threw a weird i think because of a preceding space that it only showed sometimes.
		# so explicitly convert it to number
		let FITSTATUS=$(echo ${FITSTATUS})
		#echo "FITSTATUS is ${FITSTATUS}"
	fi
	
	# if absorption fit was successful get the absorption peak height difference
	PEAKHEIGHTDIFF=0  # default value
	if [ ${FITSTATUS} -eq 1 ]; then
		PEAKHEIGHTS=$(psql -U postgres -d rundb -t -c "SELECT values->'peak_heights' FROM data WHERE name='gdconcmeasure' AND values->'method'='\"${METHOD}\"' ORDER BY timestamp DESC LIMIT 1")
		if [ $? -eq 0 ] && [ ! -z "${PEAKHEIGHTS}" ]; then
			# returned result should be a json array of two values: '[ val1, val2 ]'
			# parse it with regex why not
			PATTERN=' ?\[([0-9\.]+), ?([0-9\.]+)\]'
			[[ ${PEAKHEIGHTS} =~ ${PATTERN} ]]
			if [ $? -eq 0 ]; then
				#PEAKHEIGHTDIFF=`echo "scale=6; ${BASH_REMATCH[1]}-${BASH_REMATCH[2]}" | bc`  # strips the leading 0
				PEAKHEIGHTDIFF=`echo "${BASH_REMATCH[1]} ${BASH_REMATCH[2]}" | awk '{ printf "%f", $1-$2 }'`
			else
				#echo "regex match failed for getting peakheights: ${PEAKHEIGHTS}"
				PEAKHEIGHTDIFF="0"
			fi
		fi
	fi
	
	# check that there were no errors in conversion to concentration
	CONVSTATUS=$(psql -U postgres -d rundb -t -c "SELECT values->'concfit_success' FROM data WHERE name='gdconcmeasure' AND values->'method'='\"${METHOD}\"' ORDER BY timestamp DESC LIMIT 1")
	if [ $? -ne 0 ] || [ -z "${CONVSTATUS}" ]; then
		CONVSTATUS="0"
	else
		# bash threw a weird i think because of a preceding space that it only showed sometimes.
		# so explicitly convert it to number
		let CONVSTATUS=$(echo ${CONVSTATUS})
		#echo "CONVSTATUS is ${CONVSTATUS}"
	fi
	
	# finally get the calculated gd concentration
	GDCONC=0  # default value
	if [ ${CONVSTATUS} -eq 1 ]; then
		GDCONCANDERR=$(psql -U postgres -d rundb -t -c "SELECT values->'conc_and_err' FROM data WHERE name='gdconcmeasure' AND values->'method'='\"${METHOD}\"' ORDER BY timestamp DESC LIMIT 1")
		if [ $? -eq 0 ] && [ ! -z "${GDCONCANDERR}" ]; then
			# returned result should be a json array of two values: ' [val1, val2]'
			# parse it with regex why not
			PATTERN=' ?\[([0-9\.]+), ?([0-9\.]+)\]'
			[[ ${GDCONCANDERR} =~ ${PATTERN} ]]
			if [ $? -eq 0 ]; then
				GDCONC=${BASH_REMATCH[1]}
			fi
		fi
	fi
	
	# OK finally make a nice json string with just this for the webpage
	THISMETHODJSON="{\"method\":\"${METHOD}\", \"absfit\":${FITSTATUS}, \"peakdiff\":${PEAKHEIGHTDIFF}, \"gdconc\":${GDCONC} }";
	
	# append to output
	if [ ! -z "${FITSJSON}" ]; then
		FITSJSON="${FITSJSON},"
	else
		FITSJSON="["
	fi
	FITSJSON="${FITSJSON} ${THISMETHODJSON}"
	
done

FITSJSON="${FITSJSON} ]"

JSONSTRING="{\"purefit\":${PUREFITSTATUS}, \"fits\":${FITSJSON} }"
echo ${JSONSTRING}

#{"purefit":1, "fits":[ {"method":"raw", "absfit":1, "peakdiff":0.138002, "gdconc":0.057087 }, {"method":"simple", "absfit":1, "peakdiff":0.121950, "gdconc":0.057033 }, {"method":"complex", "absfit":1, "peakdiff":0.123711, "gdconc":0.056937 } ] }
