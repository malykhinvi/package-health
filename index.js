#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

const WORK_DIR = process.cwd();
const PACKAGE_JSON_FILE = path.join(WORK_DIR, 'package.json');
const PACKAGE_LOCK_JSON_FILE = path.join(WORK_DIR, 'package-lock.json');
const ERROR = Symbol('ERROR');
const OK = Symbol('OK');

// Check if the package.json is readable
try {
  fs.accessSync(PACKAGE_JSON_FILE, fs.constants.R_OK);
  console.log(chalk.whiteBright.bgGreen(' PASS ') + ' - package.json found');
} catch (err) {
  console.log(chalk.whiteBright.bgRed(' FAIL ') + ' - package.json not found');
  process.exit(1);
}

// Check if the package-lock.json is readable
try {
  fs.accessSync(PACKAGE_LOCK_JSON_FILE, fs.constants.R_OK);
  console.log(chalk.whiteBright.bgGreen(' PASS ') + ' - package-lock.json found');
} catch (err) {
  console.log(chalk.whiteBright.bgRed(' FAIL ') + ' - package-lock.json not found');
  process.exit(1);
}

const config = {
  OK,
  ERROR,
  packageJson: JSON.parse(fs.readFileSync(PACKAGE_JSON_FILE)),
  packageLockJson: JSON.parse(fs.readFileSync(PACKAGE_LOCK_JSON_FILE))
};

const checks = [
  require('./checks/findDuplicateDependencies'),
  require('./checks/findCounterparts')
];

let success = true;
checks.forEach(check => {
  const result = check(config);
  if (success && result.status === ERROR) {
    success = false;
  }
  console.log(`${result.status === OK ? chalk.whiteBright.bgGreen(' PASS ') : chalk.whiteBright.bgRed(' FAIL ')} - ${result.message}`);
});

process.exit(success ? 0 : 1);
