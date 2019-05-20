// Titles & headers
let header = d3.select("#header");

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

// Height of header + 15px of margin on top and bottom
let headerH, h, w, sidebarW
let onWindowResize = (e) => {
    headerH = document.getElementById('header').clientHeight;
    h = document.getElementById('svgDiv').clientHeight;
    w = document.getElementById('svgDiv').clientWidth;
    sidebarW = document.getElementById('sidebar').clientWidth;
}

window.addEventListener('resize', onWindowResize, false)

// SETUP
window.addEventListener('load', function() {
    onWindowResize() // initialize metrics
    clearExpressions() // initialize canvas
})

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

        // If switching to a non-GUI tab, remove SVG mouse interactions and overlay
        if (currOption.id !== 'gui') {
            actionHandler['noEdit']();
        }
    }
}
for (let i = 0; i < menuOptions.length; i++) {
    menuOptions[i].addEventListener('click', 
        function() { handleMenuClick(menuOptions[i]) } 
    );
}


// Reveals an input field if user clicks on a gui editor button
function toggleInput(parentDivID) {
    console.log("parentDivID = " + parentDivID);

    let inputID = parentDivID + "Input";
    let inputElement = document.getElementById(inputID);
    closeInputs();
    inputElement.style.display = 'block';
}

// Closes all input tabs
function closeInputs() {
    let allInputs = document.getElementsByClassName('gui-input');

    for (var i = 0; i < allInputs.length; i++) {
        allInputs[i].style.display = 'none';
        allInputs[i].value = '';
    }
}



var overlay;
var state = 'noEdit';
var linkClicks = 0;       // Keeps track of how many times 
var linkSiteIDs = {       // Stores sites for adding link
    first: {
        id: null,
        x: null,
        y: null
    },
    second: {
        id: null,
        x: null,
        y: null
    }
};         // Stores IDs and coordinates of a new link

// Directs to appropriate gui function based on button
let actionHandler = {
    // Move button calls noEdit but is not a true move; if add another site, moves back to original position
    'noEdit': () => {
        state = 'noEdit';
        clearSVGListeners();
        closeInputs();
        clearOverlay();
    },
    'addAgent': () => {
        // If the user *just* clicked on addAgent button, open the input div
        // Else, the div is already open and they are adding another agent
        if (state !== 'addAgent') { toggleInput('addAgent'); }
        initializeOverlay();     

        state = 'addAgent';
        
        svg.on('mouseenter', () => {
            overlay.append('circle')
                    .attr('r', 27)
                    .style('fill', 'none')
                    .style('stroke', 'black')
                    .style('fill', coloragent)
                    .style('opacity', 0.5)
                    .style('stroke-dasharray', '8 4')
                    .style('pointer-events', 'none')
        })
        svg.on('mousemove', () => {
            let e = d3.event
            //console.log(e.pageX, e.pageY)
            overlay.select('circle') 
                    .attr('cx', e.pageX - sidebarW)
                    .attr('cy', e.pageY - headerH)
                    .style('pointer-events', 'none')
                    
        })
        svg.on('mouseleave', () => {
            clearOverlay();
        })
    
        svg.on('click', () => {
            console.log('canvas touched')
    
            let inputValue = document.getElementById('addAgentInput').value;
            if (inputValue === '') {
                inputValue = 'A';
            }
    
            let p = d3.event
            rule.addAgent(inputValue, p.x, p.y)
    
            clearExpressions()
            visualizeExpression(rule, svgGroups)
    
            inputBox.node().value = rule.toString()
    
            actionHandler['addAgent']();
    
        })
        
    },
    'addSite': () => {
        if (state !== 'addSite') { toggleInput('addSite'); }
        initializeOverlay();
        state = 'addSite';

        svg.on('mouseenter', () => {
            overlay.append('circle')
                    .attr('r', 13)
                    .style('fill', 'none')
                    .style('stroke', 'black')
                    .style('fill', colorsite)
                    .style('opacity', 0.5)
                    .style('stroke-dasharray', '8 4')
                    .style('pointer-events', 'none')
        })
        svg.on('mousemove', () => {
            let e = d3.event  

            let res = isHoveringOverEl('agents', (e.pageX - sidebarW), (e.pageY - headerH));
            
            if (res.withinDist) {
                overlay.select('circle') 
                    .style('opacity', 0.5);
            } else {
                overlay.select('circle') 
                    .style('opacity', 0);
            }

            overlay.select('circle')
                    .attr('cx', e.pageX - sidebarW)
                    .attr('cy', e.pageY - headerH) 
        })
        svg.on('mouseleave', () => {
            clearOverlay();
        })
        svg.on('click', () => {
            console.log('canvas touched')
            let inputValue = document.getElementById('addSiteInput').value;
            if (inputValue === '') {
                inputValue = 'x';
            }
    
            let p = d3.event
            let x = p.pageX - sidebarW;
            let y = p.pageY - headerH;
            let res = isHoveringOverEl();

            // check if it is hovering over an agent
            console.log(res)
            if (res.withinDist && res.closestEl.elID !== null) {
                rule.addSite(res.closestEl.elID, inputValue, x, y)
            }
        
            clearExpressions()
            visualizeExpression(rule, svgGroups)
    
            inputBox.node().value = rule.toString()
    
            actionHandler['addSite']();
        })
    },
    'addLink': () => {
        closeInputs();
        initializeOverlay();
        state = 'addLink';

        svg.on('mouseenter', () => {
            overlay.append('line')
            .style('stroke-width', '2px')
            .style('opacity', 0.5)
            .style('pointer-events', 'none');
        })

        svg.on('mousemove', () => {
            let e = d3.event;
            let res = isHoveringOverEl();

            document.getElementById('svgDiv').style.cursor = 'crosshair';

            // If they already selected first site, show a line extending from first point to current cursor
            // Color = red if not over valid site
            // Color = gray or green if over valid site
            if (linkClicks === 1) {
                
                overlay.select('line')
                            .attr('x1', linkSiteIDs.first.x)
                            .attr('y1', linkSiteIDs.first.y)
                            .attr('x2', e.pageX - sidebarW)
                            .attr('y2', e.pageY - headerH)
                            .style('stroke', res.withinDist ? 'gray' : 'red')
                            .style('stroke-width', '5px')
                            .style('opacity', res.withinDist ? 0.5: 0.3);

                
            }
        })

        svg.on('mouseleave', () => {
            document.getElementById('svgDiv').style.cursor = 'auto';
            clearOverlay();
            linkClicks = 0;
        })
       
        svg.on('click', () => {
            let e = d3.event;

            if (linkClicks < 2) {
                let res = isHoveringOverEl();
                console.log(res);

                if (res.withinDist) {
                    console.log(linkClicks);
                    if (linkClicks === 0) {
                        linkSiteIDs.first.id = res.closestEl.elID;
                        linkSiteIDs.first.x = res.closestEl.x;
                        linkSiteIDs.first.y = res.closestEl.y;
                        linkClicks++;
                    } 
                    else if (linkClicks === 1) {
                        linkSiteIDs.second.id = res.closestEl.elID;
                        linkSiteIDs.second.x = res.closestEl.x;
                        linkSiteIDs.second.y = res.closestEl.y;

                        // Add a bond to the rule
                        rule.addBond(linkSiteIDs.first.id, linkSiteIDs.second.id);

                        // Then reset everything
                        linkClicks = 0;
                        // for (var key in linkSiteIDs) {
                        //     if (linkSiteIDs[key].value === null) { linkSiteIDs[key] = null; }
                        // }

                        clearExpressions()
                        visualizeExpression(rule, svgGroups)
                
                        inputBox.node().value = rule.toString()
                
                        actionHandler['addLink']();
                    }
                } 
            
            }
        })
            

    },
    'editAgent': () => {
        toggleInput('editAgent');
    },
    'editSite': () => {
        toggleInput('editSite');
    },
    'editState': () => {
        toggleInput('editState');
    },
    'deleteItem': (data) => {
        closeInputs();
        initializeOverlay();

        state = 'delete';

        svg.on('mouseenter', () => {
            overlay.style('pointer-events', 'none');
        })

        svg.on('mouseleave', () => {
            clearOverlay();
        })

        svg.on('click', () => {
             let res = isHoveringOverEl();
             if (res.withinDist) {
                // Call appropriate backend function whether it's a link or node 
                if (hovered[0] === 'link') {
                    //rule.deleteEdge(hovered[1].id, hovered[2])
                    rule.deleteEdge(hovered[1].id)  // Line above passes side to function 
                    
                } else {
                    //rule.deleteNode(hovered[1].id, hovered[2])
                    rule.deleteNode(hovered[1].id)
                }
             }
        })
    },
}

let hovered = undefined;

// Calculates the distance between two points (x1, y1) and (x2, y2)
function findDistance(x1, y1, x2, y2) {
    let xDist = x1 - x2;
    let yDist = y1 - y2;
    let dist = Math.sqrt(xDist*xDist + yDist*yDist);

    return dist;
}

// Looks through all agents to see if pointer overlaps with one; returns closest overlapping agent
// withinDist: true if pointer is within distance of at least one agent in a group of overlapping agents; 
// closestAgent: id of agent closest to pointer; distance to that agent
function isHoveringOverEl() {
    let response = {
        withinDist: false,
        closestEl: {
            elID: null,
            //distToPointer: Number.MAX_SAFE_INTEGER,
            x: 0,
            y: 0
        }
    };
    /* let elSet;
    let minDist = (elType === 'agents' ? 38 : 24);

    if (elType === 'agents') {
        elSet = rule.agents;
    } else if (elType === 'sites') {
        elSet = rule.sites;
    }

    // Look through all existing agents to see if pointer is overlapping with an element 
    for (var i = 0; i < elSet.length; i++) {
        let el = elSet[i];
        let dist = findDistance(el.x, el.y, x, y);

        // If you are hovering over an agent
        if (dist < minDist) {
            response.withinDist = true;
            // Guards against agents that are overlapping
            if (dist < response.closestEl.distToPointer) {
                response.closestEl.elID = el.id;        // DOesn't work w/ sites because sites are an array
                response.closestEl.distToPointer = dist;
                response.closestEl.x = el.x;
                response.closestEl.y = el.y;
            }
        }
    } */
    response.withinDist = Boolean(hovered)
    if (hovered) {
        response.closestEl.elID = hovered[1].id;
        response.closestEl.x = hovered[1].x;
        response.closestEl.y = hovered[1].y;
        
    }
    return response;
}

// Attach an event listener to all GUI buttons
let guiButtons = document.getElementsByClassName('gui-button');

for (var i = 0; i < guiButtons.length; i++) {
    let parentDivID = guiButtons[i].parentElement.id;
    console.log(parentDivID)

    guiButtons[i].addEventListener('click', () => {
        clearOverlay();
        actionHandler[parentDivID]()
        
    });
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





var svg, svgGroups

// Action associated w/ Export SVG button
function downloadSVG() {
    var config = {
        filename: 'kappa_rulevis',
    }
    d3_save_svg.save(d3.select('#svg').node(), config);
}

let rule = new KappaRule('') // TODO: handle empty string gracefully

inputBox.on("input", () => {
    rule = new KappaRule(...inputBox.property('value').split('->'))
    clearExpressions()

    visualizeExpression(rule, svgGroups) // TODO: ignore malformed expression on either side of rule
});

function clearExpressions() {
    // Clear svg before loading new graph (accommodates for added text)
    svgDiv.selectAll('svg').remove()
    svg = svgDiv.append('svg') // FIXME: dupe code
                .attr('id', 'svg')
                .attr('width', '100%')
                .attr('height', '100%')
                // .attr('margin-left', function () {
                //     let sidebarW = document.getElementById('sidebar').offsetWidth;
                //     return sidebarW;
                // })
                /* .call(d3.zoom().on("zoom", function () {
                    svg.attr("transform", d3.event.transform)
                })) */

    initializeOverlay() // depends on svg

    svgGroups =
        [svg.append('g').attr('transform', `translate(0,0)`),
            svg.append('g').attr('transform', `translate(${w/2},0)`)]
}

function initializeOverlay() {    
    // ASSUME agent placement for now
    overlay = svg.append('g')
                .attr('id', 'overlay');
}

function clearOverlay() {
    overlay.selectAll('circle')
                .remove()

    overlay.selectAll('line')
                .remove();
}

function clearSVGListeners() {
    svg.on('mousemove', null);
    svg.on('mouseenter', null);
    svg.on('mouseleave', null);
    svg.on('click', null);
}

// simulation stores
var nodes, links,
    simulation

var coloragent = '#3eb78a';
var colorsite = '#fcc84e';

function visualizeExpression(rule, group) {
    // d3.selectAll("svg > *").remove();
    // subheading.text(JSON.stringify(expression)) // DEBUG

    
  
    nodes = [...rule.agents, ...rule.sites]
    nodes.forEach((d) => {
        d.label = d.isAgent ? true :
                     d.lhs && d.rhs &&
                     (d.lhs.name != d.rhs.name || d.lhs.state != d.rhs.state) ?
                     true : false
    }) // FIXME: don't mutate the KappaRule

    links = [...rule.bonds.map(u => u.lhs).filter(u => u),
             ...rule.bonds.map(u => u.rhs).filter(u => u),
             ...rule.parents]
    simulation = cola.d3adaptor(d3)
        .size([w/2,h])
        .nodes(nodes)
        .links(links)
        .linkDistance(d => !d.isParent ? 80 :
                            d.sibCount > 6 ? 45 :
                            d.sibCount > 3 ? 35 : 30)
        .avoidOverlaps(true);
    simulation.start(30,30,30); // expand link 'source' and 'target' ids into references

    const side = ['lhs', 'rhs'] // cludge (objects cannot have numerical fields)
    let currSide;
    let currLink = null;        // Stores index of current link; null if not over it

    // visualization stores
    let link = [], node = [], freeNode = [],
        name = [], state = [], nodeGroup = []
    group.forEach((root, i) => {
        link[i] = root.append("g")
                        .selectAll("line")
                        .data(links)
                        .enter()
                            .append("line")
                            .attr("stroke-width", d => d.isParent ? 1 : 5)
                            .attr("stroke", d => d.isParent ? "darkgray" : "black")
                            .attr("stroke-opacity", d => // d.source[side[i]] && d.target[side[i]]
                                                         d.side == side[i] ? 0.4 : 0)
                            .attr("stroke-dasharray", d => d.isAnonymous ? 4 : null )
                            .on("mouseenter", d => {
                                hovered = ['link', d, side[i]]
                            })
                            .on("mouseleave", () => {hovered = undefined})

        // node base
        nodeGroup[i] = root.selectAll('.node')
                            .data(nodes)
                            .enter()
                            .append('g')
                            .attr('class', 'node')
                            .call(simulation.drag);

        node[i] = nodeGroup[i].append('circle')
                            .attr("r", d => d.isAgent ? 27 : 13)
                            .attr("fill", d => d.isAgent ? d[side[i]].name ? coloragent : "#fff" :
                                               d[side[i]] && d[side[i]].port && d[side[i]].port.length == 0 ? "#fff" : colorsite)
                            .attr("stroke", d => d.isAgent ? coloragent : colorsite)
                            .attr("stroke-width", 3)
                            .style("opacity", d => d[side[i]] && d[side[i]].name ? 1 : 0)
                            .on("mouseenter", d => {
                                hovered = [d.isAgent ? 'agent': 'site', d, side[i]]
                            })
                            .on("mouseleave", () => {hovered = undefined})

        // node annotations
        freeNode[i] = root.append("g")
                        .selectAll("circle")
                        .data(nodes)
                        .enter()
                            .filter(d => !d.isAgent && d[side[i]] && d[side[i]].port && d[side[i]].port.length == 0)
                            .append("circle")
                            .attr("r", 4)
                            .attr("fill", "black")
                            .style("opacity", d => d[side[i]] && d[side[i]].name ? 1 : 0)
                            .on("mouseenter", function () { currSide = side[i]; } );

        name[i] = nodeGroup[i].append("text")
                        .text(d => d[side[i]] && d[side[i]].name)
                        .attr("class", d => d.isAgent ? "agent" : "site")
                        .attr("fill", "black")
                        .attr("text-anchor", "middle")
                        .attr("font-size", d => d.isAgent ? 16 : 12)
                        .attr("font-family", "Helvetica Neue")
                        .style('opacity', d => d.label ? 1 : 0);

        state[i] = nodeGroup[i].append("text")
                        .text(d => d.state)
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
        link[i].on("click", function (d, i) {
            if (state === 'delete') {
                console.log(d);
                //actionHandler['deleteItem'](d);
            }
        })
    })

    simulation.on("tick", () => {
        // one simulation drives both charts! this is why the data on each side of the rule vis are shared.
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
            .attr("y", d => d.y ? d.isAgent ? d.y+4 : d.y+3 : undefined ))
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


let guiState = 'none';

// Styles the active GUI action button + div so the user knows which action they are performing
function addActiveStyle(divID) {
    // Remove active class from whatever was there before
    let prevActive = document.querySelectorAll('div.gui-button-div-active, button.gui-button-div-active');
    for (var i = 0; i < prevActive.length; i++) {
        prevActive[i].classList.remove('gui-button-div-active');
    }

    // Once all active classes are remove, re-add the active class to the divID 
    document.getElementById(divID).classList.add('gui-button-div-active');
    document.getElementById(divID + "Button").classList.add('gui-button-div-active');
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