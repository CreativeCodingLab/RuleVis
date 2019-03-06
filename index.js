// Titles & headers
var body = d3.select("body");
body.append("h1").text("Kappa: Rule-based modeling for biological processes");
// var subheading = body.append("h2")

// Set up the SVG attributes
var w = 1000;
var h = 450;

// Create container div for styling purposes
var main = d3.select('body').append('div')
                .attr('id', 'main')
                .style('text-align', 'center');

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

var exportDiv = main.append('div')
                    .attr('id', 'buttonDiv');

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

function downloadSVG() {
    var config = {
        filename: 'kappa_rulevis',
    }
    d3_save_svg.save(d3.select('#svg').node(), config);
}

var expression;
inputBox.on("input", function() {
    let input = inputBox.property('value').split('->'),
        lhs = tokenize(input[0]),
        rhs = input.length > 1 ? tokenize(input[1]) : undefined

    chart = [lhs, rhs].map( u =>
                u ? tinynlp.parse(u, pattern, 'start') : u
            )
    expression = chart.map( c => c ? simplify(c) : c )

    clearExpressions()
    visualizeExpression(expression,
        [svg.append('g').attr('transform', `translate(0,0)`),
         svg.append('g').attr('transform', `translate(${w/2},0)`)]
        ) // TODO: pass if either side of rule is malformed

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

var agents, sites, bonds, parents,
    simulation // debug
function visualizeExpression(expression, group) {
    // d3.selectAll("svg > *").remove();
    // subheading.text(JSON.stringify(expression)) // DEBUG

    var coloragent = '#3eb78a';
    var colorsite = '#fcc84e';

    let e = expression
    agents = d3.range(e[0].agents.length).map( (i) => 
                     ({id: e[0].agents[i].id, siteCount: e[0].agents[i].siteCount,
                       lhs: e[0].agents[i],
                       rhs: e[1].agents[i]}))
    sites = d3.range(e[0].sites.length).map( (i) => 
                    ({id: e[0].sites[i].id, parent: e[0].sites[i].parent,
                      lhs: e[0].sites[i],
                      rhs: e[1].sites[i]}))
                    // TODO: handle empty agents w/o their sites

    let getIndex = (siteId) => {
        if (!siteId) return
        let [a,b] = siteId
        return agents.length +
               sites.findIndex((u) => u.id[0] == a && u.id[1] == b)
      },
        side = ['lhs', 'rhs']

    sites.forEach(function(d) {
        if (d.parent === undefined) {
            d.label = true;
        } else {
            d.label = false;
        }
    })
    let nodes = [...agents,
                 ...sites]

    bonds = d3.range(2).map((i) => 
                expression[i].namedBonds.slice(1)
                  .filter(bnd => bnd && bnd[1])
                  .map(([src,tar]) => ({'source': getIndex(src),
                                       'target': getIndex(tar)
                                       })))
    bonds = {lhs: bonds[0], rhs: bonds[1]}

    parents = sites.map(u => ({'source': u.parent, // agentId is already a valid index
                                'target': getIndex(u.id),
                                'isParent': true,
                                'sibCount': agents[u.parent].siteCount,
                               }))

    let rs = nodes.map(d => d.lhs.siteCount === undefined ? 13 /*:
                            d.siteCount > 5 ? 7+4*d.siteCount*/ : 27)

    simulation = cola.d3adaptor(d3)
        .size([w/2,h])
        .nodes(nodes)
        .links([...new Set([...bonds.lhs, ...bonds.rhs, ...parents])])
        .linkDistance(d => !d.isParent ? 80 : d.sibCount > 6 ? 65 : d.sibCount > 3 ? 50 : 35)
        // .avoidOverlaps(true);

    let link = [], node = [], freeNode = [],
        name = [], state = []
    group.forEach((root, i) => {
        link[i] = root.append("g")
                        .selectAll("line")
                        .data([...bonds[side[i]], ...parents])
                        .enter()
                            .append("line")
                            .attr("stroke-width", d => d.isParent ? 1 : 5)
                            .attr("stroke", d => d.isParent ? "darkgray" : "black")
                            .attr("stroke-opacity", 0.4)

        let nodegroup = root.selectAll('.node')
                            .data(nodes)
                            .enter()
                            .append('g')
                            .attr('class', 'node')
                            .call(simulation.drag);

        node[i] = nodegroup.append('circle')
                            .attr("r", (d,i) => rs[i])
                            .attr("fill", d => d[side[i]].parent === undefined ?
                                                    d[side[i]].name ? coloragent : "#fff" :
                                               d[side[i]].bond ? colorsite : "#fff")
                            .attr("stroke", d => d[side[i]].parent === undefined ? coloragent : colorsite)
                            .attr("stroke-width", 3);

        freeNode[i] = root.append("g")
                        .selectAll("circle")
                        .data(nodes)
                        .enter()
                            .filter(d => d[side[i]].parent !== undefined && d.bond == undefined)
                            .append("circle")
                            .attr("r", 4)
                            .attr("fill", "black");

        name[i] = nodegroup.append("text")
                        .text(d => d[side[i]].name)
                        .attr("class", d => d[side[i]].parent == undefined ? "agent" : "site")
                        .attr("fill", "black")
                        .attr("text-anchor", "middle")
                        .attr("font-size", d => d[side[i]].parent === undefined ? 16 : 12)
                        .attr("font-family", "Helvetica Neue")
                        .style('opacity', d => d[side[i]].parent === undefined ? 1 : 0);

        state[i] = nodegroup.append("text")
                        .text(d => d[side[i]].state)
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
};

// Prints expression to expression
function getJSON(input) {
    expression.text( () => {
      let chart = tinynlp.parse([...input].filter(c => c != ' '), pattern, 'start')
      return JSON.stringify(simplify(chart), null, 2)
    });
    return expression.text();
};
