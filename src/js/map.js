const width = window.innerWidth;
const height = window.innerHeight;

// Tooltip per mostrare informazioni
const tooltip = d3.select("body").append("div")
  .attr("class", "tooltip")
  .style("position", "absolute")
  .style("padding", "6px")
  .style("background", "rgba(0, 0, 0, 0.7)")
  .style("color", "#fff")
  .style("border-radius", "4px")
  .style("pointer-events", "none")
  .style("opacity", 0);

// Creare la proiezione e il path
const projection = d3.geoMercator().scale(150).translate([width / 2, height / 2]);
const path = d3.geoPath().projection(projection);

// Zoom e panoramica
const zoom = d3.zoom().scaleExtent([1, 8]).on("zoom", (event) => {
  svg.selectAll("g").attr("transform", event.transform);
});

// Aggiungere SVG
const svg = d3.select("#map-container")
  .append("svg")
  .attr("width", "100vw")
  .attr("height", "100vh")
  .call(zoom);

const g = svg.append("g");

// Caricare i dati GeoJSON e il dataset
Promise.all([
  d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"), // GeoJSON
  d3.csv("./../../dataset/emissions_2022_total.csv"), // Dataset con emissioni
  d3.csv("./../../dataset/fossil_land_continents.csv")
]).then(([world, emissions, emissions_type]) => {
  const emissionsByCountry = new Map(emissions.map(d => [d.Country, +d.Total]));
  // Colori per la scala
  const colorScale = d3.scaleSequential(d3.interpolateReds)
    .domain([d3.min(emissions.map(d => +d.Total)), d3.max(emissions.map(d => +d.Total))]);

  // Disegnare la mappa
  g.selectAll("path")
    .data(world.features)
    .join("path")
    .attr("d", path)
    .attr("fill", d => {
      // console.log(emissionsByCountry.get(d.Country))
      const emissions = emissionsByCountry.get(d.properties.name) || 0; // d.id è il codice ISO del paese
      return colorScale(emissions);
    })
    .attr("stroke", "#ccc")
    .attr("stroke-width", 0.5)
    .on("mousemove", function (event, d) {
      const emissions = emissionsByCountry.get(d.properties.name) || 0;

      // Tooltip
      tooltip.style("opacity", 1)
        .html(`<strong>${d.properties.name}</strong><br>Emissions: ${(emissions / 1e9).toFixed(3)} Bil t`)
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY + 10}px`);

      // Highlight the hovered country
      d3.select(this)
        .attr("stroke", "black")
        .attr("stroke-width", 2)
        .style("opacity", 1);

      // Gray out all other countries
      g.selectAll("path")
        .filter(node => node !== d) // Exclude the hovered country
        .style("opacity", 0.3);
    })
    .on("mouseout", function (event, d) {
      // Reset tooltip
      tooltip.style("opacity", 0);

      // Reset all countries to original state
      g.selectAll("path")
        .attr("stroke", "#ccc")
        .attr("stroke-width", 0.5)
        .style("opacity", 1);
    }).on("click", function (event, d) {
      const countryEmissions = emissions.find(r => r.Country == d.properties.name);
      const emissionsPerCapita = +countryEmissions.CO2;
      const countryPopulation = +countryEmissions.Population;
      console.log(emissionsPerCapita, countryPopulation)
      const emissionsType2022 = emissions_type.filter(d => +d.Year === 2022)
      const fossilEmissions = d3.sum(emissionsType2022.map(d => +d.Fossil)) || 0;
      const landEmissions = d3.sum(emissionsType2022.map(d => +d.Land)) || 0;

      // Calculate the bounding box of the clicked country
      const [[x0, y0], [x1, y1]] = path.bounds(d);

      // Calculate the width, height, and center of the bounding box
      const bboxWidth = x1 - x0;
      const bboxHeight = y1 - y0;
      const bboxCenterX = (x0 + x1) / 2;
      const bboxCenterY = (y0 + y1) / 2;

      // Calculate the zoom scale (fit the bounding box to the viewport)
      const scale = Math.max(1, Math.min(8, 0.9 / Math.max(bboxWidth / width, bboxHeight / height)));

      // Calculate the translation to center the bounding box in the viewport
      const translateX = width / 2 - scale * bboxCenterX;
      const translateY = height / 2 - scale * bboxCenterY;

      // Apply zoom transformation
      svg.transition()
        .duration(750)
        .call(zoom.transform, d3.zoomIdentity.translate(translateX, translateY).scale(scale));

      tooltip.style("opacity", 1)
        .html(`<strong>${d.properties.name}</strong><br>
               Total fossil emissions: ${(fossilEmissions / 1e9).toFixed(3)} Bil t<br />
               Total land change emissions: ${(landEmissions / 1e9).toFixed(3)} Bil t<br />
               CO2 emissions per capita: ${emissionsPerCapita}<br />
               Population: ${countryPopulation}
               `)
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY + 10}px`);
    });

  // Aggiungere effetti di zoom e panoramica
  svg.call(zoom);
  document.body.append(svg.node())
});
