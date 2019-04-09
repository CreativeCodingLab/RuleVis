// Titles & headers
let header = d3.select("#header");
let headerText = header.append('h1').text("Kappa: Rule-based modeling for biological processes");

// Height of header + 15px of margin on top and bottom
let headerH = document.getElementById('header').clientHeight;

// Dimensions of entire page EXCLUDING header, in order to calculate other element sizes
let bodyH = window.document.documentElement.clientHeight - headerH;
let bodyW = window.document.documentElement.clientWidth;

// Set up the SVG attributes
let h = bodyH;
let w = bodyW * 0.7;

var expression;

// Create container div for styling purposes
let main = d3.select('body').append('div')
                .attr('id', 'main');
                //.style('text-align', 'center');

/* main.append('p')
    .text('Example Kappa syntax: \n A(x[1],z[3]),B(x[2],y[1]),C(x[3],y[2],z[.])')
                .style('width', w + "px")
                .style('height', 10 + "px")
                .style('display', 'inline-block'); */

// // Sidebar for different options
// let sidebar = main.append('div')
//                     .attr('id', 'sidebar')
//                     .style('width', (bodyW > 600 ? 30 : 100) + '%')
//                     .style('height', (bodyW > 600 ? bodyH : bodyH*0.35) + 'px')
//                     .style('float', 'left')
//                     .style('background-color', 'rgb(230, 233, 239)')
//                     .style('text-align', 'center');

//let menuOptions = ["inputText", "export"];

let sidebar = document.getElementById('sidebar');
let sidebarMenu = document.getElementById('sidebarMenu');
let menuOptions = document.getElementsByClassName('menuOption');
let inputDiv = d3.select('div#inputDiv');
let exportDiv = d3.select('div#exportDiv');
let inputBox = d3.select('textarea#inputBox');

// Map of menuOption ids to their associated divs
let menuMapArray = [['inputText', 'inputDiv'], ['export', 'exportDiv']];
let menuMap = new Map(menuMapArray);

let handleMenuClick = function(e) {
    // Id of newly clicked element
    let itemID = e.id;

    for (let option = 0; option < menuOptions.length; option++) {
        // id of the menu option clicked
        let currOption = menuOptions[option];
        // div associated with the id        
        let currOptionDiv = document.getElementById(menuMap.get(currOption.id));
        //let currOptionDiv = menuMap.get(currOption.id);

        // If we find the current element, add active class and display associated div
        if (currOption.id === itemID) {
            currOption.classList.add('active');
            currOptionDiv.style.display = 'inline-block';
        } else {
            if (currOption.classList.contains('active')) {
                currOption.classList.remove('active');
            }
            currOptionDiv.style.display = 'none';
        }
    }
}

for (let i = 0; i < menuOptions.length; i++) {
    menuOptions[i].addEventListener('click', 
        function() { handleMenuClick(menuOptions[i]) } 
    );
}

// let sidebarMenu = sidebar.append('div')
//                     .attr('id', 'sidebarMenu')
//                     .style('width', '100%');

// Menu buttons
// let menu = sidebarMenu.selectAll('input')
//                     .data(menuOptions)
//                     .enter()
//                     .append('input')
//                     .attr('type', 'button')
//                     .attr('value', function (d) { return d })
//                     .attr('class', 'menuOption')
//                     .attr('id', function (d) { return d });

// var menuGroups = sidebarMenu.selectAll('div')
//                     .data(menuOptions)
//                     .enter()
//                     .append('div')
//                     .attr('width', '20px')
//                     .attr('transform', function (i) {
//                         return ('translateX(' + i*20 + ')');
//                     })
//                     .attr('class', 'menuOption')
//                     .attr('id', function (d) { return d });

// let menuLabels = sidebarMenu.selectAll('text')
//                     .data(menuOptions)
//                     .enter()
//                     .append('text')
//                     .attr('x', function (i) {
//                         return (10 + i*20);
//                     })
//                     .attr('y', 0)
//                     .style('padding', '0px, 5px')
//                     .text(function (d) { return d });

//var menuText = menu.selectAll('text')


// menu.on("click", function (d) {
//     console.log(d);
//     if (d === "inputText") {
//         d3.select('#inputDiv')
//             .style('display', 'inline-block')
//             .style('width', '100%');
//         d3.select('#exportDiv')
//             .style('display', 'none');

//         d3.select("#inputText")
//             .classed('active', true);

//         d3.select("#export")
//             .classed('active', false);

//         console.log(document.getElementById("inputText").classList);

//     }
//     else if (d === "export") {
//         d3.select('#inputDiv').style('display', 'none');
//         d3.select('#exportDiv').style('display', 'inline-block');

//         d3.select("#export")
//             .classed('active', true);

//         d3.select("#inputText")
//             .classed('active', false);


//     }
// });


// Text Input tab
// let inputDiv = sidebar.append('div')
//                     .attr('id', 'inputDiv');


// let inputBox = inputDiv.append('textarea')
//                     .attr('name', 'expression')
//                     .attr('size', 50)
//                     .attr('rows', 30)
                    
//                     .style('padding', '10px')
//                     .attr('placeholder', 'Begin typing an expression to visualize it.')
//                     //.style('text-align', 'center')
//                     .attr('id', 'inputBox');
                    //.attr('placeholder', 'expression');

// Download SVG tab
// var exportDiv = sidebar.append('div')
//                     .attr('id', 'exportDiv')
//                     .style('display', 'none');

// Button for downloading/exporting svg
// var exportButton = exportDiv.append('button')
//                             .attr('id', 'download')
//                             .text('Export SVG')
//                             .style('font-size', '20px')
//                             .style('font-weight', 'medium')
//                             .style('font', 'Helvetica Neue')
//                             .style('border-radius', '10px')
//                             .style('background-color', 'whitesmoke')
//                             .on('click', function() {
//                                 downloadSVG();
//                             });

// var downloadButton = exportDiv.append('button')
//                             .attr('id', 'downloadJSON')
//                             .text('Download JSON')
//                             .style('font-size', '20px')
//                             .style('font-weight', 'medium')
//                             .style('font', 'Helvetica Neue')
//                             .style('border-radius', '10px')
//                             .style('background-color', 'whitesmoke')
//                             .on('click', function() {
//                                 downloadJSON();
//                             });

function downloadJSON(data) {

  var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
  var dlAnchorElem = document.getElementById('downloadAnchorElem');
  dlAnchorElem.setAttribute("href", dataStr);
  dlAnchorElem.setAttribute("download", "expression.json");
  dlAnchorElem.click();
}

var uploadBox = exportDiv.append('textarea')
                          .attr('id', 'uploadJSON')
                          .attr('placeholder', 'Paste JSON');

uploadBox.on('input', function() {

  data = JSON.parse(uploadBox.property('value'));
  console.log(data);
  clearExpressions();
  visualizeFromJSON(data,
           [svg.append('g').attr('transform', `translate(0,0)`),
            svg.append('g').attr('transform', `translate(${w/2},0)`)])

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

// visual properties
var agents, parents, // unified
    sites, bonds, // bifurcated into {lhs, rhs}
    simulation
function visualizeExpression(expression, group) {
    // d3.selectAll("svg > *").remove();
    // subheading.text(JSON.stringify(expression)) // DEBUG

    var coloragent = '#3eb78a';
    var colorsite = '#fcc84e';

    let e = expression,
        agentCount = e[0].agents.length // VERIFY: assume aligned agents
    if (!e[1])
        e[1] = {'agents': [], 'sites': [], 'virtualSites': [],
                              'bonds': [], 'virtualBonds': []} // BRITTLE

    agents = d3.range(agentCount).map( (i) =>
                     ({id: e[0].agents[i].id,
                       siteCount: e[0].agents[i].siteCount,
                       lhs: e[0].agents[i],
                       rhs: e[1].agents[i] ? e[1].agents[i] : new Agent(i)}))

    // cannot assume aligned sites
    let side = ['lhs', 'rhs']

    sites = e[0].sites.map( (u) => 
        ({id: u.id, parent: u.parent,
          lhs: u, rhs: new Site(...u.id) })
    )
    if (e[1])
        e[1].sites.forEach( (v) => {
            let u = sites.find((u) => u.id[0] == v.id[0] && u.id[1] == v.id[1])
            console.log("merge", u, v)

            if (u === undefined)
                sites.push({id: v.id, parent: v.parent,
                            lhs: new Site(v.parent, v.id[1]), rhs: v })
            else
                u.rhs = v
        })
    // TODO: generate anonymous agents as needed for bonds, too
    e.forEach((expr,i) =>
        expr.virtualSites.forEach((v,j) => {
            let par = agents.length + j,
                tar = new Site([par, 0])
            tar.bond = [-1, false] // VERIFY
            
            sites.push({
                id: [par, 0], parent: par,
                lhs: tar, rhs: {...tar},
            })
            let res = sites.slice(-1)[0][side[i]]
            res.state = `of-${v.boundTo}`
            res.name = v.boundAt ? v.boundAt : '_'
        })
    )

    let getIndex = (siteId) => {
        if (!siteId) throw new Error("getIndex cannot look up a site without its index")

        let [a,b] = siteId
        return agents.length +
               sites.findIndex((u) => u.id[0] == a && u.id[1] == b)
      }    
    let nodes = [...agents,
                 ...sites]

    // treat bonds (site-site links) separately
    bonds = expression.map((u,i) => {
        if (!u) return []
        let named = u.bonds
            .filter(bnd => bnd && bnd[1])
            .map(([src,tar]) => ({'source': getIndex(src),
                                'target': getIndex(tar)
                                }))
        let anon = u.virtualBonds
            .map(([src,_],i) => ({'source': getIndex(src),
                                 'target': getIndex([agents.length+i, 0]),
                                 // BRITTLE: look up anonymous index
                                 'isAnonymous': true}))
        return [...named, ...anon]
        })
    bonds = {lhs: bonds[0], rhs: bonds[1]}

    // treat parents (site-agent links) once
    parents = sites.filter(u => u.parent < agentCount) // ignore virtual sites
                    .map(u => ({'source': u.parent, // agentId is already a valid index
                                'target': getIndex(u.id),
                                'isParent': true,
                                'sibCount': agents[u.parent].siteCount,
                               }))

    let rs = nodes.map(d => d.lhs.siteCount === undefined ? 13 : 27 /*:
                            d.siteCount > 5 ? 7+4*d.siteCount*/)
    nodes.forEach((d) => {
        d.label = d.parent === undefined ? true :
                  d.lhs.state != d.rhs.state ? true :
                  false
    })

    var linkSet = [...new Set([...bonds.lhs, ...bonds.rhs, ...parents])];
    simulation = cola.d3adaptor(d3)
        .size([w/2,h])
        .nodes(nodes)
        .links(linkSet)
        .linkDistance(d => !d.isParent ? 80 :
                            d.sibCount > 6 ? 45 :
                            d.sibCount > 3 ? 35 : 30)
        // .avoidOverlaps(true);

    let link = [], node = [], freeNode = [],
        name = [], state = [], nodeGroup = []
    group.forEach((root, i) => {
        link[i] = root.append("g")
                        .selectAll("line")
                        .data([...bonds[side[i]], ...parents])
                        .enter()
                            .append("line")
                            .attr("stroke-width", d => d.isParent ? 1 : 5)
                            .attr("stroke", d => d.isParent ? "darkgray" : "black")
                            .attr("stroke-opacity", 0.4)
                            .attr("stroke-dasharray", d => d.isAnonymous ? 4 : null )

        nodeGroup[i] = root.selectAll('.node')
                            .data(nodes)
                            .enter()
                            .append('g')
                            .attr('class', 'node')
                            .call(simulation.drag);

        node[i] = nodeGroup[i].append('circle')
                            .attr("r", (d,i) => rs[i])
                            .attr("fill", d => d[side[i]].parent === undefined ?
                                                    d[side[i]].name ? coloragent : "#fff" :
                                               d[side[i]].bond ? colorsite : "#fff")
                            .attr("stroke", d => d[side[i]].parent === undefined ? coloragent : colorsite)
                            .attr("stroke-width", 3)
                            .style("opacity", d => d[side[i]].name ? 1 : 0);

        freeNode[i] = root.append("g")
                        .selectAll("circle")
                        .data(nodes)
                        .enter()
                            .filter(d => d[side[i]].parent !== undefined
                                      && d[side[i]].bond == undefined)
                            .append("circle")
                            .attr("r", 4)
                            .attr("fill", "black")
                            .style("opacity", d => d[side[i]].name ? 1 : 0);

        name[i] = nodeGroup[i].append("text")
                        .text(d => d[side[i]].name)
                        .attr("class", d => d[side[i]].parent == undefined ? "agent" : "site")
                        .attr("fill", "black")
                        .attr("text-anchor", "middle")
                        .attr("font-size", d => d[side[i]].parent === undefined ? 16 : 12)
                        .attr("font-family", "Helvetica Neue")
                        .style('opacity', d => d.label ? 1 : 0);

        state[i] = nodeGroup[i].append("text")
                        .text(d => d[side[i]].state)
                        .attr("fill", "black")
                        .attr("font-size", 12)
                        .style('opacity', d => d.label ? 1 : 0);

        // FIXME: find the counterpart of (this) on the rule's other side.
        nodeGroup[i].on("mouseover", function(d,i) {
            if (d.label === false) {
                d3.select(this).selectAll('text').style('opacity', 1);
            }
        });
        nodeGroup[i].on("mouseout", function(d,i) {
            if (d.label === false) {
                d3.select(this).selectAll('text').style('opacity', 0);
            }
        });
        nodeGroup[i].on("click", function(d,i) {
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

    jsonBlob = {sites: sites, agents: agents, bonds: bonds, text: inputBox.property('value')};

    downloadButton.on('click', function() {
      downloadJSON(jsonBlob);
    })

};

// Prints expression to expression
function getJSON(input) {
    expression.text( () => {
      let chart = tinynlp.parse([...input].filter(c => c != ' '), pattern, 'start')
      return JSON.stringify(simplify(chart), null, 2)
    });
    return expression.text();
};
