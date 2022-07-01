<!-- vim:set expandtab tabstop=2 wrap filetype=html -->
<!doctype html>
<html lang="en">
  <!-- HEAD -->
  <head>
    <meta charset="utf-8">
    <!-- set page width to match device, and initial scale to 100% -->
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <!-- Bootstrap core CSS -->
    <link href="./bootstrap-5.1.3-dist/css/bootstrap.min.css" rel="stylesheet">
    
    <!-- pull in any custom overrides for styles -->
    <link href="gad.css" rel="stylesheet">

    <title>GAD Control and Monitoring Website</title>
    
    <!-- bootstrap javascript source bundle must be included, typically at the end of the head/body section -->
    <script src="./bootstrap-5.1.3-dist/js/bootstrap.bundle.min.js"></script>
    
    <!-- plotly javascript source bundle -->
    <script src="./plotly-2.3.0/plotly-2.3.0.min.js"></script>
    <script src="./d3/d3.min.js"></script>
  </head>
  
  <!-- BODY -->
  <body>
  
  <?php echo '<p>Hello World</p>'; ?>
  
  <?php phpinfo(); ?>
  
  <!--
  <?php $data = file_get_contents("http://192.168.2.53/cgi-bin/marcus/scheduler_rows.cgi",0); echo $data; ?>
  <?php virtual("http://192.168.2.53/cgi-bin/marcus/scheduler_rows.cgi"); ?>
  -->
  
  </body>
  
</html>



