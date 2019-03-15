
function Agent(idx) {
    // this.interface = []
    this.siteCount = 0
    this.id = idx
}
function Site(par, idx) {
    this.id = [par, idx]
    this.parent = par

    this.state = undefined
}

let pattern = new tinynlp.Grammar([
'start -> pattern',  
'pattern -> agent more-pattern | agent',
'more-pattern -> , pattern',

'agent -> agent-name ( interface ) | . ( interface ) | .', // VERIFY
'interface -> site more-interface | site',
'more-interface -> , interface',

'site -> site-name internal-state link-state | site-name link-state internal-state | site-name internal-state | site-name link-state | site-name',
'internal-state -> { state-name } | { # }',
'link-state -> [ number ] | [ . ] | [ _ ] | [ # ] | [ site-name . agent-name ]', //  [ . / number ] |
])

let regex = {'digits': /^\d+$/g,
             'identifier': /^_?[A-Za-z]+[A-Za-z\d_~\-+]*$/g,
              // todo: labels
            }
let tokenize = (raw) => {
    let str = raw.replace(/\s+/g, '') // kill whitespace
        re = /(\d+|_?[A-Za-z]+[A-Za-z\d_~\-+]*|[\[\]\(\)\{\}\/#,])/g
    return str.split(re).filter(s => s)
}
pattern.terminalSymbols = (token) => {
    // console.log(token)
    if (token.match(regex.identifier)) { // console.log('identifier')
        return ['agent-name', 'site-name', 'state-name']
    }
    else if (token.match(regex.digits)) { // console.log('number')
        return ['number']
    }
    else { // console.log('something else')
        return [token]
    }
    // throw new Error('Bad token: ' + token)
}

let simplify = (chart) => {
    let res = chart.getFinishedRoot('start').traverse()
    if (!res) throw 'Failed to parse chart.'
    else if (res.length > 1) throw 'Ambiguous chart parse.'

    let simplify = (node, ret) => {
        // TODO: gracefully append to existing contact network?
        if (!ret) ret = {'interfacing': false,
                         'subscripting': false,
                        'agents': [],
                        'sites': [],
                        'virtualSites': [],
                        'bonds': [],
                        'virtualBonds': []}

        let curr = ret.agents ? ret.agents.slice(-1)[0] : null,
            loc = ret.sites ? ret.sites.slice(-1)[0] : null
            // loc = curr ? curr.interface ? curr.interface.slice(-1)[0] : null : null

        let rule = {
        'agent': () => {ret.agents.push(new Agent(ret.agents.length))},
        'agent-name': () => {
            if (ret.interfacing) {
                // TODO: collect virtual agents, too
                // loc.boundTo = new Agent()
                // loc.boundTo.name = node.subtrees[0].root[0]
                ret.virtualSites.slice(-1)[0]
                   .boundTo = node.subtrees[0].root[0]
            }
            else curr.name = node.subtrees[0].root[0]
        },
        'site': () => {
            let v = new Site(curr.id, curr.siteCount) // curr.interface.length
            // curr.interface.push(v.id)
            curr.siteCount += 1
            ret.sites.push(v)
        },
        'site-name': () => {
            if (ret.interfacing) {
                // loc.boundAt = new Site() // TODO: propagate stub to top
                // loc.boundAt.name = node.subtrees[0].root[0]
                loc.bond = [-1, false]
                console.log(loc)

                let res = new Site([-1,0])
                res.boundAt = node.subtrees[0].root[0]
                res.bond = [-1, false]

                ret.virtualBonds.push([loc.id, [-1,0]]) // VERIFY
                ret.virtualSites.push(res)
                // TODO: attach to virtual agent
            }
            else loc.name = node.subtrees[0].root[0]
        },
        'number': () => {
            if (ret.interfacing) {
                let k = node.subtrees[0].root[0]
                loc.bond = [parseInt(k), true]
                
                let v = ret.bonds[k]
            if (v) ret.bonds[k].push(loc.id)
            else ret.bonds[k] = [loc.id]
            }},
        'state-name': () => {
            if (ret.subscripting) {
                loc.state = node.subtrees[0].root[0]
            }
        },
        
        '_': () => {
            if (ret.interfacing) {
                loc.bond = [-1, false]
                
                let res = new Site([-1,0])
                res.bond = [-1, false]

                ret.virtualBonds.push([loc.id, [-1,0]])
                ret.virtualSites.push(res)
            }},
        '.': () => {
            /* if (ret.interfacing) {
                loc.bond = null
            }*/ },
        '#': () => {
            if (ret.interfacing) {
                loc.bond = undefined // TODO
            } else if (ret.subscripting) {
                loc.state = undefined
            }},

        '[': () => {ret.interfacing = true},
        ']': () => {ret.interfacing = false},

        '{': () => {ret.subscripting = true},
        '}': () => {ret.subscripting = false},

        }[node.root]
        if (rule) rule()

        // todo: optimize tail recursion
        if (node.subtrees)
            node.subtrees.forEach((u) => {
                ret = simplify(u, ret)
            })
        return ret
    }
    let ret = simplify(res[0])
    delete ret.interfacing
    delete ret.subscripting // remove internal parse state
    return ret
}