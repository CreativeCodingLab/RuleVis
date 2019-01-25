d3.select("body")
    .append("h1")
    .text("Kappa Visualization");

d3.select("body")
    .append("h2")
    .text("Rule-based modeling for complex biological systems");

// Set up the SVG attributes
var w = 600;
var h = 600;
/*
// Find the window width to determine how far svg needs to be translated
var windowW = document.documentElement.clientWidth || document.documentElement.body.clientWidth;
var translateSVGx = windowW/2 - w/2;

// Append an svg to the body and center it horizontally
var svg = d3.select("body").append("svg")
                .attr("width", w)
                .attr("height", h)
                .attr("transform", "translate(" + translateSVGx + ", 0)");
*/
//--------------------
var main = d3.select('body').append('div')
                .attr('id', 'main')
                .style('text-align', 'center');

var svgDiv = d3.select('#main').append('div')
                .attr('id', 'svgDiv')                
                .style('width', w + "px")
                .style('height', h + "px")
                .style('display', 'inline-block');

var svg = d3.select("#svgDiv").append("svg")
                .attr('width', w + 'px')
                .attr('height', h + 'px')
                .attr('id', 'svg');


//-------------

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
