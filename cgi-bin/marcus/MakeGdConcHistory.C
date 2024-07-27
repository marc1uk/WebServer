#include "Algorithms.h"  // from DataModel, provides SystemCall
#include "BoostStore.h" // from ToolFramework, for json parsing
#include "TFile.h"
#include "TPad.h"
#include "TH1.h" // needed for TAxis stuff
#include "TGraph.h"
#include "TLegend.h"
#include "TMultiGraph.h"
#include "TDatime.h"    // note TDatime objects have no support for timezones
#include "TColor.h"
#include "JsonParser.h"
#include <iostream>
#include <vector>
#include <thread>
#include <chrono>
#include "TSystem.h"
#include "TCanvas.h"
#include "TPaveText.h"
#include "TStyle.h"
#include "TRandom3.h"
//#include "TImage.h"

const std::string CGIDIR="/home/gad/WebServer/cgi-bin/marcus";

int main(int argc, const char** argv){
	int histlength = 200;
	if(argc>1){
		histlength = atoi(argv[1]);
	}
	JSONP jsonparser;
	// use SystemCall to get data from the cgi scripts.
	// this is much easier than having to deal with pqxx
	std::vector<std::string> leds{"275_A","275_B"};
	std::map<std::string,Style_t> styles{{"275_A",2},{"275_B",5}}; // also 4 and 28
	TMultiGraph mg("mg_gdconc","Check plots do not enter the shaded area");
	TCanvas c1("c1","c1",800,600);
	
	// used in generating dummy data
	TRandom3 rnd;
	std::vector<double> conc_centres{0.0515,0.0475};
	double measurement_delta = 0.0004; // 1% variance of 0.06% Gd
	double measurement_resolution = 0.0001;
	
	// get cutoff time
	std::string cmd = "date --date='-" + std::to_string(192*15) + " minutes' '+%F %T'";
	std::string ret;
	int ok = SystemCall(cmd, ret);
	double unixns_15mins_ago = TDatime(ret.c_str()).Convert();
	size_t last_inrange_point=0;
	
	int ledi=0;
	for(auto&& aled : leds){
		
		std::vector<double> tvals;
		std::vector<double> yvals;
		if(argc>2 && strcmp(argv[2],"dummy")==0){
			std::cout<<"MAKING DUMMY DATA"<<std::endl;
			// dummy data                                              rnd.PoissonD(0.8)
			tvals.resize(histlength);
			yvals.resize(histlength);
			last_inrange_point = histlength;
			for(int i=0; i<histlength; ++i){
				cmd = "TZ=Asia/Tokyo date --date='-" + std::to_string(i*15) + " minutes' '+%F %T'";
				ret = "";
				ok = SystemCall(cmd, ret);
				tvals.at(i) = TDatime(ret.c_str()).Convert();
				double measurement_var = int(((rnd.Rndm()-0.5)*measurement_delta)/measurement_resolution)
				                         *measurement_resolution;
				//double measurement_var = (rnd.Rndm()-0.5)*measurement_delta;
				yvals.at(i) = conc_centres.at(ledi) + measurement_var;
				//std::cout<<"point "<<i<<": ("<<tvals.at(i)<<", "<<yvals.at(i)<<")"<<std::endl;
			}
			++ledi;
			
		} else {
			
			std::string args = "a=gdconc"
			                   "&b="+aled
			                  +"&c="+std::to_string(histlength);
			std::string argstring="QUERY_STRING=\""+args+"\" ";
			cmd=argstring+CGIDIR+"/get_measurement_values.cgi | tail -n -2";
			ret = "";
			ok = SystemCall(cmd, ret);
			if(ok!=0){ // system calls should return 0 on success
				std::cerr<<"systemcall '"<<cmd<<"' failed with return code "<<ok
				         <<", return: "<<ret<<std::endl;
				return -1;
			}
			// returned value should be a JSON string that we need to parse
			BoostStore store{false};
			ok = jsonparser.Parse(ret, store);
			if(!ok){
				std::cerr<<"JsonParser failed to parse return string: '"
				         <<ret<<"' with return code "<<ok<<std::endl;
				return -2;
			}
			// retrieve results
			std::vector<std::string> xvals;
			ok  = store.Get("xvals",xvals);
			ok &= store.Get("yvals",yvals);
			if(!ok){
				std::cerr<<"failed to find xvals and yvals in returned Store!"<<std::endl;
				return -3;
			}
			// convert timestamp strings into unix seconds for plotting
			tvals.resize(xvals.size());
			last_inrange_point=0;
			for(int i=0; i<xvals.size(); ++i){
				std::string nexttimestring = xvals.at(i);
				// maybe TDattime doesn't support fractional seconds like postgres?
				nexttimestring = nexttimestring.substr(0,nexttimestring.find('.'));
				tvals.at(i) = TDatime(nexttimestring.c_str()).Convert();
				// make a note of data that's too old - don't include it in the graph
				if(tvals.at(i) < unixns_15mins_ago){
					break;
				}
				++last_inrange_point;
			}
			
		}
		TGraph* tmp = new TGraph(last_inrange_point,
		                         tvals.data(),
		                         yvals.data());
		EColor plotcolour = (aled=="275_A") ? kRed : kBlue;
		
		tmp->SetName(aled.c_str());
		tmp->SetTitle(aled.c_str());
		tmp->SetLineColor(plotcolour);
		tmp->SetMarkerColor(plotcolour);
		//tmp->SetMarkerStyle(plotstyle);
		mg.Add(tmp); // takes ownership and handles deletion of tmp
	}
	
	// may be required depending on ROOT version
	mg.Draw("al");
	gPad->Update();
	// now we can set the axis type to timestamp
	//mg.GetXaxis()->SetTitle("Time");
	mg.GetYaxis()->SetTitle("Gd Concentration %");
	mg.GetXaxis()->SetTimeDisplay(1);
	mg.GetXaxis()->SetTimeFormat("#splitline{%H:%M}{%m-%d}");
	mg.GetXaxis()->SetTimeOffset(0);  // very much not clear but seems this is what we want
	mg.GetYaxis()->SetTitleSize(0.04);
	//mg.GetXaxis()->SetTitleSize(0.04);
	//mg.GetXaxis()->SetLabelSize(0.02);
	//mg.GetXaxis()->SetLabelOffset(0.072);
	//mg.GetYaxis()->SetRangeUser(0.05,0.068);      // FIXME 0.05, 0.07
	mg.GetYaxis()->SetRangeUser(0.05,0.07);
	//if(argc>2 && strcmp(argv[2],"dummy")==0) mg.GetYaxis()->SetRangeUser(0,0.1);
	mg.GetXaxis()->SetLabelOffset(0.04);
	gStyle->SetTitleSize(0.4,"t");
	TPaveText* pt = (TPaveText*)gPad->GetPrimitive("title");
	pt->SetTextSize(0.04);
	gStyle->SetTitleH(0.4);
	gPad->Modified();
	gPad->Update();
	/*
	TLegend* leg = gPad->BuildLegend(0.65,0.40,0.95,0.65);
	leg->SetBorderSize(0);
	//leg->SetFillColor(0);
	//leg->SetShadowColor(0);
	leg->SetFillStyle(0);
	*/
	gPad->SetCanvasSize(800, 600);
	gPad->SetLeftMargin(0.1489971);
	gPad->SetBottomMargin(0.1308017);
	gPad->Modified();
	gPad->Update();
	gPad->SaveAs("gdconcs.png");
	/*
	TImage* img = TImage::Create();
	if(img){
		img->FromPad(gPad);  // c1
		img->WriteImage("gdconcs.png");
		std::cerr<<"TImage::Create returned nullptr"<<std::endl;
	}
	*/
	//gPad->SaveAs("gdconcs.C");        // this does not reproduce the canvas at all
	//gPad->SaveAs("gdconcscanv.root"); // this mostly reproduces the canvas, but the axes label offsets aren't right
	mg.SaveAs("gdconcs.root");          // this gives the same as the above
	/*
	while(gROOT->FindObject("c1")!=nullptr){
		gSystem->ProcessEvents();
		std::this_thread::sleep_for(std::chrono::milliseconds(100));
	}
	*/
	return 0;
}
