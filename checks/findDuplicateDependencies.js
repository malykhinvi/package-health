const chalk = require('chalk');
const semver = require('semver');

module.exports = ({packageLockJson, PASS, FAIL}) => {
  const dependenciesMap = {};
  const requiresMap = {};

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
      const isSameMajorInstalled = installedVersions.every(
        v => semver.major(v) === semver.major(installedVersions[0])
      );
      const versionHint = isSameMajorInstalled
        ? chalk.green('same major version')
        : chalk.red('different major versions');
      result.message +=
        `\n\t"${dependency}":` +
        `\n\t\t${installedVersionsStr} - ${versionHint}` +
        `\n\t\t${requiredVersionsStr}`;
    });
  } else {
    result.status = PASS;
    result.message = 'no duplicate dependencies found';
  }
  return result;
};
