import { GetPSQLTable } from '/includes/functions.js';

var audio;
var alarm_message;
var updateinterval;
var alarminterval = "";
var checking_alarm_footer;

if (document.readyState !== 'loading'){
	Init();
} else {
	document.addEventListener("DOMContentLoaded", () => { Init(); });
}

function Init(){
	document.getElementById("btnTestAlarm").addEventListener("click", TestAlarm);
	alarm_message = document.getElementById("alarm_message");
	updateinterval = setInterval(CheckAlarms, 5000);
	try {
		audio = new Audio('/includes/jump.ogg');
	} catch(err){
		console.error(err);
		// TODO add a banner beneath the main ribbow indicating that there was an error
		// loading the audio file and alarms will be silenced
		// (this could be e.g. because the user disallowed audio on the page)
		//const silentbanner = document.createElement...
	}
	checking_alarm_footer = false;
	CheckAlarms();
}

function sleep (ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function TestAlarm(){
	alarm_message.value = "Alarm Test";
	for (let i = 0; i < 6; i++){
		AlarmOn();
		await sleep(1000);
	}
	alarm_message.value = "no current alarm";
}

function CheckAlarms(){
	
	//console.log(`checking background alarms (current status is ${checking_alarm_footer})`);
	
	if(checking_alarm_footer) return;
	checking_alarm_footer=true;
	
	try{
		GetPSQLTable("select device from alarms where silenced=0", "root", "daq", true).then(function(result){
			var table= document.createElement('table');
			table.innerHTML=result;
			
			if(table.rows.length<2){
				AlarmOff();
				
			} else {
				alarm_message.value = table.rows[1].cells[0].innerText;
				if (alarminterval == "") alarminterval = setInterval(AlarmOn, 1000);
				
			}
			
			checking_alarm_footer=false;
		});
	} catch(err){
		console.error(`Error checking background alarms: ${err}`);
		checking_alarm_footer=false;
	}
	
}

function AlarmOn(){
	console.log("Alarm found! BEEP!");
	audio.play();
	if(document.body.style.backgroundColor == "red"){
		document.body.style.backgroundColor = "white";
		alarm_message.style.backgroundColor = "white";
	} else{
		document.body.style.backgroundColor = "red"
		alarm_message.style.backgroundColor = "red";
	}
}

function AlarmOff(){
	clearInterval(alarminterval);
	alarminterval = "";
	document.body.style.backgroundColor = "white";
	alarm_message.style.backgroundColor = "white";
	alarm_message.value =  "no current alarm";
}

