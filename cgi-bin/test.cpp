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

using namespace std;
using namespace cgicc;

int main (){

  boost::uuids::uuid m_UUID=boost::uuids::random_generator()();
  long msg_id=0;
    
   
  zmq::context_t *context=new zmq::context_t(1);
  

  ///////////////response /////////////////
  Cgicc formData;

  cout <<"Content-type:text/html\r\n\r\n";
  cout<<"<html>";
  cout<<" <head> <meta http-equiv=\"refresh\" content-\"60\"><meta http-equiv=\"Content-Type\" cpntent\"text/html; carset=iso-8859-1\"/> <title>Remote ToolChain Control</title><head>";
  
  std::vector<FormEntry> elements= formData.getElements();
  for(int i=0;i<elements.size();i++){
    std::cout<<elements.at(i).getName()<<" : "<<elements.at(i).getValue()<<std::endl;

  }
  
  
   form_iterator fi = formData.getElement("button1");
  if( !fi->isEmpty() && fi != (*formData).end()) {
    
    zmq::socket_t Info (*context, ZMQ_PUB);
    //  Info.connect("ipc:///tmp/WebInput");
    Info.connect("tcp://127.0.0.1:5555");
    sleep(1);
    Store tmp;
    int a=54;
    tmp.Set("test",a);

    std::string mstring;
    tmp>>mstring;

    zmq::message_t msg(mstring.length()+1);
    snprintf ((char *) msg.data(), mstring.length()+1 , "%s" ,mstring.c_str()) ;

    //    cout<<"d1 "<<mstring<<std::endl<<std::endl<<std::endl;
    Info.send(msg);
    Info.send(msg);
    //    cout<<"sent"<<std::endl;
    sleep (1);
    ///footer

  }

  //  cout <<"Content-type:text/html\r\n\r\n";
  //cout<<"<html>";
  //cout<<" <head> <meta http-equiv=\"refresh\" content-\"60\"><meta http-equiv=\"Content-Type\" cpntent\"text/html; carset=iso-8859-1\" /> <title>Remote ToolChain Control</title><head>";


  string line;
  ifstream myfile ("/var/www/html/header.html");

  if (myfile.is_open())
    {
      while ( getline (myfile,line) )
	{


	  cout << line;//<<std::endl;

	}
      myfile.close();
    }


  cout<<"<h1 align=\"center\">Remote Control ToolChain</h1>" ;
  cout<< " <img src=\"/images/last.jpg\"  width=\"40%\" height=\"40%\"> </p> <p>"<<std::endl;

  //  cout<<"<form action=\"/cgi-bin/test.cgi\" method=\"post\">";
  cout<<"<form action=\"/cgi-bin/transmitt.cgi\" method=\"post\">";
  //  cout<<"<input type=\"text\" id=\"source_url\" name=\"source_url\" value=\"/cgi-bin/test.cgi\" style=\"display: none;\"><br>";
  cout<<"<input type=\"text\" id=\"source_url\" name=\"source_url\" value=\"URL\" style=\"display: none;\"><br>";
  cout<<"  <p>Please select your LED:</p>";
  cout<<"    <input type=\"checkbox\" id=\"R\" name=\"R\" value=\"R\">";
  cout<<"    <label for=\"R\">R</label><br>";
  cout<<" <input type=\"checkbox\" id=\"G\" name=\"G\" value=\"G\">";
  cout<<"<label for=\"G\">G</label><br>";
  cout<<"  <input type=\"checkbox\" id=\"B\" name=\"B\" value=\"B\">";
  cout<<"<label for=\"B\">B</label>";

 cout<<"    <br> "; 

  
  cout<<"<input name=\"button1\" type=\"submit\" value=\"Send\" /></form>";
  cout<<"<p>"<<std::endl;
  cout<<"<script>document.getElementById(\"source_url\").value = document.URL  </script>";

    
  ifstream myfile2 ("/web/html/footer.html");

  if (myfile2.is_open())
    {
      while ( getline (myfile2,line) )
	{


	  cout << line;//<<std::endl;

	}
      myfile2.close();
    }

  
   
  return 0;
}
