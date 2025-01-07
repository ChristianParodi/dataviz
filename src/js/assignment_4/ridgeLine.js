import { kernelDensityEstimator, kernelEpanechnikov } from './utils.js';
import { toFahrenheit, toCelsius } from './utils.js';
import { tooltip } from './utils.js';

function ridgelinePlot() {
  d3.csv("./../../../dataset/assignment_4/min_max_avg_states.csv", d3.autoType)
    .then(data => {
      const toggleUnit = d3.select("#toggle-unit-ridge");

      // set the year slider
      const yearSlider = d3.select("#year-slider-ridge");
      const minYear = d3.min(data, d => d.year);
      const maxYear = d3.max(data, d => d.year);

      let minimumAllowedYear = minYear;
      yearSlider
        .attr("min", minYear)
        .attr("max", maxYear)
        .attr("value", maxYear)
        .property("value", maxYear);

      // correct the two values of the slider text
      d3.select("#ridge-decade").text(`${maxYear - 10} - ${maxYear}`)
      d3.select("#min-year-text-ridge").text(minYear);
      d3.select("#max-year-text-ridge").text(maxYear);

      // set the state selector
      const stateSelector = d3.select("#state-selector-ridge");

      const states = Array.from(new Set(data.map(d => d.country)));
      states.sort();
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

      function drawChart(selectedState, decade, isFahrenheit) {
        svg.selectAll("*").remove()

        const filteredData = data
          .filter(d => d.country === selectedState && (decade.start <= d.year && decade.end >= d.year)).map(d => ({ ...d }))
          .map(d => ({ ...d }));

        const convert = (v) => isFahrenheit ? v : toCelsius(v);

        filteredData.forEach(d => {
          d.min = convert(d.min);
          d.max = convert(d.max);
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
            convert(d3.min(data, d => d.min)),
            convert(d3.max(data, d => d.max))
          ])
          .range([margin.left, width - margin.right]);

        const y = d3.scalePoint()
          .domain(grouped.map(d => d.year))
          .range([margin.top, height - margin.bottom])
          .padding(0.5);

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

          // Y ticks
          svg.append("text")
            .attr("x", margin.left - 10)
            .attr("y", offset)
            .attr("dy", "0.35em")
            .attr("text-anchor", "end")
            .style("font-size", "12px")
            .text(dataset.year);
        });

        // Plot title
        svg.append("text")
          .attr("x", width / 2 + margin.right)
          .attr("y", margin.top / 2)
          .style("text-anchor", "middle")
          .style("font-weight", "300")
          .text(`${selectedState} (${decade.start} - ${decade.end})`);

        svg.append("g")
          .attr("transform", `translate(0,${height - margin.bottom})`)
          .call(d3.axisBottom(x));

        svg.append("text")
          .attr("x", width / 2)
          .attr("y", height - margin.bottom + 30)
          .attr("text-anchor", "middle")
          .style("font-size", "12px")
          .text(isFahrenheit ? "Temperature (°F)" : "Temperature (°C)");
      }

      const decade = { start: maxYear - 10, end: maxYear };
      drawChart(firstState, decade, toggleUnit.property("checked"));

      // Update chart on slider input
      yearSlider.node().addEventListener("input", function () {
        const selectedState = stateSelector.property("value");
        let decade = { start: (+this.value) - 10, end: +this.value };
        const isFahrenheit = toggleUnit.property("checked");

        if (decade.start < minimumAllowedYear) {
          // Set tooltip text, hence width
          tooltip.html(`No data available for ${selectedState} before ${minimumAllowedYear}.`);

          const sliderRect = yearSlider.node().getBoundingClientRect();
          const sliderValue = +this.value;
          const sliderPositionX = 0.5 * sliderRect.width + sliderRect.left - 0.5 * tooltip.node().offsetWidth;
          const sliderPositionY = sliderRect.top + sliderRect.height;

          // Reset slider value to minimumAllowedYear
          this.value = minimumAllowedYear + 10;
          decade.start = minimumAllowedYear;
          decade.end = minimumAllowedYear + 10;

          yearSlider
            .classed("accent-blue-500", false)
            .classed("denied", true);

          // Show a tooltip
          tooltip.style("opacity", 1)
            .style("left", `${sliderPositionX}px`) // Position the tooltip near the slider
            .style("top", `${sliderPositionY - 55}px`);

          // Hide the tooltip after a delay
          setTimeout(() => {
            tooltip.style("opacity", 0);
            yearSlider.classed("denied", false).classed("accent-blue-500", true);
          }, 2000);

        }
        else {
          tooltip.style("opacity", 0);
        }

        drawChart(selectedState, decade, isFahrenheit);
      });

      // Update chart on state selection
      stateSelector.node().addEventListener("change", function () {
        const selectedState = this.value;
        minimumAllowedYear = d3.min(data.filter(d => d.country === this.value), d => d.year);
        let decade = {
          start: (+yearSlider.property("value")) - 10,
          end: +yearSlider.property("value")
        };

        if (decade.start < minimumAllowedYear) {
          yearSlider.property("value", minimumAllowedYear);
          decade.start = minimumAllowedYear;
          decade.end = minimumAllowedYear + 10;
        }
        const isFahrenheit = toggleUnit.property("checked");

        drawChart(selectedState, decade, isFahrenheit);
      });

      // Update chart on toggle
      toggleUnit.node().addEventListener("change", function () {
        const selectedState = stateSelector.property("value");
        const decade = {
          start: (+yearSlider.property("value")) - 10,
          end: +yearSlider.property("value")
        };
        const isFahrenheit = toggleUnit.property("checked");

        drawChart(selectedState, decade, isFahrenheit);
      });
    });
}

ridgelinePlot();
