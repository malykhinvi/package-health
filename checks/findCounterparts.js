const counterparts = require('./counterparts');

//TODO optimize index generation
const counterpartsIndex = counterparts.reduce((index, group) => {
  group.forEach((member, i, array) => {
    index[member] = array.filter(el => el !== member);
  });
  return index;
}, {});

module.exports = ({packageLockJson, PASS, FAIL}) => {
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
          `${name} - ${alreadyUsedCounterparts.join(', ')}`
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

  const result = {};
  if (foundCounterparts.size > 0) {
    result.status = FAIL;
    result.message = 'the following counterparts found:';
    foundCounterparts.forEach(counterpart => {
      result.message += `\n\t${counterpart}`;
    });
  } else {
    result.status = PASS;
    result.message = 'no counterparts found';
  }
  return result;
};
