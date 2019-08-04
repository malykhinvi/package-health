const chalk = require('chalk');
const semver = require('semver');

module.exports = ({packageJson, packageLockJson, PASS, FAIL}) => {
  const dependenciesMap = {};
  const requiresMap = {};
  Object.keys(packageJson.dependencies).forEach(name => {
    requiresMap[name] = new Set([packageJson.dependencies[name]]);
  });

  const traverseDependency = (name, dependency) => {
    dependenciesMap[name] = dependenciesMap[name] || new Set();
    if (!dependency.dev) {
      dependenciesMap[name].add(dependency.version);
      if (dependency.requires) {
        Object.keys(dependency.requires).forEach(requireName => {
          requiresMap[requireName] = requiresMap[requireName] || new Set();
          requiresMap[requireName].add(dependency.requires[requireName]);
        });
      }
      if (dependency.dependencies) {
        Object.keys(dependency.dependencies).forEach(name =>
          traverseDependency(name, dependency.dependencies[name])
        );
      }
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
    result.status = FAIL;
    result.message = `the following duplicate dependencies found in the tree(${
      duplicateDependencies.length
    }):`;
    duplicateDependencies.forEach(dependency => {
      const installedVersions = Array.from(dependenciesMap[dependency]);
      const requiredVersions = Array.from(requiresMap[dependency]);
      const installedVersionsStr = installedVersions
        .map(d => `"${d}"`)
        .join(', ');
      const requiredVersionsStr = requiredVersions
        .map(r => `"${r}"`)
        .join(', ');
      result.message +=
        `\n\t"${dependency}":` +
        `\n\t\t${installedVersionsStr}` +
        `\n\t\t${requiredVersionsStr}`;
    });
    result.message += chalk.gray(
      '\n' +
      '\n To find out what packages cause duplicate dependencies to be installed run `npm ls package-name`' +
      '\n There is no a correct way to handle duplicates for all possible cases.' +
      '\n Be mindful during dependency update, a good practice is to update one depenency at a time.' +
      '\n Run `npm dedupe` to remove duplicates and make dependencies tree flat.' +
      '\n\n'
    );
  } else {
    result.status = PASS;
    result.message = 'no duplicate dependencies found';
  }
  return result;
};
