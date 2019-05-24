const pattern = new tinynlp.Grammar([
    'start -> pattern | ',  
    'pattern -> agent more-pattern | agent',
    'more-pattern -> , pattern',
    
    'agent -> agent-name ( interface ) | . ( interface ) | agent-name ( ) | . ( ) | agent-name | .',
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
        e[1] = {'agents': [], 'sites': [], 'bonds': [], 'virtual': []}
    if (!e[0])
        e[0] = {'agents': [], 'sites': [], 'bonds': [], 'virtual': []}

    // convert expression into a diff

    // ASSUME aligned agents
    this.agents = d3.range(e[0].agents.length).map( (i) =>
                     ({id: e[0].agents[i].id,
                       siteCount: e[0].agents[i].siteCount,
                       isAgent: true,
                       lhs: e[0].agents[i],
                       rhs: e[1].agents[i] ? e[1].agents[i] : new Agent(i)}))


    // cannot assume aligned sites
    this.sites = e[0].sites.map( (u) => 
        ({id: u.id, lhs: u, rhs: new Site(...u.id) })
    )
    if (e[1])
        e[1].sites.forEach( (v) => {
            let u = this.sites.find((u) => u.id[0] == v.id[0] && u.id[1] == v.id[1])
            // console.log("merge sites", u, v)

            if (u === undefined)
                this.sites.push({'id': v.id, 'lhs': new Site(...v.id), 'rhs': v }) // VERIFY: dummy site? new Site(...u.id)
            else
                u.rhs = v
        })

    // treat parents (site-agent links)
    this.parents = this.sites // .filter(u => u.id[0] < e[0].agents.length) // ignore virtual sites
                    .map(u => ({'source': u.id[0], // agentId is already a valid index
                                'target': this.getIndex(u.id),
                                'isParent': true,
                                'sibCount': this.agents[u.id[0]].siteCount,
                                }))
    // treat bonds (site-site links)
    this.bonds = e[0].bonds
                .map((u,k) => [u,k]) // enumerate
                .filter(bnd => bnd[0] && bnd[0][1])
                .map(([[src,tar],k]) => ({'lhs': {'source': this.getIndex(src),
                                                'target': this.getIndex(tar),
                                                'side': 'lhs',
                                                'id': k},
                                          'rhs': undefined})
    )
    console.log(e.map(ei => ei.bonds))
    if (e[1])
        e[1].bonds.forEach( ([src, tar], k) => {
            // merge named bonds only
            if (src && tar) { // ignore half-bonds
                let u = this.bonds.filter(u => u.lhs)
                                .find((u) => u.lhs.source[0] == src[0] && u.lhs.source[1] == src[1] &&
                                                u.lhs.target[0] == tar[0] && u.lhs.target[1] == tar[1])

                let res = {'source': this.getIndex(src),
                            'target':this.getIndex(tar),
                            'side': 'rhs',
                            'id': k}
                if (u === undefined)
                    this.bonds.push({'lhs': undefined,
                                    'rhs': res})
                else
                    u.rhs = res
            }
        })

    // generate anonymous agents as needed (TODO: for bonds, too)
    e[0].virtual.forEach((v, j) => {
        // VERIFY
        // let par = this.agents.length + j // assign fake id
        let [src_id, port] = v

        let res = new Site([-1, j])
        console.log(port)
        res.state = port.agent_name ? `of ${port.agent_name}` : ''
        res.name = port.site_name ? port.site_name : '.'

        this.bonds.push({
            'lhs': {'source': this.getIndex(src_id),
                    'target': this.agents.length + this.sites.length,
                    'side': 'lhs',
                    isAnonymous: true},
            'rhs': undefined
        })
        this.sites.push({id: res.id, lhs: res, rhs: {} })

        /* let par = this.agents.length + j // assign fake id
        this.sites.push({
            id: [par, v.id[1]], parent: par,
            lhs: v, rhs: {...v},
        })
        let res = this.sites.slice(-1)[0][['lhs', 'rhs'][i]]
        */
    })
    e[1].virtual.forEach((v, j) => {
        let [src_id, port] = v
        let i = this.bonds.findIndex(u => {
            let ls = u.lhs ? u.lhs.id : undefined
                rs = u.rhs ? u.rhs.id : undefined
            return (ls && ls[0] == src_id[0] && ls[1] == src_id[1])
                || (rs && rs[0] == src_id[0] && rs[1] == src_id[1]) 
        })

        let link = {
            'source': this.getIndex(src_id),
            'target': this.agents.length + this.sites.length,
            'side': 'rhs',
            isAnonymous: true,
        }
        let res = new Site([-1, e[0].virtual.length + j]) // brittle?
        res.state = port.agent_name ? `of ${v.port.agent_name}` : ''
        res.name = port.site_name ? v.port.site_name : '.'

        if (i == -1) {
            this.bonds.push( {'lhs': undefined, 'rhs': link })
            this.sites.push({id: res.id, lhs: {}, rhs: res })
        }
        else {
            this.bonds[i].rhs = link
            this.sites[i].rhs = res
        }
    })

    this.expression = null
    this.chart = null
}

KappaRule.prototype = { // n.b. arrow notation on helper functions would discard 'this' context
    getIndex: function(siteId) {
        // helper function to create links  
        if (siteId === undefined)
            throw new Error("expression merger cannot look up a site without its index")
    
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
            let children = this.sites.filter(v => v.id[0] == u.id) 
            
            let bake = (w) => {
                let siteStrings = []
                children.forEach(v => {
                    let res = v[w].name ? v[w].name : '.'
                    if (v[w] && v[w].port) {
                        if (v[w].port.length == 0)
                            res += `[.]`
                        else if (typeof v[w].port === 'number')
                            res += `[${v[w].port}]`
                        else if (typeof v[w].port !== 'boolean')
                            res += `[${v[w].port.site_name}.${v[w].port.agent_name}]`
                        else
                            res += `[_]`
                    }
                    if (v[w] && v[w].state) res += `{${v[w].state}}`
                    if (res !== '.') siteStrings.push(res)
                })
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
            {id: u.id, // label: true,
             lhs: u, rhs: {...u}, // addition to both sides of rule
             isAgent: true,
             siteCount: u.siteCount,
             x: x, y: y // FIXME
        })
    },
    addSite: function (parent, name, x=0, y=0) {
        let u = this.agents.find(u => u.id == parent) // TODO: take reference itself as arg
        if (u) {
            let v = new Site(parent, u.siteCount)
            v.name = name

            this.sites.push(
                {id: v.id,
                lhs: u.lhs.name ? v : undefined,
                rhs: u.rhs.name ? {...v} : undefined,
                x: x, y: y
                })
            u.siteCount += 1

            this.parents.push(
                {'source': u.id,
                'target': this.getIndex(v.id),
                'isParent': true,
                'sibCount': u.siteCount
            })
            this.parents.filter(w => w.source == u.id)
                        .forEach(w => w.sibCount += 1)
        }
    },
    addBond: function (a, b) {
        if (a[0] == b[0]) {
            if (a[1] == b[1]) {
                // HACK: wiring an EMPTY to itself makes an ANY
                let u = this.sites.find(v => v.id[0] == a[0] && v.id[1] == a[1])
                u.lhs.port = undefined
                u.rhs.port = undefined
                return
            }
            else
                return // can't have a bond to site on same agent
        }

        let u = this.sites.find(v => v.id[0] == a[0] && v.id[1] == a[1]),
            w = this.sites.find(v => v.id[0] == b[0] && v.id[1] == b[1])
        if (u && w) {
            let ks = d3.range(this.bonds.length).filter(k => !this.bonds[k+1]),
                k = ks.length > 0 ? ks[0]+2 : 1

            // let clobber = new Set()
            let isEmpty = (v) => { // FIXME: ew, side effects
                if (!v.port || v.port.length == 0) return true
                if (typeof v.port == 'number') {
                    console.log('wrangling link ' + v.port)

                    if (this.bonds.find(bnd => (bnd.lhs && bnd.lhs.id == v.port) ||
                                                (bnd.rhs && bnd.rhs.id == v.port))) // oops, an actual bond is here
                        return false 
                    return true
                }
                return false 
            }

            let added = [false, false]
            if (u.lhs.name && w.lhs.name) {
                if ( isEmpty(u.lhs) && isEmpty(w.lhs) ) {
                    u.lhs.port = k; w.lhs.port = k
                    added[0] = true
                }
            }
            if (u.rhs.name && w.rhs.name) {
                if ( isEmpty(u.rhs) && isEmpty(w.rhs) ) {
                    u.rhs.port = k; w.rhs.port = k
                    added[1] = true
                }
            }

            // console.log(k, added)
            let res = {}
            if (added[0])
                res.lhs = {id: k, 'side': 'lhs', source: this.getIndex(a), target: this.getIndex(b)}
            if (added[1])
                res.rhs = {id: k, 'side': 'rhs', source: this.getIndex(a), target: this.getIndex(b)}

            this.bonds.push(res)
            // clobber.forEach(idx => this.bonds.splice(idx, 1))
        }
    },

    deleteAgent: function (side, index) {
        let u = this.agents.find(u => u.id == index)
        if (u) {
            // delete self
            u[side] = new Agent(index)

            // delete children sites & their edges
            this.sites.filter(v => v.id[0] == index)
                      .forEach(v => {
                          if (typeof v[side].port == 'number')
                            this.deleteBond(side, v[side].port)
                          v[side] = new Site(...v[side].id)
                        })

            if (!u.lhs.name && !u.rhs.name) {
                // remove children sites
                d3.range(u.siteCount).forEach(i => {this.deleteSite([index, i])} )
                this.agents.splice(index, 1) // VERIFY    
            }
        }
    },
    deleteSite: function(index) {
        // no asymmetry between sites is allowed, because they are part of their agent's signature

        let idx = this.sites.findIndex(v => v.id[0] == index[0] && v.id[1] == index[1]),
            v = idx != -1 ? this.sites[idx] : undefined
        if (v) {
            // unbind port
            let unbind = (p) => {if (typeof p == 'number') {this.deleteBond('lhs', p); this.deleteBond('rhs', p)} }
            unbind(v.lhs.port)
            unbind(v.rhs.port)
            // (TODO: delete virtual site, if my port is _)

            // delete self
            
            // unbind from parent
            this.agents[index[0]].siteCount -= 1
            rule.parents = rule.parents.filter((({target: tar}) =>
                tar.id[0] != v.id[0] || tar.id[1] != v.id[1] ))

            // reindex siblings
            this.sites.splice(idx, 1)
            this.sites.filter(v => v.id[0] == index[0] && v.id[1] > index[1])
                      .forEach(v => { v.id[1] -= 1 }) // VERIFY: GUI'd ids aren't contiguous, but does this at least not break?
        }
    },
    deleteBond: function (side, index) {
        // VERIFY: assume link indexes are preserved on lhs, rhs of rule
        
        // find sites whose port has this link
        
        console.log('unbinding ' + side + ' sites with bond ' + index)
        let friends = this.sites.filter(v => v[side] && v[side].port == index)
        friends.forEach(v => {
            v[side].port = [] // unbind them
        })

        let idx = this.bonds.findIndex(bnd => bnd[side] && bnd[side].id == index ),
            bnd = idx != -1 ? this.bonds[idx] : undefined

        if (bnd) {
            bnd[side] = undefined
            if (!bnd.lhs && !bnd.rhs)
                this.bonds.splice(idx, 1)
        }
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
                        'bonds': [],
                        'virtual': [],
                    }

        let ag = ret.agents ? ret.agents.slice(-1)[0] : null,
            si = ret.sites ? ret.sites.slice(-1)[0] : null
            // si = ag ? ag.interface ? ag.interface.slice(-1)[0] : null : null

        let rule = {
        'agent': () => {ret.agents.push(new Agent(ret.agents.length))},
        'agent-name': () => {
            if (ret.interfacing) {
                // finalize the port_link as 'some of type'
                // let [_, port] = ret.virtual.slice(-1)[0]
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
                ret.virtual.push([si.id, si.port])
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
                si.port = true // 'some'
                ret.virtual.push([si.id, si.port])
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