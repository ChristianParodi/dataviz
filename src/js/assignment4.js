/**
 * Converts a temperature from Fahrenheit to Celsius.
 *
 * @param {number} fahrenheit - The temperature in Fahrenheit.
 * @param {number} [decimals=2] - The number of decimal places to round the result to.
 * @returns {number} The temperature in Celsius, rounded to the specified number of decimal places.
 */
function toCelsius(fahrenheit, decimals = 2) {
  if (typeof fahrenheit !== 'number' || isNaN(fahrenheit))
    throw new TypeError('Input must be a number');

  return +((fahrenheit - 32) * 5 / 9).toFixed(decimals) || undefined;
}

/**
 * Converts a temperature from Celsius to Fahrenheit.
 *
 * @param {number} fahrenheit - The temperature in Fahrenheit.
 * @param {number} [decimals=2] - The number of decimal places to round the result to.
 * @returns {number} The temperature in Celsius, rounded to the specified number of decimal places.
 */
function toFahrenheit(celsius, decimals = 2) {
  if (typeof celsius !== 'number' || isNaN(celsius))
    throw new TypeError('Input must be a number');

  return +((celsius * 9 / 5) + 32).toFixed(decimals) || undefined;
}


function lineChart() {
  d3.csv("./../../dataset/assignment_4/min_max_avg_states.csv", d3.autoType)
    .then(data => {
      // set the year slider
      const yearSlider = d3.select("#year-slider");
      const minYear = d3.min(data, d => d.year);
      const maxYear = d3.max(data, d => d.year);
      yearSlider
        .attr("min", minYear)
        .attr("max", maxYear)
        .property("value", maxYear);

      // correct the two values of the slider text
      d3.select("#min-year-text").text(minYear);
      d3.select("#max-year-text").text(maxYear);


      // set the state selector
      const stateSelector = d3.select("#state-selector");

      data.forEach(d => {
        if (!d.country) {
          console.log(d);
        }
      });

      const states = Array.from(new Set(data.map(d => d.country)));
      states.sort();
      states.forEach(state => {
        stateSelector.append("option")
        .attr("value", state)
        .text(state);
      });
      
      const firstState = states[0];

      // Function to draw the chart
      function drawChart(selectedState, selectedYear) {
        // Remove existing SVG
        d3.select("#line-chart").select("svg").remove();

        const filtered = data.filter(d => d.country == selectedState && +d.year === selectedYear);

        const margin = { top: 20, right: 30, bottom: 30, left: 80 };
        const width = 600;
        const height = 300;

        const svg = d3.select("#line-chart").append("svg")
          .attr("width", width)
          .attr("height", height);

        const x = d3.scalePoint()
          .domain(filtered.map(d => d.month))
          .range([margin.left, width - margin.right])
          .padding(0.5);

        const y = d3.scaleLinear()
          .domain([d3.min(data, d => d.min), d3.max(data, d => d.max) + 20])
          .range([height - margin.bottom, margin.top]);

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
          .text("Temperature [F]");

        // X label
        svg.append("text")
          .attr("x", width / 2 + margin.right)
          .attr("y", margin.top)
          .style("text-anchor", "middle")
          .style("font-weight", "300")
          .text(selectedYear);

        // Min
        svg.append("path")
          .datum(filtered)
          .attr("fill", "none")
          .attr("stroke", "darkblue")
          .attr("stroke-width", 2)
          .attr("d", d3.line()
            .x(d => x(d.month))
            .y(d => y(d.min))
          );

        // Max
        svg.append("path")
          .datum(filtered)
          .attr("fill", "none")
          .attr("stroke", "red")
          .attr("stroke-width", 2)
          .attr("d", d3.line()
            .x(d => x(d.month))
            .y(d => y(d.max))
          );

        // Avg
        svg.selectAll(".circle-avg")
          .data(filtered)
          .join("circle")
          .attr("class", "circle-avg")
          .attr("cx", d => x(d.month))
          .attr("cy", d => y(d.avg))
          .attr("r", 3)
          .attr("fill", "steelblue");

        // Add the dots
        svg.selectAll(".circle-min")
          .data(filtered)
          .join("circle")
          .attr("class", "circle-min")
          .attr("cx", d => x(d.month))
          .attr("cy", d => y(d.min))
          .attr("r", 3)
          .attr("fill", "darkblue");

        svg.selectAll(".circle-max")
          .data(filtered)
          .join("circle")
          .attr("class", "circle-max")
          .attr("cx", d => x(d.month))
          .attr("cy", d => y(d.max))
          .attr("r", 3)
          .attr("fill", "red");

        svg.selectAll(".circle-avg")
          .data(filtered)
          .join("circle")
          .attr("class", "circle-avg")
          .attr("cx", d => x(d.month))
          .attr("cy", d => y(d.avg))
          .attr("r", 3)
          .attr("fill", "steelblue");
      }

      // Initial draw
      drawChart(firstState, maxYear);

      // Update chart on slider input
      yearSlider.on("input", function () {
        const selectedYear = +this.value;
        drawChart(firstState, selectedYear);
      });

      // Update chart on state selection
      stateSelector.on("change", function () {
        const selectedState = this.value;
        console.log(selectedState);
        drawChart(selectedState, +yearSlider.property("value"));
      });
    });
}

lineChart();