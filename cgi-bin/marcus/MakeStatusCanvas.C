#include "TCanvas.h"
#include "TPaveText.h"

int main(int argc, const char** argv){
	if(argc==1){
		printf("Usage: %s [status text file]\n",argv[0]);
		return 0;
	}
	//TCanvas c1("c1", "c1",800,600);
	TCanvas c1("c1", "c1",800,350);
	TPaveText pt(0.0,0.00,0.5,0.95,"NB");  // 0, 0.05, 0.5, 0.95
	pt.SetMargin(0.03);
	pt.SetFillColor(0);
	pt.SetTextFont(82);  //82=non bold https://root.cern.ch/doc/master/classTAttText.html#ATTTEXT5
	pt.SetTextSize(0.05454545); // 0.03 for 800x600
	pt.ReadFile(argv[1]);
	pt.Draw();
	c1.Modified();
	c1.Update();
	//gPad->SetCanvasSize(800, 600);
	gPad->SetCanvasSize(800, 350);
	c1.SaveAs("StatusCanvas.png");
	c1.SaveAs("StatusCanvas.C");  // this does reproduce the canvas for once
	//pt.SaveAs("status.root");   // this doesn't seem to work, on the otherhand.
	return 0;
}
