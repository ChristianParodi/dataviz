const width = window.innerWidth;
const height = window.innerHeight;

// Colori per la scala
const colorScale = d3.scaleSequential(d3.interpolateReds).domain([0, 10000]);

// Tooltip per mostrare informazioni
const tooltip = d3.select("#tooltip");

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
    .call(zoom);

const g = svg.append("g");

// Caricare i dati GeoJSON e il dataset
Promise.all([
    d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"), // GeoJSON
    d3.json("emissions.json") // Dataset con emissioni
]).then(([world, emissions]) => {
    const emissionsByCountry = new Map(emissions.map(d => [d.country, d.emissions]));

    // Disegnare la mappa
    g.selectAll("path")
        .data(world.features)
        .join("path")
        .attr("d", path)
        .attr("fill", d => {
            const emissions = emissionsByCountry.get(d.id) || 0; // d.id è il codice ISO del paese
            return colorScale(emissions);
        })
        .attr("stroke", "#ccc")
        .attr("stroke-width", 0.5)
        .on("mousemove", (event, d) => {
            const emissions = emissionsByCountry.get(d.id) || 0;
            tooltip.style("opacity", 1)
                .html(`<strong>${d.properties.name}</strong><br>Emissions: ${emissions}`)
                .style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY + 10}px`);
        })
        .on("mouseout", () => tooltip.style("opacity", 0));

    // Aggiungere effetti di zoom e panoramica
    svg.call(zoom);
});
