import { toFahrenheit, toCelsius } from './utils.js';

const tooltip = d3.select("body").append("div")
  .attr("class", "tooltip")
  .style("position", "absolute")
  .style("padding", "6px")
  .style("background", "rgba(0, 0, 0, 0.7)")
  .style("color", "#fff")
  .style("border-radius", "4px")
  .style("pointer-events", "none")
  .style("opacity", 0);


const monthsMap = {
  "Jan": "January",
  "Feb": "February",
  "Mar": "March",
  "Apr": "April",
  "May": "May",
  "Jun": "June",
  "Jul": "July",
  "Aug": "August",
  "Sep": "September",
  "Oct": "October",
  "Nov": "November",
  "Dec": "December"
};

function radarChart() {
  d3.csv("./../../dataset/assignment_4/min_max_avg_states.csv", d3.autoType)
    .then(data => {
      // unit selector (C - F)
      const toggleUnit = d3.select("#toggle-unit");

      // Set up the year slider
      const yearSlider = d3.select("#year-slider");
      const minYear = d3.min(data, d => d.year);
      const maxYear = d3.max(data, d => d.year);
      yearSlider
        .attr("min", minYear)
        .attr("max", maxYear)
        .property("value", maxYear);

      d3.select("#min-year-text").text(minYear);
      d3.select("#max-year-text").text(maxYear);

      const stateSelector = d3.select("#state-selector");

      const states = Array.from(new Set(data.map(d => d.country)));
      const firstState = states[0];

      // Function to draw the radar chart
      function drawChart(selectedState, selectedYear, isFahrenheit) {
        // Remove existing SVG
        d3.select("#radar-chart").select("svg").remove();

        const filtered = data.filter(d => d.country === selectedState && +d.year === selectedYear);

        const width = 600;
        const height = 600;
        const margin = 50;
        const radius = Math.min(width, height) / 2 - margin;

        const svg = d3.select("#radar-chart").append("svg")
          .attr("width", width)
          .attr("height", height)
          .append("g")
          .attr("transform", `translate(${width / 2}, ${height / 2})`);

        const months = filtered.map(d => d.month);
        const angleScale = d3.scalePoint()
          .domain([...months, ""]) // add another element, otherwise dec overlaps jan on the circumference
          .range([0, 2 * Math.PI]);

        const convert = (v) => isFahrenheit ? v : toCelsius(v);

        const selectedUnitData = filtered.map(d => ({ ...d })); // Deep copy
        selectedUnitData.forEach(d => {
          d.min = convert(d.min);
          d.max = convert(d.max);
          d.avg = convert(d.avg);
        });

        const absMin = convert(d3.min(data, d => d.min));
        const absMax = convert(d3.max(data, d => d.max));
        const radialScale = d3.scaleLinear()
          .domain([absMin, absMax + 20])
          .range([0, radius]);

        // Draw axis lines for months
        months.forEach(month => {
          const angle = angleScale(month);
          const x = radius * Math.sin(angle);
          const y = -radius * Math.cos(angle);

          svg.append("line")
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", x)
            .attr("y2", y)
            .style("stroke", "#ccc");

          svg.append("text")
            .attr("x", x * 1.1)
            .attr("y", y * 1.1)
            .style("text-anchor", "middle")
            .style("font-size", "12px")
            .text(month);
        });

        // Draw radial gridlines
        const numLevels = 5;
        const gridLevels = d3.range(0, numLevels + 1)
          .map(i => absMin + (i * (absMax - absMin) / numLevels));

        // Draw radial gridlines
        gridLevels.forEach(level => {
          const r = radialScale(level);
          svg.append("circle")
            .attr("cx", 0)
            .attr("cy", 0)
            .attr("r", r)
            .style("fill", "none")
            .style("stroke", "#ccc")
            .style("stroke-dasharray", "2,2");

          svg.append("text")
            .attr("x", 0)
            .attr("y", -r)
            .attr("dy", "-0.5em")
            .style("text-anchor", "middle")
            .style("font-size", "10px")
            .text(level.toFixed(1) + (isFahrenheit ? "°F" : "°C"));
        });

        // Function to calculate radar path
        function calculatePath(data, key) {
          return data.map(d => {
            const angle = angleScale(d.month);
            const r = radialScale(d[key]);
            const x = r * Math.sin(angle);
            const y = -r * Math.cos(angle);
            return [x, y];
          });
        }

        // Plot min, max, and avg lines
        const paths = [
          { key: "min", color: "darkblue" },
          { key: "max", color: "red" },
          { key: "avg", color: "steelblue" }
        ];

        paths.forEach(({ key, color }) => {
          const pathData = calculatePath(selectedUnitData, key);

          svg.append("path")
            .datum(pathData)
            .attr("d", d3.line().x(d => d[0]).y(d => d[1]).curve(d3.curveLinearClosed))
            .style("fill", "none")
            .style("stroke", color)
            .style("stroke-width", 2);

          svg.selectAll(`.circle-${key}`)
            .data(pathData)
            .join("circle")
            .attr("class", `circle-${key}`)
            .attr("cx", d => d[0])
            .attr("cy", d => d[1])
            .attr("r", 3)
            .style("fill", color);
        });

        // Line for tooltip
        const line = svg.append("line")
          .attr("class", "month-axis-highlight")
          .style("stroke", "black")
          .style("stroke-width", 2)
          .style("opacity", 0);

        // Add a transparent overlay for mouse interactions
        svg.append("circle")
          .attr("r", radius)
          .style("fill", "none")
          .style("pointer-events", "all")
          .on("mousemove", function (event) {
            const [mouseX, mouseY] = d3.pointer(event);

            const angle = Math.atan2(mouseY, mouseX);

            // Normalize the angle to match the radar chart's axes
            const adjustedAngle = (angle + Math.PI / 2 + 2 * Math.PI) % (2 * Math.PI);

            // Find the closest month based on the angle
            const closestMonthIndex = Math.round((adjustedAngle / (2 * Math.PI)) * months.length) % months.length;
            const closestMonth = months[closestMonthIndex]; // Array of months in order
            const closestMonthAngle = angleScale(closestMonth);

            // Find the corresponding data for the month
            const monthData = selectedUnitData.find(d => d.month === closestMonth);

            if (monthData) {
              // Update the tooltip
              const unit = isFahrenheit ? "°F" : "°C";
              tooltip.style("opacity", 1)
                .style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY + 10}px`)
                .html(`
                  <strong style="text-decoration: underline;">${monthsMap[closestMonth]}</strong><br>
                  <strong>Max:</strong> ${monthData.max.toFixed(1)}${unit}<br>
                  <strong>Avg:</strong> ${monthData.avg.toFixed(1)}${unit}<br>
                  <strong>Min:</strong> ${monthData.min.toFixed(1)}${unit}
                `);

              // Update the axis highlight
              line
                .attr("class", "month-axis-highlight")
                .attr("x1", 0)
                .attr("y1", 0)
                .attr("x2", (Math.sin(closestMonthAngle) * radius))
                .attr("y2", (-Math.cos(closestMonthAngle) * radius))
                .style("opacity", 1);
            }
          })
          .on("mouseout", function () {
            // Hide the tooltip
            tooltip.style("opacity", 0);
            // Remove the axis highlight
            line.style("opacity", 0);
          });
      };

      // Initial draw
      drawChart(firstState, maxYear, toggleUnit.property("checked"));

      // Update chart on slider input
      yearSlider.node().addEventListener("input", function () {
        const selectedState = stateSelector.node().value;
        const selectedYear = +this.value;
        const isFahrenheit = toggleUnit.node().checked;

        drawChart(selectedState, selectedYear, isFahrenheit);
      });

      // Update chart on state selection
      stateSelector.node().addEventListener("change", function () {
        const selectedState = this.value;
        const selectedYear = +yearSlider.node().value;
        const isFahrenheit = toggleUnit.node().checked;

        drawChart(selectedState, selectedYear, isFahrenheit);
      });

      // Update chart on unit toggle
      toggleUnit.node().addEventListener("change", function () {
        const selectedState = stateSelector.node().value;
        const selectedYear = +yearSlider.node().value;
        const isFahrenheit = this.checked;

        drawChart(selectedState, selectedYear, isFahrenheit);
      });
    });
}

radarChart();