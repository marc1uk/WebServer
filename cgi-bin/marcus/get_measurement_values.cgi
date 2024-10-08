#!/bin/bash
#set -x

# must have this or it complains 'malformed header'
echo -e "Content-type:text/html\n"

# return a dummy value on error
DUMMYSTRING='{"xvals":[1,2,3],"yvals":[1,3,2],"xerrs":[],"yerrs":[]}'

echo "QUERY_STRING is '${QUERY_STRING}'" > ./debug.txt
QUERY_STRING=${QUERY_STRING:-"a=raw_peakheight1"}
#PATTERN='a=([^&]+)*[&b=]+?(.*)'
#[[ ${QUERY_STRING} =~ ${PATTERN} ]]
#if [ $? -ne 0 ]; then
#	echo "unrecognised trace type: '"${QUERY_STRING}"'"
#	echo -n "${DUMMYSTRING}"
#	exit 1
#fi
#MEASUREMENT=${BASH_REMATCH[1]}
#LED=${BASH_REMATCH[2]}

IFS='&' read -r -a ARGS <<< "${QUERY_STRING}"
DEBUG="false"
for ARG in "${ARGS[@]}"; do
	#echo "next arg: '${VAL}' <br>"
	KEY=$(echo ${ARG} | cut -d '=' -f 1)
	VAL=$(echo ${ARG} | cut -d '=' -f 2)
	if [ "${KEY}" == "a" ]; then
		MEASUREMENT="${VAL}"
	elif [ "${KEY}" == "b" ]; then
		LED="${VAL}"
	elif [ "${KEY}" == "c" ]; then
		MAXVALS="${VAL}"
	elif [ "${KEY}" == "d" ]; then
		MEASUREMENT="${MEASUREMENT}_${VAL}"
	elif [ "${KEY}" == "e" ]; then
		DEBUG="${VAL}"
	#else
	#	echo "${DUMMYSTRING}"
	#	exit 1
	fi
done

if [ -z "${LED}" ]; then
	LED="%"
fi
if [ "${MEASUREMENT}" == "mem" ] || [ "${MEASUREMENT}" == "cpu" ] || [ "${MEASUREMENT}" == "hdd1" ] || [ "${MEASUREMENT}" == "temp" ]; then
	DBNAME="gd"
else
	DBNAME="rundb"
fi

DEBUGCRIT='run>10000 AND'
#DEBUGCRIT="run>10000 AND timestamp > '2023-12-26'::timestamptz AND timestamp < '2024-02-01'::timestamptz AND"
if [ "${DEBUG}" == "false" ]; then
	DEBUGCRIT="run<10000 AND"
fi

TOOL='MatthewAnalysisStrikesBack'
#TOOL='MarcusAnalysis'

#echo "measurement type: '"${MEASUREMENT}"'"
#echo "led type: '"${LED}"'"
#echo "max vals: '${MAXVALS}'"

# set of possible measurements we support.
# use an associative array to map to the corresponding SQL qeury
declare -A KNOWN_MEASUREMENTS_Y
KNOWN_MEASUREMENTS_Y['dark_mean']="SELECT values->'mean' FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='darktrace_params' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_Y['dark_range']="SELECT values->'width' FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='darktrace_params' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_Y['raw_min']="SELECT values->'min' FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='rawtrace_params' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_Y['raw_max']="SELECT values->'max' FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='rawtrace_params' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_Y['pure_chi2']="SELECT values->'fitChi2' FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='pure_fit_status' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_Y['pure_stretchx']="SELECT values->'values'->1 FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='pure_fit_pars' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_Y['pure_stretchy']="SELECT values->'values'->0 FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='pure_fit_pars' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_Y['pure_shiftx']="SELECT values->'values'->2 FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='pure_fit_pars' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_Y['pure_shifty']="SELECT values->'values'->3 FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='pure_fit_pars' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_Y['pure_linearcomp']="SELECT values->'values'->4 FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='pure_fit_pars' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_Y['pure_shoulderwid']="SELECT values->'values'->7 FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='pure_fit_pars' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_Y['pure_shoulderamp']="SELECT values->'values'->5 FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='pure_fit_pars' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_Y['pure_shoulderpos']="SELECT values->'values'->6 FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='pure_fit_pars' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_Y['raw_peakheight1']="SELECT values->'peak_heights'->0 FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='gdconcmeasure' AND values->'method'='\"raw\"' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_Y['raw_peakheight2']="SELECT values->'peak_heights'->1 FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='gdconcmeasure' AND values->'method'='\"raw\"' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_Y['raw_peakheightdiff']="SELECT (values->'peak_heights'->0)::float - (values->'peak_heights'->1)::float AS peakdiff FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='gdconcmeasure' AND values->'method'='\"raw\"' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_Y['simple_peak1_chi2']="SELECT values->'absorption_fits'->0->'fitstatus'->'fitChi2' FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='gdconcmeasure' AND values->'method'='\"simple\"' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_Y['simple_peak2_chi2']="SELECT values->'absorption_fits'->1->'fitstatus'->'fitChi2' FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='gdconcmeasure' AND values->'method'='\"simple\"' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_Y['simple_peakheight1']="SELECT values->'peak_heights'->0 FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='gdconcmeasure' AND values->'method'='\"simple\"' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_Y['simple_peakheight2']="SELECT values->'peak_heights'->1 FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='gdconcmeasure' AND values->'method'='\"simple\"' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_Y['simple_peakheightdiff']="SELECT (values->'peak_heights'->0)::float - (values->'peak_heights'->1)::float AS peakdiff FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='gdconcmeasure' AND values->'method'='\"simple\"' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_Y['complex_chi2']="SELECT values->'absorption_fits'->0->'fitstatus'->'fitChi2' FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='gdconcmeasure' AND values->'method'='\"complex\"' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_Y['complex_peakheight1']="SELECT values->'peak_heights'->0 FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='gdconcmeasure' AND values->'method'='\"complex\"' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_Y['complex_peakheight2']="SELECT values->'peak_heights'->1 FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='gdconcmeasure' AND values->'method'='\"complex\"' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_Y['complex_peakheightdiff']="SELECT (values->'peak_heights'->0)::float - (values->'peak_heights'->1)::float AS peakdiff FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='gdconcmeasure' AND values->'method'='\"complex\"' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_Y['raw_gdconc']="SELECT values->'conc_and_err'->0 FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='gdconcmeasure' AND values->'method'='\"raw\"' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_Y['simple_gdconc']="SELECT values->'conc_and_err'->0 FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='gdconcmeasure' AND values->'method'='\"simple\"' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_Y['complex_gdconc']="SELECT values->'conc_and_err'->0 FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='gdconcmeasure' AND values->'method'='\"complex\"' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"

KNOWN_MEASUREMENTS_Y['pure_scaling']="SELECT values->'values'->0 FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='data_fit_pars' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_Y['pure_translation']="SELECT values->'values'->1 FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='data_fit_pars' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_Y['pure_stretch']="SELECT values->'values'->2 FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='data_fit_pars' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_Y['gd_scaling']="SELECT values->'values'->3 FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='data_fit_pars' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_Y['second_order_background']="SELECT values->'values'->4 FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='data_fit_pars' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_Y['first_order_background']="SELECT values->'values'->5 FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='data_fit_pars' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_Y['zeroth_order_background']="SELECT values->'values'->6 FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='data_fit_pars' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"

KNOWN_MEASUREMENTS_Y['abs_fitpar0']="SELECT values->'values'->0 FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='abs_fit_pars' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_Y['abs_fitpar1']="SELECT values->'values'->1 FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='abs_fit_pars' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_Y['abs_fitpar2']="SELECT values->'values'->2 FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='abs_fit_pars' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_Y['abs_fitpar3']="SELECT values->'values'->3 FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='abs_fit_pars' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_Y['abs_fitpar4']="SELECT values->'values'->4 FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='abs_fit_pars' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_Y['abs_fitpar5']="SELECT values->'values'->5 FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='abs_fit_pars' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"

#KNOWN_MEASUREMENTS_Y['led_intensity']="SELECT jsonb_array_elements(values->'yvals') AS value FROM webpage WHERE name='pure_scaled' AND ledname LIKE '${LED}' AND timestamp = ( SELECT MAX(timestamp) FROM webpage WHERE name='pure_scaled') ORDER BY value DESC LIMIT 1"
KNOWN_MEASUREMENTS_Y['led_intensity']="SELECT values FROM data WHERE ${DEBUGCRIT} name='led_intensity' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"

KNOWN_MEASUREMENTS_Y['gdconc']="SELECT values->'conc_and_err'->0 FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='gdconcmeasure' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_Y['metric']="SELECT values->'metric_and_err'->0 FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='gdconcmeasure' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_Y['purefit_chi2']="SELECT values->'fitChi2' FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='data_fit_status' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_Y['absfit_chi2']="SELECT values->'fitChi2' FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='abs_fit_status' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"

KNOWN_MEASUREMENTS_Y['transparency_red']="SELECT values->'red'->'value' FROM data WHERE ${DEBUGCRIT} name='transparency_samples' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_Y['transparency_green']="SELECT values->'green'->'value' FROM data WHERE ${DEBUGCRIT} name='transparency_samples' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_Y['transparency_blue']="SELECT values->'blue'->'value' FROM data WHERE ${DEBUGCRIT} name='transparency_samples' ORDER BY timestamp DESC"

KNOWN_MEASUREMENTS_Y['mem']="SELECT mem FROM stats ORDER BY time DESC"
KNOWN_MEASUREMENTS_Y['cpu']="SELECT cpu FROM stats ORDER BY time DESC"
KNOWN_MEASUREMENTS_Y['temp']="SELECT temp FROM stats ORDER BY time DESC"
KNOWN_MEASUREMENTS_Y['hdd1']="SELECT hdd1 FROM stats ORDER BY time DESC"

KNOWN_MEASUREMENTS_Y['invalve']="SELECT values->'invalve' FROM webpage WHERE name='gpio_status' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_Y['outvalve']="SELECT values->'outvalve' FROM webpage WHERE name='gpio_status' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_Y['pump']="SELECT values->'pump' FROM webpage WHERE name='gpio_status' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_Y['power']="SELECT values->'power' FROM webpage WHERE name='gpio_status' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_Y['valve_temp']="SELECT values FROM webpage WHERE name='valve_temp' ORDER BY timestamp DESC"

declare -A KNOWN_MEASUREMENTS_X
KNOWN_MEASUREMENTS_X['dark_mean']="SELECT timestamp at time zone 'europe/london' at time zone 'jst' FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='darktrace_params' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_X['dark_range']="SELECT timestamp at time zone 'europe/london' at time zone 'jst' FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='darktrace_params' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_X['raw_min']="SELECT timestamp at time zone 'europe/london' at time zone 'jst' FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='rawtrace_params' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_X['raw_max']="SELECT timestamp at time zone 'europe/london' at time zone 'jst' FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='rawtrace_params' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_X['pure_chi2']="SELECT timestamp at time zone 'europe/london' at time zone 'jst' FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='pure_fit_status' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_X['pure_stretchx']="SELECT timestamp at time zone 'europe/london' at time zone 'jst' FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='pure_fit_pars' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_X['pure_stretchy']="SELECT timestamp at time zone 'europe/london' at time zone 'jst' FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='pure_fit_pars' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_X['pure_shiftx']="SELECT timestamp at time zone 'europe/london' at time zone 'jst' FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='pure_fit_pars' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_X['pure_shifty']="SELECT timestamp at time zone 'europe/london' at time zone 'jst' FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='pure_fit_pars' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_X['pure_linearcomp']="SELECT timestamp at time zone 'europe/london' at time zone 'jst' FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='pure_fit_pars' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_X['pure_shoulderwid']="SELECT timestamp at time zone 'europe/london' at time zone 'jst' FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='pure_fit_pars' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_X['pure_shoulderamp']="SELECT timestamp at time zone 'europe/london' at time zone 'jst' FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='pure_fit_pars' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_X['pure_shoulderpos']="SELECT timestamp at time zone 'europe/london' at time zone 'jst' FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='pure_fit_pars' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_X['raw_peakheight1']="SELECT timestamp at time zone 'europe/london' at time zone 'jst' FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='gdconcmeasure' AND values->'method'='\"raw\"' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_X['raw_peakheight2']="SELECT timestamp at time zone 'europe/london' at time zone 'jst' FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='gdconcmeasure' AND values->'method'='\"raw\"' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_X['raw_peakheightdiff']="SELECT timestamp at time zone 'europe/london' at time zone 'jst' FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='gdconcmeasure' AND values->'method'='\"raw\"' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_X['simple_peak1_chi2']="SELECT timestamp at time zone 'europe/london' at time zone 'jst' FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='gdconcmeasure' AND values->'method'='\"simple\"' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_X['simple_peak2_chi2']="SELECT timestamp at time zone 'europe/london' at time zone 'jst' FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='gdconcmeasure' AND values->'method'='\"simple\"' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_X['simple_peakheight1']="SELECT timestamp at time zone 'europe/london' at time zone 'jst' FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='gdconcmeasure' AND values->'method'='\"simple\"' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_X['simple_peakheight2']="SELECT timestamp at time zone 'europe/london' at time zone 'jst' FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='gdconcmeasure' AND values->'method'='\"simple\"' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_X['simple_peakheightdiff']="SELECT timestamp at time zone 'europe/london' at time zone 'jst' FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='gdconcmeasure' AND values->'method'='\"simple\"' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_X['complex_chi2']="SELECT timestamp at time zone 'europe/london' at time zone 'jst' FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='gdconcmeasure' AND values->'method'='\"complex\"' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_X['complex_peakheight1']="SELECT timestamp at time zone 'europe/london' at time zone 'jst' FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='gdconcmeasure' AND values->'method'='\"complex\"' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_X['complex_peakheight2']="SELECT timestamp at time zone 'europe/london' at time zone 'jst' FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='gdconcmeasure' AND values->'method'='\"complex\"' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_X['complex_peakheightdiff']="SELECT timestamp at time zone 'europe/london' at time zone 'jst' FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='gdconcmeasure' AND values->'method'='\"complex\"' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_X['raw_gdconc']="SELECT timestamp at time zone 'europe/london' at time zone 'jst' FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='gdconcmeasure' AND values->'method'='\"raw\"' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_X['simple_gdconc']="SELECT timestamp at time zone 'europe/london' at time zone 'jst' FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='gdconcmeasure' AND values->'method'='\"simple\"' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_X['complex_gdconc']="SELECT timestamp at time zone 'europe/london' at time zone 'jst' FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='gdconcmeasure' AND values->'method'='\"complex\"' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"

KNOWN_MEASUREMENTS_X['led_intensity']="SELECT timestamp at time zone 'europe/london' at time zone 'jst' FROM data WHERE ${DEBUGCRIT} name='led_intensity' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_X['metric']="SELECT timestamp at time zone 'europe/london' at time zone 'jst' FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='gdconcmeasure' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_X['purefit_chi2']="SELECT timestamp at time zone 'europe/london' at time zone 'jst' FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='data_fit_status' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_X['absfit_chi2']="SELECT timestamp at time zone 'europe/london' at time zone 'jst' FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='abs_fit_status' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"

KNOWN_MEASUREMENTS_X['pure_scaling']="SELECT timestamp at time zone 'europe/london' at time zone 'jst' FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='data_fit_pars' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_X['pure_translation']="SELECT timestamp at time zone 'europe/london' at time zone 'jst' FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='data_fit_pars' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_X['pure_stretch']="SELECT timestamp at time zone 'europe/london' at time zone 'jst' FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='data_fit_pars' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_X['gd_scaling']="SELECT timestamp at time zone 'europe/london' at time zone 'jst' FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='data_fit_pars' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_X['second_order_background']="SELECT timestamp at time zone 'europe/london' at time zone 'jst' FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='data_fit_pars' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_X['first_order_background']="SELECT timestamp at time zone 'europe/london' at time zone 'jst' FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='data_fit_pars' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_X['zeroth_order_background']="SELECT timestamp at time zone 'europe/london' at time zone 'jst' FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='data_fit_pars' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"

KNOWN_MEASUREMENTS_X['abs_fitpar0']="SELECT timestamp at time zone 'europe/london' at time zone 'jst' FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='abs_fit_pars' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_X['abs_fitpar1']="SELECT timestamp at time zone 'europe/london' at time zone 'jst' FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='abs_fit_pars' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_X['abs_fitpar2']="SELECT timestamp at time zone 'europe/london' at time zone 'jst' FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='abs_fit_pars' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_X['abs_fitpar3']="SELECT timestamp at time zone 'europe/london' at time zone 'jst' FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='abs_fit_pars' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_X['abs_fitpar4']="SELECT timestamp at time zone 'europe/london' at time zone 'jst' FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='abs_fit_pars' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_X['abs_fitpar5']="SELECT timestamp at time zone 'europe/london' at time zone 'jst' FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='abs_fit_pars' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"

KNOWN_MEASUREMENTS_X['gdconc']="SELECT timestamp at time zone 'europe/london' at time zone 'jst' FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='gdconcmeasure' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"

KNOWN_MEASUREMENTS_X['transparency_red']="SELECT timestamp at time zone 'europe/london' at time zone 'jst' FROM data WHERE ${DEBUGCRIT} name='transparency_samples' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_X['transparency_green']="SELECT timestamp at time zone 'europe/london' at time zone 'jst' FROM data WHERE ${DEBUGCRIT} name='transparency_samples' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_X['transparency_blue']="SELECT timestamp at time zone 'europe/london' at time zone 'jst' FROM data WHERE ${DEBUGCRIT} name='transparency_samples' ORDER BY timestamp DESC"

KNOWN_MEASUREMENTS_X['mem']="SELECT time FROM stats ORDER BY time DESC"
KNOWN_MEASUREMENTS_X['cpu']="SELECT time FROM stats ORDER BY time DESC"
KNOWN_MEASUREMENTS_X['temp']="SELECT time FROM stats ORDER BY time DESC"
KNOWN_MEASUREMENTS_X['hdd1']="SELECT time FROM stats ORDER BY time DESC"

KNOWN_MEASUREMENTS_X['invalve']="SELECT timestamp at time zone 'europe/london' at time zone 'jst' FROM webpage WHERE name='gpio_status' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_X['outvalve']="SELECT timestamp at time zone 'europe/london' at time zone 'jst' FROM webpage WHERE name='gpio_status' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_X['pump']="SELECT timestamp at time zone 'europe/london' at time zone 'jst' FROM webpage WHERE AND name='gpio_status' BY timestamp DESC"
KNOWN_MEASUREMENTS_X['power']="SELECT timestamp at time zone 'europe/london' at time zone 'jst' FROM webpage WHERE name='gpio_status' ORDER BY timestamp DESC"
KNOWN_MEASUREMENTS_X['valve_temp']="SELECT timestamp at time zone 'europe/london' at time zone 'jst' FROM webpage WHERE name='valve_temp' ORDER BY timestamp DESC"

if [[ ! " ${!KNOWN_MEASUREMENTS_X[*]} " =~ " ${MEASUREMENT} " ]] || [[ ! " ${!KNOWN_MEASUREMENTS_Y[*]} " =~ " ${MEASUREMENT} " ]]; then
	echo "measuremenet '${MEASUREMENT}' not in array" >> ./debug.txt
	echo -n "${DUMMYSTRING}"
	exit 1;
fi
#echo "known measurement"

QUERY_X="${KNOWN_MEASUREMENTS_X[${MEASUREMENT}]}"
QUERY_Y="${KNOWN_MEASUREMENTS_Y[${MEASUREMENT}]}"

if [ ! -z "${MAXVALS}" ]; then
	QUERY_X="${QUERY_X} LIMIT ${MAXVALS}";
	QUERY_Y="${QUERY_Y} LIMIT ${MAXVALS}";
fi
echo "query X is '${QUERY_X}'" >> ./debug.txt
echo "query Y is '${QUERY_Y}'" >> ./debug.txt

# 'SELECT array ( SELECT * From * WHERE ${DEBUGCRIT} * )' formats the result of the first query as an array:
# i.e. turns '8\n8\n8\n8\n8' into { 8,8,8,8 }.
# note that SELECT array (...) only allows one column, so we have to run two queriest
RESP_X=$(psql -U postgres -d "${DBNAME}" -t -c "SELECT array ( ${QUERY_X} ) " )
RESP_Y=$(psql -U postgres -d "${DBNAME}" -t -c "SELECT array ( ${QUERY_Y} ) " )

echo "RESP_X='${RESP_X}'" >> ./debug.txt
echo "RESP_Y='${RESP_Y}'" >> ./debug.txt

# check the X array looks like an array of timestamps
PATTERN=' ?\{("[0-9]{4}\-[0-9]{2}\-[0-9]{2}[T ][0-9]{2}\:[0-9]{2}\:[0-9]{2}\.?[0-9]*",? ?)*\} ?'
[[ ${RESP_X} =~ ${PATTERN} ]]
if [ $? -ne 0 ]; then
	echo "bad regex match '${RESP_X}'" >> ./debug.txt
	echo ${DUMMYSTRING}
	exit 1
fi
# check the Y array looks like an array of values
PATTERN=' ?\{([?0-9\.\-]+,? ?)*\} ?'
[[ ${RESP_Y} =~ ${PATTERN} ]]
if [ $? -ne 0 ]; then
	echo "bad regex match '${RESP_Y}'" >> ./debug.txt
	echo ${DUMMYSTRING}
	exit 1
fi

# trim leading space and enclosing curly braces
# and add in json square brackets to enclose array
RESP_X=$(echo "[${RESP_X:2:-1}]")
RESP_Y=$(echo "[${RESP_Y:2:-1}]")

echo -n "{ \"xvals\":${RESP_X}, \"yvals\":${RESP_Y} }"
exit 1




## set of possible measurements we support.
## use an associative array to map to the corresponding SQL qeury
#declare -A KNOWN_MEASUREMENTS
#KNOWN_MEASUREMENTS['dark_mean']="SELECT timestamp, values->'mean' FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='darktrace_params' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
#KNOWN_MEASUREMENTS['dark_range']="SELECT timestamp, values->'width' FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='darktrace_params' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
#KNOWN_MEASUREMENTS['raw_min']="SELECT timestamp, values->'min' FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='rawtrace_params' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
#KNOWN_MEASUREMENTS['raw_max']="SELECT timestamp, values->'max' FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='rawtrace_params' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
#KNOWN_MEASUREMENTS['pure_chi2']="SELECT timestamp, values->'fitChi2' FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='pure_fit_status' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
#KNOWN_MEASUREMENTS['pure_stretchx']="SELECT timestamp, values->'values'->1 FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='pure_fit_pars' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
#KNOWN_MEASUREMENTS['pure_stretchy']="SELECT timestamp, values->'values'->0 FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='pure_fit_pars' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
#KNOWN_MEASUREMENTS['pure_shiftx']="SELECT timestamp, values->'values'->2 FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='pure_fit_pars' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
#KNOWN_MEASUREMENTS['pure_shifty']="SELECT timestamp, values->'values'->3 FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='pure_fit_pars' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
#KNOWN_MEASUREMENTS['pure_linearcomp']="SELECT timestamp, values->'values'->4 FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='pure_fit_pars' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
#KNOWN_MEASUREMENTS['pure_shoulderwid']="SELECT timestamp, values->'values'->7 FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='pure_fit_pars' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
#KNOWN_MEASUREMENTS['pure_shoulderamp']="SELECT timestamp, values->'values'->5 FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='pure_fit_pars' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
#KNOWN_MEASUREMENTS['pure_shoulderpos']="SELECT timestamp, values->'values'->6 FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='pure_fit_pars' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
#KNOWN_MEASUREMENTS['raw_peakheight1']="SELECT timestamp, values->'peak_heights'->0 FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='gdconcmeasure' AND values->'method'='\"raw\"' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
#KNOWN_MEASUREMENTS['raw_peakheight2']="SELECT timestamp, values->'peak_heights'->1 FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='gdconcmeasure' AND values->'method'='\"raw\"' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
#KNOWN_MEASUREMENTS['raw_peakheightdiff']="SELECT timestamp, (values->'peak_heights'->0)::float - (values->'peak_heights'->1)::float AS peakdiff FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='gdconcmeasure' AND values->'method'='\"raw\"' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
#KNOWN_MEASUREMENTS['simple_peak1_chi2']="SELECT timestamp, values->'absorption_fits'->0->'function' FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='gdconcmeasure' AND values->'method'='\"simple\"' AND (values->'absorption_fits'->0->'function')::text LIKE '\"f_gaus1_%\"' LIMIT 1"  # not required to match as order of array elements in absorption fit array is preserved
#KNOWN_MEASUREMENTS['simple_peak1_chi2']="SELECT timestamp, values->'absorption_fits'->0->'fitstatus'->'fitChi2' FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='gdconcmeasure' AND values->'method'='\"simple\"' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
#KNOWN_MEASUREMENTS['simple_peak2_chi2']="SELECT timestamp, values->'absorption_fits'->1->'fitstatus'->'fitChi2' FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='gdconcmeasure' AND values->'method'='\"simple\"' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
#KNOWN_MEASUREMENTS['simple_peakheight1']="SELECT timestamp, values->'peak_heights'->0 FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='gdconcmeasure' AND values->'method'='\"simple\"' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
#KNOWN_MEASUREMENTS['simple_peakheight2']="SELECT timestamp, values->'peak_heights'->1 FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='gdconcmeasure' AND values->'method'='\"simple\"' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
#KNOWN_MEASUREMENTS['simple_peakheightdiff']="SELECT timestamp, (values->'peak_heights'->0)::float - (values->'peak_heights'->1)::float AS peakdiff FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='gdconcmeasure' AND values->'method'='\"simple\"' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
#KNOWN_MEASUREMENTS['complex_chi2']="SELECT timestamp, values->'absorption_fits'->0->'fitstatus'->'fitChi2' FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='gdconcmeasure' AND values->'method'='\"complex\"' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
#KNOWN_MEASUREMENTS['complex_peakheight1']="SELECT timestamp, values->'peak_heights'->0 FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='gdconcmeasure' AND values->'method'='\"complex\"' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
#KNOWN_MEASUREMENTS['complex_peakheight2']="SELECT timestamp, values->'peak_heights'->1 FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='gdconcmeasure' AND values->'method'='\"complex\"' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
#KNOWN_MEASUREMENTS['complex_peakheightdiff']="SELECT timestamp, (values->'peak_heights'->0)::float - (values->'peak_heights'->1)::float AS peakdiff FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='gdconcmeasure' AND values->'method'='\"complex\"' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
#KNOWN_MEASUREMENTS['raw_gdconc']="SELECT timestamp, values->'conc_and_err'->0 FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='gdconcmeasure' AND values->'method'='\"raw\"' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
#KNOWN_MEASUREMENTS['simple_gdconc']="SELECT timestamp, values->'conc_and_err'->0 FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='gdconcmeasure' AND values->'method'='\"simple\"' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"
#KNOWN_MEASUREMENTS['complex_gdconc']="SELECT timestamp, values->'conc_and_err'->0 FROM data WHERE ${DEBUGCRIT} tool='${TOOL}' AND name='gdconcmeasure' AND values->'method'='\"complex\"' AND ledname LIKE '${LED}' ORDER BY timestamp DESC"

# we can see if our requested measurement is in the array of known measurements
# by trying to perform a regex match
#if [[ ! " ${!KNOWN_MEASUREMENTS[*]} " =~ " ${MEASUREMENT} " ]]; then
#	#echo "not in array";
#	echo -n "${DUMMYSTRING}"
#	exit 1;
#fi
#echo "known measurement"

### replace postgres array encloses '{ }' with json '[ ]'
##RESP=$(echo ${RESP} | tr '{' '[' | tr '}' ']')
##echo ${RESP}

#echo "running query"
#RESP=$(psql -U postgres -d rundb -t -c "${KNOWN_MEASUREMENTS[${MEASUREMENT}]}")
#if [ $? -ne 0 ] || [ -z "${RESP}" ]; then
#	#echo "bad response ${RESP}"
#	echo -n "${DUMMYSTRING}"
#	exit 1
#fi
#echo "query done"

##XVALS=''
##YVALS=''
## loop over the lines and build x and y arrays
## the enclosing quotes around RESP are important here!'
## XXX for some reason this loop was REALLY slow, so two queries using 'SELECT array (...)' seems faster.
#echo "parsing result"
#while read -r LINE; do
#	echo -n "."
#	# split line into x and y values
#	NEXTXVAL=$(echo "${LINE}" | cut -d '|' -f 1);
#	NEXTYVAL=$(echo "${LINE}" | cut -d '|' -f 2);
#	# trim spaces
#	NEXTXVAL=$(echo -n ${NEXTXVAL} | xargs echo -n )
#	NEXTYVAL=$(echo -n ${NEXTYVAL} | xargs echo -n )
#	# add to arrays
#	if [ -z "${XVALS}" ]; then
#		XVALS="[\"${NEXTXVAL}\""
#	else
#		XVALS="${XVALS},\"${NEXTXVAL}\""
#	fi
#	if [ -z "${YVALS}" ]; then
#		YVALS="[${NEXTYVAL}"
#	else
#		YVALS="${YVALS},${NEXTYVAL}"
#	fi
#	export XVALS=${XVALS}
#	export YVALS=${YVALS}
#done < <(echo "${RESP}")
#echo "parsing done"
#XVALS="${XVALS}]"
#YVALS="${YVALS}]"

#echo -n "{ \"xvals\":${XVALS}, \"yvals\":${YVALS} }"

