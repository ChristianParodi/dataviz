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

  const legendWidth = width + 30;
  const legendHeight = 100;

  const legendSvg = d3.select("#legend-container-equal")
    .append("svg")
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .style("background", "#fff");

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
    const emissionsPerCapitaByCountry = new Map(emissions.map(d => [d.Code, +d.CO2]));

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
    ];

    const colors = (thresholds) => thresholds.map((d, i) => {
      return d3.interpolateOranges(i / (thresholds.length - 1)); // Spread the shades evenly
    });

    const colorScaleTotal = d3.scaleThreshold()
      .domain(thresholds)
      .range(colors(thresholds).slice(0));

    const perCapitaThresholds = [0, 1, 2, 5, 10, 20, 30, 50];
    const colorScalePerCapita = d3.scaleThreshold()
      .domain(perCapitaThresholds)
      .range(colors(perCapitaThresholds));

    function updateMap() {
      const isPerCapita = document.getElementById("toggle-ortho").checked;
      const t = d3.transition().duration(500);

      // Draw the map
      g.selectAll("path")
        .data(world.features)
        .join(
          enter => enter.append("path") // Handle new paths
            .attr("d", path)
            .attr("fill", d => {
              const emissions = isPerCapita
                ? emissionsPerCapitaByCountry.get(d.id)
                : emissionsByCountry.get(d.id);
              const scale = isPerCapita ? colorScalePerCapita : colorScaleTotal;
              return emissions === undefined ? "#ccc" : scale(emissions);
            })
            .attr("stroke", "#ccc")
            .attr("stroke-width", 0.5),
          update => update // Handle updating paths
            .transition(t) // Smoothly transition the color
            .attr("fill", d => {
              const emissions = isPerCapita
                ? emissionsPerCapitaByCountry.get(d.id)
                : emissionsByCountry.get(d.id);
              const scale = isPerCapita ? colorScalePerCapita : colorScaleTotal;
              return emissions === undefined ? "#ccc" : scale(emissions);
            }),
          exit => exit.remove())// Handle exiting paths
        .on("mousemove", function (event, d) {
          const emissions = isPerCapita
            ? emissionsPerCapitaByCountry.get(d.id)
            : emissionsByCountry.get(d.id);

          let tooltipText = `<strong>${d.properties.name}</strong><br>Data not available`;
          if (emissions !== undefined)
            tooltipText = `<strong>${d.properties.name}</strong><br>
              ${isPerCapita
                ? `CO₂ per capita: ${(emissions).toFixed(3)} t`
                : `Total CO₂ emissions: ${(emissions / 1e9).toFixed(3)} Bil t`}`;
          tooltip.style("opacity", 1)
            .html(tooltipText)
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
        });

      // Add graticule (optional, for better visual effect)
      const graticule = d3.geoGraticule();
      g.append("path")
        .datum(graticule)
        .attr("d", path)
        .attr("fill", "none")
        .attr("stroke", "#ccc")
        .attr("stroke-width", 0.5);
      }
        
        function updateLegend() {
          const isPerCapita = document.getElementById("toggle-mercator").checked;
          const scale = isPerCapita ? colorScalePerCapita : colorScaleTotal;
    
          const selectedThreshold = isPerCapita ? perCapitaThresholds : thresholds;
          // Create the bins for the legend (based on thresholds and colors)
          let legendBins = selectedThreshold.map((threshold, i) => {
            return { threshold, color: scale(threshold), next: selectedThreshold[i + 1] };
          }).slice(0, -1); // Remove the last bin as it doesn't have a corresponding range
    
          legendBins.unshift({ threshold: undefined, color: "#ccc", next: undefined });
    
          // Set dimensions for the legend
          const squareSize = 20; // Size of each square
          const spacing = 15; // Space between squares and text
          const legendPadding = 15; // Padding for the legend container
    
          const legendSpacing = isPerCapita
            ? squareSize + spacing
            : 2 * (squareSize + spacing)
          // Define a scale for the widths of the legend squares based on the range
          const squareWidthScale = d3.scaleLinear()
            .domain([0, selectedThreshold[selectedThreshold.length - 1]]) // Input domain is the range of emission values
            .range([0, legendWidth - 2 * legendPadding - legendSpacing]); // Output range for square widths (min to max length)
          let cumulativeX = legendPadding; // Inizializza la posizione iniziale
    
          legendSvg.selectAll("rect")
            .data(legendBins)
            .join("rect")
            .attr("x", (d, i) => {
              const currentX = cumulativeX; // Memorizza la posizione corrente
              if ((isPerCapita && i > 0) || i > 1) { // after the gray and the 0.00 - 0.01, do it normally. Do it on total only
                cumulativeX += squareWidthScale(d.next - d.threshold); // Aggiorna la posizione cumulativa
              }
              else
                cumulativeX += squareSize + spacing
              return currentX; // Ritorna la posizione corrente per l'elemento
            })
            .attr("y", 10) // Posizione verticale costante
            .attr("width", (d, i) => {
              return (isPerCapita && i > 0) || i > 1 ? squareWidthScale(d.next - d.threshold) : squareSize;
            }) // Larghezza proporzionale
            .attr("height", squareSize) // Altezza costante
            .attr("stroke", "orange")
            .attr("stroke-width", "1px")
            .style("fill", d => d.color) // Colore basato sulla scala
            .on("mousemove", function (event, d) {
              const legendValue = isPerCapita ? d.threshold : d.threshold / 1e9;
              const legendValueNext = isPerCapita ? d.next : d.next / 1e9;
              const tooltipText = isPerCapita
                ? `Emissions: ${legendValue.toFixed(2)} - ${legendValueNext.toFixed(2)} t`
                : `Emissions: ${legendValue.toFixed(2)} - ${legendValueNext.toFixed(2)} Bil t`
              // Tooltip
              tooltip.style("opacity", 1)
                .html(d.color === "#ccc" ? "Data not available" : tooltipText)
                .style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY + 10}px`);
    
              // Highlight the legend square
              d3.select(this)
                .style("opacity", 1);
    
              // Gray out all other legend squares
              legendSvg.selectAll("rect")
                .filter(node => node !== d) // Exclude the hovered square
                .style("opacity", 0.3);
    
              // Highlight the countries with the same emission
              g.selectAll("path")
                .data(world.features)
                .attr("stroke", function (node) {
                  const emissions = isPerCapita
                    ? emissionsPerCapitaByCountry.get(node.id)
                    : emissionsByCountry.get(node.id) / 1e9;
                  if (isNaN(legendValue))
                    return isNaN(emissions) ? "#000" : null;
                  return emissions >= legendValue && emissions <= legendValueNext ? "#000" : null;
                })
                .attr("stroke-width", function (node) {
                  const emissions = isPerCapita
                    ? emissionsPerCapitaByCountry.get(node.id)
                    : emissionsByCountry.get(node.id) / 1e9;
                  if (isNaN(legendValue))
                    return isNaN(emissions) ? 0.5 : 0;
                  return (emissions >= legendValue && emissions <= legendValueNext) ? 0.5 : 0;
                })
                .attr("fill-opacity", function (node) {
                  const emissions = isPerCapita
                    ? emissionsPerCapitaByCountry.get(node.id)
                    : emissionsByCountry.get(node.id) / 1e9;
                  if (isNaN(legendValue))
                    return isNaN(emissions) ? 1 : 0.5;
                  return emissions >= legendValue && emissions <= legendValueNext ? 1 : 0.5;
                });
            })
            .on("mouseout", function () {
              // reset legend squares
              legendSvg.selectAll("rect")
                .attr("stroke", "orange")
                .attr("stroke-width", "1px")
                .style("opacity", 1);
    
              // Reset the countries highlighting
              g.selectAll("path")
                .attr("stroke", "#ccc")
                .attr("stroke-width", 0.5)
                .attr("fill-opacity", 1);
    
              tooltip.style("opacity", 0);
            });
    
          legendSvg.selectAll("text").remove();
    
          cumulativeX = legendPadding; // Reinizializza per i testi
          legendSvg.selectAll(".bar-text")
            .data(legendBins.slice(0)) // I numeri per le barrette
            .join("text")
            .attr("x", (d, i) => {
              let currentX = cumulativeX;
              if ((isPerCapita && i > 0) || i > 1) { // after the gray and the 0.00 - 0.01, do it normally
                if ((!isPerCapita && i === 2) || (isPerCapita && i === 1))
                  currentX -= squareSize * 0.5;
                cumulativeX = currentX + squareWidthScale(d.next - d.threshold); // Aggiorna la posizione cumulativa
                return currentX; // Ritorna la posizione corrente per l'elemento
              }
              else {
                if (i === 0)
                  currentX += squareSize * 0.5; // Memorizza la posizione corrente
                cumulativeX = currentX + squareSize + spacing
                return currentX; // Ritorna la posizione corrente per l'elemento
              }
            })
            .attr("y", 45) // Posizione sopra i quadratini
            .text((d, i) => {
              if (i === 0) // gray
                return "Nd";
    
              if (i === 1 && !isPerCapita) // 0 - 0.01
                return "<0.01";
    
              return (isPerCapita ? legendBins[i].threshold : legendBins[i].threshold / 1e9).toFixed(2)
            }) // Mostra il valore di tonnellate
            .style("font-size", "10px")
            .style("fill", "#333")
            .style("text-anchor", "middle");
    
    
          legendSvg.append("text")
            .attr("x", cumulativeX) // Posizione finale dopo l'ultimo quadratino
            .attr("y", 45)
            .text((isPerCapita ? selectedThreshold[selectedThreshold.length - 1] : selectedThreshold[selectedThreshold.length - 1] / 1e9).toFixed(2)) // Ultimo valore (d.next)
            .style("font-size", "10px")
            .style("fill", "#333")
            .style("text-anchor", "middle");
    
          const firstTickX = isPerCapita
            ? legendPadding + spacing + squareSize
            : legendPadding + 2 * spacing + 2 * squareSize;
    
          // Primo tick (iniziale)
          legendSvg.append("rect")
            .attr("x", firstTickX - 1) // Posizione iniziale del primo tick
            .attr("y", 9.5)
            .attr("width", 2)
            .attr("height", 25)
            .attr("fill", "orange")
            .attr("stroke-width", "2px");
    
          // Ultimo tick (finale)
          legendSvg.append("rect")
            .attr("x", cumulativeX - 1) // Posizione finale dopo l'ultimo rettangolo
            .attr("y", 9.5)
            .attr("width", 2)
            .attr("height", 25)
            .attr("fill", "orange")
            .attr("stroke-width", "2px");
    
          // Append the axis to the legend
          legendSvg.append("g")
            .attr("transform", `translate(60, 0)`) // Position the axis beside the legend rectangles
            .call(g => g.select(".domain").remove()); // Remove the line of the axis
        }
    
    

    updateMap();
    updateLegend();

    document.getElementById("toggle-ortho").addEventListener("change", updateMap);
    document.getElementById("toggle-mercator").addEventListener("change", updateLegend);
  });
}

mapOrthographic();
