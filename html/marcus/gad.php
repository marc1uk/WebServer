<!-- vim:set expandtab tabstop=2 wrap filetype=php -->
<!doctype html>
<html lang="en">
  <!-- HEAD -->
  <head>
    <meta charset="utf-8">
    <!-- set page width to match device, and initial scale to 100% -->
    <meta name="viewport" content="width=device-width, initial-scale=1">
    
    <!-- specify the location of bootstrap css -->
    
    <!-- Bootstrap core CSS -->
    <!-- <link href="./bootstrap-5.1.3-dist/css/bootstrap.min.css" rel="stylesheet"> -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    
    <!-- pull in any custom overrides for styles -->
    <link href="scss/gad.scss" rel="stylesheet">
    
    <title>GAD Control and Monitoring Website</title>
    
    <!-- bootstrap javascript source bundle must be included, typically at the end of the head/body section -->
    <!-- <script src="./bootstrap-5.1.3-dist/js/bootstrap.bundle.min.js"></script> -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
    
    <!-- plotly javascript source bundle -->
    <!-- <script src="./plotly-2.3.0/plotly-2.3.0.min.js"></script> -->
    <script src="https://cdn.plot.ly/plotly-2.3.0.min.js" charset="utf-8"></script>
    
    <!-- <script src="./d3/d3.min.js"></script> -->
    <script src="https://cdn.jsdelivr.net/npm/d3@7.8.5/dist/d3.min.js"></script>
    
  </head>
  
  <!-- BODY -->
  <body>
  
  <!--#include file="plots.html" -->
  
  <!-- navigation header bar. Will turn into a burger when below medium viewport width.
       light text colour (dark mode), bottom margin of 4rem -->
  <nav class="navbar navbar-expand-md bg-primary navbar-dark mb-4">
    <!-- fluid-width container to rearrange content based on viewport width -->
    <div class="container-fluid">
      <!-- ben's amazing GAD logo :) -->
      <a class="navbar-brand" href="#">
       <img src="images/gad_logo.png" alt="GAD" style="width:100px;">
      </a>
      <!-- make the navbar collapse into a burger when the viewport is small, e.g. mobile -->
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarCollapse" aria-controls="navbarCollapse" aria-expanded="false" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="navbarCollapse">
        <ul class="navbar-nav me-auto mb-2 mb-md-0">
          <!-- the list of items in the navigation menu -->
          <li class="nav-item">
            <a class="nav-link active" aria-current="page" href="#">Home</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="../cam.html">Camera</a>
          </li>
          <!-- TODO: allow arbitrary queries from the database -->
          <li class="nav-item">
            <a class="nav-link disabled">Query Database</a>
          </li>
        </ul>
      </div>
    </div>
  </nav>
  
  <div class="container-fluid bg-primary text-white">
      <h1>Detector Status</h1>
  </div>
  <!-- container for two form columns -->
  <div class="container-md row mx-auto">
    <!-- container for first form column -->
    <!-- col-sm: two columns of form items will stack when viewport width becomes small -->
    <div class="col-sm d-flex justify-content-center">
      
      <!-- form of first column of buttons -->
      <form action="/cgi-bin/transmitt.cgi" method="post">
        
        <!-- POWER STATE -->
        <div class="form-row d-flex justify-content-center">
        <label for="power" class="col col-form-label" style="text-align: right;">Power: </label>
        <input name="Power" id="power" type="submit" class="btn btn-warning active" value="UNKNOWN" >
        <input type="text" class="btn" name="source_url" value="URL" style="display: none;">
        </div>
        
        <!-- PUMP STATE -->
        <div class="form-row d-flex justify-content-center">
        <label for="pump" class="col col-form-label" style="text-align: right;">Pump: </label>
        <input name="Pump" id="pump" type="submit" class="btn btn-warning active" value="UNKNOWN" >
        <input type="text" class="btn" name="source_url" value="URL" style="display: none;">
        </div>
        
        <!-- INLET VALVE -->
        <div class="form-row d-flex justify-content-center">
        <label for="invalve" class="col col-form-label" style="text-align: right;">Inlet Valve: </label>
        <input name="Valve_inlet" id="invalve" type="submit" class="btn btn-warning" value="UNKNOWN" >
        </div>
         
        <!-- OUTLET VALVE -->
        <div class="form-row d-flex justify-content-center">
        <label for="outvalve" class="col col-form-label" style="text-align: right;">Outlet Valve: </label>
        <input name="Valve_outlet" id="outvalve" type="submit" class="btn btn-warning" value="UNKNOWN" >
        <input type="text" class="btn" name="source_url" value="URL" style="display: none;">
        </div>
        
        <!-- PWM BOARD -->
        <div class="form-row d-flex justify-content-center">
        <label class="col col-form-label" style="text-align: right;">PWM board connected: </label>
        <input class="form-check-input align-middle" type="checkbox" id="pwmboard"
               onclick="this.checked=!this.checked;" style="vertical-align: middle; margin: 12px auto;" >
        <script>var checkbox = document.getElementById("pwmboard"); checkbox.indeterminate = true; </script>
        </div>
        
        <!-- SPECTROMETER -->
        <div class="form-row d-flex justify-content-center">
        <label class="col col-form-label" style="text-align: right;">Spectrometer connected: </label>
        <input class="form-check-input align-middle" type="checkbox" id="spectrometer"
               onclick="this.checked=!this.checked;" style="vertical-align: middle; margin: 12px auto;" >
        <script>var checkbox = document.getElementById("spectrometer"); checkbox.indeterminate = true; </script>
        </div>
        
      </form> <!-- end first form -->
    </div> <!-- end container for first form column -->
    
    <!-- second column of form items-->
    <div class="col-sm d-flex justify-content-center">
      <!-- form to contain the interactible elements -->
      <form action="/cgi-bin/transmitt.cgi" method="post">
        <!-- enclose the rows in this form column in a div for vertical alignment -->
<!--        <div class="d-flex justify-content-center"> -->
          <!-- LED STATES -->
          <div class="form-check form-switch ">
            <?php $data = file_get_contents("/cgi-bin/marcus/get_led_buttons.cgi",0); echo $data; ?>
          </div>
<!--        </div> --> <!-- end vertical alignment div -->
      </form>
    </div>  <!-- end container of second column form -->
    
  </div>  <!-- end container of two form columns -->
  <!-- script that will continually update the contents -->
  <script src="../../update_hardware_status.js" type="module"></script>
  
  <div class="container-fluid"> <!-- RUN INFO CONTAINER -->
  
  <!-- get the run information all at once, since its one entry in the run table -->
  <!-- RUN INFO -->
  <!-- + run, start time, end time, runconfig, notes, git tag [R] -->
  <!-- MORE RUN INFO -->
  <!-- + pure reference trace filename ("purewater_filename" = json: "filename") [D]
       + calibration function paramter set version - ("calibration_version" = json: bare integer?) [D]
       + output file ("output_filename" = json: "filename" ) [W] -->
  <div class="container-md bg-muted">  <!-- add mx-3 to class list to left-align it -->
    <div class="input-group mb-3">
      <span class="input-group-text">Run</span>
      <input id="runnum" type="text" readonly style="background-color: white" class="form-control" value="-1" >
<!--    </div>-->
<!--    <div class="input-group mb-3">-->
      <span class="input-group-text">Run Config ID</span>
      <input id="runconfig" type="text" readonly style="background-color: white" class="form-control" value="-1" >
<!--    </div>-->
<!--    <div class="input-group mb-3">-->
      <span class="input-group-text">Git Tag</span>
      <input id="git_tag" type="text" readonly style="background-color: white" class="form-control" value="-1" >
    </div>
    <div class="input-group mb-3">
      <span class="input-group-text">Start Time</span>
      <input id="start" type="text" readonly style="background-color: white" class="form-control" value="-1" >
      <span class="input-group-text">Stop Time</span>
      <input id="stop" type="text" readonly style="background-color: white" class="form-control" value="-1" >
    </div>
    <!--
    <div class="input-group mb-3">
      <span class="input-group-text">Pure water reference file</span>
      <input id="reffile" type="text" readonly style="background-color: white" class="form-control" value="<?php echo $run_info['purewater_filename']; ?>" >
      <span class="input-group-text">Calibration Curve Version</span>
      <input id="calibver" type="text" readonly style="background-color: white" class="form-control" value="<?php echo $run_info['calib_curve_ver']; ?>" >
    </div>
    -->
    <div class="input-group mb-3">
      <span class="input-group-text">Run Notes</span>
      <!-- note: everything between <textarea> and </textarea> is text, so no newines or whitespace here! -->
      <textarea input id="notes" readonly style="background-color: white" class="form-control"></textarea>
    </div>
    <div class="input-group mb-3">
      <span class="input-group-text">Output file</span>
      <input id="output_file" type="text" readonly style="background-color: white" class="form-control" value="" >
    </div>
  </div>
  <!-- script that will populate this table -->
  <script src="../../update_run_info.js" type="module">  </script>
  
  </div> <!-- END RUN INFO CONTAINER -->
  
  <!-- styled table -->
  <div class="container-md p-3">
    <div class="table-responsive" style="max-height:300px;" id="scheduler_table">
      <table class="table table-striped table-hover">
        <tbody id="scheduler_commands">
        <script src="../../get_scheduler_commands.js" type="module">  </script>
        </tbody>
      </table>
    </div>
  </div>
  
  <!-- Accordion of trace plots -->
  <div class="container-fluid bg-primary text-white border">
    <h1>Last Measurement Results</h1>
  </div>
  <div id="plots" class="mx-5 my-2 bg-light rounded border">
    <?php
      $traces = ['last_trace',
      //           'dark_subtracted_data_in',
      //           'dark_subtracted_data_out',
      //           'dark_subtracted_pure',
      //           'pure_scaled',
      // combine all the above on a single plot
                 'dark_subtracted_data',
                 'absorbance_trace',
                 'transparency_trace'];
      $tracenames = [ 'Last Trace',
      //              'Dark Subtracted Data (absorbance region)',
      //              'Dark Subtracted Data (fitted sideband region)',
      //              'Dark Subtracted Pure Reference',
      //              'Pure Reference, Fit to Data',
                      'Dark Subtracted Data',
                      'Absorbance',
                      'Transparency'
                    ];
      
      for($i=0; $i < count($traces); ++$i){
          echo PHP_EOL;
          // each plot is embedded within a bootstrap 'card'.
          // cards are suitable as they have a header that can always show the title of the plot,
          // and an inner (collapsible) body to contain the actual plot
          echo '    <div class="card">' . PHP_EOL;
          echo '      <div class="card-header">' . PHP_EOL;
          // header contains button that specifies trace and controls collapsible body
          echo '        <a class="btn" data-bs-toggle="collapse" href="#plot' . "{$i}" . '">' . "{$tracenames[$i]}" . '</a>' . "\n";
          echo '      </div>' . PHP_EOL;
          // body must specify a height since contained plot is reactive and needs a size
          echo '      <div id="plot' . "{$i}" . '" class="card-body collapse';
          //if($i == 0) echo " show";
          echo '" data-bs-parent="#plots"  height:500px>' . PHP_EOL;
          //the plot itself must be within a nested div for margins to work, for some reason
          echo '        <div id="' . "{$traces[$i]}" . '" class="dataplot" style="width:100%"></div>' . "\n";
          echo '      </div>' . PHP_EOL;
          echo '    </div>' . PHP_EOL;
      }
      
      /* result should look like the following
      <! -- PURE TRACE -->
      <div class="card">
        <!-- header -->
        <div class="card-header">
          <a class="btn" data-bs-toggle="collapse" href="#plot2">Pure Trace</a>
        </div>
        <!-- body -->
        <div id="plot2" class="card-body collapse" data-bs-parent="#plots">
          <div id="pure_trace" class="dataplot" style="width:100% height:500px"></div>
        </div>
      </div>
      */
      
    ?>
    
  </div> <!-- end accordion class -->
  
  <!-- seems like javascript must be in the parent directory or it doesn't work? -->
  <!-- plotly javascript uses getElementById('...') to insert graph into a specified div -->
  <script src="../../update_traces.js" type="module"></script>
  
  <div class="container-md bg-muted">  <!-- add mx-3 to class list to left-align it -->
    <div class="input-group mb-3">
      <span class="input-group-text">Pure Fit Status</span>
      <input id="purefit" type="text" class="form-control">
      <span class="input-group-text">Absorption Fit Status</span>
      <input id="absfit" type="text" class="form-control">
    </div>
    
  <script src="../../update_fit_results.js" type="module"></script>
  
  <div class="container-fluid my-1 bg-primary text-white">
    <h1>Historic Data</h1>
  </div>

  <div class="container-md bg-muted">  <!-- add mx-3 to class list to left-align it -->
    <div class="form-row d-flex justify-content-center">
      <div class="input-group">
        <span class="input-group-text">History Length</span>
        <input id="historyLength" type="number" style="background-color: white" class="form-control" value='200' >
        <span class="input-group-text">Debug Mode</span>
        <div class="input-group-text"> <input class="form-check-input" id="debugToggle" type="checkbox" value=""> </div>
      </div>
    </div>
  </div>
  
  <!-- Accordion of histograms -->
  <div id="histograms" class="m-3 bg-light rounded">
    <?php
      $histos = [
                 'gdconcentration',     //
                 'metric',
                 'led_intensity',       // peak value, extracted from pure fit
                 'rawtrace_pars',       // min, max within absorbance region
                 'darktrace_pars',      // mean, width
                 
                 // parameters for MarcusAnalysis
                 //'purefit_pars',        // x-scaling, y-scaling, x-shift, y-shift, linear component grad
                 //'peak_diff',           // difference in peak heights is metric for MarcusAnalysis
                 //'peak1_height',        // height of gd peak 1
                 //'peak2_height',        // height of gd peak 2
                 //'rawfit_pars'          // N/A - raw method has not fitting parameters
                 //'simplefit_pars',      // 2-gaussian method, gaussian fit pars
                 //'complexfit_pars',     // 4-gaussian method, fit parameters
                 
                 // fit parameters for MatthewAnalysisStrikesBack
                 'purefit_pars',          // parameters of fit of the pure reference to the data
                 'purefit_chi2',
                 'absfit_pars',           // parameters of fit of the reference absorbance to the extracted one
                 'absfit_chi2',
                 
                 // general system state monitoring
                 'valve_state',
                 'pi_mem',
                 'valve_temps'
                 ];
      $histonames = [ 
                      'Gd Concentration',
                      'Metric',
                      'LED intensity',
                      'Raw Trace Parameters',
                      'Dark Trace Parameters',
                      'Pure Fit Parameters',
                      'Pure Fit Chi2',
                      //'Peak Height Difference',
                      //'Peak 1 Height',
                      //'Peak 2 Height',
                      //'Simple Fit Parameters',
                      //'Complex Fit Parameters',
                      'Absorbance Fit Parameters',
                      'Absorbance Fit Chi2',
                      'Valve States',
                      'RPi Resource Usage',
                      'Valve Temperature (Average)'
                    ];
      
//	 + dark trace params - ("darktrace_params" = json: "mean", "width") [D]
//	 + raw trace params  - ("rawtrace_params" = json: "max", "min" [within abs region]) [D]
//	 + pure fit pars ("pure_fit_pars" = json from [fitting pars, fitting errors]) [D]
//	 + LHS absorbance peak fit ("left_abspk_fit_pars" = json from [fitting pars, fitting errors]) [D]
//	 + RHS absorbance peak fit ("right_abspk_fit_pars" = json from [fitting pars, fitting errors]) [D]
//	 + gd concentration: ("gdconcentration" = json: "val", "err") [D]
//	 + pure fitresultptr ("pure_fit_status" = json from fitresultptr) [D]
//	 + LHS absorbance peak fitresultptr ("left_abspk_fit_status" = json from fitresultptr) [D]
//	 + RHS absorbance peak fitresultptr ("right_abspk_fit_status" = json from fitresultptr) [D]
      
      for($i=0; $i < count($histos); ++$i){
          echo PHP_EOL;
          
          // each plot is embedded within a bootstrap 'card'.
          echo '    <div class="card">' . PHP_EOL;
          // the card has a header...
          echo '      <div class="card-header">' . PHP_EOL;
          // ...that contains button with a descriptive name to controls collapse
          echo '        <a class="btn" data-bs-toggle="collapse" href="#card' . "{$i}" . '">' . "{$histonames[$i]}" . '</a>' . PHP_EOL;
          echo '      </div>' . PHP_EOL;  // close card header
          
          // the card body must specify a height since contained plot is reactive and needs a size
          echo '      <div id="card' . "{$i}" . '" class="card-body collapse';
          //if($i == 0) echo " show";
          //echo '" data-bs-parent="#histograms" height:500px>' . PHP_EOL;
          echo '"  height:500px>' . PHP_EOL;
          
          // within the card body we'll put a tabbar
          echo '<ul class="card-body nav nav-tabs" role="tablist" style="width:100%">' . PHP_EOL;
          // a tabbar is just a series of links
          echo '  <li class="nav-item">' . PHP_EOL;
          // link one: time series page
          echo '    <a class="nav-link active" data-bs-toggle="tab" href="#TS_' . "{$histos[$i]}" . '">Time Series</a>' . PHP_EOL;
          echo '  </li>' . PHP_EOL;
          // link two: histogram page
          echo '  <li class="nav-item">' . PHP_EOL;
          echo '    <a class="nav-link" data-bs-toggle="tab" href="#H_' . "${histos[$i]}" . '">Histogram</a>' . PHP_EOL;
          echo '  </li>' . PHP_EOL;
          echo '</ul>' . PHP_EOL;   // end tabbar
          
         /*
           to add content to the tabbar we actually do that afterwards by linking content:
           * make a div instance of the "tab-content" class
           * embed a series of container divs, one for each tab, each of the "tab-pane" class
           * specify 'active' to the *first* tab in the list: this is always initially selected in the tabbar
           * add 'fade' to all tabs and 'fade show' to the first tab to animate switching
         */
          echo '<div id="' . "{$histos[$i]}" . '" class="tab-content resultplot">' . PHP_EOL;
          // within the div of tab pane 1 we'll put time series
          echo '<div id="TS_' . "{$histos[$i]}" . '" class="container tab-pane active fade show"><br>' . PHP_EOL;
          echo '<div id="timeseries_' . "{$histos[$i]}" . '" class="timeplot" style="width:100%"></div>' . PHP_EOL;
          echo '</div>' . PHP_EOL;  // end tab page
          // and in tab pane 2 a histogram
          echo '<div id="H_' . "{$histos[$i]}" . '" class="container tab-pane fade"><br>' . PHP_EOL;
          echo '<div id="histo_' . "{$histos[$i]}" . '" class="histoplot" style="width:100%"></div>' . PHP_EOL;
          echo '</div>' . PHP_EOL;  // end tab page
          echo '</div>' . PHP_EOL; //  end tab-content
          
          echo '</div>' . PHP_EOL;  // end card body
          echo '</div>' . PHP_EOL;  // end card class
      }
      
    ?>
    
  </div> <!-- end of histogram accordion -->
  <!-- script that'll populate those histograms -->
  <script src="../../update_histos.js" type="module"></script>
  
  <!-- transparency plots -->
  <div id="transparency_heatmap_acc" class="m-5 bg-light rounded">
    <div class="card">
      <div class="card-header">
        <a class="btn" data-bs-toggle="collapse" href="#transparencyhistory">Transparency History</a>
      </div>
      <div id="transparencyhistory" class="card-body collapse active" data-bs-parent="#transparency_heatmap_acc">
        <!-- add show to list of classes above to expand by default -->
        <div id="transparency_samples" class="transparencyplot" style="width:100% height:500px"></div>
      </div>
    </div>
    <div class="card">
      <div class="card-header">
        <a class="btn" data-bs-toggle="collapse" href="#transparencyheatmap">Transparency Heatmap</a>
      </div>
      <div id="transparencyheatmap" class="card-body collapse" data-bs-parent="#transparency_heatmap_acc">
        <div id="transparency_heatmap" style="width:100% height:500px">Coming Soon...</div>
        <!-- class="transparencyplot" << add to above div to make it a plotly plot -->
      </div>
    </div>
  </div>
  <script src="../../update_heatmap.js" type="module"></script>
  
<!--        <li class="list-group-item d-flex justify-content-between align-items-center"> start </li>-->
<!--      <li class="list-group-item active d-flex justify-content-between align-items-center"> power </li>-->
<!--      <li class="list-group-item d-flex justify-content-between align-items-center">-->
<!--        start_loop 10-->
<!--        <span class="badge bg-primary rounded-pill">5/10</span>-->
<!--      </li>-->
<!--      <li class="list-group-item d-flex justify-content-between align-items-center"> measure dark </li>-->
  
  
    <!--
    * website table:
     STATUS
     + power ("powerstate" = json: "status" = 'ON'/'OFF') [W]
     + pump ("pumpstate" = json: "state" = 'ON'/'OFF') [W]
     + inlet valve ("valvestate_inlet" = json: "state" = 'OPEN'/'CLOSED') [W]
     + outlet valve ("valvestate_inlet" = json: "state" = 'OPEN'/'CLOSED') [W]
     + pwm board ("pwm_connected" = json: bare integer? ) [W]
     + spectrometer ("spectrometer_connected" = json: bare bool ) [W]
     + leds ("ledStatuses" = json: <ledname>:<integer> ) [W]
     
     RECORDING
     + run, start time, end time, runconfig, notes, git tag [R]
     + pure reference trace filename ("purewater_filename" = json: "filename") [D]
     + calibration function paramter set version - ("calibration_version" = json: bare integer?) [D]
     + output file ("output_filename" = json: "filename" ) [W]
     + scheduler ("scheduler_commands" = json array of command strings) [W]
     + current scheduler position ("scheduler_progress" = json: "current_command" (string),  [W]
                                   "commands_step" (string), "loop_counts" (array of integers) )
     
     MEASUREMENT
     + last trace ("last_trace" = json: "yvals", "yerrs", "xvals") [W]
     + dark trace params - ("darktrace_params" = json: "mean", "width") [D]
     + raw trace params  - ("rawtrace_params" = json: "max", "min" [within abs region]) [D]
     + dark subtracted trace in abs region ("dark_subtracted_data_in" = json tgrapherrors) [W]
     + dark subtracted trace outside abs region ("dark_subtracted_data_out" = json tgrapherrors) [W]
     + dark subtracted pure trace ("dark_subtracted_pure" = json tgrapherrors) [W]
     + pure fitted to data: ("pure_scaled" = json tgrapherrors) [W]
     + pure fit pars ("pure_fit_pars" = json from [fitting pars, fitting errors]) [D]
     + pure fitresultptr ("pure_fit_status" = json from fitresultptr) [D]
     + absorbance graph: ("absorbance_trace" = json tgrapherrors) [W]
     + LHS absorbance peak fit ("left_abspk_fit_pars" = json from [fitting pars, fitting errors]) [D]
     + LHS absorbance peak fitresultptr ("left_abspk_fit_status" = json from fitresultptr) [D]
     + RHS absorbance peak fit ("right_abspk_fit_pars" = json from [fitting pars, fitting errors]) [D]
     + RHS absorbance peak fitresultptr ("right_abspk_fit_status" = json from fitresultptr) [D]
     + gd concentration: ("gdconcentration" = json: "val", "err") [D]
     
  -->
  
  </body>
  
</html>
