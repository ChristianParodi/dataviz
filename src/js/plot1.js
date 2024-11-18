

let data;
const nTop = 2;  // Number of top emitters to display

d3.csv("./../../../dataset/emissions_2022_total.csv")
  .then((csv) => {
    data = csv;
    createPlot(data);
  });
function createPlot(data) {
viewof filters = Inputs.checkbox(continents, {
    label: "Filters",
    value: continents,
    format: (x) =>
      html`<div width="20px" height="20px" style="background-color: ${continentColors[x]}"></div>
            <span style="text-transform: capitalize; border-bottom: solid 2px ${continentColors[x]}; margin-bottom: -2px;">
            ${x}
           </span>`
  })

  legend = Swatches(colorScale, { columns: "180px" })



const height = 450;
const marginTop = 50;
const marginRight = 20;
const marginBottom = 80;
const marginLeft = 100;

const top10 = emissions2022.sort((a, b) => b.CO2 - a.CO2).slice(0, 10);

// Scala verticale per i nomi dei paesi
const y = d3
    .scaleBand()
    .domain(top10.map((d) => d.Country))
    .range([marginTop, height - marginBottom]) // tutti e 214 i paesi dovranno in qualche modo comparire sull'asse
    .padding(0.1);

const yAxis = d3.axisLeft(y).tickSizeOuter(0);

// Scala orizzontale per i valori di CO2
const x = d3
    .scaleLinear()
    .domain([0, d3.max(top10, (d) => d.CO2)])
    .nice()
    .range([marginLeft, width - marginRight]);

const xAxis = d3.axisBottom(x).tickFormat((x) => `${x} t`);

// Contenitore SVG
const svg = d3
    .create("svg")
    .attr("viewBox", [0, 0, width, height])
    .attr(
    "style",
    `max-width: ${width}px; height: auto; font: 10px sans-serif; overflow: visible;`
    );

const title = svg
    .append("text")
    .attr("x", width / 2) // Center horizontally
    .attr("y", marginTop - 20) // Position above the chart
    .attr("text-anchor", "middle") // Center the text
    .attr("font-size", "24px") // Set font size
    .attr("font-weight", "bold") // Make it bold
    .attr("font-family", "Roboto Slab")
    .attr("text-wrap", "break-word")
    .attr("margin-top", "10px")
    .text("Top 10 per capita CO₂ emitters (2022)");

// Tooltip for hover effect
const tooltip = d3
    .select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("visibility", "hidden")
    .style("background-color", "#fff")
    .style("border", "1px solid #ccc")
    .style("padding", "5px")
    .style("border-radius", "3px")
    .style("box-shadow", "2px 2px 5px rgba(0,0,0,0.1)");

const bars = svg
    .append("g")
    .attr("fill", "steelblue")
    .selectAll("rect")
    .data(top10)
    .join("rect")
    .style("mix-blend-mode", "multiply") // Darker color when bars overlap during the transition.
    .attr("y", (d) => y(d.Country))
    .attr("x", marginLeft)
    .attr("height", y.bandwidth())
    .attr("width", (d) => x(d.CO2) - marginLeft)
    .attr("fill", (d) => continentColors[d.Continent] || "#ccc")
    .on("mouseover", function (event, d) {
    tooltip
        .style("visibility", "visible")
        .html(`${d.Country}: ${d.CO2.toFixed(2)} t`);
    })
    .on("mousemove", function (event) {
    tooltip
        .style("top", event.pageY + 5 + "px")
        .style("left", event.pageX + 5 + "px");
    })
    .on("mouseout", function () {
    tooltip.style("visibility", "hidden");
    })
    .text((d) => d.Country);

const gx = svg
    .append("g")
    .attr("class", "xaxis")
    .attr("transform", `translate(0,${height - marginBottom})`)
    .call(xAxis);

const gy = svg
    .append("g")
    .attr("class", "yaxis")
    .attr("transform", `translate(${marginLeft}, 0)`)
    .call(yAxis)
    .call((g) => g.select(".domain").remove());

svg.node().update = function (checked_filters) {
    const data = emissions2022
    .filter((d) => checked_filters.includes(d.Continent))
    .sort((a, b) => b.CO2 - a.CO2)
    .slice(0, 10);

    //change x domain
    // x.domain([0, d3.max(data, (d) => d.CO2)]);
    //change y domain
    y.domain(data.map((d) => d.Country));

    //change bars
    const rects = svg.selectAll("rect").data(data);
    rects.join(
    (enter) =>
        enter
        .transition()
        .duration(750)
        .delay((d, i) => i * 20)
        .attr("x", marginLeft)
        .attr("y", (d) => y(d.Country))
        .attr("height", y.bandwidth())
        .attr("width", (d) => x(d.CO2) - marginLeft)
        .attr("fill", (d) => continentColors[d.Continent] || "#ccc"),
    (update) =>
        update
        .transition()
        .duration(750)
        .delay((d, i) => i * 20)
        .attr("x", marginLeft)
        .attr("y", (d) => y(d.Country))
        .attr("height", y.bandwidth())
        .attr("width", (d) => x(d.CO2) - marginLeft)
        .attr("fill", (d) => continentColors[d.Continent] || "#ccc"),
    (exit) => exit
    );
    //change x axis
    gx.transition()
    .duration(750)
    .delay((d, i) => i * 20)
    .call(xAxis);

    //change y axis
    gy.transition()
    .duration(750)
    .delay((d, i) => i * 20)
    .call(yAxis);
};

// Add x-axis label
svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", height - marginBottom / 3) // Position the label below the x-axis
    .attr("text-anchor", "middle")
    .attr("font-size", "18px")
    .attr("font-family", "Roboto Slab")
    .text("Tonnes of CO₂");

document.getElementById("plot1").append(svg.node());
}

