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
      const toggleUnit = d3.select("#toggle-unit-radardecade");

      const filteredData = data;
      const states = Array.from(new Set(filteredData.map(d => d.country)));
      const firstState = states[0];

      function drawChart(selectedState, isFahrenheit) {
        d3.select("#radardecade-chart").select("svg").remove();

        const stateData = filteredData.filter(d => d.country === selectedState);
        const aggregatedData = d3.rollups(
          stateData,
          v => d3.mean(v, d => d.avg),
          d => Math.floor(d.year / 10) * 10, // Group by decade
          d => d.month
        ).map(([decade, months]) => {
          return {
            decade,
            values: Array.from(months, ([month, avg]) => ({ month, avg }))
          };
        });

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

        const convert = v => isFahrenheit ? v : toCelsius(v);

        const absMin = convert(d3.min(filteredData, d => d.avg));
        const absMax = convert(d3.max(filteredData, d => d.avg));
        const radialScale = d3.scaleLinear()
          .domain([absMin, absMax])
          .range([0, radius]);

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

        // Draw radial gridlines
        const numLevels = 5;
        d3.range(0, numLevels + 1).forEach(i => {
          const level = absMin + (i * (absMax - absMin) / numLevels);
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

        // Draw avg paths
        aggregatedData.forEach((decadeData, index) => {
          const color = d3.schemeTableau10[index % 10];
          const pathData = months.map(month => {
            const monthData = decadeData.values.find(v => v.month === month);
            const angle = angleScale(month);
            const r = monthData ? radialScale(convert(monthData.avg)) : 0;
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
            .data(decadeData.values)
            .join("circle")
            .attr("class", `circle-decade-${index}`)
            .attr("cx", d => {
              const angle = angleScale(d.month);
              return radialScale(convert(d.avg)) * Math.sin(angle);
            })
            .attr("cy", d => {
              const angle = angleScale(d.month);
              return -radialScale(convert(d.avg)) * Math.cos(angle);
            })
            .attr("r", 3)
            .style("fill", color)
            .on("mouseover", function (event, d) {
              tooltip.style("opacity", 1)
                .style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY + 10}px`)
                .html(`Decade: <strong>${decadeData.decade}s</strong><br>Month: <strong>${monthsMap[d.month]}</strong><br>Average Temp: <strong>${convert(d.avg).toFixed(1)}${isFahrenheit ? '°F' : '°C'}</strong>`);
            })
            .on("mouseout", () => tooltip.style("opacity", 0));
        });
      }

      drawChart(firstState, toggleUnit.property("checked"));

      toggleUnit.on("change", function () {
        drawChart(d3.select("#state-selector-radardecade").property("value"), this.checked);
      });

      const stateSelector = d3.select("#state-selector-radardecade");
      stateSelector.selectAll("option")
        .data(states)
        .enter()
        .append("option")
        .text(d => d)
        .property("selected", d => d === firstState);

      stateSelector.on("change", function () {
        drawChart(this.value, toggleUnit.property("checked"));
      });
    });
}

radarmeandecadeChart();