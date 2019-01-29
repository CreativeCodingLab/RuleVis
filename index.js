// Titles & headers
var body = d3.select("body");
body.append("h1").text("Kappa Visualization");
body.append("h2").text("Rule-based modeling for complex biological systems");

// Set up the SVG attributes
var w = 600;
var h = 400;

// Create container div for styling purposes
var main = d3.select('body').append('div')
                .attr('id', 'main')
                .style('text-align', 'center');

// DEBUG TOOL: Prints expression JSON from text box
var expression = main.append('p');

// Input text box for expression
var inputDiv = main.append('div')
                    .attr('id', 'inputDiv');

var inputBox = inputDiv.append('input')
                    .attr('type', 'text')
                    .attr('name', 'expression')
                    .attr('size', 50)
                    .style('text-align', 'center');
                    //.attr('placeholder', 'expression');

// Create parent div for svg
var svgDiv = d3.select('#main').append('div')
                .attr('id', 'svgDiv')
                .style('width', w + "px")
                .style('height', h + "px")
                .style('display', 'inline-block');

// Append svg to the div
var svg = d3.select("#svgDiv").append("svg")
                .attr('width', w + 'px')
                .attr('height', h + 'px')
                .attr('id', 'svg');

var jsonExpression = '';
inputBox.on("input", function() {
    jsonExpression = JSON.parse(getJSON(inputBox.property('value')));
    visualizeExpression(jsonExpression);
    console.log(jsonExpression);
    //console.log(jsonExpression['agents']);
    // if valid input, then visualize() without requiring 'enter' key to be pressed
    // NOTE: How to implement 'onSumbit' in this format?

});

function visualizeExpression(expression) {

    // Clear svg before loading new graph (accommodates for added text)
    d3.selectAll("svg > *").remove();

    var coloragent = '#40bf80';
    var colorsite = '#28A8A8';

    let nodes = [...jsonExpression.agents,
                 ...jsonExpression.sites]

    let getIndex = (siteId) => {
      if (!siteId) return
      let [a,b] = siteId
      return jsonExpression.agents.length +
             jsonExpression.sites.findIndex((u) => u.id[0] == a && u.id[1] == b)
    }
    let bonds = jsonExpression.namedBonds.slice(1)
                  .filter(bnd => bnd && bnd[1])
                  .map(([src,tar]) => ({'source': getIndex(src),
                                       'target': getIndex(tar)
                                       })),
        parents = jsonExpression.sites
                    .map(u => ({'source': u.parent, // agentId is already a valid index
                                'target': getIndex(u.id),
                                'isParent': true
                               }))

    // force directed graph
    /*console.log(nodes)
    const simulation = d3.forceSimulation(nodes)
      .force("bonds", d3.forceLink(bonds).strength(0.1).distance(100))
      .force("site", d3.forceLink(parents).strength(0.9).distance(20))
      .force("charge", d3.forceManyBody())
      .force("center", d3.forceRadial(100, w / 2, h / 2));*/

    // CoLa graph - using constraint based optimization
    const simulation = cola.d3adaptor(d3)
        .size([600,400])
        .nodes(nodes)
        .links([...bonds, ...parents])
        .linkDistance(d => d.isParent ? 20 : 100)
        .avoidOverlaps(true);

    const link = svg.append("g")
                    .selectAll("line")
                    .data([...bonds, ...parents])
                    .enter()
                        .append("line")
                        .attr("stroke-width", d => d.isParent ? 1 : 5)
                        .attr("stroke", d => d.isParent ? "darkgray" : "black")
                        .attr("stroke-opacity", 0.5)

    const node = svg.append("g")
                    .selectAll("circle")
                    .data(nodes)
                    .enter()
                        .append("circle")
                        .attr("r", d => d.parent === undefined ? 27 : 13)
                        .attr("fill", d => d.parent === undefined ? coloragent :
                                           d.bond == undefined ? "#fff" : colorsite)
                        .attr("stroke", d => d.parent === undefined ? coloragent : colorsite)
                        .attr("stroke-width", 1.5)
                        .call(simulation.drag);

     simulation.start(30,30,30);

     simulation.on("tick", () => {
                     link
                         .attr("x1", d => d.source.x)
                         .attr("y1", d => d.source.y)
                         .attr("x2", d => d.target.x)
                         .attr("y2", d => d.target.y);
                     node
                         .attr("cx", d => d.x)
                         .attr("cy", d => d.y);
                     });
};

// Prints expression to expression
function getJSON(input) {
    expression.text( () => {
      let chart = tinynlp.parse([...input].filter(c => c != ' '), pattern, 'start')
      return JSON.stringify(simplify(chart), null, 2)
    });
    return expression.text();
};
