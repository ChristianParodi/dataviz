function mapOrthographic() {
  const width = 1000;
  const height = 600;

  // Tooltip for showing information
  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("padding", "6px")
    .style("background", "rgba(0, 0, 0, 0.7)")
    .style("color", "#fff")
    .style("border-radius", "4px")
    .style("pointer-events", "none")
    .style("opacity", 0);

  // Create the projection and path
  const projection = d3.geoOrthographic().scale(300).translate([width / 2, height / 2]);
  const path = d3.geoPath().projection(projection);

  const svg = d3.select("#map-container-ortho")
    .append("svg")
    .attr("width", width)
    .attr("height", height)

  const g = svg.append("g");

  // Add a dark circle to represent the sea
  g.append("circle")
    .attr("cx", width / 2)
    .attr("cy", height / 2)
    .attr("r", projection.scale())
    .attr("fill", "#fdfdfd"); // Darker blue color for the sea

  let rotation = [0, 0]; // Store the current rotation

  // Drag behavior for rotating the globe
  const drag = d3.drag()
    .on("drag", (event) => {
      const dx = event.dx;
      const dy = event.dy;

      // Update the rotation based on mouse drag
      const newRotation = [
        rotation[0] + dx / 2,
        Math.max(-90, Math.min(90, rotation[1] - dy / 2))
      ];

      rotation = newRotation;
      projection.rotate(rotation);

      // Redraw the globe
      g.selectAll("path").attr("d", path);
    });

  svg.call(drag);

  // Load GeoJSON and emissions data
  Promise.all([
    d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"),
    d3.csv("./../../dataset/emissions_2022_total.csv"),
    d3.csv("./../../dataset/fossil_land_continents.csv")
  ]).then(([world, emissions, emissions_type]) => {
    const emissionsByCountry = new Map(emissions.map(d => [d.Code, +d.Total]));

    const colorScale = d3.scaleSequential(d3.interpolateReds)
      .domain([d3.min(emissions.map(d => +d.Total)), d3.max(emissions.map(d => +d.Total))]);

    // Draw the map
    g.selectAll("path")
      .data(world.features)
      .join("path")
      .attr("d", path)
      .attr("fill", d => {
        const emissions = emissionsByCountry.get(d.id) || 0;
        return emissions === 0 ? "#ccc" : colorScale(emissions);
      })
      .attr("stroke", "#ccc")
      .attr("stroke-width", 0.5)
      .on("mousemove", function (event, d) {
        const emissions = emissionsByCountry.get(d.id) || 0;

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
      })
      .on("mouseout", function () {
        // Reset tooltip
        tooltip.style("opacity", 0);

        // Reset all countries to original state
        g.selectAll("path")
          .attr("stroke", "#ccc")
          .attr("stroke-width", 0.5)
          .style("opacity", 1);
      })
      .on("click", function (event, d) {
        const [longitude, latitude] = d3.geoCentroid(d); // Get the centroid of the country

        // Calculate new rotation to center the country
        const newRotation = [-longitude, -latitude];
        rotation = newRotation;

        // Smoothly transition the rotation
        d3.transition()
          .duration(1000)
          .tween("rotate", () => {
            const interpolate = d3.interpolate(projection.rotate(), newRotation);
            return t => {
              projection.rotate(interpolate(t));
              g.selectAll("path").attr("d", path);
            };
          });

        // Update the tooltip with country-specific data
        const emissions = emissionsByCountry.get(d.id) || 0;
        tooltip.style("opacity", 1)
          .html(`<strong>${d.properties.name}</strong><br>Emissions: ${(emissions / 1e9).toFixed(3)} Bil t`)
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY + 10}px`);
      });

    // Add graticule (optional, for better visual effect)
    const graticule = d3.geoGraticule();
    g.append("path")
      .datum(graticule)
      .attr("d", path)
      .attr("fill", "none")
      .attr("stroke", "#ccc")
      .attr("stroke-width", 0.5);
  });
}

mapOrthographic();
