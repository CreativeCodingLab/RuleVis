
function Agent(idx) {
    this.interface = []
    this.id = idx
}
function Site(par, idx) {
    this.id = [par, idx]
}

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

let simplify = (chart) => {
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
    let ret = simplify(res[0])
    delete ret.interfacing // remove internal parse state
    return ret
}