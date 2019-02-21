// Titles & headers
let body = d3.select("body");
let header = body.append('div').attr('id', 'header');
let headerText = header.append('h1').text("Kappa: Rule-based modeling for biological processes");

// Height of header + 15px of margin on top and bottom
let headerH = document.getElementById('header').clientHeight;

// Dimensions of entire page EXCLUDING header, in order to calculate other element sizes
let bodyH = window.document.documentElement.clientHeight - headerH;
let bodyW = window.document.documentElement.clientWidth;

// Set up the SVG attributes
let h = bodyH;
let w = bodyW * 0.7;

// Create container div for styling purposes
let main = d3.select('body').append('div')
                .attr('id', 'main');
                //.style('text-align', 'center');

/* main.append('p')
    .text('Example Kappa syntax: \n A(x[1],z[3]),B(x[2],y[1]),C(x[3],y[2],z[.])')
                .style('width', w + "px")
                .style('height', 10 + "px")
                .style('display', 'inline-block'); */

// Sidebar for different options
let sidebar = main.append('div')
                    .attr('id', 'sidebar')
                    .style('width', (bodyW > 600 ? 30 : 100) + '%')
                    .style('height', (bodyW > 600 ? bodyH : bodyH*0.35) + 'px')
                    .style('float', 'left')
                    .style('background-color', 'rgb(230, 233, 239)')
                    .style('text-align', 'center');

let menuOptions = ["inputText", "export", "settings"];

let sidebarMenu = sidebar.append('div')
                    .attr('id', 'sidebarMenu')
                    .style('width', '100%')
                    .style('height', '40px')
                    .style('background-color', 'rgb(188, 192, 198)');

// Menu buttons
let menu = sidebarMenu.selectAll('input')
                    .data(menuOptions)
                    .enter()
                    .append('input')
                    .attr('type', 'button')
                    .attr('value', function (d) { return d })
                    .attr('class', 'menuOption')
                    .attr('id', function (d) { return d });

//var menuText = menu.selectAll('text')
                    
menu.on("click", function (d) {
    console.log(d);
    if (d === "inputText") {
        d3.select('#inputDiv').style('display', 'inline-block');
        d3.select('#exportDiv').style('display', 'none');
    } 
    else if (d === "export") {
        d3.select('#inputDiv').style('display', 'none');
        d3.select('#exportDiv').style('display', 'inline-block');
    }
});

// Text Input tab
let inputDiv = sidebar.append('div')
                    .attr('id', 'inputDiv');

let inputBox = inputDiv.append('textarea')
                    .attr('name', 'expression')
                    .attr('size', 50)
                    .attr('rows', 10)
                    //.style('text-align', 'center')
                    .attr('id', 'inputBox');
                    //.attr('placeholder', 'expression');

// Download SVG tab
var exportDiv = sidebar.append('div')
                    .attr('id', 'exportDiv')
                    .style('display', 'none');

// Button for downloading/exporting svg
var exportButton = exportDiv.append('button')
                            .attr('id', 'download')
                            .text('Export SVG')
                            .style('font-size', '20px')
                            .style('font-weight', 'medium')
                            .style('font', 'Helvetica Neue')
                            .style('border-radius', '10px')
                            .style('background-color', 'whitesmoke')
                            .on('click', function() {
                                downloadSVG();
                            });

// Create parent div for svg
let svgDiv = d3.select('#main').append('div')
                .attr('id', 'svgDiv')
                .style('width', function () {
                    // If window size < 600, svg should reflect size of parent div
                    if (bodyW > 600) {
                        return 70 + '%';
                    } else {
                        w = bodyW - 10;
                        return 100 + '%';
                    }
                })
                .style('height', bodyH + "px")
                .style('float', 'left');

var svg = undefined





function downloadSVG() {
    var config = {
        filename: 'kappa_rulevis',
    }
    d3_save_svg.save(d3.select('#svg').node(), config);
}

var chart, expression;
inputBox.on("input", function() {
    let input = inputBox.property('value').split('->'),
        lhs = tokenize(input[0]),
        rhs = input.length > 1 ? tokenize(input[1]) : undefined
          // [...inputBox.property('value')]

    chart = [lhs, rhs].map( u =>
                u ? tinynlp.parse(u, pattern, 'start') : u
            )
    expression = chart.map( c => c ? simplify(c) : c )
    // paragraph.text( () => JSON.stringify(expression, null, 2));

    clearExpressions()
    visualizeExpression(expression[0],
        svg.append('g').attr('transform', `translate(0,0)`))
    if (rhs)
        visualizeExpression(expression[1],
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
                .call(d3.zoom().on("zoom", function () {
                    svg.attr("transform", d3.event.transform)
                }))
                .append("g")
}

function visualizeExpression(expression, group) {
    // d3.selectAll("svg > *").remove();

    var coloragent = '#3eb78a';
    var colorsite = '#fcc84e';

    let nodes = [...expression.agents,
                 ...expression.sites]

    nodes.forEach(function(d) {
        d.label = false;
    })

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
        .linkDistance(d => !d.isParent ? 80 : d.sibCount > 6 ? 65 : d.sibCount > 3 ? 50 : 35)
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

    const nodegroup = group.selectAll('.node')
                        .data(nodes)
                        .enter()
                        .append('g')
                        .attr('class', 'node')
                        .call(simulation.drag);

    const node = nodegroup.append('circle')
                        .attr("r", (d,i) => rs[i])
                        .attr("fill", d => d.parent === undefined ? coloragent :
                                d.bond == undefined ? "#fff" : colorsite)
                        .attr("stroke", d => d.parent === undefined ? coloragent : colorsite)
                        .attr("stroke-width", 3);

    const freeNode = group.append("g")
                    .selectAll("circle")
                    .data(nodes)
                    .enter()
                        .filter(d => d.parent !== undefined && d.bond == undefined)
                        .append("circle")
                        .attr("r", 4)
                        .attr("fill", "black");

    const name = nodegroup.append("text")
                    .text(d => d.name)
                    .attr("class", d => d.parent == undefined ? "agent" : "site")
                    .attr("fill", "black")
                    .attr("text-anchor", "middle")
                    .attr("font-size", d => d.parent === undefined ? 16 : 12)
                    .attr("font-family", "Helvetica Neue")
                    .style('opacity', 0);

    const state = nodegroup.append("text")
                    .text(d => d.state)
                    .attr("fill", "black")
                    .attr("font-size", 12)
                    .style('opacity', 0);

    nodegroup.on("mouseover", function(d,i) {
        if (d.label === false) {
            d3.select(this).selectAll('text').style('opacity', 1);
        }
    });
    nodegroup.on("mouseout", function(d,i) {
        if (d.label === false) {
            d3.select(this).selectAll('text').style('opacity', 0);
        }
    });
    nodegroup.on("click", function(d,i) {
        if (d.label === false) {
            d.label = true;
            d3.select(this).selectAll('text').style('opacity', 1);
        } else {
            d.label = false;
            d3.select(this).selectAll('text').style('opacity', 0);
        }
    });


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
                         .attr("x", d => d.x)
                         .attr("y", d => d.parent === undefined ? d.y+4 : d.y+3);
                     state
                         .attr("x", d => d.x)
                         .attr("y", d => d.y+14);
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