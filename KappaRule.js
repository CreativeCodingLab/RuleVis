const pattern = new tinynlp.Grammar([
    'start -> pattern | ',  
    'pattern -> agent more-pattern | agent',
    'more-pattern -> , pattern',
    
    'agent -> agent-name ( interface ) | . ( interface ) | agent-name | .', // VERIFY
    'interface -> site more-interface | site',
    'more-interface -> , interface',
    
    'site -> site-name internal-state link-state | site-name link-state internal-state | site-name internal-state | site-name link-state | site-name',
    'internal-state -> { state-name } | { # }',
    'link-state -> [ number ] | [ . ] | [ _ ] | [ # ] | [ site-name . agent-name ]', //  [ . / number ] |
    ])

const regex = {
    'digits': /^\d+$/g,
    'identifier': /^_?[A-Za-z]+[A-Za-z\d_~\-+]*$/g,
    // todo: labels
    'token': /(\d+|_?[A-Za-z]+[A-Za-z\d_~\-+]*|[\[\]\(\)\{\}\/#,])/g
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

function KappaRule(lhs, rhs) {
    // INPUT: a pair of strings, each representing a Kappa expression
    // INSTANTIATES: a mutable KappaRule

    const tokenize = (raw) =>
        raw.replace(/\s+/g, '') // kill whitespace
            .split(regex.token).filter(s => s)

    this.chart = [lhs, rhs]  // VERIFY whether tokenize can make strings become falsy
                .map( u => u ? tokenize(u) : undefined)
                .map( u => u ? tinynlp.parse(u, pattern, 'start') : u)
    let chart = this.chart

    console.log(chart)
    this.expression = chart.map( c => c !== undefined ? simplify(c) : c )
    // TODO: store expression as a diff, not as two independent sides.

    let e = this.expression // TODO: handle trivial case in simplify
    if (!e[1])
        e[1] = {'agents': [], 'sites': [], 'virtualSites': [],
                              'bonds': [], 'virtualBonds': []}
    if (!e[0])
        e[0] = {'agents': [], 'sites': [], 'virtualSites': [],
                              'bonds': [], 'virtualBonds': []}

    // convert expression into a diff

    // ASSUME aligned agents
    this.agents = d3.range(e[0].agents.length).map( (i) =>
                     ({id: e[0].agents[i].id,
                       siteCount: e[0].agents[i].siteCount,
                       lhs: e[0].agents[i],
                       rhs: e[1].agents[i] ? e[1].agents[i] : new Agent(i)}))


    // cannot assume aligned sites
    this.sites = e[0].sites.map( (u) => 
        ({id: u.id,
          lhs: u, rhs: new Site(...u.id) })
    )
    if (e[1])
        e[1].sites.forEach( (v) => {
            let u = this.sites.find((u) => u.id[0] == v.id[0] && u.id[1] == v.id[1])
            console.log("merge", u, v)

            if (u === undefined)
                this.sites.push({id: v.id,
                            lhs: new Site(...v.id), rhs: v })
            else
                u.rhs = v
        })
    // generate anonymous agents as needed (TODO: for bonds, too)
    e.forEach((expr,i) =>
        expr.virtualSites.forEach((v,j) => {
            console.log(v)
            let par = this.agents.length + j // assign fake id
            // tar = new Site([-1, 0])
            v.port = [-1, false]

            this.sites.push({
                id: [par, v.id[1]], parent: par,
                lhs: v, rhs: {...v},
            })
            let res = this.sites.slice(-1)[0][['lhs', 'rhs'][i]] // BRITTLE
            res.state = v.boundTo ? `of ${v.boundTo}` : ''
            res.name = v.boundAt ? v.boundAt : '_' // FIXME: Site gets hidden if its name is falsy.
        })
    )

    // treat bonds (site-site links) separately
    let bonds = e.map((u,i) => {
        if (!u) return []
        let named = u.bonds
            .filter(bnd => bnd && bnd[1])
            .map(([src,tar]) => ({'source': this.getIndex(src),
                                'target': this.getIndex(tar)
                                }))
        let anon = u.virtualBonds
            .map(([src,_],i) => ({'source': this.getIndex(src),
                                    'target': this.getIndex([this.agents.length+i, 0]),
                                    // BRITTLE: look up anonymous index
                                    'isAnonymous': true}))
        return [...named, ...anon]
        })
    this.bonds = {lhs: bonds[0], rhs: bonds[1]} // FIXME: flipped

    // treat parents (site-agent links) once
    this.parents = this.sites.filter(u => u.id[0] < e[0].agents.length) // ignore virtual sites
                    .map(u => ({'source': u.id[0], // agentId is already a valid index
                                'target': this.getIndex(u.id),
                                'isParent': true,
                                'sibCount': this.agents[u.id[0]].siteCount,
                                }))

    this.expression = null
    this. chart = null
}

KappaRule.prototype = { // n.b. arrow notation on helper functions would discard 'this' context
    getIndex: function(siteId) {
        // helper function to create links  
        if (!siteId) throw new Error("expression merger cannot look up a site without its index")
    
        let [a,b] = siteId
        return this.agents.length +
                this.sites.findIndex((u) => u.id[0] == a && u.id[1] == b)
    },
    toString: function () {
        // GENERALIZE
        // TODO: handle anonymous bonds
    
        // return `${this.agents[0].lhs.name}(${this.sites[0].lhs.name}[${this.ports.lhs[0]}])`
        let agentStrings = {lhs: [], rhs: []}
        this.agents.forEach((u, i) => {
            let children = this.sites.filter(v => v.id[0] == i) 
            
            let bake = (w) => {
                let siteStrings = []
                children.forEach(v => {
                    let res = v[w].name || '.'
                    if (v[w].port) {
                        if (v[w].port.length == 0)
                            res += `[.]`
                        else if (typeof v[w].port === 'number')
                            res += `[${v[w].port}]`
                        else
                            res += `[_]`
                    }
                    if (v[w].state) res += `{${v[w].state}}`
                    if (res !== '.') siteStrings.push(res)
                })
                console.log(siteStrings)
                // if (siteStrings.length == 0) siteStrings = ['.']

                let name = u[w].name || '.'
                return siteStrings.length == 0 ? `${name}`  
                                               : `${name}(${siteStrings.join(',')})`
            }
            agentStrings.lhs[i] = bake('lhs')
            agentStrings.rhs[i] = bake('rhs')
        })
        return `${agentStrings.lhs.join(',')} -> ${agentStrings.rhs.join(',')}`
    },

    /*setBonds: function(expr) { // FIXME: update bonds from internal representation alone
        // instantiates:
        //   this.ports.lhs: [{source, target, isAnonymous}]
        //   this.ports.rhs: ~
        //   this.parents: [{source, target, isParent, sibCount}]
    
    }, */

    addAgent: function (name, x=0, y=0) {
        let u = new Agent(this.agents.length)
        u.name = name
        u.siteCount = 0
        this.agents.push(
            {id: u.id, label: true,
             lhs: u, rhs: {...u}, // addition to both sides of rule
             siteCount: u.siteCount,
             x: x, y: y // FIXME
        })
        // this.setBonds() // FIXME
    },
    deleteNode: function (agentIdx, siteIdx) {
        // TODO
    },
    deleteEdge: function (linkIdx) {
        // TODO: locate both ? references to the link
    }
}

function Agent(idx) {
    // this.interface = []
    this.siteCount = 0
    this.id = idx
    this.isAgent = true
}
function Site(par, idx) {
    this.id = [par, idx]
    // this.isSite = true
    this.state = undefined
}

function simplify(chart) {
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

        let ag = ret.agents ? ret.agents.slice(-1)[0] : null,
            si = ret.sites ? ret.sites.slice(-1)[0] : null
            // si = ag ? ag.interface ? ag.interface.slice(-1)[0] : null : null

        let virtualSiteCount = 0

        let rule = {
        'agent': () => {ret.agents.push(new Agent(ret.agents.length))},
        'agent-name': () => {
            if (ret.interfacing) {
                // TODO: collect virtual agents, too
                // ret.virtualSites.slice(-1)[0].boundTo = node.subtrees[0].root[0]

                // finalize the port_link as 'some of type'
                si.port.agent_name = node.subtrees[0].root[0]
            }
            else ag.name = node.subtrees[0].root[0]
        },
        'site': () => {
            let v = new Site(ag.id, ag.siteCount) // ag.interface.length
            // ag.interface.push(v.id)
            ag.siteCount += 1
            ret.sites.push(v)
        },
        'site-name': () => {
            if (ret.interfacing) {
                // e.g. x[y.B], a 'some of type' link

                si.port = {}
                si.port.site_name = node.subtrees[0].root[0]

                let tmp = new Site(-1, virtualSiteCount) // TODO: attach to virtual agent
                virtualSiteCount += 1
                tmp.boundAt = node.subtrees[0].root[0]
                // tmp.port = 

                ret.virtualBonds.push([si.id, [-1,0]]) // VERIFY
                ret.virtualSites.push(tmp)
            }
            else {
                si.port = null // 'whatever'
                si.name = node.subtrees[0].root[0]
            }
        },
        'number': () => {
            if (ret.interfacing) {
                let k = node.subtrees[0].root[0]
                si.port = parseInt(k) // 'explicit link' - TODO: attach bond partner
                
                let v = ret.bonds[k]
            if (v) ret.bonds[k].push(si.id)
            else ret.bonds[k] = [si.id]
            }},
        'state-name': () => {
            if (ret.subscripting) {
                // TODO: parse multiple states per port
                si.state = node.subtrees[0].root[0]
            }
        },
        
        '_': () => {
            if (ret.interfacing) {                
                let tmp = new Site(-1, virtualSiteCount)
                virtualSiteCount += 1
                tmp.port = true // 'some'

                ret.virtualBonds.push([si.id, [-1,0]])
                ret.virtualSites.push(tmp)
            }},
        '.': () => {
            if (ret.interfacing && !si.port) {
                si.port = [] // 'free'
            }},
        '#': () => {
            // do nothing to a 'whatever'
            if (ret.subscripting) {
                si.state = undefined
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