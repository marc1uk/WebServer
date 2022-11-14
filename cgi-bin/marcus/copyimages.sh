#!/bin/bash
SCRIPTDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
date > ${SCRIPTDIR}/last_run_time

CGIDIR=/home/pi/WebServer/cgi-bin/marcus

#cd ${CGIDIR}

# invoke the script to regenerate the EGADS shift page status images
${CGIDIR}/make_status_file.sh &> ${SCRIPTDIR}/make_status_file_log.txt

# copy output files to sukap for mirroring to EGADS shift page
# ip obtained from running `getend ahosts sukap01` from a machine connected to SK VPN.
# i guess we need to add kmvpn.icrr.u-tokyo.ac.jp as a DNS server...
# i tried adding it as a nameserver to /etc/resolv.conf but it didn't work
# (although i didn't call `sudo service resolvconf restart` for fear of breaking things)
# `systemctl restart systemd-resolved`
# for now it's hard-coded in /etc/hosts

scp -i ~/.ssh/sk ${CGIDIR}/{transparency_history.png,StatusCanvas.png,gdconc_history.png} moflaher@sukap01:/disk02/usr6/moflaher/GAD/ &> ${SCRIPTDIR}/scp_log.txt
# we also get 'host key verification failed' if the server (sukap01) isn't known
if [ $? -ne 0 ]; then
	# see if that's the issue;
	grep "host key verification failed" ${SCRIPTDIR}/scp_log.txt
	if [ $? -eq 0 ]; then
		# update manually
		#ssh-keygen -R sukap01  # remove old entries
		#ssh-keyscan -Ht sukap01,10.220.11.101 >> ~/.ssh/known_hosts  # add entry ... insecure? maybe
		# another option - add, but don't update if it exists
		ssh -i ~/.ssh/sk -o StrictHostKeyChecking=accept-new moflaher@sukap01 echo "anything"
	fi
fi

