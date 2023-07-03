#!/bin/bash
SCRIPTDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# but first setup root
cd /home/pi/GDConcMeasure/
. Setup.sh
cd ${SCRIPTDIR}
root -b -q makeKindleSummary.C
