const fs = require("fs");

module.exports = ({ packageLockJson, OK, ERROR }) => {
  const dependenciesMap = {};

  const traverseDependency = (name, dependency) => {
    dependenciesMap[name] = dependenciesMap[name] || new Set();
    dependenciesMap[name].add(`${dependency.dev ? '' : 'PROD - '}${dependency.version}`);
    if (dependency.dependencies) {
      Object.keys(dependency.dependencies).forEach(name =>
        traverseDependency(name, dependency.dependencies[name])
      );
    }
  };

  Object.keys(packageLockJson.dependencies || []).forEach(name =>
    traverseDependency(name, packageLockJson.dependencies[name])
  );

  const duplicateDependencies = Object.keys(dependenciesMap).filter(
    name => dependenciesMap[name].size > 1
  );

  duplicateDependencies.sort((dep1, dep2) => {
    const numberOfVersions1 = dependenciesMap[dep1].size;
    const numberOfVersions2 = dependenciesMap[dep2].size;
    if (numberOfVersions1 === numberOfVersions2) {
      return 0;
    } else if (numberOfVersions1 > numberOfVersions2) {
      return 1;
    } else {
      return -1;
    }
  });

  const result = {};
  if (duplicateDependencies.length > 0) {
    result.status = ERROR;
    result.message = "the following duplicate dependencies found in the tree:";
    duplicateDependencies.forEach(dependency => {
      result.message += `\n\t"${dependency}": ${JSON.stringify(
        Array.from(dependenciesMap[dependency])
      )}`;
    });
  } else {
    result.status = OK;
    result.message = "no duplicate dependencies found";
  }
  return result;
};
