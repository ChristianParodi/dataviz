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
  const legendWidth = 120;
  const legendHeight = 400;

  const legendSvg = d3.select("#map-container-mercator")
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
    // Custom quantile thresholds
    const customQuantiles = [
      0,
      0.1,
      0.15,
      0.2,
      0.25,        // Min
      0.95,      // 10th percentile
      0.96,     // 25th percentile
      0.97,      // 50th percentile
      0.98,     // 75th percentile (focus ends here for < 5 bil t)
      0.995,     // 95th percentile (>= 5 bil t)
      1         // Max
    ];

    const quantileValues = customQuantiles.map(q => d3.quantile(emissionsValues, q));
    console.log(quantileValues)
    const thresholds = [
      0,

      emissionsValues[-1]
    ];

    const colorScale = d3.scaleThreshold()
      .domain(thresholds)
      .range(d3.schemeOranges[6]);


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

    const legendBins = colorScale.range().map(color => colorScale.invertExtent(color)).reverse();

    legendSvg.selectAll("rect")
      .data(legendBins)
      .join("rect")
      .attr("x", 40)
      .attr("y", (d, i) => (height - legendHeight) / 2 + i * (legendHeight / legendBins.length))
      .attr("width", 20)
      .attr("height", legendHeight / legendBins.length)
      .style("fill", d => colorScale(d[0]));



    const legendScale = d3.scaleLinear()
      .domain([emissionDomain[0], emissionDomain[1]])
      .range([(height - legendHeight) / 2 + legendHeight, (height - legendHeight) / 2]);

    // Use d3.ticks to generate evenly spaced tick values
    const legendTicks = thresholds;

    const legendAxis = d3.axisRight(legendScale)
      .tickValues(legendTicks)
      .tickFormat(d => (d / 1e9).toFixed(2) + " bil t"); // Format as billions



    legendSvg.append("g")
      .attr("transform", `translate(60, 0)`)
      .call(legendAxis)
      .call(g => g.select(".domain").remove());

  });
}

mapMercator();
