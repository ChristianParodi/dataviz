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

function radarmeandecadeChart() {
  d3.csv("./../../dataset/assignment_4/min_max_avg_states.csv", d3.autoType)
    .then(data => {
      const toggleUnit = d3.select("#toggle-unit-ridge");
      const stateSelector = d3.select("#state-selector-ridge");
      const yearSlider = d3.select("#year-slider-ridge");

      const minYear = d3.min(data, d => d.year);
      const maxYear = d3.max(data, d => d.year);
      let minimumAllowedYear = minYear;

      const states = Array.from(new Set(data.map(d => d.country)));
      states.sort();
      const firstState = states[0];


      function drawChart(selectedState, decade, isFahrenheit) {
        d3.select("#radardecade-chart").select("svg").remove();

        const stateData = data.
          filter(d => d.country === selectedState).map(d => ({ ...d }));
        const filteredData = stateData
          .filter(d => decade.start <= d.year && decade.end >= d.year)
          .map(d => ({ ...d }));

        const width = 600;
        const height = 600;
        const margin = 50;
        const radius = Math.min(width, height) / 2 - margin;

        const svg = d3.select("#radardecade-chart").append("svg")
          .attr("width", width)
          .attr("height", height)
          .append("g")
          .attr("transform", `translate(${width / 2}, ${height / 2})`);

        const months = Object.keys(monthsMap);
        const angleScale = d3.scalePoint()
          .domain([...months, ""]) // Prevent Dec-Jan overlap
          .range([0, 2 * Math.PI]);

        // Draw axes
        months.forEach(month => {
          const angle = angleScale(month);
          const x = radius * Math.sin(angle);
          const y = -radius * Math.cos(angle);

          svg.append("line")
            .attr("x1", 0).attr("y1", 0)
            .attr("x2", x).attr("y2", y)
            .style("stroke", "#ccc");

          svg.append("text")
            .attr("x", x * 1.1)
            .attr("y", y * 1.1)
            .style("text-anchor", "middle")
            .style("font-size", "12px")
            .text(month);
        });

        const convert = v => isFahrenheit ? v : toCelsius(v);

        // grouped is in the shape of [{ year, avgValues: [Jan, Feb, ..., Dec] }, ...]
        const grouped = d3.groups(filteredData, d => d.year)
          .map(([year, arr]) => ({
            year,
            avgValues: months.map(month => {
              const monthData = arr.find(d => d.month === month);
              return monthData ? convert(monthData.avg) : null;
            })
          }))
          .sort((a, b) => d3.ascending(a.year, b.year));

        console.log(stateData)
        const absMin = convert(d3.min(stateData, d => +d.avg));
        const absMax = convert(d3.max(stateData, d => +d.avg));

        console.log(absMin, absMax);

        const radialScale = d3.scaleLinear()
          .domain([absMin, absMax])
          .range([0, radius]);

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
            .text(`${level.toFixed(1)}${isFahrenheit ? '°F' : '°C'}`);
        });

        grouped.forEach((yearData, index) => {
          const colors = [...d3.schemeTableau10, "#ff00ff"]; // Add an extra color
          const color = colors[index % colors.length];

          const pathData = months.map((month, i) => {
            const angle = angleScale(month);
            const r = yearData.avgValues[i] !== null ? radialScale(yearData.avgValues[i]) : 0;
            return [r * Math.sin(angle), -r * Math.cos(angle)];
          });

          svg.append("path")
            .datum(pathData)
            .attr("d", d3.line().x(d => d[0]).y(d => d[1]).curve(d3.curveLinearClosed))
            .style("fill", "none")
            .style("stroke", color)
            .style("stroke-width", 2)
            .style("stroke-opacity", 0.8);

          svg.selectAll(`.circle-decade-${index}`)
            .data(pathData)
            .join("circle")
            .attr("class", `circle-decade-${index}`)
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

            // Find the data for that month in the years
            const monthData = grouped.map(yearData => {
              const monthIndex = months.indexOf(closestMonth);
              return {
                year: yearData.year,
                avg: yearData.avgValues[monthIndex]
              };
            }).filter(d => d.avg !== null);

            if (monthData) {
              // Update the tooltip
              const unit = isFahrenheit ? "°F" : "°C";
              let tooltipText = `<strong style="text-decoration: underline;">Means for ${monthsMap[closestMonth]}</strong><br>`;
              monthData.forEach((d, i) => {
                tooltipText += `<strong>${d.year}:</strong> ${d.avg.toFixed(1)}${unit}`;
                if (i !== monthData.length - 1) {
                  tooltipText += "<br>";
                }
              });

              tooltip.style("opacity", 1)
                .style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY + 10}px`)
                .html(tooltipText);

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

      }

      // Initial draw
      let decade = { start: maxYear - 10, end: maxYear };
      let selectedState = firstState;
      let isFahrenheit = toggleUnit.property("checked");

      drawChart(selectedState, decade, isFahrenheit);

      // Update chart on slider input
      yearSlider.node().addEventListener("input", function () {
        decade = { start: (+this.value) - 10, end: +this.value };

        if (decade.start < minimumAllowedYear) {
          // Reset slider value to minimumAllowedYear
          decade.start = minimumAllowedYear;
          decade.end = minimumAllowedYear + 10;
          this.value = decade.end;
        }

        drawChart(selectedState, decade, isFahrenheit);
      });

      stateSelector.on("change", function () {
        selectedState = this.value;
        minimumAllowedYear = d3.min(data.filter(d => d.country === this.value), d => d.year);
        if (decade.start < minimumAllowedYear) {
          decade.start = minimumAllowedYear;
          decade.end = minimumAllowedYear + 10;
        }
        drawChart(selectedState, decade, isFahrenheit);
      });

      // Update chart on toggle
      toggleUnit.node().addEventListener("change", function () {
        isFahrenheit = toggleUnit.property("checked");
        drawChart(selectedState, decade, isFahrenheit);
      });
    });
}

radarmeandecadeChart();