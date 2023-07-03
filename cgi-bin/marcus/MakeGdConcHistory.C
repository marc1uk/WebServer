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

const std::string CGIDIR="/home/pi/WebServer/cgi-bin/marcus";

int main(int argc, const char** argv){
	int histlength = 200;
	if(argc>1){
		histlength = atoi(argv[1]);
	}
	JSONP jsonparser;
	// use SystemCall to get data from the cgi scripts.
	// this is much easier than having to deal with pqxx
	std::vector<std::string> methods{"raw","simple","complex"};
	std::map<std::string, EColor> colours{{"raw",kRed},{"simple",EColor(kGreen+1)},{"complex",kBlue}};
	std::map<std::string, EColor> colours2{{"raw",EColor(kOrange+1)},{"simple",EColor(kAzure+1)},{"complex",kViolet}};
	std::vector<std::string> leds{"275_A","275_B"};
	std::map<std::string,Style_t> styles{{"275_A",2},{"275_B",5}}; // also 4 and 28
	TMultiGraph mg("mg_gdconc","Check plots do not enter the shaded area");
	TCanvas c1("c1","c1",800,600);
	
	// used in generating dummy data
	TRandom3 rnd;
	double conc_centre = 0.05;  // should be 0.06% Gd2SO4
	double led_delta = 0.02;
	double method_delta = 0.01;
	double measurement_delta = 0.002; // 1% variance of 0.06% Gd
	
	for(auto&& amethod : methods){
		for(auto&& aled : leds){
			
			double this_led_delta = (rnd.Rndm()-0.5)*led_delta;
			std::vector<double> tvals;
			std::vector<double> yvals;
			if(argc>2 && strcmp(argv[2],"dummy")==0){
				// dummy data                                              rnd.PoissonD(0.8)
				double this_conc_centre = conc_centre + this_led_delta + ((rnd.Rndm()-0.5)*method_delta);
				// make192 "measurements" - 48 hours at 4 measurements/hr
				tvals.resize(192);
				yvals.resize(192);
				for(int i=0; i<192; ++i){
					std::string cmd = "date --date='-" + std::to_string(i*15) + " minutes' '+%F %T'";
					std::string ret;
					int ok = SystemCall(cmd, ret);
					tvals.at(i) = TDatime(ret.c_str()).Convert();
					yvals.at(i) = this_conc_centre + ((rnd.Rndm()-0.5)*measurement_delta);
					//std::cout<<"point "<<i<<": ("<<tvals.at(i)<<", "<<yvals.at(i)<<")"<<std::endl;
				}
				
			} else {
				
				std::string args = "a="+amethod+"_gdconc"
				                  +"&b="+aled
				                  +"&c="+std::to_string(histlength);
				std::string argstring="QUERY_STRING=\""+args+"\" ";
				std::string cmd=argstring+CGIDIR+"/get_measurement_values.cgi | tail -n -2";
				std::string ret;
				int ok = SystemCall(cmd, ret);
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
				for(int i=0; i<xvals.size(); ++i){
					std::string nexttimestring = xvals.at(i);
					// maybe TDattime doesn't support fractional seconds like postgres?
					nexttimestring = nexttimestring.substr(0,nexttimestring.find('.'));
					tvals.at(i) = TDatime(nexttimestring.c_str()).Convert();
				}
				
			}
			TGraph* tmp = new TGraph(tvals.size(),tvals.data(),yvals.data());
			std::string name{amethod+"_"+aled};
			auto& colourmap = (aled=="275_A") ? colours : colours2;
			EColor plotcolour = colourmap.at(amethod);
			Style_t plotstyle = styles.at(aled);
			
			tmp->SetName(name.c_str());
			tmp->SetTitle(name.c_str());
			tmp->SetLineColor(plotcolour);
			tmp->SetMarkerColor(plotcolour);
			//tmp->SetMarkerStyle(plotstyle);
			mg.Add(tmp); // takes ownership and handles deletion of tmp
		}
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
	mg.GetYaxis()->SetRangeUser(0.03,0.06);
	if(argc>2 && strcmp(argv[2],"dummy")==0) mg.GetYaxis()->SetRangeUser(0,0.1);
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
