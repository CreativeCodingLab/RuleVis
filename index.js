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


// Load grammar library
tinynlp = require('https://cdn.jsdelivr.net/gh/lagodiuk/earley-parser-js@master/earley-oop.js').catch(() => window.tinynlp)

// Initialize pattern grammar
pattern = new tinynlp.Grammar([
    'start -> pattern',  
    'pattern -> agent more-pattern | agent',
    'more-pattern -> , pattern',
    
    'agent -> agent-name ( interface )',
    'agent-name -> A | B | C',
    'interface -> site more-interface | site',
    'more-interface -> , interface',
    
    'site -> site-name internal-state link-state | site-name link-state internal-state | site-name internal-state | site-name link-state | site-name',
    'site-name -> x | y | z',
    'internal-state -> { state-name } | { # }',
    'state-name -> u | v | w',
    'link-state -> [ number ] | [ . ] | [ _ ] | [ # ] | [ site-name . agent-name ]',
    'number -> 1 | 2 | 3',
  ])



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
    let input = inputBox.property('value')
    visualize(input);
    console.log(input); 
    parseInput(input)    
    // if valid input, then visualize() without requiring 'enter' key to be pressed
    // NOTE: How to implement 'onSumbit' in this format?
});

function parseInput(input){
    chart = tinynlp.parse([...input], pattern, 'start')
    // Example patterns:
    // A(x{u}[#]),B(y[y.B])
    // A(x[1],y[_]),A(x[1],y[.])
    // B(x[.],y[y.B])
    // A(x{u}[#]),B(y[.],y[.])
    return simplify(chart)
}

simplify = (chart) => {
    let res = chart.getFinishedRoot('start').traverse()
    if (!res) throw 'Failed to parse chart.'
    else if (res.length > 1) throw 'Ambiguous chart parse.'
    
    let simplify = (node, ret) => {
       // TODO: gracefully append to existing contact network?
      if (!ret) ret = {'interfacing': false,
                       'agents': [],
                       'bonds': [],
                       'namedBonds': []}
  
      let curr = ret.agents ? ret.agents.slice(-1)[0] : null,
          loc = curr ? curr.interface ? curr.interface.slice(-1)[0] : null : null
      
      let rule = {
        'agent': () => {ret.agents.push(new Agent(ret.agents.length))},
        'agent-name': () => {
          if (ret.interfacing) {
            loc.boundTo = new Agent() // FIXME
            loc.boundTo.name = node.subtrees[0].root
          }
          else curr.name = node.subtrees[0].root
        },
        'site': () => {curr.interface.push(new Site(curr.id, curr.interface.length))},
        'site-name': () => {
          if (ret.interfacing) {
            loc.boundAt = new Site() // FIXME
            loc.boundAt.name = node.subtrees[0].root
          }
          else loc.name = node.subtrees[0].root
        },
        'internal-state': () => {
          loc.state = node.subtrees[1].subtrees[0].root
        },
        'number': () => {
          if (ret.interfacing) {
            let k = node.subtrees[0].root
            loc.bond = [parseInt(k), true]
            
            let v = ret.namedBonds[k]
            if (v) ret.namedBonds[k].push(loc.id)
            else ret.namedBonds[k] = [loc.id]
          }},
        
        '_': () => {
          if (ret.interfacing) {
            let k = ret.bonds.push([loc.id])
            loc.bond = [k-1, false]
          }},
        '.': () => {
          if (ret.interfacing) {
            loc.bond = null
          }},
        '#': () => {
          if (ret.interfacing) {
            loc.bond = undefined // TODO
          }},
  
        '[': () => {ret.interfacing = true},
        ']': () => {ret.interfacing = false},
  
        // TODO: handle cases I-IV of Figure 5
      }[node.root]
      if (rule) rule()
      
      node.subtrees.forEach((u) => {
        ret = simplify(u, ret)
      })
  
      return ret
    }
    return simplify(res[0])
  }

Agent = {
    function Agent(idx) {
    this.interface = []
    this.id = idx
    }
    // Agent.prototype.getName = () => this.name
    // TODO: what about dynamically bound properties?
    return Agent
}
Site = {
    function Site(par, idx) {
      this.id = [par, idx]
    }
    return Site
}
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
