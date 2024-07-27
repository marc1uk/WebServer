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
PUREFITSTATUS=$(psql -U postgres -d rundb -t -c "SELECT values::json->'datafit_success' FROM data WHERE name='gdconcmeasure' AND tool='MatthewAnalysisStrikesBack' ORDER BY timestamp DESC LIMIT 1")
if [ $? -ne 0 ] || [ -z "${PUREFITSTATUS}" ]; then
	PUREFITSTATUS="0"
else
	# bash threw a weird i think because of a preceding space that it only showed sometimes.
	# so explicitly convert it to number
	let PUREFITSTATUS=$(echo ${PUREFITSTATUS})
	#echo "PUREFITSTATUS is ${PUREFITSTATUS}"
fi

METHODS=( "raw" "simple" "complex" )

ABSFITSTATUS=$(psql -U postgres -d rundb -At -c "SELECT values->'absfit_success' FROM data WHERE name='gdconcmeasure' AND tool='MatthewAnalysisStrikesBack' ORDER BY timestamp DESC LIMIT 1")

JSONSTRING="{\"purefit\":${PUREFITSTATUS}, \"absfit\":${ABSFITSTATUS} }"
echo ${JSONSTRING}

