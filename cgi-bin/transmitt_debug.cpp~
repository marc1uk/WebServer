#include <iostream>
#include <vector>  
#include <string>  
#include <stdio.h>  
#include <stdlib.h> 
#include <sstream>

#include <cgicc/CgiDefs.h> 
#include <cgicc/Cgicc.h> 
#include <cgicc/HTTPHTMLHeader.h> 
#include <cgicc/HTMLClasses.h>  


#include "ServiceDiscovery.h"

#include "zmq.hpp"



#include <boost/uuid/uuid.hpp>            // uuid class
#include <boost/uuid/uuid_generators.hpp> // generators
#include <boost/uuid/uuid_io.hpp>         // streaming operators etc.
#include <boost/date_time/posix_time/posix_time.hpp>

using namespace cgicc;

int main (){

  //  boost::uuids::uuid m_UUID=boost::uuids::random_generator()();
  // long msg_id=0;
    
   
  zmq::context_t *context=new zmq::context_t(1);
  

  ///////////////response /////////////////
  Cgicc formData;
  
  Store tmp;
  
  std::string url="";
  
  std::vector<FormEntry> elements= formData.getElements();
  for(int i=0;i<elements.size();i++){
    std::string key=elements.at(i).getName();
    std::string value=elements.at(i).getValue();
    tmp.Set(key,value);
    if(key=="source_url") url=value;
  }
  
  
  zmq::socket_t Info (*context, ZMQ_PUB);
  //  Info.connect("ipc:///tmp/WebInput");
  Info.connect("tcp://127.0.0.1:5555");
  sleep(1);
  std::string mstring;
  tmp>>mstring;
  
  zmq::message_t msg(mstring.length()+1);
  snprintf ((char *) msg.data(), mstring.length()+1 , "%s" ,mstring.c_str()) ;
  
  //    std::cout<<"d1 "<<mstring<<std::endl<<std::endl<<std::endl;
  Info.send(msg);
  //    Info.send(msg);
  //    std::cout<<"sent"<<std::endl;
  sleep (1);
  ///footer
  
  
  
  //  std::cout<<"<!DOCTYPE html>"<<std::endl;
  std::cout <<"Content-type:text/html\r\n\r\n";
  std::cout<<"<html>"<<std::endl;
  std::cout<<"<head>"<<std::endl;
  std::cout<<"<title>HTML Meta Tag</title>"<<std::endl;
  std::cout<<"<meta http-equiv = \"refresh\" content = \"0; url = "<<url<<"\" />"<<std::endl;
  std::cout<<"</head>"<<std::endl;
  //  std::cout<<"<body>"<<std::endl;
  //std::cout<<mstring<<std::endl;
  //std::cout<<"</body>"<<std::endl;
  std::cout<<"</html>"<<std::endl;
  
  
  return 0;
}
