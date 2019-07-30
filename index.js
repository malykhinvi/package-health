#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const WORK_DIR = process.cwd();
const PACKAGE_JSON_FILE = path.join(WORK_DIR, "package.json");
const PACKAGE_LOCK_JSON_FILE = path.join(WORK_DIR, "package-lock.json");

const messages = [];

// Check if the package.json is readable
try {
  fs.accessSync(PACKAGE_JSON_FILE, fs.constants.R_OK);
  console.log("👌 - package.json found");
} catch (err) {
  console.log("🛑 - package.json not found");
  process.exit(1);
}

// Check if the package-lock.json is readable
try {
  fs.accessSync(PACKAGE_LOCK_JSON_FILE, fs.constants.R_OK);
  console.log("👌 - package-lock.json found");
} catch (err) {
  console.log("🛑 - package-lock.json not found");
  process.exit(1);
}

// Check package-lock.json file.
try {
  const packageLock = JSON.parse(fs.readFileSync(PACKAGE_LOCK_JSON_FILE));
  const dependenciesMap = {};

  const traverseDependency = (name, dependency) => {
    dependenciesMap[name] = dependenciesMap[name] || new Set();
    dependenciesMap[name].add(dependency.version);
    if (dependency.dependencies) {
      Object.keys(dependency.dependencies).forEach(name =>
        traverseDependency(name, dependency.dependencies[name])
      );
    }
  };

  Object.keys(packageLock.dependencies || []).forEach(name =>
    traverseDependency(name, packageLock.dependencies[name])
  );

  const duplicateDependencies = Object.keys(dependenciesMap).filter(name => dependenciesMap[name].size > 1);

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

  if (duplicateDependencies.length > 0) {
    console.log("🛑 - the following duplicate dependencies found in the tree")
  } else {
    console.log("👌 - no duplicate dependencies found");
  }
  duplicateDependencies.forEach(dependency => {
    console.log(`\t"${dependency}": `, Array.from(dependenciesMap[dependency]))
  });
} catch (err) {
  console.error(err);
  process.exit(1);
}

messages.forEach(message => console.log(message));
