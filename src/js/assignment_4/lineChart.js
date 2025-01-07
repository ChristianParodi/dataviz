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

function lineChart() {
  d3.csv("./../../../dataset/assignment_4/min_max_avg_states.csv", d3.autoType)
    .then(data => {
      const toggleUnit = d3.select("#toggle-unit");

      // set the year slider
      const yearSlider = d3.select("#year-slider");
      const minYear = d3.min(data, d => d.year);
      const maxYear = d3.max(data, d => d.year);

      let minimumAllowedYear = minYear;

      yearSlider
        .attr("min", minYear)
        .attr("max", maxYear)
        .attr("value", maxYear)
        .property("value", maxYear);

      // correct the two values of the slider text
      d3.select("#min-year-text").text(minYear);
      d3.select("#max-year-text").text(maxYear);

      // set the state selector
      const stateSelector = d3.select("#state-selector");

      const states = Array.from(new Set(data.map(d => d.country)));
      states.sort();
      states.forEach(state => {
        stateSelector.append("option")
          .attr("value", state)
          .text(state);
      });

      const firstState = states[0];

      // Function to draw the chart
      function drawChart(selectedState, selectedYear, isFahrenheit) {

        // Remove existing SVG
        d3.select("#line-chart").select("svg").remove();

        const filtered = data.filter(d => d.country == selectedState && +d.year === selectedYear);

        const margin = { top: 30, right: 30, bottom: 60, left: 80 };
        const width = 600;
        const height = 330;

        const svg = d3.select("#line-chart").append("svg")
          .attr("width", width)
          .attr("height", height);

        const x = d3.scalePoint()
          .domain(filtered.map(d => d.month))
          .range([margin.left, width - margin.right])
          .padding(0.5);

        // set the right unit (C - F)
        const convert = isFahrenheit ? toFahrenheit : toCelsius;

        const selectedUnitData = filtered.map(d => ({ ...d })); // IMPORTANT
        // apparently, if selectedUnitData = filtered; the referenced object
        // is the original data because .filter() does not make a copy
        selectedUnitData.forEach(d => {
          d.min = convert(d.min);
          d.max = convert(d.max);
          d.avg = convert(d.avg);
        });

        const absMin = convert(d3.min(data, d => d.min));
        const absMax = convert(d3.max(data, d => d.max));
        const y = d3.scaleLinear()
          .domain([absMin, absMax + 20])
          .range([height - margin.bottom, margin.top]);

        // Add a vertical line for mouse interactions
        const verticalLine = svg.append("line")
          .attr("class", "vertical-line")
          .attr("stroke", "black")
          .attr("stroke-width", 1)
          .attr("stroke-dasharray", "4")
          .attr("y1", margin.top)
          .attr("y2", height - margin.bottom)
          .style("opacity", 0);


        // X axis
        svg.append("g")
          .attr("transform", `translate(0,${height - margin.bottom})`)
          .call(d3.axisBottom(x));

        // Y axis
        svg.append("g")
          .attr("transform", `translate(${margin.left},0)`)
          .call(d3.axisLeft(y));

        // Y label
        svg.append("text")
          .attr("x", -height / 2)
          .attr("y", margin.left / 2)
          .attr("transform", "rotate(-90)")
          .style("text-anchor", "middle")
          .style("font-weight", "300")
          .text(isFahrenheit ? "Temperature (°F)" : "Temperature (°C)");

        // X Label
        svg.append("text")
          .attr("x", width / 2 + margin.right)
          .attr("y", height - margin.bottom / 4)
          .style("text-anchor", "middle")
          .style("font-weight", "300")
          .text("Month");

        // Plot title
        svg.append("text")
          .attr("x", width / 2 + margin.right)
          .attr("y", margin.top / 2)
          .style("text-anchor", "middle")
          .style("font-weight", "300")
          .text(`${selectedState} - ${selectedYear}`);

        // Min
        svg.append("path")
          .datum(selectedUnitData)
          .attr("fill", "none")
          .attr("stroke", "darkblue")
          .attr("stroke-width", 2)
          .attr("d", d3.line()
            .x(d => x(d.month))
            .y(d => y(d.min))
          );

        // Max
        svg.append("path")
          .datum(selectedUnitData)
          .attr("fill", "none")
          .attr("stroke", "red")
          .attr("stroke-width", 2)
          .attr("d", d3.line()
            .x(d => x(d.month))
            .y(d => y(d.max))
          );

        // Avg
        svg.selectAll(".circle-avg")
          .data(selectedUnitData)
          .join("circle")
          .attr("class", "circle-avg")
          .attr("cx", d => x(d.month))
          .attr("cy", d => y(d.avg))
          .attr("r", 3)
          .attr("fill", "steelblue");

        // Add the dots
        svg.selectAll(".circle-min")
          .data(selectedUnitData)
          .join("circle")
          .attr("class", "circle-min")
          .attr("cx", d => x(d.month))
          .attr("cy", d => y(d.min))
          .attr("r", 3)
          .attr("fill", "darkblue");

        svg.selectAll(".circle-max")
          .data(selectedUnitData)
          .join("circle")
          .attr("class", "circle-max")
          .attr("cx", d => x(d.month))
          .attr("cy", d => y(d.max))
          .attr("r", 3)
          .attr("fill", "red");

        svg.selectAll(".circle-avg")
          .data(selectedUnitData)
          .join("circle")
          .attr("class", "circle-avg")
          .attr("cx", d => x(d.month))
          .attr("cy", d => y(d.avg))
          .attr("r", 3)
          .attr("fill", "steelblue");

        // Add a transparent overlay for mouse interactions
        svg.append("rect")
          .attr("width", width - margin.right - margin.left)
          .attr("height", height - margin.top - margin.bottom)
          .attr("transform", `translate(${margin.left},${margin.top})`)
          .style("fill", "none")
          .style("pointer-events", "all")
          .on("mousemove", function (event) {
            const [mouseX] = d3.pointer(event);

            // Find the closest month
            const closestMonth = x.domain().reduce((prev, curr) => {

              const prevDist = Math.abs(x(prev) - mouseX - margin.left);
              const currDist = Math.abs(x(curr) - mouseX - margin.left);
              return currDist < prevDist ? curr : prev;
            });

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

              // Update the vertical line
              verticalLine
                .attr("x1", x(closestMonth))
                .attr("x2", x(closestMonth))
                .style("opacity", 1);
            }
          })
          .on("mouseout", function () {
            // Hide the tooltip
            tooltip.style("opacity", 0);
            verticalLine.style("opacity", 0);
          });
      }

      // Initial draw
      drawChart(firstState, maxYear, toggleUnit.property("checked"));

      // Update chart on slider input
      yearSlider.node().addEventListener("input", function () {
        const selectedState = stateSelector.property("value");
        let selectedYear = +this.value;
        const isFahrenheit = toggleUnit.property("checked");

        if (selectedYear < minimumAllowedYear) {
          // Set tooltip text, hence width
          tooltip.html(`No data available for ${selectedState} before ${minimumAllowedYear}.`);

          const sliderRect = yearSlider.node().getBoundingClientRect();
          const sliderValue = +this.value;
          const sliderPositionX = 0.5 * sliderRect.width + sliderRect.left - 0.5 * tooltip.node().offsetWidth;
          const sliderPositionY = sliderRect.top + sliderRect.height;

          // Reset slider value to minimumAllowedYear
          this.value = minimumAllowedYear;
          selectedYear = minimumAllowedYear;

          yearSlider.classed("accent-blue-500", false).classed("denied", true);

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

        drawChart(selectedState, selectedYear, isFahrenheit);
      });

      // Update chart on state selection
      stateSelector.node().addEventListener("change", function () {

        const selectedState = this.value;
        minimumAllowedYear = d3.min(data.filter(d => d.country === this.value), d => d.year);
        let selectedYear = +yearSlider.property("value");

        if (selectedYear < minimumAllowedYear) {
          yearSlider.property("value", minimumAllowedYear);
          selectedYear = minimumAllowedYear;
        }
        const isFahrenheit = toggleUnit.property("checked");

        drawChart(selectedState, selectedYear, isFahrenheit);
      });

      // Update chart on toggle
      toggleUnit.node().addEventListener("change", function () {
        const selectedState = stateSelector.property("value");
        const selectedYear = +yearSlider.property("value");
        const isFahrenheit = toggleUnit.property("checked");

        drawChart(selectedState, selectedYear, isFahrenheit);
      });
    });
}

lineChart();