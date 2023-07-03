void makeKindleSummary(){
// for whatever reason the only way the TPaveText doesn't seg
// is if you run the macro and draw the canvas, then get it from there.
// if save the canvas to root file, load the root file and do JUST:
// `c1->Draw()` it will draw, but if you try to GET the canvas first:
// `TCanvas* c1 = (TCanvas*)_file0->GetListOfKeys()->At(0);`
// then c1 will claim it has a TPaveText but will draw empty,
// and trying to get the TPaveText results in a corrupt object.
gROOT->ProcessLine(".x StatusCanvas.C");
TCanvas* c1 = (TCanvas*)gROOT->GetListOfCanvases()->At(0);
TPaveText* pt = (TPaveText*)c1->GetListOfPrimitives()->At(0);

// ok cool now we have it build the canvas we actually want
TCanvas c2("c2","c2",800,600);
c2.Divide(1,2);
c2.cd(1);
pt->Draw();

TFile* _file1 = TFile::Open("transps.root");
TFile* _file2 = TFile::Open("gdconcs.root");
c2.cd(2);
gPad->Divide(2,1);
gPad->cd(1);
TMultiGraph* mgt=(TMultiGraph*)_file1->Get("mg_transp");
mgt->Draw("AL");
mgt->GetYaxis()->SetTitleOffset(1.3);
gPad->Modified();
TMultiGraph* mgc=(TMultiGraph*)_file2->Get("mg_gdconc");
c2.cd(2);
gPad->cd(2);
mgc->Draw("AL");
mgc->GetYaxis()->SetTitleOffset(1.4);
gPad->Modified();
c2.SetCanvasSize(800,600);
c2.SaveAs("kindle_history.png");
}
