// Assuming your data is an array of objects with the following structure:
// { Country: 'Country Name', TotalCO2: x, Land: y, Fossil: z, Continent: 'Continent Name' }
let data;
const nTop = 2;  // Number of top emitters to display

d3.csv("./dataset/fossil_land_continents.csv")
  .then((csv) => {
    data = csv;
    data = data.filter(d => +d.Year === 2022);  // Filter for the year 2022
    createPlot(data);
  });

function createPlot(data) {
  const container = d3.select("#alluvial");
  const width = container.node().getBoundingClientRect().width;
  // const width = window.innerWidth;
  const height = 800;
  const svg = container
    .append("svg")
    .attr("preserveAspectRatio", "xMinYMin meet")
    .attr("viewBox", [0, 0, width, height])
    .attr("width", width)
  // .attr("height", height);

  // Set color for continents
  const color = d3.scaleOrdinal(d3.schemeCategory10);
  const continentColorMap = new Map();
  data.forEach(d => {
    if (!continentColorMap.has(d.Continent)) {
      continentColorMap.set(d.Continent, color(d.Continent));
    }
  });

  // Sankey layout settings
  const sankey = d3.sankey()
    .nodeWidth(15)
    .nodePadding(10)
    .extent([[1, 1], [width - 1, height - 6]])
    .nodeSort(null);

  // Group data by continent and sort
  const groupedData = d3.groups(data, d => d.Continent).sort((a, b) => d3.sum(b[1].map(e => e.Total)) - d3.sum(a[1].map(e => e.Total)));
  const nodesMap = new Map();

  // Add general Fossil and Land nodes
  nodesMap.set("Fossil", { id: "Fossil", color: "#ffbf00" });
  nodesMap.set("Land", { id: "Land", color: "#00b300" });

  groupedData.forEach(([continent, countries]) => {
    // Sort by Total emissions in descending order
    countries.sort((a, b) => b.Total - a.Total);

    // Top 3 emitters and Other group
    const topEmitters = countries.slice(0, nTop);
    const otherEmitters = countries.slice(nTop);

    // Create nodes for the continent and countries with continent color
    nodesMap.set(continent, { id: continent, color: continentColorMap.get(continent) });

    topEmitters.forEach(d => {
      nodesMap.set(d.Country, { id: d.Country, color: continentColorMap.get(continent) });
    });

    if (otherEmitters.length > 0) {
      nodesMap.set(`Others (${continent})`, { id: `Others (${continent})`, color: continentColorMap.get(continent) });
    }
  });

  // Create links for Sankey with Fossil and Land as intermediate blocks
  const nodes = Array.from(nodesMap.values());
  const links = [];

  groupedData.forEach(([continent, countries]) => {
    countries.sort((a, b) => b.Total - a.Total);

    const topEmitters = countries.slice(0, nTop);
    const otherEmitters = countries.slice(nTop);

    const fossilTotal = d3.sum(countries, d => d.Fossil);
    const landTotal = d3.sum(countries, d => d.Land);

    // Link from continent to Fossil and Land
    links.push({ source: continent, target: "Fossil", value: fossilTotal });
    links.push({ source: continent, target: "Land", value: landTotal });

    // Links from Fossil and Land blocks to top emitters and "Other"
    topEmitters.forEach(d => {
      links.push({ source: "Fossil", target: d.Country, value: d.Fossil });
      links.push({ source: "Land", target: d.Country, value: d.Land });
    });

    if (otherEmitters.length > 0) {
      const otherFossilTotal = d3.sum(otherEmitters, d => d.Fossil);
      const otherLandTotal = d3.sum(otherEmitters, d => d.Land);

      links.push({ source: "Fossil", target: `Others (${continent})`, value: otherFossilTotal });
      links.push({ source: "Land", target: `Others (${continent})`, value: otherLandTotal });
    }
  });

  // Pass nodes and links into the Sankey layout, using nodesMap for accurate connections
  const sankeyData = sankey({
    nodes: nodes,
    links: links.map(link => ({
      source: nodesMap.get(link.source),
      target: nodesMap.get(link.target),
      value: link.value
    }))
  });

  // Tooltip setup
  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("padding", "6px")
    .style("background", "rgba(0, 0, 0, 0.7)")
    .style("color", "#fff")
    .style("border-radius", "4px")
    .style("pointer-events", "none")
    .style("opacity", 0);

  // Draw links with hover effects
  svg.append("g")
    .attr("fill", "none")
    .attr("stroke-opacity", 0.5)
    .selectAll("path")
    .data(sankeyData.links)
    .join("path")
    .attr("d", d3.sankeyLinkHorizontal())
    .attr("stroke", d => d.source.color)
    .attr("stroke-width", d => Math.max(1, d.width))
    .on("mouseover", function (event, d) {
      // Highlight hovered link
      d3.select(this).attr("stroke-opacity", 0.8);

      // Gray out other links
      d3.selectAll("path").filter(link => link !== d)
        .attr("stroke-opacity", 0.1);

      d3.selectAll("rect").attr("fill-opacity", node => { d.target === node || d.source === node ? 1 : 0.1 });

      // if we check continent -> fossil/land, display "continent (fossil/land)",
      // if we check from fossil -> country display "country (fossil/land)"
      const tooltip_text =
        ["Fossil", "Land"].includes(d.source.id) ? `${d.target.id} (${d.source.id})<br /> CO₂: ${(d.value / 1e9).toFixed(3)} Bil t`
          : `${d.source.id} (${d.target.id})<br />CO₂: ${(d.value / 1e9).toFixed(3)} Bil t`

      // Show tooltip
      tooltip.transition().duration(200).style("opacity", 0.9);
      tooltip.html(tooltip_text)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function () {
      // Reset link opacity
      d3.selectAll("path").attr("stroke-opacity", 0.5);

      // Reset nodes opacity
      svg.selectAll("rect").attr("fill-opacity", 1);

      // Hide tooltip
      tooltip.transition().duration(500).style("opacity", 0);
    });

  // Draw nodes
  svg.append("g")
    .selectAll("rect")
    .attr("stroke-opacity", 0.8)
    .data(sankeyData.nodes)
    .join("rect")
    .attr("x", d => d.x0)
    .attr("y", d => d.y0)
    .attr("height", d => d.y1 - d.y0)
    .attr("width", d => d.x1 - d.x0)
    .attr("fill", d => d.color)
    .attr("stroke", "#000")
    .on("mouseover", function (event, d) {
      // Highlight hovered node by increasing opacity
      d3.select(this).attr("stroke-opacity", 1);

      // Gray out all other nodes and links
      svg.selectAll("rect").attr("fill-opacity", node => (node === d ? 1 : 0.1));

      // Highlight the nodes that are the source/target of links whose target/source is the hovered node
      svg.selectAll("path").attr("stroke-opacity", link => {
        if (link.target === d || link.source === d) {
          if (link.target === d)
            lookingForId = link.source.id
          else
            lookingForId = link.target.id;

          currentNode = d3.selectAll("rect").filter(node => node.id === lookingForId);
          currentNode.attr("fill-opacity", 1);

          if (currentNode.id === "Fossil" || currentNode.id === "Land") {
          }
          return 0.8;
        }
        return 0.1;
      });



      // Determine tooltip content based on the type of node
      let tooltip_text;
      if (d.id === "Fossil" || d.id === "Land") {
        tooltip_text = `Total ${d.id} emissions: ${(d.value / 1e9).toFixed(3)} Bil t`;
      } else if (continentColorMap.has(d.id)) {
        tooltip_text = `${d.id}<br />Total CO₂ (Land + Fossil): ${(d.value / 1e9).toFixed(3)} Bil t`;
      } else {
        tooltip_text = `${d.id}<br />Total CO₂ (Land + Fossil): ${(d.value / 1e9).toFixed(3)} Bil t`;
      }

      // Show tooltip with calculated text
      tooltip.transition().duration(200).style("opacity", 0.9);
      tooltip.html(tooltip_text)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function () {
      // Reset all nodes and links opacity to original state
      svg.selectAll("rect").attr("fill-opacity", 1);
      svg.selectAll("path").attr("stroke-opacity", 0.5);

      // Reset hovered node opacity
      d3.select(this).attr("stroke-opacity", 0.8);

      // Hide tooltip
      tooltip.transition().duration(500).style("opacity", 0);
    });

  // Add labels to nodes
  svg.append("g")
    .style("font", "16px sans-serif")
    .selectAll("text")
    .data(sankeyData.nodes)
    .join("text")
    .attr("x", d => d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6)
    .attr("y", d => (d.y1 + d.y0) / 2)
    .attr("dy", "0.35em")
    .attr("text-anchor", d => d.x0 < width / 2 ? "start" : "end")
    .text(d => d.id);

  // Append the svg to the document main
  document.getElementById("alluvial").append(svg.node());

}
