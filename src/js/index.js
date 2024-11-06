const margin = { top: 40, bottom: 40, left: 120, right: 120 };
const width = window.innerWidth - margin.left - margin.right;
const height = window.innerHeight - margin.top - margin.bottom;

// Creates sources <svg> element
const svg = d3
  .select("body")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom);

// Group used to enforce margin
const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
// Global variable for all data
let data;

// Scales setup
const xscale = d3.scaleLinear().range([0, width]);
const yscale = d3.scaleBand().rangeRound([0, height]).paddingInner(0.1);

// Axis setup
const xaxis = d3.axisBottom().scale(xscale);
const g_xaxis = g.append("g")
  .attr("class", "x axis")
  .attr("transform", `translate(0, ${height - margin.bottom - margin.top})`);
const yaxis = d3.axisLeft().scale(yscale);
const g_yaxis = g.append("g").attr("class", "y axis");

/////////////////////////

d3.csv("./dataset/emissions_2022_countries.csv").then((csv) => {
  csv.forEach(d => {
    d.CO2 = +d.CO2;
  });
  data = csv;
  update(data);
})

// Dictionary mapping continents to colors
const continentColors = {
  "Africa": "fill-tangerine",
  "Asia": "fill-pigment_green",
  "Europe": "fill-steel_blue",
  "North America": "fill-naples_yellow",
  "Oceania": "fill-sky_magenta",
  "South America": "fill-indian_red"
};


function update(new_data) {
  const top10 = new_data.slice(0, 10);
  //update the scales
  xscale.domain([0, d3.max(top10, (d) => d.CO2)]);
  yscale.domain(top10.map((d) => d.Country));
  //render the axis
  g_xaxis.transition().call(xaxis);
  g_yaxis.transition().call(yaxis);

  // Render the chart with new data

  // DATA JOIN use the key argument for ensuring that the same DOM element is bound to the same data-item
  const rect = g
    .selectAll("rect")
    .data(top10, (d) => d.Country)
    .join(
      // ENTER
      // new elements
      (enter) => {
        const rect_enter = enter.append("rect").attr("x", 0);
        rect_enter.append("title");
        rect_enter.attr("class", d => continentColors[d.Continent])
        return rect_enter;
      },
      // UPDATE
      // update existing elements
      (update) => update,
      // EXIT
      // elements that aren't associated with data
      (exit) => exit.remove()
    );

  // ENTER + UPDATE
  // both old and new elements
  rect
    .transition()
    .attr("height", yscale.bandwidth() * (height / window.innerHeight))
    .attr("width", (d) => xscale(d.CO2))
    .attr("y", (d) => yscale(d.Country));

  rect.select("title").text((d) => d.CO2); // Hover
}

//interactivity
let checkedContinents = d3.selectAll("input[name='filter']:checked").nodes().map((node) => node.value);

d3.selectAll("input[name='filter']").on("change", function () {
  const checked = d3.select(this).property("checked");
  const filterValue = d3.select(this).property("value");

  if (checked) {
    // Add the continent to the checked list
    checkedContinents.push(filterValue);
  } else {
    // Remove the continent from the checked list
    checkedContinents = checkedContinents.filter((continent) => continent !== filterValue);
  }

  // Update the chart with the filtered data
  if (checkedContinents.length === 0) {
    update(data); // If no continents are checked, show all data
  } else {
    const filtered_data = data.filter((d) => checkedContinents.includes(d.Continent));
    update(filtered_data);
  }
});

// d3.select("#filter-us-only").on("change", function () {
//   // This will be triggered when the user selects or unselects the checkbox
//   const checked = d3.select(this).property("checked");
//   if (checked === true) {
//     // Checkbox was just checked

//     // Keep only data element whose country is US
//     const filtered_data = data.filter((d) => d.Country === "US");

//     update(filtered_data); // Update the chart with the filtered data
//   } else {
//     // Checkbox was just unchecked
//     update(data); // Update the chart with all the data we have
//   }
// });