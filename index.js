#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const WORK_DIR = process.cwd();
const PACKAGE_JSON_FILE = path.join(WORK_DIR, "package.json");
const PACKAGE_LOCK_JSON_FILE = path.join(WORK_DIR, "package-lock.json");
const ERROR = Symbol("ERROR");
const OK = Symbol("OK");

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

const config = {
  OK,
  ERROR,
  packageJson: JSON.parse(fs.readFileSync(PACKAGE_JSON_FILE)),
  packageLockJson: JSON.parse(fs.readFileSync(PACKAGE_LOCK_JSON_FILE)),
};

const checks = [
  require("./checks/findDuplicateDependencies"),
  require("./checks/findCounterparts")
];

checks.map(check => {
  const result = check(config);
  console.log(`${result.status === OK ? "👌" : "🛑"} - ${result.message}`);
});
