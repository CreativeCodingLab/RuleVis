function visualizeFromJSON(jsonBlob, group) {

  console.log(jsonBlob);

  var coloragent = '#3eb78a';
  var colorsite = '#fcc84e';


  var sites = jsonBlob.sites;
  var agents = jsonBlob.agents;
  var bonds = jsonBlob.bonds;
  var textExp = jsonBlob.text;

  let getIndex = (siteId) => {
      if (!siteId) return
      let [a,b] = siteId
      return agents.length +
             sites.findIndex((u) => u.id[0] == a && u.id[1] == b)
    }

    var parents = sites.map(u => ({'source': u.parent, // agentId is already a valid index
                                'target': getIndex(u.id),
                                'isParent': true,
                                'sibCount': agents[u.parent].siteCount,
                               }))

  inputBox.property('value', textExp);

 let nodes = [...agents,...sites]
  let rs = nodes.map(d => d.lhs.siteCount === undefined ? 13 : 27 /*:
                          d.siteCount > 5 ? 7+4*d.siteCount*/)
  nodes.forEach((d) => {
      d.label = d.parent === undefined ? true :
                d.lhs.state != d.rhs.state ? true :
                false
  })

  side = ['lhs', 'rhs'];
  var linkSet = [...new Set([...bonds.lhs, ...bonds.rhs, ...parents])];
  simulation = cola.d3adaptor(d3)
      .size([w/2,h])
      .nodes(nodes)
      .links(linkSet)
      .linkDistance(d => !d.isParent ? 80 :
                          d.sibCount > 6 ? 45 :
                          d.sibCount > 3 ? 35 : 30)
      // .avoidOverlaps(true);

  let link = [], node = [], freeNode = [],
      name = [], state = [], nodeGroup = []
  group.forEach((root, i) => {
      link[i] = root.append("g")
                      .selectAll("line")
                      .data([...bonds[side[i]], ...parents])
                      .enter()
                          .append("line")
                          .attr("stroke-width", d => d.isParent ? 1 : 5)
                          .attr("stroke", d => d.isParent ? "darkgray" : "black")
                          .attr("stroke-opacity", 0.4)

      nodeGroup[i] = root.selectAll('.node')
                          .data(nodes)
                          .enter()
                          .append('g')
                          .attr('class', 'node')
                          .call(simulation.drag);

      node[i] = nodeGroup[i].append('circle')
                          .attr("r", (d,i) => rs[i])
                          .attr("fill", d => d[side[i]].parent === undefined ?
                                                  d[side[i]].name ? coloragent : "#fff" :
                                             d[side[i]].bond ? colorsite : "#fff")
                          .attr("stroke", d => d[side[i]].parent === undefined ? coloragent : colorsite)
                          .attr("stroke-width", 3)
                          .attr("cx", d => d.x)
                          .attr("cy", d => d.y);

      freeNode[i] = root.append("g")
                      .selectAll("circle")
                      .data(nodes)
                      .enter()
                          .filter(d => d[side[i]].parent !== undefined && d[side[i]].bond == undefined)
                          .append("circle")
                          .attr("r", 4)
                          .attr("fill", "black");

      name[i] = nodeGroup[i].append("text")
                      .text(d => d[side[i]].name)
                      .attr("class", d => d[side[i]].parent == undefined ? "agent" : "site")
                      .attr("fill", "black")
                      .attr("text-anchor", "middle")
                      .attr("font-size", d => d[side[i]].parent === undefined ? 16 : 12)
                      .attr("font-family", "Helvetica Neue")
                      .style('opacity', d => d.label ? 1 : 0);

      state[i] = nodeGroup[i].append("text")
                      .text(d => d[side[i]].state)
                      .attr("fill", "black")
                      .attr("font-size", 12)
                      .style('opacity', d => d.label ? 1 : 0);

      // FIXME: find the counterpart of (this) on the rule's other side.
      nodeGroup[i].on("mouseover", function(d,i) {
          if (d.label === false) {
              d3.select(this).selectAll('text').style('opacity', 1);
          }
      });
      nodeGroup[i].on("mouseout", function(d,i) {
          if (d.label === false) {
              d3.select(this).selectAll('text').style('opacity', 0);
          }
      });
      nodeGroup[i].on("click", function(d,i) {
          if (d.label === false) {
              d.label = true;
              d3.select(this).selectAll('text').style('opacity', 1);
          } else {
              d.label = false;
              d3.select(this).selectAll('text').style('opacity', 0);
          }
      });
  })
  simulation.start(30,30,30);
  simulation.on("tick", () => {
      // one simulation drives both charts!
      // note the different translate() assigned to each group.

      link.forEach(sel => sel
          .attr("x1", d => d.source.x)
          .attr("y1", d => d.source.y)
          .attr("x2", d => d.target.x)
          .attr("y2", d => d.target.y))
      node.forEach(sel => sel
          .attr("cx", d => d.x)
          .attr("cy", d => d.y))
      freeNode.forEach(sel => sel
          .attr("cx", d => d.x - 10)
          .attr("cy", d => d.y + 10))
      name.forEach(sel => sel
          .attr("x", d => d.x)
          .attr("y", d => d.parent === undefined ? d.y+4 : d.y+3))
      state.forEach(sel => sel
          .attr("x", d => d.x)
          .attr("y", d => d.y+14))
      });

  jsonBlob1 = {sites: sites, agents: agents, bonds: bonds, text: inputBox.property('value')};

  downloadButton.on('click', function() {
    downloadJSON(jsonBlob1);
  })

}
