# C++ compiler flags - XXX config.gmk sets this already, so APPEND ONLY XXX
CXXFLAGS += -g -O3 -std=c++11 -Wno-psabi -fdiagnostics-color=always

ToolDAQPath=/home/gad/GDConcMeasure/ToolDAQ

BoostLib= -L $(ToolDAQPath)/boost_1_66_0/install/lib -lboost_serialization -lboost_iostreams -lboost_regex
BoostInclude= -I $(ToolDAQPath)/boost_1_66_0/install/include

RootInclude= `root-config --cflags`
RootLib= `root-config --libs`

GDConcPath=/home/gad/GDConcMeasure
DataModelInclude= -I $(GDConcPath)/include
DataModelLib= -L $(GDConcPath)/lib -lStore

all: makeGdConcHistory makeTranspHistory makeStatusFile


makeTranspHistory: MakeTranspHistory.C JsonParser.cpp JsonParser.h
	g++ $(CXXFLAGS) -o $@ MakeTranspHistory.C JsonParser.cpp Algorithms.cpp -I ./ $(DataModelInclude) $(BoostInclude) $(RootInclude) $(DataModelLib) $(RootLib) $(BoostLib)

makeGdConcHistory: MakeGdConcHistory.C JsonParser.cpp JsonParser.h
	g++ $(CXXFLAGS) -o $@ MakeGdConcHistory.C JsonParser.cpp Algorithms.cpp -I ./ $(DataModelInclude) $(BoostInclude) $(RootInclude) $(DataModelLib) $(RootLib) $(BoostLib) -o $@

makeStatusFile: MakeStatusCanvas.C
	g++ $(CXXFLAGS) $^ $(RootInclude) $(RootLib) -o $@
