// Titles & headers
var body = d3.select("body");
body.append("h1").text("Kappa Visualization");
body.append("h2").text("Rule-based modeling for complex biological systems");

// Set up the SVG attributes
var w = 600;
var h = 200;

// Create container div for styling purposes
var main = d3.select('body').append('div')
                .attr('id', 'main')
                .style('text-align', 'center');

// Input text box for expression
var inputDiv = main.append('div')
                    .attr('id', 'inputDiv');

var inputBox = inputDiv.append('input')
                    .attr('type', 'text')
                    .attr('name', 'expression')
                    .attr('size', 50)
                    .style('text-align', 'center');
                    //.attr('placeholder', 'expression');

inputBox.on("input", function() {
    visualize(inputBox.property('value'));
    console.log(inputBox.property('value'));
    // if valid input, then visualize() without requiring 'enter' key to be pressed
    // NOTE: How to implement 'onSumbit' in this format?
});

// Dummy function just to explore the usage of input box value
// will contain dynamic Visualization
function visualize(input) {
    main.append('p').text(input);
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
var dummy = ['node', 'interface', 'interface'];

var circles = svg.selectAll('circle')
                .data(dummy)
                .enter()
                .append('circle');

// TODO: Force directed graph based on input received
//  POTENTIAL INTERMEDIATE STEP: Base graphics for nodes, links, etc to mirror
//      figure 5 in Kappa manual (create a 'node' etc)
circles
    .attr('cx', function(d, i) {
        if (d == 'node') {
            return w/2;
        } else {
            if (i % 2 == 0) {
                return w/2 + (13*(i));
            } else {
                return w/2 - (13*(i+1));
            }
        }
    })
    .style('fill', function(d) {
        if (d == 'node') {
            return '#bf0040';
        } else {
            return '#73008c';
        }
    })
    .attr('cy', h/4)
    .attr('r', function(d) {
        if (d == 'node') {
            return 20;
        } else {
            return 10;
        }
    });
