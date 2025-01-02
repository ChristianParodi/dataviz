import { kernelDensityEstimator, kernelEpanechnikov } from './utils.js';
import { toFahrenheit, toCelsius } from './utils.js';

function ridgelinePlot() {
  d3.csv("./../../../dataset/assignment_4/min_max_avg_states.csv", d3.autoType)
    .then(data => {
      const toggleUnit = d3.select("#toggle-unit");
      const stateSelector = d3.select("#state-selector");

      const states = Array.from(new Set(data.map(d => d.country))).sort();
      const years = Array.from(new Set(data.map(d => d.year))).sort();
      const selectedYears = years.slice(-10);

      states.forEach(state => {
        stateSelector.append("option")
          .attr("value", state)
          .text(state);
      });

      const firstState = states[0];
      const svgWidth = 700;
      const svgHeight = 600;
      const svg = d3.select("#ridge-line")
        .append("svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight);

      function drawChart(selectedState, isFahrenheit) {
        const filteredData = data
          .filter(d => d.country === selectedState && selectedYears.includes(d.year));

        filteredData.forEach(d => {
          d.min = isFahrenheit ? toFahrenheit(d.min) : toCelsius(d.min);
          d.max = isFahrenheit ? toFahrenheit(d.max) : toCelsius(d.max);
        });

        const grouped = d3.groups(filteredData, d => d.year)
          .map(([yr, arr]) => ({
            year: yr,
            minValues: arr.map(v => v.min),
            maxValues: arr.map(v => v.max)
          }))
          .sort((a, b) => d3.ascending(a.year, b.year));

        const margin = { top: 50, right: 30, bottom: 30, left: 50 };
        const width = 700;
        const height = 600;
        const lineHeight = (height - margin.top - margin.bottom) / grouped.length;

        const x = d3.scaleLinear()
          .domain([
            d3.min(data, d => d.min),
            d3.max(data, d => d.max)
          ])
          .range([margin.left, width - margin.right]);

        const y = d3.scalePoint()
          .domain(grouped.map(d => d.year))
          .range([margin.top, height - margin.bottom])
          .padding(0.5);

        svg.selectAll("*").remove();

        const step = 0.5;
        const domain = d3.range(x.domain()[0], x.domain()[1], step);
        const kde = kernelDensityEstimator(kernelEpanechnikov(7), domain);

        grouped.forEach(dataset => {
          const offset = y(dataset.year);
          const densityMin = kde(dataset.minValues);
          const densityMax = kde(dataset.maxValues);

          svg.append("path")
            .datum(densityMax)
            .attr("fill", "red")
            .attr("fill-opacity", 0.2)
            .attr("stroke", "red")
            .attr("stroke-width", 1)
            .attr("d", d3.area()
              .curve(d3.curveBasis)
              .x(d => x(d[0]))
              .y0(offset)
              .y1(d => offset - lineHeight * d[1] * 10)
            );

          svg.append("path")
            .datum(densityMin)
            .attr("fill", "blue")
            .attr("fill-opacity", 0.2)
            .attr("stroke", "blue")
            .attr("stroke-width", 1)
            .attr("d", d3.area()
              .curve(d3.curveBasis)
              .x(d => x(d[0]))
              .y0(offset)
              .y1(d => offset - lineHeight * d[1] * 10)
            );

          svg.append("text")
            .attr("x", margin.left - 10)
            .attr("y", offset)
            .attr("dy", "0.35em")
            .attr("text-anchor", "end")
            .style("font-size", "12px")
            .text(dataset.year);
        });

        svg.append("g")
          .attr("transform", `translate(0,${height - margin.bottom})`)
          .call(d3.axisBottom(x));

        svg.append("text")
          .attr("x", width / 2)
          .attr("y", height - margin.bottom + 25)
          .attr("text-anchor", "middle")
          .style("font-size", "12px")
          .text(isFahrenheit ? "Temperature (°F)" : "Temperature (°C)");
      }

      drawChart(firstState, toggleUnit.property("checked"));

      stateSelector.on("change", function () {
        drawChart(this.value, toggleUnit.property("checked"));
      });

      toggleUnit.on("change", function () {
        drawChart(stateSelector.property("value"), toggleUnit.property("checked"));
      });
    });
}

ridgelinePlot();
