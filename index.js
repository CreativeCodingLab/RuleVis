// Titles & headers
var body = d3.select("body");
body.append("h1").text("Kappa Visualization");
body.append("h2").text("Rule-based modeling for complex biological systems");

// Set up the SVG attributes
var w = 600;
var h = 600;

// Create container div for styling purposes
var main = d3.select('body').append('div')
                .attr('id', 'main')
                .style('text-align', 'center');

var expression = main.append('p')

// Input text box for expression
var inputDiv = main.append('div')
                    .attr('id', 'inputDiv');

var inputBox = inputDiv.append('input')
                    .attr('type', 'text')
                    .attr('name', 'expression')
                    .attr('size', 50)
                    .style('text-align', 'center');
                    //.attr('placeholder', 'expression');

var jsonExpression = '';
inputBox.on("input", function() {
    jsonExpression = JSON.parse(getJSON(inputBox.property('value')));
    console.log(jsonExpression);
    //console.log(jsonExpression['agents']);
    // if valid input, then visualize() without requiring 'enter' key to be pressed
    // NOTE: How to implement 'onSumbit' in this format?

    var coloragent = '#40bf80';

    // force directed graph - currently only nodes are implemented
    const manuallinks = [];
    const manualnodes = jsonExpression.agents.map(d => Object.create(d));

    const simulation = d3.forceSimulation(manualnodes)
      .force("link", d3.forceLink(manuallinks))
      .force("charge", d3.forceManyBody())
      .force("center", d3.forceCenter(w / 2, h / 2));

     const link = svg.append("g")
       .attr("stroke", "#999")
       .attr("stroke-opacity", 0.6)
     .selectAll("line")
     .data(manuallinks)
     .enter().append("line")
       .attr("stroke-width", d => Math.sqrt(d.value));

       const node = svg.append("g")
       .attr("stroke", "#fff")
       .attr("stroke-width", 1.5)
     .selectAll("circle")
     .data(manualnodes)
     .enter().append("circle")
       .attr("r", 5)
       .attr("fill", coloragent);


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

});

// Prints expression to expression
function getJSON(input) {
    expression.text( () => {
      let chart = tinynlp.parse([...input], pattern, 'start')
      return JSON.stringify(simplify(chart), null, 2)
    });
    return expression.text();
};

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

// Default Visualization

// TODO: Force directed graph based on input received
//  POTENTIAL INTERMEDIATE STEP: Base graphics for nodes, links, etc to mirror
//      figure 5 in Kappa manual (create a 'node' etc)
