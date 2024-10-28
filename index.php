<!DOCTYPE html>
<html lang="en">

  <head>
    <title>Tristimuli</title>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <!-- Includes -->
    <link href="./dist/index.css" rel="stylesheet" />
    <link href="./libs/flowbite.min.css" rel="stylesheet" type="text/css" />
    <script src="./libs/flowbite.min.js"></script>
    <script src="./libs/d3.v7.min.js"></script>
    <script src="./libs/tailwind.js"></script>

    <!-- vertical carousel -->
    <link href="./dist/carousel.css" rel="stylesheet" />
  </head>

  <body>
    <main class="max-h-screen overflow-y-scroll snap snap-y snap-mandatory">
      <?php include("./src/html/carousel.html"); ?>
    </main>
    <!-- Title -->
    <!-- Subtitle -->
    <!-- 
      Section1: description of the project
      data at hand etc.
    -->
    <!-- 
      following sections (one for each secondary page)
    -->
    <!-- Check w3c validator -->
    <!-- Use selector with svg to style them (no inline styling) -->
    <!-- fonts: Roboto Slab for headings and Fira sans for paragraphs -->
    <!-- <button class="btn-primary">Prova</button>
    <div>
      <strong>Filter:</strong>
      <label><input type="checkbox" name="US" value="1" id="filter-us-only" />US only</label>
    </div> -->
    <!-- <script src="./src/js/index.js" type="module"></script> -->
  </body>

</html>