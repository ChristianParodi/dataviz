// Assuming your data is an array of objects with the following structure:
// { Country: 'Country Name', TotalCO2: x, Land: y, Fossil: z, Continent: 'Continent Name' }
let data;

d3.csv("./../../../dataset/fossil_land_continents.csv")
  .then((csv) => {
    data = csv;
    data = data.filter(d => +d.Year === 2022);  // Filter for the year 2022
    console.log(data)
    createPlot(data);
  });

function createPlot(data) {
  // const data = [
  //   { continent: "Asia", emission_type: "Land", country: "China", value: 30 },
  //   { continent: "Asia", emission_type: "Land", country: "India", value: 20 },
  //   { continent: "Asia", emission_type: "Land", country: "Indonesia", value: 15 },
  //   { continent: "Asia", emission_type: "Fossil", country: "China", value: 40 },
  //   { continent: "Asia", emission_type: "Fossil", country: "India", value: 25 },
  //   { continent: "Asia", emission_type: "Fossil", country: "Indonesia", value: 10 },

  //   { continent: "Europe", emission_type: "Land", country: "Germany", value: 18 },
  //   { continent: "Europe", emission_type: "Land", country: "France", value: 10 },
  //   { continent: "Europe", emission_type: "Land", country: "Italy", value: 8 },
  //   { continent: "Europe", emission_type: "Fossil", country: "Germany", value: 22 },
  //   { continent: "Europe", emission_type: "Fossil", country: "France", value: 12 },
  //   { continent: "Europe", emission_type: "Fossil", country: "Italy", value: 10 },

  //   { continent: "Africa", emission_type: "Land", country: "Nigeria", value: 14 },
  //   { continent: "Africa", emission_type: "Land", country: "Egypt", value: 12 },
  //   { continent: "Africa", emission_type: "Land", country: "South Africa", value: 9 },
  //   { continent: "Africa", emission_type: "Fossil", country: "Nigeria", value: 17 },
  //   { continent: "Africa", emission_type: "Fossil", country: "Egypt", value: 15 },
  //   { continent: "Africa", emission_type: "Fossil", country: "South Africa", value: 10 },
  // ];

  // Impostazioni del grafico
  // const width = 900;
  // const height = 500;
  // const color = d3.scaleOrdinal(d3.schemeCategory10);
  // const svg = d3.create("svg")
  //   .attr("viewBox", [0, 0, width, height])
  //   .attr("width", width)
  //   .attr("height", height);

  // // Funzione per creare il diagramma di Sankey
  // const sankey = d3.sankey()
  //   .nodeWidth(15)
  //   .nodePadding(10)
  //   .extent([[1, 1], [width - 1, height - 6]]);

  // // Genera nodi e collegamenti per il diagramma di Sankey
  // const nodesMap = new Map();
  // data.forEach(d => {
  //   nodesMap.set(d.continent, { id: d.continent });
  //   nodesMap.set(d.emission_type, { id: d.emission_type });
  //   nodesMap.set(d.country, { id: d.country });
  // });

  // const nodes = Array.from(nodesMap.values());
  // const links = data.flatMap(d => [
  //   { source: d.continent, target: d.emission_type, value: d.value },
  //   { source: d.emission_type, target: d.country, value: d.value }
  // ]);

  // const sankeyData = sankey({
  //   nodes: nodes,
  //   links: links.map(link => ({
  //     source: nodes.find(n => n.id === link.source),
  //     target: nodes.find(n => n.id === link.target),
  //     value: link.value
  //   }))
  // });

  // // Disegna i collegamenti (link) nel diagramma
  // svg.append("g")
  //   .attr("fill", "none")
  //   .attr("stroke-opacity", 0.5)
  //   .selectAll("path")
  //   .data(sankeyData.links)
  //   .join("path")
  //   .attr("d", d3.sankeyLinkHorizontal())
  //   .attr("stroke", d => color(d.source.id))
  //   .attr("stroke-width", d => Math.max(1, d.width));

  // // Disegna i nodi (continenti, tipi di emissione, paesi)
  // svg.append("g")
  //   .selectAll("rect")
  //   .data(sankeyData.nodes)
  //   .join("rect")
  //   .attr("x", d => d.x0)
  //   .attr("y", d => d.y0)
  //   .attr("height", d => d.y1 - d.y0)
  //   .attr("width", d => d.x1 - d.x0)
  //   .attr("fill", d => color(d.id))
  //   .attr("stroke", "#000");

  // // Aggiungi etichette ai nodi
  // svg.append("g")
  //   .style("font", "10px sans-serif")
  //   .selectAll("text")
  //   .data(sankeyData.nodes)
  //   .join("text")
  //   .attr("x", d => d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6)
  //   .attr("y", d => (d.y1 + d.y0) / 2)
  //   .attr("dy", "0.35em")
  //   .attr("text-anchor", d => d.x0 < width / 2 ? "start" : "end")
  //   .text(d => d.id);

  // document.body.append(svg.node());
  // Impostazioni del grafico
  const width = 900;
  const height = 500;
  const color = d3.scaleOrdinal(d3.schemeCategory10);
  const svg = d3.create("svg")
    .attr("viewBox", [0, 0, width, height])
    .attr("width", width)
    .attr("height", height);

  // Funzione per creare il diagramma di Sankey
  const sankey = d3.sankey()
    .nodeWidth(15)
    .nodePadding(10)
    .extent([[1, 1], [width - 1, height - 6]]);

  // Genera nodi e collegamenti per il diagramma di Sankey
  const nodesMap = new Map();
  data.forEach(d => {
    nodesMap.set(d.Continent, { id: d.Continent });
    nodesMap.set("Fossil", { id: "Fossil" });
    nodesMap.set("Land", { id: "Land" });
    nodesMap.set(d.Country, { id: d.Country });
  });

  const nodes = Array.from(nodesMap.values());
  const links = data.flatMap(d => [
    { source: d.Continent, target: "Fossil", value: d.Fossil },
    { source: d.Continent, target: "Land", value: d.Land },
    { source: "Fossil", target: d.Country, value: d.Fossil },
    { source: "Land", target: d.Country, value: d.Land }
  ]);

  const sankeyData = sankey({
    nodes: nodes,
    links: links.map(link => ({
      source: nodes.find(n => n.id === link.source),
      target: nodes.find(n => n.id === link.target),
      value: link.value
    }))
  });

  // Disegna i collegamenti (link) nel diagramma
  svg.append("g")
    .attr("fill", "none")
    .attr("stroke-opacity", 0.5)
    .selectAll("path")
    .data(sankeyData.links)
    .join("path")
    .attr("d", d3.sankeyLinkHorizontal())
    .attr("stroke", d => color(d.source.id))
    .attr("stroke-width", d => Math.max(1, d.width));

  // Disegna i nodi (continenti, tipi di emissione, paesi)
  svg.append("g")
    .selectAll("rect")
    .data(sankeyData.nodes)
    .join("rect")
    .attr("x", d => d.x0)
    .attr("y", d => d.y0)
    .attr("height", d => d.y1 - d.y0)
    .attr("width", d => d.x1 - d.x0)
    .attr("fill", d => color(d.id))
    .attr("stroke", "#000");

  // Aggiungi etichette ai nodi
  svg.append("g")
    .style("font", "10px sans-serif")
    .selectAll("text")
    .data(sankeyData.nodes)
    .join("text")
    .attr("x", d => d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6)
    .attr("y", d => (d.y1 + d.y0) / 2)
    .attr("dy", "0.35em")
    .attr("text-anchor", d => d.x0 < width / 2 ? "start" : "end")
    .text(d => d.id);

  // Append the svg to the document body
  document.body.append(svg.node());
}
