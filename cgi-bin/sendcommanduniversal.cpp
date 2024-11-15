#include <iostream>
#include <vector>
#include <string>
#include <stdio.h>
#include <stdlib.h>
#include <sstream>
#include <fstream>

#include <cgicc/CgiDefs.h>
#include <cgicc/Cgicc.h>
#include <cgicc/HTTPHTMLHeader.h>
#include <cgicc/HTMLClasses.h>

#include <Store.h>

#include "zmq.hpp"



#include <boost/uuid/uuid.hpp>                   // uuid class
#include <boost/uuid/uuid_generators.hpp>        // generators
#include <boost/uuid/uuid_io.hpp>                // streaming operators etc.
#include <boost/date_time/posix_time/posix_time.hpp>

using namespace std;
using namespace cgicc;
using namespace ToolFramework;

int main (){

        //boost::uuids::uuid m_UUID=boost::uuids::random_generator()();
        //long msg_id=0;

        std::cout <<"Content-type:text/html\r\n\r\n";
        std::cout<<"<html><body>"<<std::endl;

        // debug file
        std::ofstream* debugf = nullptr;

        try {

                // uncomment to enable debug output
                //debugf = new std::ofstream("/tmp/sendcommand2nopadding.log",std::ios::out);


                if(debugf) *debugf << "opening zmq context" << std::endl;
                zmq::context_t *context=new zmq::context_t(1);


                ///////////////response /////////////////
                Cgicc formData;

                std::string IP;
                std::string port;
                std::string command;
                std::string var1;
                std::stringstream response;

                form_iterator fi = formData.getElement("ip");
                if( !fi->isEmpty() && fi != (*formData).end()) {
                        IP= **fi;
                        if(debugf) *debugf << "IP: " << IP <<std::endl;

                        form_iterator pi = formData.getElement("port");
                        if( !pi->isEmpty() && pi != (*formData).end()) {
                                port= **pi;
                                if(debugf) *debugf << "port: " << port <<std::endl;

                                form_iterator ti = formData.getElement("command");
                                if( !ti->isEmpty() && ti != (*formData).end()) {
                                        command= **ti;
                                        if(debugf) *debugf << "command: '" << command << "'" <<std::endl;

                                        // what we want is to be able to send commands with spaces
                                        // but to be compatible, lets add a new flags
                                        bool keep = false;
                                        form_iterator ws = formData.getElement("keep");
                                        if (!ws->isEmpty() && ws != (*formData).end()) {
                                                std::string val = **ws;
                                                if (val=="1" || val=="true")
                                                        keep = true;
                                        }
                                        bool raw = false;
                                        form_iterator ra = formData.getElement("raw");
                                        if (!ra->isEmpty() && ra != (*formData).end()) {
                                                std::string val = **ra;
                                                if (val=="1" || val=="true")
                                                        raw = true;
                                        }

                                        std::stringstream ss(command);
                                        if (!keep) {
                                                ss >> command;
                                                getline(ss, var1);
                                                if(var1.length()>0){
                                                        while(var1.at(0)==' ') var1=var1.substr(1,var1.length());
                                                }
                                        } else {
                                                getline(ss, command);
                                        }

                                        std::string tmp = "";
                                        if (!raw) {
                                                boost::posix_time::ptime t = boost::posix_time::microsec_clock::universal_time();
                                                std::stringstream isot;
                                                isot<<boost::posix_time::to_iso_extended_string(t) << "Z";
                                                Store bb;

                                                //bb.Set("uuid",m_UUID);
                                                //bb.Set("msg_id",msg_id);
                                                bb.Set("msg_time", isot.str());
                                                bb.Set("msg_type", "Command");
                                                bb.Set("msg_value", command);
                                                bb.Set("var1",var1);
                                                bb>>tmp;
                                        } else {
                                                tmp=command;
                                        }

                                        if(debugf) *debugf << "creating socket" << std::endl;
                                        zmq::socket_t ServiceSend (*context, ZMQ_REQ);

                                        if(debugf) *debugf << "setting socket options" << std::endl;
                                        int a=5000;
                                        int b=1;
                                        ServiceSend.setsockopt(ZMQ_RCVTIMEO, a);
                                        ServiceSend.setsockopt(ZMQ_SNDTIMEO, a);
                                        //ServiceSend.setsockopt(ZMQ_IMMEDIATE, b);

                                        if(debugf) *debugf << "connecting to socket" << std::endl;
                                        std::stringstream connection;
                                        connection<<"tcp://"<<IP<<":"<<port;
                                        ServiceSend.connect(connection.str().c_str());
                                        if(debugf) *debugf << "sending '"<<tmp<<"'" << std::endl;
                                        bool ok = false;
                                        if (!raw) {
                                                zmq::message_t s1(tmp.length() + 1);
                                                snprintf ((char *) s1.data(), tmp.length() + 1 , "%s" ,tmp.c_str()) ;
                                                ok = ServiceSend.send(s1);
                                        } else {
                                                zmq::message_t s1(tmp.data(),tmp.data()+tmp.size());
                                                ok = ServiceSend.send(s1);
                                        }

                                        // FIXME should poll for listener before sending
                                        if(debugf) *debugf << "send success: " << ok << std::endl;
                                        if(!ok) throw std::runtime_error("zmq send failed");

                                        zmq::message_t receive;
                                        if(debugf) *debugf << "receiving..." << std::endl;
                                        // FIXME should poll for inbound before receiving

                                        ok = ServiceSend.recv(&receive);
                                        if(debugf) *debugf << "recv success: " << ok << std::endl;
                                        if(!ok) throw std::runtime_error("zmq rcv failed");

                                        // FIXME this is not a safe way to retrieve the result, use memcpy
                                        //std::istringstream iss(static_cast<char*>(receive.data()));
                                        //std::string answer=iss.str();
					std::string answer(static_cast<char*>(receive.data()),receive.size());

                                        if(debugf) *debugf << "got response: '"<<answer<<"'" << std::endl;
                                        if(answer=="") throw std::runtime_error("zmq rcv got empty response");

                                        if (!raw) {
                                                Store rr;
                                                rr.JsonParser(answer);
                                                //std::cout<<"answer="<<answer<<" : ";
                                                if(rr.Get<std::string>("msg_type")=="Command Reply"){
                                                        response<<rr.Get<std::string>("msg_value"); //response<<"["<<IP<<":"<<port<<"] Reply: "<<*rr["msg_value"];
                                                } else {
                                                        if(debugf) *debugf << "no 'msg_type' or 'msg_type' not 'Command Reply' in response" << std::endl;
                                                }
                                        } else {
                                                response << answer << std::endl;
                                        }

                                } else {
                                        // else response<< "Service does not exist"<<std::endl<<std::endl;
                                        if(debugf) *debugf << "no command specified" << std::endl;

                                }

                        } else {
                                //      response << "No Command Entered " << endl;
                                if(debugf) *debugf << "no port specified" << std::endl;
                        }

                } else {
                        // response << "Cannot Send Command No Services Found" << endl;
                        if(debugf) *debugf << "no ip specified" << std::endl;

                }

                if(debugf) *debugf << "got repsonse '"<<response.str()<<"'" << std::endl;
                //std::cout<<"hi ben";
                std::cout<<response.str()<<endl;

        } catch(std::exception& e){
                // surely this is useful, though perhaps it will break things that expect a specific format...
                //std::cout<<e.what()<<std::endl;
        }

        if(debugf){
                debugf->close();
                delete debugf;
        }

        cout<<"<body/><html/>";


        return 0;
}

