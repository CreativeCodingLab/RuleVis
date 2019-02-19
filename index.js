// Titles & headers
var body = d3.select("body");
body.append("h1").text("Kappa: Rule-based modeling for biological processes");
var subheading = body.append("h2").text("Debug expression placeholder");

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
          // [...inputBox.property('value')]

    lhs = simplify(tinynlp.parse(lhs, pattern, 'start'))
    rhs = simplify(tinynlp.parse(rhs, pattern, 'start'))

    let merge = (lhs, rhs, what) => {
        if (lhs.length != rhs.length)
            throw new Error(what + ' lists don\'t match')

        let ret = lhs.map((u,i) => {
            let v = rhs[i]
            if (what == 'agent') {
                console.log(u,v)

                if (u.name == v.name) {
                    // FIXME: update site count
                    return u
                }
                else if (!u.name) // added agent
                    return {...v, added: true}
                else if (!v.name) // removed agent
                    return {...u, removed: true}
                else
                    throw new Error(`${u.name} @ ${u.id} doesn't match ${v.name} @ ${v.id}`)
            }
            else if (what == 'site') {
                // if (u.parent != v.parent)
                return u
            }
            else
                throw new Error(what + ' isn\'t mergable')
        })
        return ret
    }
    expression = {agents: merge(lhs.agents, rhs.agents, 'agent'),
                  sites: merge(lhs.sites, rhs.sites, 'site'),
                  bonds: [...lhs.bonds, ...rhs.bonds],
                  namedBonds: [...lhs.namedBonds, ...rhs.namedBonds]}
    // paragraph.text( () => JSON.stringify(expression, null, 2));

    clearExpressions()
    visualizeExpression(expression,
        [svg.append('g').attr('transform', `translate(0,0)`),
         svg.append('g').attr('transform', `translate(${w/2},0)`)])
    /* if (rhs)
        visualizeExpression(
            simplify(tinynlp.parse(rhs, pattern, 'start')),
            svg.append('g').attr('transform', `translate(${w/2},0)`)) */
    
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
    subheading.text(JSON.stringify(expression)) // DEBUG

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

    // TODO: annotate agent nodes with cola's relative x/y constraints
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

    let link = [], node = [], freeNode = [], name = [], state = []
    d3.range(2).forEach(i => {
        link[i] = group[i].append("g")
            .selectAll("line")
            .data([...bonds, ...parents])
            .enter()
                .append("line")
                .attr("stroke-width", d => d.isParent ? 1 : 5)
                .attr("stroke", d => d.isParent ? "darkgray" : "black")
                .attr("stroke-opacity", 0.4)
    
        node[i] = group[i].append("g")
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
    
        freeNode[i] = group[i].append("g")
            .selectAll("circle")
            .data(nodes)
            .enter()
                .filter(d => d.parent !== undefined && d.bond == undefined)
                .append("circle")
                .attr("r", 4)
                .attr("fill", "black");
    
        name[i] = group[i].append("g")
            .selectAll("text")
            .data(nodes)
            .enter()
                .append("text")
                .text(d => d.name)
                .attr("class", d => d.parent == undefined ? "agent" : "site")
                .attr("fill", "black")
                .attr("text-anchor", "middle")
                .attr("font-size", d => d.parent === undefined ? 16 : 12)
                .attr("font-family", "Helvetica Neue");

        state[i] = group[i].append("g")
            .selectAll("text")
            .data(expression.sites)
            .enter()
                .append("text")
                .text(d => d.state)
                .attr("fill", "black")
                .attr("font-size", 12)
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
