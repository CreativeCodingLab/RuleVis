# RuleVis

## Constructing Patterns and Rules for Rule-based Models


We introduce RuleVis, a web-based application for defining and editing "correct-by-construction" executable rules that model biochemical functionality, and which can be used to simulate the behavior of protein-protein interaction networks and other complex systems. Our application bridges the graph rewriting and systems biology research communities by providing an external visual representation of salient patterns that experts can use to determine the appropriate level of detail in a particular modeling context. 

This project is a collaboration between the UCSC Creative Coding Lab and the Walter Fontana Group at Harvard Medical School. Our short paper has been submitted for review to IEEE VIS 2019. The tool uses the same syntax from the [Kappa Language](https://kappalanguage.org/), a rule-based language for modeling interacting networks. The application is available online with this link: [Run in browser](https://creativecodinglab.github.io/RuleVis/)

![Example](https://github.com/CreativeCodingLab/RuleVis/media/teaser_rulevis.png)


## API

### KappaRule

KappaRule (lhs, rhs=undefined): **constructor**


lhs and (optional) rhs are strings each representing a valid Kappa expression.

**TODO:** Or, lhs (and rhs) are objects each representing a RuleVis expression.

#### TODO:
KappaRule.addAgent(name, symmetry=BOTH): Adds an agent to the lhs.

etcetera
