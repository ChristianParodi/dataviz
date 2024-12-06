function mapMercator() {
  const width = 1200;
  const height = 600;
  let zoomed = false;
  let clicked = false;
  let currentZoomLevel = d3.zoomIdentity.k;
  let previousZoomLevel = currentZoomLevel;

  // Select the reset button
  const resetButton = document.getElementById("reset");

  // Add click event listener to the button
  resetButton.addEventListener("click", () => {
    clicked = false;
    zoomed = false;
    currentZoomLevel = d3.zoomIdentity.k;
    previousZoomLevel = currentZoomLevel;

    // Reset the zoom to the default view
    svg.transition() // Add a smooth transition
      .duration(750) // Set transition duration
      .call(zoom.transform, d3.zoomIdentity); // Reset to the default zoom and pan
  });



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
  const zoom = d3.zoom()
    .scaleExtent([1, 8])
    .on("zoom", (event) => {
      zoomed = event.transform.k > 4 || clicked;
      previousZoomLevel = currentZoomLevel;
      currentZoomLevel = event.transform.k;

      if (previousZoomLevel > currentZoomLevel)
        clicked = false;

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
  const legendWidth = width + 30;
  const legendHeight = 100;

  const legendSvg = d3.select("#legend-container-mercator")
    .append("svg")
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .style("background", "#fff");

  // Caricare i dati GeoJSON e il dataset
  Promise.all([
    d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"), // GeoJSON
    d3.csv("./../../dataset/emissions_2022_total.csv"), // Dataset con emissioni
    d3.csv("./../../dataset/fossil_land_continents.csv")
  ]).then(([world, emissions, emissions_type]) => {
    const emissionsByCountry = new Map(emissions.map(d => [d.Code, +d.Total]));
    const emissionsPerCapitaByCountry = new Map(emissions.map(d => [d.Code, +d.CO2]));
    const emissionsValues = emissions.map(d => +d.Total).sort((a, b) => a - b);
    const perCapitaEmissionsValues = emissions.map(d => +d.CO2).sort((a, b) => a - b);

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
      emissionsValues[emissionsValues.length - 1]
    ];

    const colors = (thresholds) => thresholds.map((d, i) => {
      return d3.interpolateOranges(i / (thresholds.length - 1)); // Spread the shades evenly
    });

    const colorScaleTotal = d3.scaleThreshold()
      .domain(thresholds)
      .range(colors(thresholds).slice(0));

    function setZoomedTooltip(event, d) {
      const countryEmissions = emissions.find(r => r.Code == d.id);
      if (countryEmissions !== undefined) {
        const emissionsPerCapita = +countryEmissions.CO2;
        const countryPopulation = +countryEmissions.Population;

        const emissionsType2022 = emissions_type.filter(d => +d.Year === 2022);
        const fossilEmissions = d3.sum(emissionsType2022.map(d => +d.Fossil)) || 0;
        const landEmissions = d3.sum(emissionsType2022.map(d => +d.Land)) || 0;

        tooltip.style("opacity", 1)
          .html(`<strong>${d.properties.name}</strong><br>
                 Total fossil emissions: ${(fossilEmissions / 1e9).toFixed(3)} Bil t<br />
                 Total land change emissions: ${(landEmissions / 1e9).toFixed(3)} bil t<br />
                 CO₂ emissions per capita: ${emissionsPerCapita.toFixed(3).toLocaleString()} t<br />
                 Population: ${countryPopulation.toLocaleString()} people
                 `)
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY + 10}px`);
      }
      else {
        tooltip.style("opacity", 1)
          .html(`<strong>${d.properties.name}</strong><br>Data not available`)
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY + 10}px`);
      }
    }

    const perCapitaThresholds = [0, 1, 2, 5, 10, 20, 30, perCapitaEmissionsValues[perCapitaEmissionsValues.length - 1]];
    const colorScalePerCapita = d3.scaleThreshold()
      .domain(perCapitaThresholds)
      .range(colors(perCapitaThresholds));

    // Function to update the map
    function updateMap() {
      const isPerCapita = document.getElementById("toggle-mercator").checked;

      const t = d3.transition().duration(500);

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


          if (!zoomed) {
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
          }
          else {
            setZoomedTooltip(event, d);
          }

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
          clicked = true;

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

          zoomed = true;
          setZoomedTooltip(event, d);
        });
      // Aggiungere effetti di zoom e panoramica
      svg.call(zoom);
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
        .attr("style", "outline: 0.05px solid orange;")
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
        })
        .on("mouseout", function () {
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
        .attr("y", 10)
        .attr("width", 2)
        .attr("height", 25)
        .attr("fill", "orange")
        .attr("stroke-width", "2px");

      // Ultimo tick (finale)
      legendSvg.append("rect")
        .attr("x", cumulativeX - 1) // Posizione finale dopo l'ultimo rettangolo
        .attr("y", 10)
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

    document.getElementById("toggle-mercator").addEventListener("change", updateMap);
    document.getElementById("toggle-mercator").addEventListener("change", updateLegend);
  });
}

mapMercator();