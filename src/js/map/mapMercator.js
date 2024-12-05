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
    .style("background", "#fff");

  // Caricare i dati GeoJSON e il dataset
  Promise.all([
    d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"), // GeoJSON
    d3.csv("./../../dataset/emissions_2022_total.csv"), // Dataset con emissioni
    d3.csv("./../../dataset/fossil_land_continents.csv")
  ]).then(([world, emissions, emissions_type]) => {
    const emissionsByCountry = new Map(emissions.map(d => [d.Code, +d.Total]));
    const emissionsPerCapitaByCountry = new Map(emissions.map(d => [d.Code, +d.CO2]));
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

    const colorScaleTotal = d3.scaleThreshold()
      .domain(thresholds)
      .range(colors.slice(1));

    const perCapitaThresholds = [0, 1, 2, 5, 10, 20, 30, 50];
    const colorScalePerCapita = d3.scaleThreshold()
      .domain(perCapitaThresholds)
      .range(d3.schemeOranges[9]);

    // Function to update the map
    function updateMap() {
      const isPerCapita = document.getElementById("toggle").checked;

      const t = d3.transition().duration(750);

      g.selectAll("path")
        .data(world.features)
        .join("path")
        .attr("d", path)
        .attr("fill", d => {
          const emissions = isPerCapita
            ? emissionsPerCapitaByCountry.get(d.id)
            : emissionsByCountry.get(d.id);
          const scale = isPerCapita ? colorScalePerCapita : colorScaleTotal;
          return emissions === undefined ? "#ccc" : scale(emissions);
        })
        .attr("stroke", "#ccc")
        .attr("stroke-width", 0.5)
        .on("mousemove", function (event, d) {
          const emissions = isPerCapita
            ? emissionsPerCapitaByCountry.get(d.id)
            : emissionsByCountry.get(d.id);

          let tooltipText = `<strong>${d.properties.name}</strong><br>Data not available`;
          if (emissions !== undefined)
            tooltipText = `<strong>${d.properties.name}</strong><br>
              ${isPerCapita
                ? `CO₂ per capita: ${(emissions).toFixed(3)} t`
                : `Total emissions: ${(emissions / 1e9).toFixed(3)} Bil t`}`;

          tooltip.style("opacity", 1)
            .html(tooltipText)
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
          tooltip.style("opacity", 0);
          // Reset all countries to original state
          g.selectAll("path")
            .attr("stroke", "#ccc")
            .attr("stroke-width", 0.5)
            .style("opacity", 1);
        })
        .on("click", function (event, d) {
          const countryEmissions = emissions.find(r => r.Code == d.id);
          const emissionsPerCapita = +countryEmissions.CO2;
          const countryPopulation = +countryEmissions.Population;

          const emissionsType2022 = emissions_type.filter(d => +d.Year === 2022);
          const fossilEmissions = d3.sum(emissionsType2022.map(d => +d.Fossil)) || 0;
          const landEmissions = d3.sum(emissionsType2022.map(d => +d.Land)) || 0;

          const [[x0, y0], [x1, y1]] = path.bounds(d);
          const bboxWidth = x1 - x0;
          const bboxHeight = y1 - y0;
          const bboxCenterX = (x0 + x1) / 2;
          const bboxCenterY = (y0 + y1) / 2;

          const scale = Math.max(1, Math.min(8, 0.9 / Math.max(bboxWidth / width, bboxHeight / height)));
          const translateX = width / 2 - scale * bboxCenterX;
          const translateY = height / 2 - scale * bboxCenterY;

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
    }

    // Initialize the map with total emissions
    updateMap();

    // Add event listener for the toggle switch
    document.getElementById("toggle").addEventListener("change", updateMap);

    // Legend generation code remains unchanged...
    // Create the bins for the legend (based on thresholds and colors)
    const legendBins = thresholds.map((threshold, i) => {
      return { threshold, color: colors[i], next: thresholds[i + 1] };
    }).slice(0, -1); // Remove the last bin as it doesn't have a corresponding range

    const squareSize = 20;
    const spacing = 20;
    const legendPadding = 10;
    const maxRange = d3.max(legendBins, d => d.next - d.threshold);
    const squareWidthScale = d3.scaleLinear()
      .domain([0, maxRange])
      .range([20, 120]);

    let cumulativeX = legendPadding;

    legendSvg.selectAll("rect")
      .data(legendBins)
      .join("rect")
      .attr("x", (d, i) => {
        const currentX = cumulativeX;
        cumulativeX += squareWidthScale(d.next - d.threshold) + spacing;
        return currentX;
      })
      .attr("y", 10)
      .attr("width", d => squareWidthScale(d.next - d.threshold))
      .attr("height", squareSize)
      .style("fill", d => d.color);

    legendSvg.selectAll("text")
      .data(legendBins)
      .join("text")
      .attr("x", (d, i) => legendPadding + i * (squareSize + spacing))
      .attr("y", d => 50)
      .attr("dy", "0.35em")
      .text(d => `${(d.threshold / 1e9).toFixed(1)}B`);
  });
}

mapMercator();
