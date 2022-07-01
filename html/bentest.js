 
function httpGet(theUrl){
    if(window.XMLHttpRequest)
    {// code for IE7+, Firefox, Chrome, Opera, Safari
	xmlhttp=new XMLHttpRequest();
    }
    else
    {// code for IE6, IE5
	xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
    }
    xmlhttp.onreadystatechange=function()
    {
	if (xmlhttp.readyState==4 && xmlhttp.status==200)
	{
	    //var barry="[0"+xmlhttp.responseText+"]";
	    //var barry="["+"awsome";
	    //   barry.concat("]","awsome");
	    //   var barry="[10, 20, 70, 40, 50]"
	    data= xmlhttp.responseText.split("@");
	    time= data[0].split(" | ");
	    memory= data[1].split(" | ");
	    cpu= data[2].split(" | ");
	    temp= data[3].split(" | ");
	    hdd1= data[4].split(" | ");
	    hdd2= data[5].split(" | ");
	    // var jerry=Array.from([1, 2, 30, 4, 5]);
	    console.log("here ben");
	    console.log(time[time.length -2]);
	    // console.log(Array.from(barry));
	    // document.getElementById('demo').innerHTML=barry;

	    TESTER2 = document.getElementById('tester');
	    Plotly.react( TESTER2, [
		{
		    x: time,
		    y: memory,
		    name: 'Memory Used'
		},
		{
		    x: time,
		    y: cpu,
		    name: 'CPU Load'
		},
		{
		    x: time,
		    y: temp,
		    visible: "legendonly",
		    name: 'Temperature'

		},
		{
		    x: time,
		    y: hdd1,
		    visible: "legendonly",
		    name: 'HDD 1'

		},
		{
		    x: time,
		    y: hdd2,
		    visible: "legendonly",
		    name: 'HDD 2'

		}
	    ],
			    {
				/*updatemenus: [{
				//    y: 0.8,
				    yanchor: 'top',
				        buttons: [{
					method: 'restyle',
					args: ['line.color', 'red'],
					label: 'red'
					    }, {
					    method: 'restyle',
					    args: ['line.color', 'blue'],
					    label: 'blue'
					        }, {
						method: 'restyle',
						args: ['line.color', 'green'],
						label: 'green'
						    }],
						    }],
				*/
				xaxis: {
				    autorange: true,
				    //    range: ['2021-08-01 18:00:27.442639', '2021-08-07 17:00:25.676744'],
				    //range: ['2021-08-06 18:00:27', '2021-08-07 17:00:25'],

				    rangeselector: {buttons: [
					{
					    count: 1,
					    label: '1hr',
					    step: 'hour',
					    stepmode: 'backward'
					},
					{
					    count: 3,
					    label: '3hr',
					    step: 'hour',
					    stepmode: 'backward'
					},
					{
					    count: 6,
					    label: '6hr',
					    step: 'hour',
					    stepmode: 'backward'
					},
					{
					    count: 12,
					    label: '12h',
					    step: 'hour',
					    stepmode: 'backward'
					},
					{
					    count: 24,
					    label: '24hr',
					    step: 'hour',
					    stepmode: 'backward'
					},
					{
					    count: 3,
					    label: '3d',
					    step: 'day',
					    stepmode: 'backward'
					},
					{
					    count: 7,
					    label: '1w',
					    step: 'day',
					    stepmode: 'backward'
					},
					{
					    count: 1,
					    label: '1m',
					    step: 'month',
					    stepmode: 'backward'
					},
					{step: 'all'}
				    ]},
				    rangeslider: {range: [time[0], time[time.length-2]] },
				    type: 'date'
				}

			    }


			  );

	    // window.alert(barry);
	    return xmlhttp.responseText;

	}
    }
    xmlhttp.open("GET", theUrl, false );
    xmlhttp.send();
}

setInterval(function(){
    httpGet("http://192.168.2.53/cgi-bin/psql.cgi")
}, 300000); 

httpGet("http://192.168.2.53/cgi-bin/psql.cgi");
