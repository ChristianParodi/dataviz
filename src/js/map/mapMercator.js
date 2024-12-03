function mapMercator() {
  const width = 1000;
  const height = 600;

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

  // Aggiungere SVG con sfondo
  const svg = d3.select("#map-container-mercator")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .style("background", "#fdfdfd") // Set the background color
    .style("border", "1px solid #ccc")
    .call(zoom);

  const g = svg.append("g");

  // Creare una seconda SVG per la legenda
  const legendWidth = 800;
  const legendHeight = 400;

  const legendSvg = d3.select("#legend-container-mercator")
    .append("svg")
    .attr("width", legendWidth)
    .attr("height", height)
    // .style("border", "1px solid #ccc")
    .style("background", "#fff");

  // Caricare i dati GeoJSON e il dataset
  Promise.all([
    d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"), // GeoJSON
    d3.csv("./../../dataset/emissions_2022_total.csv"), // Dataset con emissioni
    d3.csv("./../../dataset/fossil_land_continents.csv")
  ]).then(([world, emissions, emissions_type]) => {
    const emissionsByCountry = new Map(emissions.map(d => [d.Code, +d.Total]));
    const emissionDomain = [
      d3.min(emissions, d => +d.Total),
      d3.max(emissions, d => +d.Total),
    ];
    const emissionsValues = emissions.map(d => +d.Total).sort((a, b) => a - b);
    // Colori per la scala

    const thresholds = [
      0,
      0.01e9,
      0.3e9,
      0.5e9,
      0.7e9,
      1e9,
      3e9,
      5e9,
      6e9,
      8e9,
      10e9,
      emissionsValues[emissionsValues.length - 1]
    ];

    const colors = thresholds.map((d, i) => {
      return d3.interpolateOranges(i / (thresholds.length - 1)); // Spread the shades evenly
    });

    const colorScale = d3.scaleThreshold()
      .domain(thresholds)
      .range(colors.slice(1));

    // Disegnare la mappa
    g.selectAll("path")
      .data(world.features)
      .join("path")
      .attr("d", path)
      .attr("fill", d => {
        const emissions = emissionsByCountry.get(d.id);
        return emissions === undefined ? "#ccc" : colorScale(emissions);
      })
      .attr("stroke", "#ccc")
      .attr("stroke-width", 0.5)
      .on("mousemove", function (event, d) {
        const emissions = emissionsByCountry.get(d.id);

        // Tooltip
        tooltip.style("opacity", 1)
          .html(`<strong>${d.properties.name}</strong><br>${emissions === undefined ? "Data not available" : "Emissions: " + (emissions / 1e9).toFixed(3) + " Bil t"}`)
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY + 10}px`);

        // Highlight the hovered country
        d3.select(this)
          .attr("stroke", "black")
          .attr("stroke-width", 0.5)
          .style("opacity", 1);

        // Gray out all other countries
        g.selectAll("path")
          .filter(node => node !== d) // Exclude the hovered country
          .style("opacity", 0.3);
      })
      .on("mouseout", function () {
        // Reset tooltip
        tooltip.style("opacity", 0);

        // Reset all countries to original state
        g.selectAll("path")
          .attr("stroke", "#ccc")
          .attr("stroke-width", 0.5)
          .style("opacity", 1);
      }).on("click", function (event, d) {
        const countryEmissions = emissions.find(r => r.Code == d.id);
        const emissionsPerCapita = +countryEmissions.CO2;
        const countryPopulation = +countryEmissions.Population;

        const emissionsType2022 = emissions_type.filter(d => +d.Year === 2022);
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
                 Total land change emissions: ${(landEmissions / 1e9).toFixed(3)} bil t<br />
                 CO₂ emissions per capita: ${emissionsPerCapita.toFixed(3).toLocaleString()} t<br />
                 Population: ${countryPopulation.toLocaleString()} people
                 `)
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY + 10}px`);
      });
    // Aggiungere effetti di zoom e panoramica
    svg.call(zoom);
// Create the bins for the legend (based on thresholds and colors)
const legendBins = thresholds.map((threshold, i) => {
  return { threshold, color: colors[i], next: thresholds[i + 1] };
}).slice(0, -1); // Remove the last bin as it doesn't have a corresponding range

// Set dimensions for the legend
const squareSize = 20; // Size of each square
const spacing = 20; // Space between squares and text
const legendPadding = 10; // Padding for the legend container

// Define a scale for the widths of the legend squares based on the range
const maxRange = d3.max(legendBins, d => d.next - d.threshold); // Maximum range
const squareWidthScale = d3.scaleLinear()
  .domain([0, maxRange]) // Input domain is the range of emission values
  .range([20, 120]); // Output range for square widths (min to max length)

  let cumulativeX = legendPadding; // Inizializza la posizione iniziale

  legendSvg.selectAll("rect")
    .data(legendBins)
    .join("rect")
    .attr("x", (d, i) => {
      const currentX = cumulativeX; // Memorizza la posizione corrente
      cumulativeX += squareWidthScale(d.next - d.threshold) + spacing; // Aggiorna la posizione cumulativa
      return currentX; // Ritorna la posizione corrente per l'elemento
    })
    .attr("y", 10) // Posizione verticale costante
    .attr("width", d => squareWidthScale(d.next - d.threshold)) // Larghezza proporzionale
    .attr("height", squareSize) // Altezza costante
    .style("fill", d => d.color); // Colore basato sulla scala

// Add labels beside each square to show the range
legendSvg.selectAll("text")
  .data(legendBins)
  .join("text")
  .attr("x", (d, i) => legendPadding + i * (squareSize + spacing) ) // Position text to the right of the square
  .attr("y", d => 50  ) // Align text with the middle of each square
  .attr("dy", "0.35em") // Center the text vertically
  .text(d => `${(d.threshold / 1e9).toFixed(2)} - ${(d.next / 1e9).toFixed(2)} bil t`) // Format the range
  .style("font-size", "10px")
  .style("fill", "#333");



    // Scale for the legend axis (match the vertical position of rectangles)
    const legendScale = d3.scaleLinear()
      .domain([0, thresholds.length - 1]) // Map indices to the range of bins
      .range([(height - legendHeight) / 2 + legendHeight, (height - legendHeight) / 2]); // Fit within the legend height


    // Append the axis to the legend
    legendSvg.append("g")
      .attr("transform", `translate(60, 0)`) // Position the axis beside the legend rectangles
      .call(legendAxis)
      .call(g => g.select(".domain").remove()); // Remove the line of the axis


  });
}

mapMercator();
