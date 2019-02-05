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
// var paragraph = main.append('svg').attr('height', 0);

//var expression = main.append('svg')
//                    .attr('height', 0);
/* main.append('p')
    .text('Example Kappa syntax: \n A(x[1],z[3]),B(x[2],y[1]),C(x[3],y[2],z[.])')
                .style('width', w + "px")
                .style('height', 10 + "px")
                .style('display', 'inline-block'); */

// Input text box for expression
var inputDiv = main.append('div')
                    .attr('id', 'inputDiv');

var inputBox = inputDiv.append('textarea')
                    .attr('name', 'expression')
                    .attr('size', 50)
                    .attr('rows', 4)
                    // .style('text-align', 'center')
                    .attr('id', 'inputBox');
                    //.attr('placeholder', 'expression');

// Create parent div for svg
let svgDiv = d3.select('#main').append('div')
                .attr('id', 'svgDiv')
                .style('width', w + "px")
                .style('height', h + "px")
                .style('display', 'inline-block');
var svg = undefined

var chart, expression;
inputBox.on("input", function() {
    let input = inputBox.property('value').split('->'),
        lhs = tokenize(input[0]),
        rhs = input.length > 1 ? tokenize(input[1]) : undefined
          // [...inputBox.property('value')]

    chart = tinynlp.parse(lhs, pattern, 'start')
    expression = simplify(chart)
    // paragraph.text( () => JSON.stringify(expression, null, 2));

    clearExpressions()
    visualizeExpression(expression,
        svg.append('g').attr('transform', `translate(0,0)`))
    if (rhs)
        visualizeExpression(
            simplify(tinynlp.parse(rhs, pattern, 'start')),
            svg.append('g').attr('transform', `translate(${w/2},0)`))
    
    /*var inputBoxId = document.getElementById("inputBox");
    inputBoxId.setAttribute = ("border-color", "red");*/
    
    // If code reaches this line, then expression contains a valid expression

    // if valid input, then visualize() without requiring 'enter' key to be pressed
    // NOTE: How to implement 'onSubmit' in this format?

});

function clearExpressions() {
    // Clear svg before loading new graph (accommodates for added text)
    svgDiv.selectAll('svg').remove()
    svg = svgDiv.append('svg') // FIXME: dupe code
                .attr('width', w+'px')
                .attr('height', h+'px')
                .attr('id', 'svg')
}

function visualizeExpression(expression, group) {
    // d3.selectAll("svg > *").remove();

    var coloragent = '#3eb78a';
    var colorsite = '#fcc84e';

    let nodes = [...expression.agents,
                 ...expression.sites]

    let getIndex = (siteId) => {
      if (!siteId) return
      let [a,b] = siteId
      return expression.agents.length +
             expression.sites.findIndex((u) => u.id[0] == a && u.id[1] == b)
    }
    let bonds = expression.namedBonds.slice(1)
                  .filter(bnd => bnd && bnd[1])
                  .map(([src,tar]) => ({'source': getIndex(src),
                                       'target': getIndex(tar)
                                       })),
        parents = expression.sites
                    .map(u => ({'source': u.parent, // agentId is already a valid index
                                'target': getIndex(u.id),
                                'isParent': true,
                                'sibCount': nodes[u.parent].siteCount,
                               }))

    // CoLa graph - using constraint based optimization
    let rs = nodes.map(d => d.siteCount === undefined ? 13 /*:
                            d.siteCount > 5 ? 7+4*d.siteCount*/ : 27)
    // nodes = nodes.map((d,i) => ({...d, 'width': rs[i]*2, 'height': rs[i]*2}))
        // annotate nodes for cola's avoidOverlaps

    const simulation = cola.d3adaptor(d3)
        .size([w/2,h])
        .nodes(nodes)
        .links([...bonds, ...parents])
        .linkDistance(d => !d.isParent ? 50 : d.sibCount > 8 ? 50 : d.sibCount > 4 ? 35 : 20)
        // .avoidOverlaps(true);
    
    /* // force directed graph
    const simulation = d3.forceSimulation(nodes)
        .force("bonds", d3.forceLink(bonds).strength(0.1).distance(100))
        .force("site", d3.forceLink(parents).strength(0.9).distance(20))
        .force("charge", d3.forceManyBody())
        .force("center", d3.forceRadial(100, w / 2, h / 2));*/

    const link = group.append("g")
                    .selectAll("line")
                    .data([...bonds, ...parents])
                    .enter()
                        .append("line")
                        .attr("stroke-width", d => d.isParent ? 1 : 5)
                        .attr("stroke", d => d.isParent ? "darkgray" : "black")
                        .attr("stroke-opacity", 0.4)

    const node = group.append("g")
                    .selectAll("circle")
                    .data(nodes)
                    .enter()
                        .append("circle")
                        .attr("r", (d,i) => rs[i])
                        .attr("fill", d => d.parent === undefined ? coloragent :
                                           d.bond == undefined ? "#fff" : colorsite)
                        .attr("stroke", d => d.parent === undefined ? coloragent : colorsite)
                        .attr("stroke-width", 3)
                        .call(simulation.drag);

    const freeNode = group.append("g")
                    .selectAll("circle")
                    .data(nodes)
                    .enter()
                        .append("circle")
                        .filter(d => d.parent !== undefined && d.bond == undefined)
                        .attr("r", 4)
                        .attr("fill", "black");

    const name = group.append("g")
                    .selectAll("text")
                    .data(nodes)
                    .enter()
                        .append("text")
                        .text(d => d.name)
                        .attr("fill", "black")
                        .attr("font-size", d => d.parent === undefined ? 16 : 12)
                        .attr("font-family", "Helvetica Neue");
                        

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
                     freeNode
                         .attr("cx", d => d.x - 10)
                         .attr("cy", d => d.y + 10);
                     name
                         .attr("x", d => d.parent === undefined ? (d.x-5) : (d.x-3))
                         .attr("y", d => d.parent === undefined ? (d.y+4) : (d.y+3));
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