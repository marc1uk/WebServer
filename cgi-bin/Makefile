all:
	g++ control.cpp -o control.cgi -L ./setup/ToolDAQFramework/lib -lStore -lServiceDiscovery -L ./setup/cgicc/lib -lcgicc  -I /usr/local/include -I ./setup/ToolDAQFramework/include -I ./setup/boost_1_66_0/install/include/  -I ./setup/zeromq-4.0.7/include -L ./setup/boost_1_66_0/install/lib  -lboost_date_time -lboost_serialization  -lboost_iostreams  -L ./setup/zeromq-4.0.7/lib -lzmq 
	chmod a+x control.cgi 
	g++ controlin.cpp -o controlin.cgi  -L ./setup/ToolDAQFramework/lib -lStore -lServiceDiscovery -L ./setup/cgicc/lib -lcgicc  -I /usr/local/include -I ./setup/ToolDAQFramework/include -I ./setup/boost_1_66_0/install/include/  -I ./setup/zeromq-4.0.7/include -L ./setup/boost_1_66_0/install/lib  -lboost_date_time -lboost_serialization  -lboost_iostreams  -L ./setup/zeromq-4.0.7/lib -lzmq -I ./setup/cgicc/include
	chmod a+x controlin.cgi
	g++ test.cpp -o test.cgi  -L ./setup/ToolDAQFramework/lib -lStore -lServiceDiscovery -L ./setup/cgicc/lib -lcgicc  -I /usr/local/include -I ./setup/ToolDAQFramework/include -I ./setup/boost_1_66_0/install/include/  -I ./setup/zeromq-4.0.7/include -L ./setup/boost_1_66_0/install/lib  -lboost_date_time -lboost_serialization  -lboost_iostreams  -L ./setup/zeromq-4.0.7/lib -lzmq -I ./setup/cgicc/include
	chmod a+x test.cgi
	g++ transmitt.cpp -o transmitt.cgi  -L ./setup/ToolDAQFramework/lib -lStore -lServiceDiscovery -L ./setup/cgicc/lib -lcgicc  -I /usr/local/include -I ./setup/ToolDAQFramework/include -I ./setup/boost_1_66_0/install/include/  -I ./setup/zeromq-4.0.7/include -L ./setup/boost_1_66_0/install/lib  -lboost_date_time -lboost_serialization  -lboost_iostreams  -L ./setup/zeromq-4.0.7/lib -lzmq -I ./setup/cgicc/include
	chmod a+x transmitt.cgi
	g++ transmitt_debug.cpp -o transmitt_debug.cgi  -L ./setup/ToolDAQFramework/lib -lStore -lServiceDiscovery -L ./setup/cgicc/lib -lcgicc  -I /usr/local/include -I ./setup/ToolDAQFramework/include -I ./setup/boost_1_66_0/install/include/  -I ./setup/zeromq-4.0.7/include -L ./setup/boost_1_66_0/install/lib  -lboost_date_time -lboost_serialization  -lboost_iostreams  -L ./setup/zeromq-4.0.7/lib -lzmq -I ./setup/cgicc/include
	chmod a+x transmitt_debug.cgi

	g++ js_transmit.cpp -o js_transmit.cgi  -L ./setup/ToolDAQFramework/lib -lStore -lServiceDiscovery -L ./setup/cgicc/lib -lcgicc  -I /usr/local/include -I ./setup/ToolDAQFramework/include -I ./setup/boost_1_66_0/install/include/  -I ./setup/zeromq-4.0.7/include -L ./setup/boost_1_66_0/install/lib  -lboost_date_time -lboost_serialization  -lboost_iostreams  -L ./setup/zeromq-4.0.7/lib -lzmq -I ./setup/cgicc/include
	chmod a+x js_transmit.cgi


#g++ logbook.cpp -o logbook.cgi -L /usr/local/lib  -lcgicc  -I /usr/local/include
#	chmod a+x logbook.cgi
#	g++ logs.cpp -o logs.cgi
#	chmod a+x logs.cgi
#	g++ DAQ.cpp -o DAQ.cgi
#	chmod a+x DAQ.cgi
#	g++ settings.cpp -o settings.cgi -L /usr/local/lib -lcgicc -I /usr/local/include
#	chmod a+x settings.cgi
#	g++ settingsin.cpp -o settingsin.cgi -L /usr/local/lib -lcgicc -I /usr/local/include
#	chmod a+x settingsin.cgi
#	g++ settingsin2.cpp -o settingsin2.cgi -L /usr/local/lib -lcgicc -I /usr/local/include
#	chmod a+x settingsin2.cgi
#	g++ settingsin3.cpp -o settingsin3.cgi -L /usr/local/lib -lcgicc -I /usr/local/include
#	chmod a+x settingsin3.cgi
