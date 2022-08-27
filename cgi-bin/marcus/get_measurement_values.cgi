#!/bin/bash

# must have this or it complains 'malformed header'
echo -e "Content-type:text/html\n"

# return a dummy value on error
DUMMYSTRING='{"xvals":[1,2,3],"yvals":[1,3,2],"xerrs":[],"yerrs":[]}'

#echo "QUERY_STRING is ${QUERY_STRING}"
QUERY_STRING=${QUERY_STRING:-"a=raw_peakheight1"}
PATTERN='a=(.*)'
[[ ${QUERY_STRING} =~ ${PATTERN} ]]
if [ $? -ne 0 ]; then
	#echo "unrecognised trace type: '"${QUERY_STRING}"'"
	echo -n "${DUMMYSTRING}"
	exit 1
fi
MEASUREMENT=${BASH_REMATCH[1]}
#echo "searching for measurement type: '"${MEASUREMENT}"'"

# set of possible measurements we support.
# use an associative array to map to the corresponding SQL qeury
declare -A KNOWN_MEASUREMENTS
KNOWN_MEASUREMENTS['dark_mean']="SELECT timestamp, values->'mean' FROM data WHERE name='darktrace_params' ORDER BY timestamp ASC"
KNOWN_MEASUREMENTS['dark_range']="SELECT timestamp, values->'width' FROM data WHERE name='darktrace_params' ORDER BY timestamp ASC"
KNOWN_MEASUREMENTS['raw_min']="SELECT timestamp, values->'min' FROM data WHERE name='rawtrace_params' ORDER BY timestamp ASC"
KNOWN_MEASUREMENTS['raw_max']="SELECT timestamp, values->'max' FROM data WHERE name='rawtrace_params' ORDER BY timestamp ASC"
KNOWN_MEASUREMENTS['pure_chi2']="SELECT timestamp, values->'fitChi2' FROM data WHERE name='pure_fit_status' ORDER BY timestamp ASC"
KNOWN_MEASUREMENTS['pure_stretchx']="SELECT timestamp, values->'values'->1 FROM data WHERE name='pure_fit_pars' ORDER BY timestamp ASC"
KNOWN_MEASUREMENTS['pure_stretchy']="SELECT timestamp, values->'values'->0 FROM data WHERE name='pure_fit_pars' ORDER BY timestamp ASC"
KNOWN_MEASUREMENTS['pure_shiftx']="SELECT timestamp, values->'values'->2 FROM data WHERE name='pure_fit_pars' ORDER BY timestamp ASC"
KNOWN_MEASUREMENTS['pure_shifty']="SELECT timestamp, values->'values'->3 FROM data WHERE name='pure_fit_pars' ORDER BY timestamp ASC"
KNOWN_MEASUREMENTS['pure_linearcomp']="SELECT timestamp, values->'values'->4 FROM data WHERE name='pure_fit_pars' ORDER BY timestamp ASC"
KNOWN_MEASUREMENTS['pure_shoulderwid']="SELECT timestamp, values->'values'->7 FROM data WHERE name='pure_fit_pars' ORDER BY timestamp ASC"
KNOWN_MEASUREMENTS['pure_shoulderamp']="SELECT timestamp, values->'values'->5 FROM data WHERE name='pure_fit_pars' ORDER BY timestamp ASC"
KNOWN_MEASUREMENTS['pure_shoulderpos']="SELECT timestamp, values->'values'->6 FROM data WHERE name='pure_fit_pars' ORDER BY timestamp ASC"
KNOWN_MEASUREMENTS['raw_peakheight1']="SELECT timestamp, values->'peak_heights'->0 FROM data WHERE name='gdconcmeasure' AND values->'method'='\"raw\"' ORDER BY timestamp ASC"
KNOWN_MEASUREMENTS['raw_peakheight2']="SELECT timestamp, values->'peak_heights'->1 FROM data WHERE name='gdconcmeasure' AND values->'method'='\"raw\"' ORDER BY timestamp ASC"
KNOWN_MEASUREMENTS['raw_peakheightdiff']="SELECT timestamp, (values->'peak_heights'->0)::float - (values->'peak_heights'->1)::float AS peakdiff FROM data WHERE name='gdconcmeasure' AND values->'method'='\"raw\"' ORDER BY timestamp ASC"
#KNOWN_MEASUREMENTS['simple_peak1_chi2']="SELECT timestamp, values->'absorption_fits'->0->'function' FROM data WHERE name='gdconcmeasure' AND values->'method'='\"simple\"' AND (values->'absorption_fits'->0->'function')::text LIKE '\"f_gaus1_%\"' LIMIT 1"  # not required to match as order of array elements in absorption fit array is preserved
KNOWN_MEASUREMENTS['simple_peak1_chi2']="SELECT timestamp, values->'absorption_fits'->0->'fitstatus'->'fitChi2' FROM data WHERE name='gdconcmeasure' AND values->'method'='\"simple\"' ORDER BY timestamp ASC"
KNOWN_MEASUREMENTS['simple_peak2_chi2']="SELECT timestamp, values->'absorption_fits'->1->'fitstatus'->'fitChi2' FROM data WHERE name='gdconcmeasure' AND values->'method'='\"simple\"' ORDER BY timestamp ASC"
KNOWN_MEASUREMENTS['simple_peakheight1']="SELECT timestamp, values->'peak_heights'->0 FROM data WHERE name='gdconcmeasure' AND values->'method'='\"simple\"' ORDER BY timestamp ASC"
KNOWN_MEASUREMENTS['simple_peakheight2']="SELECT timestamp, values->'peak_heights'->1 FROM data WHERE name='gdconcmeasure' AND values->'method'='\"simple\"' ORDER BY timestamp ASC"
KNOWN_MEASUREMENTS['simple_peakheightdiff']="SELECT timestamp, (values->'peak_heights'->0)::float - (values->'peak_heights'->1)::float AS peakdiff FROM data WHERE name='gdconcmeasure' AND values->'method'='\"simple\"' ORDER BY timestamp ASC"
KNOWN_MEASUREMENTS['complex_chi2']="SELECT timestamp, values->'absorption_fits'->0->'fitstatus'->'fitChi2' FROM data WHERE name='gdconcmeasure' AND values->'method'='\"complex\"' ORDER BY timestamp ASC"
KNOWN_MEASUREMENTS['complex_peakheight1']="SELECT timestamp, values->'peak_heights'->0 FROM data WHERE name='gdconcmeasure' AND values->'method'='\"complex\"' ORDER BY timestamp ASC"
KNOWN_MEASUREMENTS['complex_peakheight2']="SELECT timestamp, values->'peak_heights'->1 FROM data WHERE name='gdconcmeasure' AND values->'method'='\"complex\"' ORDER BY timestamp ASC"
KNOWN_MEASUREMENTS['complex_peakheightdiff']="SELECT timestamp, (values->'peak_heights'->0)::float - (values->'peak_heights'->1)::float AS peakdiff FROM data WHERE name='gdconcmeasure' AND values->'method'='\"complex\"' ORDER BY timestamp ASC"
KNOWN_MEASUREMENTS['raw_gdconc']="SELECT timestamp, values->'conc_and_err'->0 FROM data WHERE name='gdconcmeasure' AND values->'method'='\"raw\"' ORDER BY timestamp ASC"
KNOWN_MEASUREMENTS['simple_gdconc']="SELECT timestamp, values->'conc_and_err'->0 FROM data WHERE name='gdconcmeasure' AND values->'method'='\"simple\"' ORDER BY timestamp ASC"
KNOWN_MEASUREMENTS['complex_gdconc']="SELECT timestamp, values->'conc_and_err'->0 FROM data WHERE name='gdconcmeasure' AND values->'method'='\"complex\"' ORDER BY timestamp ASC"

# we can see if our requested measurement is in the array of known measurements
# by trying to perform a regex match
if [[ ! " ${!KNOWN_MEASUREMENTS[*]} " =~ " ${MEASUREMENT} " ]]; then
	#echo "not in array";
	echo -n "${DUMMYSTRING}"
	exit 1;
fi

# XXX can't use this, SELECT array (...) only allows one column and we need 2 (timestamp)
#echo "sqlquery is '${KNOWN_MEASUREMENTS[${MEASUREMENT}]}'"
# 'SELECT array ( SELECT * From * WHERE * )' formats the result of the first query as an array:
# i.e. turns '8\n8\n8\n8\n8' into { 8,8,8,8 }.
#RESP=$(psql -U postgres -d rundb -t -c "SELECT array ( ${KNOWN_MEASUREMENTS[${MEASUREMENT}]} ) ")

## check the result looks like an array
#PATTERN=' ?\{([0-9\.\-]+,? ?)*\} ?'
#[[ ${RESP} =~ ${PATTERN} ]]
#if [ $? -ne 0 ]; then
#	echo "bad regex match '${RESP}'"
#	#echo ${DUMMYSTRING}
#	exit 1
#fi

## replace postgres array encloses '{ }' with json '[ ]'
#RESP=$(echo ${RESP} | tr '{' '[' | tr '}' ']')
#echo ${RESP}

RESP=$(psql -U postgres -d rundb -t -c "${KNOWN_MEASUREMENTS[${MEASUREMENT}]}")
if [ $? -ne 0 ] || [ -z "${RESP}" ]; then
	#echo "bad response ${RESP}"
	echo -n "${DUMMYSTRING}"
	exit 1
fi

#XVALS=''
#YVALS=''
# loop over the lines and build x and y arrays
# the enclosing quotes around RESP are important here!'
while read -r LINE; do
	# split line into x and y values
	NEXTXVAL=$(echo "${LINE}" | cut -d '|' -f 1);
	NEXTYVAL=$(echo "${LINE}" | cut -d '|' -f 2);
	# trim spaces
	NEXTXVAL=$(echo -n ${NEXTXVAL} | xargs echo -n )
	NEXTYVAL=$(echo -n ${NEXTYVAL} | xargs echo -n )
	# add to arrays
	if [ -z "${XVALS}" ]; then
		XVALS="[\"${NEXTXVAL}\""
	else
		XVALS="${XVALS},\"${NEXTXVAL}\""
	fi
	if [ -z "${YVALS}" ]; then
		YVALS="[${NEXTYVAL}"
	else
		YVALS="${YVALS},${NEXTYVAL}"
	fi
	export XVALS=${XVALS}
	export YVALS=${YVALS}
done < <(echo "${RESP}")
XVALS="${XVALS}]"
YVALS="${YVALS}]"

echo -n "{ \"xvals\":${XVALS}, \"yvals\":${YVALS} }"

