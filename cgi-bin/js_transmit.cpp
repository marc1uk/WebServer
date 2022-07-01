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


#include "ServiceDiscovery.h"

#include "zmq.hpp"



#include <boost/uuid/uuid.hpp>            // uuid class
#include <boost/uuid/uuid_generators.hpp> // generators
#include <boost/uuid/uuid_io.hpp>         // streaming operators etc.
#include <boost/date_time/posix_time/posix_time.hpp>

using namespace cgicc;

int main (int argc, char* argv[]){


  std::cout << "HELLO WORLD\n";
  
  //  std::cout<<"<!DOCTYPE html>"<<std::endl;
  std::cout <<"Content-type:text/html\r\n\r\n";
  std::cout<<"<html>"<<std::endl;
  std::cout<<"<head>"<<std::endl;
  std::cout<<"<title>HTML Meta Tag</title>"<<std::endl;
    
  //  std::cout<<"<meta http-equiv = \"refresh\" content = \"0; url = "<<url<<"\" />"<<std::endl;
  std::cout<<"</head>"<<std::endl;
  //  std::cout<<"<body>"<<std::endl;
  //std::cout<<mstring<<std::endl;
  //std::cout<<"</body>"<<std::endl;
  std::cout<<"</html>"<<std::endl;
  
  
  return 0;
}
