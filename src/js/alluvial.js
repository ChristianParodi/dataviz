// Assuming your data is an array of objects with the following structure:
// { Country: 'Country Name', TotalCO2: x, LandCO2: y, FossilCO2: z, Continent: 'Continent Name' }
let data;

d3.csv("./../../../dataset/fossil_land_continents.csv")
  .then((csv) => {
    data = csv;
    data = data.filter(d => +d.Year === 2022)
    createPlot(data);
  });

// Step 1: Group data by Continent and calculate the necessary aggregations
// const groupedData = d3.group(data, d => d.Continent);

function createPlot(data) {
  // Group data by Continent
  const groupedData = d3.group(data, d => d.Continent);

  // Define colors for each continent
  const continentColors = {
    'Africa': '#1f77b4',
    'Asia': '#ff7f0e',
    'Europe': '#2ca02c',
    'North America': '#d62728',
    'Oceania': '#9467bd',
    'South America': '#8c564b'
  };

  const nodes = [];
  const links = [];
  const continentNodes = {};
  const fossilNodes = {};
  const landNodes = {};

  // Iterate through each continent group
  groupedData.forEach((countries, continent) => {
    if (!continentColors[continent]) {
      console.warn(`Missing color for continent: ${continent}`);
      return;
    }

    // Add the continent node
    const continentNode = { id: continent, name: continent, color: continentColors[continent] };
    nodes.push(continentNode);
    continentNodes[continent] = continentNode;

    // Aggregate CO2 data for the continent
    const fossilEmissions = d3.sum(countries, d => +d.Fossil);
    const landEmissions = d3.sum(countries, d => +d.Land);

    // Create fossil and land nodes
    const fossilNode = { id: `${continent}-Fossil`, name: 'Fossil CO2', color: continentColors[continent] };
    const landNode = { id: `${continent}-Land`, name: 'Land Change CO2', color: continentColors[continent] };
    nodes.push(fossilNode, landNode);
    fossilNodes[continent] = fossilNode;
    landNodes[continent] = landNode;

    // Link continent to fossil and land nodes
    links.push({ source: continentNode.id, target: fossilNode.id, value: fossilEmissions });
    links.push({ source: continentNode.id, target: landNode.id, value: landEmissions });

    // Sort countries by TotalCO2 and get top 3 emitters
    const sortedCountries = [...countries].sort((a, b) => b.Total - a.Total);
    const top3 = sortedCountries.slice(0, 3);

    top3.forEach(row => {
      const countryNode = {
        id: `${continent}-${row.Country}`,
        name: row.Country,
        color: continentColors[continent]
      };
      nodes.push(countryNode);

      // Link fossil and land nodes to top emitters
      links.push({ source: fossilNode.id, target: countryNode.id, value: +row.Fossil });
      links.push({ source: landNode.id, target: countryNode.id, value: +row.Land });
    });

    // Add "Other" node for the rest of the countries
    const otherNode = { id: `${continent}-Other`, name: 'Other', color: continentColors[continent] };
    nodes.push(otherNode);

    // Calculate and link "Other" emissions for fossil and land
    const otherFossilEmissions = d3.sum(sortedCountries.slice(3), d => +d.Fossil);
    const otherLandEmissions = d3.sum(sortedCountries.slice(3), d => +d.Land);
    links.push({ source: fossilNode.id, target: otherNode.id, value: otherFossilEmissions });
    links.push({ source: landNode.id, target: otherNode.id, value: otherLandEmissions });
  });

  // Step 3: Render the Sankey Diagram
  const width = 1000, height = 600;
  const svg = d3.select("body").append("svg").attr("width", width).attr("height", height);
  console.log("nodes: ", nodes)
  const sankey = d3.sankey()
    .nodeWidth(15)
    .nodePadding(10)
    .extent([[1, 1], [width - 1, height - 5]]);
  const sankeyData =
    sankey({ nodes: nodes.map(d => Object.assign({}, d)), links: links.map(d => Object.assign({}, d)) });

  // Draw links
  svg.append("g")
    .attr("fill", "none")
    .selectAll("path")
    .data(sankeyData.links)
    .join("path")
    .attr("d", d3.sankeyLinkHorizontal())
    .attr("stroke", d => d.source.color)
    .attr("stroke-width", d => Math.max(1, d.width))
    .attr("opacity", 0.5);

  // Draw nodes
  svg.append("g")
    .selectAll("rect")
    .data(sankeyData.nodes)
    .join("rect")
    .attr("x", d => d.x0)
    .attr("y", d => d.y0)
    .attr("height", d => d.y1 - d.y0)
    .attr("width", d => d.x1 - d.x0)
    .attr("fill", d => d.color)
    .attr("stroke", "#000");

  // Add labels
  svg.append("g")
    .style("font", "10px sans-serif")
    .selectAll("text")
    .data(sankeyData.nodes)
    .join("text")
    .attr("x", d => d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6)
    .attr("y", d => (d.y1 + d.y0) / 2)
    .attr("dy", "0.35em")
    .attr("text-anchor", d => d.x0 < width / 2 ? "start" : "end")
    .text(d => d.name);
}