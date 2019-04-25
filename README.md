# RuleVis

## Generating Expressive Visual Representations of Biochemical Patterns

This project is an implementation of dynamically generated pattern site graphs in the context of modeling biological rules, such as molecular and protein interactions. This tool uses the same syntax from the [Kappa Language](https://kappalanguage.org/), a rule-based language for modeling interacting networks, as shown below in the example from the [Kappa Language Documentation](https://kappalanguage.org/documentation).

![Example](https://github.com/CreativeCodingLab/RuleVis/blob/master/pattern.png)

[Run in browser](https://creativecodinglab.github.io/RuleVis/)

## API

### KappaRule

KappaRule (lhs, rhs=undefined): **constructor**


lhs and (optional) rhs are strings each representing a valid Kappa expression.

**TODO:** Or, lhs (and rhs) are objects each representing a RuleVis expression.

#### TODO:
KappaRule.addAgent(name, symmetry=BOTH): Adds an agent to the lhs.

etcetera