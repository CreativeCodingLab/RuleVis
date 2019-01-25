d3.select("body")
    .append("h1")
    .text("Kappa Visualization");

d3.select("body")
    .append("h2")
    .text("Rule-based modeling for complex biological systems");

// Set up the SVG attributes
var svgW = 500;
var svgH = 500;

var windowW = document.documentElement.clientWidth || document.documentElement.body.clientWidth;

var windowH = document.documentElement.clientHeight || document.documentElement.body.clientHeight;

console.log(windowW);

// Create a div that holds 
var svgDiv = d3.select("body").append("div")
                .attr("id", "svgDiv")
                .attr("width", svgW)
                .attr("height", svgH);
var svg = svgDiv.append("svg")
                .attr("width", svgW)
                .attr("height", svgH)
                .attr("transform", "translate(" + (windowW/2 - svgW/2) + ", 0)");

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
    .attr("cy", svgH/2)
    .attr("r", function(d) {
        if (d == "agent") {
            return 10;
        } else {
            return 5;
        }
    });
