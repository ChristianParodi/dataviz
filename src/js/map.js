const width = window.innerWidth;
const height = window.innerHeight;

// Colori per la scala
const colorScale = d3.scaleSequential(d3.interpolateReds).domain([0, 100000000]);

// Tooltip per mostrare informazioni
const tooltip = d3.select("body").append("div")
  .attr("class", "tooltip")
  .style("position", "absolute")
  .style("padding", "6px")
  .style("background", "rgba(0, 0, 0, 0.7)")
  .style("color", "#fff")
  .style("border-radius", "4px")
  .style("pointer-events", "none")
  .style("opacity", 0);

// Creare la proiezione e il path
const projection = d3.geoMercator().scale(150).translate([width / 2, height / 2]);
const path = d3.geoPath().projection(projection);

// Zoom e panoramica
const zoom = d3.zoom().scaleExtent([1, 8]).on("zoom", (event) => {
  svg.selectAll("g").attr("transform", event.transform);
});

// Aggiungere SVG
const svg = d3.select("#map-container")
  .append("svg")
  .attr("width", "100%")
  .attr("height", "100vh")
  .call(zoom);

const g = svg.append("g");

// Caricare i dati GeoJSON e il dataset
Promise.all([
  d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"), // GeoJSON
  d3.csv("./../../dataset/emissions_2022_total.csv") // Dataset con emissioni
]).then(([world, emissions]) => {
  const emissionsByCountry = new Map(emissions.map(d => [d.Country, +d.Total]));

  // Disegnare la mappa
  g.selectAll("path")
    .data(world.features)
    .join("path")
    .attr("d", path)
    .attr("fill", d => {
      // console.log(emissionsByCountry.get(d.Country))
      const emissions = emissionsByCountry.get(d.properties.name) || 0; // d.id è il codice ISO del paese
      return colorScale(emissions);
    })
    .attr("stroke", "#ccc")
    .attr("stroke-width", 0.5)
    .on("mousemove", (event, d) => {
      const emissions = emissionsByCountry.get(d.properties.name) || 0;
      tooltip.style("opacity", 1)
        .html(`<strong>${d.properties.name}</strong><br>Emissions: ${emissions}`)
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY + 10}px`);
    })
    .on("mouseout", () => tooltip.style("opacity", 0));

  // Aggiungere effetti di zoom e panoramica
  svg.call(zoom);
  document.body.append(svg.node())
});
