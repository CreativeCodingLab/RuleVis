// Titles & headers
let header = d3.select("#header");

// Height of header + 15px of margin on top and bottom
let headerH = document.getElementById('header').clientHeight;

let h = document.getElementById('svgDiv').clientHeight;
let w = document.getElementById('svgDiv').clientWidth;

let sidebarW = document.getElementById('sidebar').clientWidth;

var expression;

// Create container div for styling purposes
let main = d3.select('div#main');
let sidebar = d3.select('div#sidebar');
let sidebarMenu = d3.select('div#sidebarMenu');
let menuOptions = document.getElementsByClassName('menuOption');
let inputDiv = document.getElementById('inputDiv');
let inputBox = d3.select('textarea#inputBox');
let exportDiv = d3.select('exportDiv');
let exportButton = d3.select('button#download');
let downloadButton = d3.select('button#downloadJSON');
let svgDiv = d3.select('div#svgDiv');

// Handles changing between GUI Editor, Text Input, and Export divs
let menuMapArray = [['inputText', 'inputDiv'], ['export', 'exportDiv'], ['gui', 'guiDiv']];
let menuMap = new Map(menuMapArray);

let handleMenuClick = function(e) {
    // Id of newly clicked element
    let itemID = e.id;

    for (let option = 0; option < menuOptions.length; option++) {
        // id of the menu option clicked
        let currOption = menuOptions[option];
        // div associated with the id        
        let currOptionDiv = document.getElementById(menuMap.get(currOption.id));

        // If we find the current element, add active class and display associated div
        if (currOption.id === itemID) {
            currOption.classList.add('active');
            currOptionDiv.style.display = 'block';
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

// Action associated w/ Download JSON Button
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




// Selects all the inputs that are inside gui-button-divs that have a previous button neighbor
// Get the id of the parent div, which contains both button and input
// Derive the id of the button associated w/ that functionality
// Add an event listener to that button
// let nameInputs = document.querySelectorAll('div.gui-button-div button.gui-button + input.gui-input');
// for (var i = 0; i < nameInputs.length; i++) {
//     let parentDivID = nameInputs[i].parentElement.id;
//     let buttonID = parentDivID + 'Button';
//     let button = document.getElementById(buttonID);
//     button.addEventListener('click', function () {toggleInput(parentDivID)});
// }

var svg, overlay

// Action associated w/ Export SVG button
function downloadSVG() {
    var config = {
        filename: 'kappa_rulevis',
    }
    d3_save_svg.save(d3.select('#svg').node(), config);
}

let rule = new KappaRule('A(x[.])') // TODO: handle empty string gracefully

inputBox.on("input", () => {
    rule = new KappaRule(...inputBox.property('value').split('->'))

    clearExpressions()
    
    overlay = svg.append('g')
                .attr('id', 'overlay')
    svg.on('mousemove', () => {
        let e = d3.event
        //console.log(e.pageX, e.pageY)

        overlay.selectAll('circle')
                .remove()
        overlay.append('circle')
                .attr('cx', e.pageX - sidebarW)
                .attr('cy', e.pageY - headerH)
                .attr('r', 27)
    })

    visualizeExpression(rule,
        [svg.append('g').attr('transform', `translate(0,0)`),
            svg.append('g').attr('transform', `translate(${w/2},0)`)]
        ) // TODO: pass if either side of rule is malformed
});

function clearExpressions() {
    // Clear svg before loading new graph (accommodates for added text)
    svgDiv.selectAll('svg').remove()
    svg = svgDiv.append('svg') // FIXME: dupe code
                .attr('width', '100%')
                .attr('height', '100%')
                // .attr('margin-left', function () {
                //     let sidebarW = document.getElementById('sidebar').offsetWidth;
                //     return sidebarW;
                // })
                .attr('id', 'svg')
                .call(d3.zoom().on("zoom", function () {
                    svg.attr("transform", d3.event.transform)
                }))
}

// simulation stores
var nodes, links,
    simulation
function visualizeExpression(rule, group) {
    // d3.selectAll("svg > *").remove();
    // subheading.text(JSON.stringify(expression)) // DEBUG

    var coloragent = '#3eb78a';
    var colorsite = '#fcc84e';
  
    nodes = [...rule.agents, ...rule.sites]

    let rs = nodes.map(d => d.lhs.siteCount === undefined ? 13 : 27 /*:
                            d.siteCount > 5 ? 7+4*d.siteCount*/)
    nodes.forEach((d) => {
        d.label = d.parent === undefined ? true :
                  d.lhs.state != d.rhs.state ? true :
                  false
    }) // FIXME: don't mutate the KappaRule

    links = [...rule.bonds.lhs, ...rule.bonds.rhs, ...rule.parents]
    // links = [...new Set([...rule.bonds.lhs, ...rule.bonds.rhs, ...rule.parents])];
    simulation = cola.d3adaptor(d3)
        .size([w/2,h])
        .nodes(nodes)
        .links(links)
        .linkDistance(d => !d.isParent ? 80 :
                            d.sibCount > 6 ? 45 :
                            d.sibCount > 3 ? 35 : 30)
        // .avoidOverlaps(true);

    const side = ['lhs', 'rhs'] // cludge (objects cannot have numerical fields)

    // visualization stores
    let link = [], node = [], freeNode = [],
        name = [], state = [], nodeGroup = []
    group.forEach((root, i) => {
        link[i] = root.append("g")
                        .selectAll("line")
                        .data([...rule.bonds[side[i]], ...rule.parents])
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
                            .attr("fill", d => d[side[i]].isAgent ?
                                                    d[side[i]].name ? coloragent : "#fff" :
                                               d[side[i]].bond ? colorsite : "#fff")
                            .attr("stroke", d => d[side[i]].isAgent ? coloragent : colorsite)
                            .attr("stroke-width", 3)
                            .style("opacity", d => d[side[i]].name ? 1 : 0);

        freeNode[i] = root.append("g")
                        .selectAll("circle")
                        .data(nodes)
                        .enter()
                            .filter(d => !d[side[i]].isAgent
                                      && d[side[i]].bond == undefined)
                            .append("circle")
                            .attr("r", 4)
                            .attr("fill", "black")
                            .style("opacity", d => d[side[i]].name ? 1 : 0);

        name[i] = nodeGroup[i].append("text")
                        .text(d => d[side[i]].name)
                        .attr("class", d => d[side[i]].isAgent ? "agent" : "site")
                        .attr("fill", "black")
                        .attr("text-anchor", "middle")
                        .attr("font-size", d => d[side[i]].isAgent ? 16 : 12)
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

    // jsonBlob = {sites: sites, agents: agents, bonds: bonds, text: inputBox.property('value')};
    jsonBlob = {...rule, text: inputBox.property('value')}
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

// 
let guiState = 'none';

function activateGUIAction(divID) {
    // Remove active class from whatever was there before
    let prevActive = document.querySelectorAll('div.gui-button-div-active, button.gui-button-div-active');

    for (var i = 0; i < prevActive.length; i++) {
        prevActive[i].classList.remove('gui-button-div-active');
    }

    // Add the active class to the divID 
    document.getElementById(divID).classList.add('gui-button-div-active');
    document.getElementById(divID + "Button").classList.add('gui-button-div-active');
}

// Input:   elementID = id of element to be turned on
//          type = querySelector string that returns set of elements containing elementID, to be turned off
// Result:  1) Turns on the visibility of element specified by supplied ID
//          2) Turns off visibility of other elements of other 
function toggleVisibility(elementID, typeSelector) {
    let element = document.getElementById(elementID);
    let type = document.querySelectorAll(typeSelector);

    // Hide all input elements
    for (var i = 0; i < type.length; i++) {
        type[i].style.display = 'none';
    }

    // Show input element 
    element.style.display = 'block';
}


function toggleActiveGUI(action) {
    guiState = action;
    activateGUIAction(action);
    toggleVisibility((action + "Input"), 'input.gui-input');
    //toggleActiveStyle(action);
}

function addAgent() {
    toggleActiveGUI('addAgent');
    // Visually tell user that we are adding an agent right now
    //activateGUIAction('addAgent');

    // Reveal the input field
    //toggleVisibility('addAgent');

    let agentName = document.getElementById('addAgentInput').value;
    console.log(agentName);
}

function addSite() {
    toggleActiveGUI('addSite');
}