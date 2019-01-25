d3.select("body")
    .append("h1")
    .text("Kappa Visualization");

d3.select("body")
    .append("h2")
    .text("Rule-based modeling for complex biological systems");

// Set up the SVG attributes
var w = 500;
var h = 500;

// TODO: CENTER THE DIV
var svg = d3.select("body").append("svg").attr("width", w).attr("height", h);

// Manual dataset - sanity checks & experimentation
var dataset = [ 5, 10, 15, 20, 25 ];
var tree = ["agent", "agent", "interface", "agent"]

// Circles based on data from 'tree'
var circles = svg.selectAll("circle")
                 .data(tree)
                 .enter()
                 .append("circle");

// Circle attributes change according to items in tree
// TODO: Force directed graph based on input received
//  POTENTIAL INTERMEDIATE STEP: Base graphics for nodes, links, etc to mirror
//      figure 5 in Kappa manual
circles
    .attr("cx", function(d, i) {
        return (i * 50) + 25;
    })
    .attr("cy", h/2)
    .attr("r", function(d) {
        if (d == "agent") {
            return 10;
        } else {
            return 5;
        }
    });
