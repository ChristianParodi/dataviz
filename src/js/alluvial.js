// Assuming your data is an array of objects with the following structure:
// { Country: 'Country Name', TotalCO2: x, Land: y, Fossil: z, Continent: 'Continent Name' }
let data;

d3.csv("./../../../dataset/fossil_land_continents.csv")
  .then((csv) => {
    data = csv;
    data = data.filter(d => +d.Year === 2022);  // Filter for the year 2022
    createPlot(data);
  });

function createPlot(data) {
  // Chart settings
  const width = 900;
  const height = 500;
  const color = d3.scaleOrdinal(d3.schemeCategory10);
  const svg = d3.create("svg")
    .attr("viewBox", [0, 0, width, height])
    .attr("width", width)
    .attr("height", height);

  // Create the Sankey layout
  const sankey = d3.sankey()
    .nodeWidth(15)
    .nodePadding(10)
    .extent([[1, 1], [width - 1, height - 6]]);

  // Step 1: Group countries by continent, sort by emissions, and categorize into top emitters and "Other"
  const groupedData = d3.groups(data, d => d.Continent);
  const nodesMap = new Map();

  // Add general Fossil and Land nodes
  nodesMap.set("Fossil", { id: "Fossil" });
  nodesMap.set("Land", { id: "Land" });

  groupedData.forEach(([continent, countries]) => {
    // Sort by Total emissions in descending order
    countries.sort((a, b) => b.Total - a.Total);

    // Extract top 3 emitters and "Other"
    const topEmitters = countries.slice(0, 3);
    const otherEmitters = countries.slice(3);

    // Create nodes for continent, top emitters, and "Other (continent)"
    nodesMap.set(continent, { id: continent });

    topEmitters.forEach(d => {
      nodesMap.set(`${d.Country} (${continent})`, { id: `${d.Country} (${continent})` });
    });

    if (otherEmitters.length > 0) {
      nodesMap.set(`Other (${continent})`, { id: `Other (${continent})` });
    }
  });

  // Step 2: Create links for Sankey with Fossil and Land as intermediate blocks
  const nodes = Array.from(nodesMap.values());
  const links = [];

  groupedData.forEach(([continent, countries]) => {
    countries.sort((a, b) => b.Total - a.Total);

    // Separate top 3 and "Other"
    const topEmitters = countries.slice(0, 3);
    const otherEmitters = countries.slice(3);

    // Links from continent to Fossil and Land blocks
    const fossilTotal = d3.sum(countries, d => d.Fossil);
    const landTotal = d3.sum(countries, d => d.Land);

    links.push({ source: continent, target: "Fossil", value: fossilTotal });
    links.push({ source: continent, target: "Land", value: landTotal });

    // Links from Fossil and Land blocks to top emitters and "Other"
    topEmitters.forEach(d => {
      links.push(
        { source: "Fossil", target: `${d.Country} (${continent})`, value: d.Fossil }
      );
      links.push(
        { source: "Land", target: `${d.Country} (${continent})`, value: d.Land }
      );
    });

    // Combine "Other" emissions total for fossil and land
    if (otherEmitters.length > 0) {
      const otherFossilTotal = d3.sum(otherEmitters, d => d.Fossil);
      const otherLandTotal = d3.sum(otherEmitters, d => d.Land);

      links.push(
        { source: "Fossil", target: `Other (${continent})`, value: otherFossilTotal }
      );
      links.push(
        { source: "Land", target: `Other (${continent})`, value: otherLandTotal }
      );
    }
  });

  // Pass nodes and links into the Sankey layout
  const sankeyData = sankey({
    nodes: nodes,
    links: links.map(link => ({
      source: nodes.find(n => n.id === link.source),
      target: nodes.find(n => n.id === link.target),
      value: link.value
    }))
  });

  // Draw links
  svg.append("g")
    .attr("fill", "none")
    .attr("stroke-opacity", 0.5)
    .selectAll("path")
    .data(sankeyData.links)
    .join("path")
    .attr("d", d3.sankeyLinkHorizontal())
    .attr("stroke", d => color(d.source.id))
    .attr("stroke-width", d => Math.max(1, d.width));

  // Draw nodes
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

  // Add labels to nodes
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
