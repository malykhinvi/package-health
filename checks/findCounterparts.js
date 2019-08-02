const fs = require("fs");

const counterparts = [
  ['webpack', 'rollup', 'parcel', 'browserify'],
  ['@angular/core', 'angular', 'vue', 'react'],
  ['styled-components', 'styletron', 'radium', 'jss', 'glamorous', 'emotion', 'aphrodite'],
  ['lodash', 'underscore'],
  ['redux', 'mobx'],
  ['react-router', '@reach/router'],
  ['rc-tooltip', 'react-tooltip'],
  ['rc-slider', 'react-slider'],
];

//TODO optimize index generation
const counterpartsIndex = counterparts.reduce((index, group) => {
  group.forEach((member, i, array) => {
    index[member] = array.filter(el => el !== member)
  });
  return index;
}, {});

module.exports = ({ packageLockJson, OK, ERROR }) => {
  const dependencies = new Set();
  const foundCounterparts = new Set();

  const traverseDependency = (name, dependency) => {
    dependencies.add(name);
    const knownCounterparts = counterpartsIndex[name];
    if (knownCounterparts) {
      const alreadyUsedCounterparts = knownCounterparts.filter(counterpart => dependencies.has(counterpart));
      if (alreadyUsedCounterparts.length > 0) {
        foundCounterparts.add(`${name} - ${alreadyUsedCounterparts.join(', ')}`);
      }
    }
    if (dependency.dependencies) {
      Object.keys(dependency.dependencies).forEach(name =>
        traverseDependency(name, dependency.dependencies[name])
      );
    }
  };

  Object.keys(packageLockJson.dependencies || []).forEach(name =>
    traverseDependency(name, packageLockJson.dependencies[name])
  );

  const result = {};
  if (foundCounterparts.size > 0) {
    result.status = ERROR;
    result.message = "the following counterparts found:";
    foundCounterparts.forEach(counterpart => {
      result.message += `\n\t${counterpart}`;
    });
  } else {
    result.status = OK;
    result.message = "no counterparts found";
  }
  return result;
};
