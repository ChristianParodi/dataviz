<!DOCTYPE html>
<html lang="en">
  <head>
    <title>Tristimuli</title>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <!-- Includes -->
    <!-- <link href="./libs/flowbite.min.css" rel="stylesheet" type="text/css" />
    <script src="./libs/flowbite.min.js"></script> -->
    <script src="./libs/d3.v7.min.js"></script>
    <script src="./libs/tailwind.js"></script>
    
    
    <link href="./dist/index.css" rel="stylesheet" />
    <!-- vertical carousel -->
    <link href="./dist/carousel.css" rel="stylesheet" />
  </head>

  <body>
  <?php
  // Path to the CSV file
  $csvFile = './dataset/emissions_2022_countries.csv';

  // Read the CSV file
  $continents = [];
  if (($handle = fopen($csvFile, 'r')) !== FALSE) {
      fgetcsv($handle, 1000, ',');
      while (($data = fgetcsv($handle, 1000, ',')) !== FALSE) {
          $continents[] = $data[3]; // Assuming the country name is in the first column
      }
      fclose($handle);
  }
  $continents = array_unique($continents);
  ?>
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
    <!-- <button class="btn-primary">Prova</button> -->
    <div class="flex items-center ">
      <div class="flex flex-col">
          <script src="./src/js/index.js" type="module" defer></script>

          <rect x="0" class="fill-[]" height="49" width="660" y="3"><title>37.601273</title></rect>

          <!-- <rect x="0" class="fill-mint" height="49" width="660" y="3"><title>37.601273</title></rect>

          <rect x="0" class="fill-slate-blue" height="49" width="660" y="3"><title>37.601273</title></rect>
          <rect x="0" class="fill-lavender" height="49" width="660" y="3"><title>37.601273</title></rect>

          <rect x="0" class="fill-oxford-blue" height="49" width="660" y="3"><title>37.601273</title></rect>
          <rect x="0" class="fill-maize" height="49" width="660" y="3"><title>37.601273</title></rect> -->

          <?php foreach ($continents as $continent): ?>
             <label>
               <input type="checkbox" name="filter" value="<?= htmlspecialchars($continent) ?>" checked />
               <?= htmlspecialchars($continent) ?>
             </label>
          <?php endforeach; ?>
        </div>
    </div>
  </body>
</html>