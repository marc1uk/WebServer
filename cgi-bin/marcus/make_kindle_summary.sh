#!/bin/bash
CGIDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# but first setup root
cd /home/pi/GDConcMeasure/
. Setup.sh
cd ${CGIDIR}
root -b -q makeKindleSummary.C

# add the overlay
convert ${CGIDIR}/kindle_history.png ${CGIDIR}/kindle_overlay.png -composite +antialias ${CGIDIR}/kindle_summary.png
