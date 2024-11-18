

let data;
const nTop = 2;  // Number of top emitters to display

d3.csv("./../../../dataset/emissions_2022_total.csv")
  .then((csv) => {
    data = csv;
    createPlot(data);
  });
function createPlot(data) {    const nTop = 2; // Number of top emitters to display

    // Load CSV Data
    d3.csv("./../../../dataset/emissions_2022_total.csv").then((data) => {
      createPlot(data);
    });

    const continentColors = {
      "Asia": "#f44336",
      "Europe": "#3f51b5",
      "Africa": "#ff9800",
      "Americas": "#4caf50",
      "Oceania": "#9c27b0"
    };

    const continents = Object.keys(continentColors);

    function createPlot(data) {
      // Create filters (checkboxes)
      const filtersDiv = d3.select("#filters");
      continents.forEach(continent => {
        filtersDiv.append("label")
          .attr("class", "checkbox-label")
          .html(`
            <input type="checkbox" class="filter-checkbox" value="${continent}" checked>
            <div class="legend-color" style="background-color: ${continentColors[continent]}"></div>
            ${continent}
          `);
      });

      // Event listener for filtering data
      d3.selectAll(".filter-checkbox").on("change", function() {
        const selectedContinents = Array.from(
          d3.selectAll(".filter-checkbox")
            .nodes()
            .filter(cb => cb.checked)
        ).map(cb => cb.value);

        updateChart(data, selectedContinents);
      });

      // Initial plot
      updateChart(data, continents);
      createLegend();
    }

    function updateChart(data, selectedContinents) {
      const svg = d3.select("#chart");
      svg.selectAll("*").remove();

      // Filter data based on selected continents
      const filteredData = data.filter(d => selectedContinents.includes(d.Continent));
      
      // Sort data by emissions and get top emitters
      const topEmitters = filteredData
        .sort((a, b) => b.Emissions - a.Emissions)
        .slice(0, nTop);

      // Set up scales
      const xScale = d3.scaleBand()
        .domain(topEmitters.map(d => d.Country))
        .range([50, 750])
        .padding(0.1);

      const yScale = d3.scaleLinear()
        .domain([0, d3.max(topEmitters, d => +d.Emissions)])
        .range([450, 50]);

      const colorScale = d3.scaleOrdinal()
        .domain(continents)
        .range(Object.values(continentColors));

      // Draw bars
      svg.selectAll("rect")
        .data(topEmitters)
        .enter()
        .append("rect")
        .attr("x", d => xScale(d.Country))
        .attr("y", d => yScale(d.Emissions))
        .attr("width", xScale.bandwidth())
        .attr("height", d => 450 - yScale(d.Emissions))
        .attr("fill", d => colorScale(d.Continent));

      // Add axes
      const xAxis = d3.axisBottom(xScale);
      const yAxis = d3.axisLeft(yScale);

      svg.append("g")
        .attr("transform", "translate(0,450)")
        .call(xAxis);

      svg.append("g")
        .attr("transform", "translate(50,0)")
        .call(yAxis);
    }

    function createLegend() {
      const legendDiv = d3.select("#legend");

      Object.entries(continentColors).forEach(([continent, color]) => {
        const legendItem = legendDiv.append("div").attr("class", "legend-item");
        legendItem.append("div")
          .attr("class", "legend-color")
          .style("background-color", color);
        legendItem.append("span").text(continent);
      });
    }
}

