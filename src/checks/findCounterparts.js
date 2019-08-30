const counterparts = require('./counterparts');
const {FAIL, PASS} = require('../status');

//TODO optimize index generation
const counterpartsIndex = counterparts.reduce((index, group) => {
  group.forEach((member, i, array) => {
    index[member] = array.filter(el => el !== member);
  });
  return index;
}, {});

const run = ({packageLockJson}) => {
  const dependencies = new Set();
  const foundCounterparts = new Set();

  const traverseDependency = (name, dependency) => {
    dependencies.add(name);
    const knownCounterparts = counterpartsIndex[name];
    if (knownCounterparts) {
      const alreadyUsedCounterparts = knownCounterparts.filter(counterpart =>
        dependencies.has(counterpart)
      );
      if (alreadyUsedCounterparts.length > 0) {
        foundCounterparts.add(
          `${name}, ${alreadyUsedCounterparts.join(', ')}`
        );
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

  return {
    status: foundCounterparts.size > 0 ? FAIL : PASS,
    data: {
      foundCounterparts
    }
  };
};

const report = (result) => {
  let message = '';
  if (result.status === FAIL) {
    message += `\n The following counterparts found (${result.data.foundCounterparts.size}):`;
    result.data.foundCounterparts.forEach(counterpart => {
      message += `\n - ${counterpart}`;
    });
    message += '\n\n';
  }
  return message;
};

module.exports = {
  description: 'Counterparts',
  run,
  report
};
