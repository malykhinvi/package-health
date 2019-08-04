#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

const WORK_DIR = process.cwd();
const PACKAGE_JSON_FILE = path.join(WORK_DIR, 'package.json');
const PACKAGE_LOCK_JSON_FILE = path.join(WORK_DIR, 'package-lock.json');
const FAIL = Symbol('FAIL');
const PASS = Symbol('PASS');
const PASS_BADGE = chalk.whiteBright.bgGreen(' PASS ');
const FAIL_BADGE = chalk.whiteBright.bgRed(' FAIL ');

// Check if the package.json is readable
try {
  fs.accessSync(PACKAGE_JSON_FILE, fs.constants.R_PASS);
} catch (err) {
  console.log(
    chalk.red(
      'The `package-health` command should be called in the root of package, in the same directory as package.json'
    )
  );
  process.exit(1);
}

// Check if the package-lock.json is readable
try {
  fs.accessSync(PACKAGE_LOCK_JSON_FILE, fs.constants.R_PASS);
  console.log(PASS_BADGE + ' - package-lock.json found');
} catch (err) {
  console.log(FAIL_BADGE + ' - package-lock.json not found');
  process.exit(1);
}

const config = {
  PASS,
  FAIL,
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
  if (success && result.status === FAIL) {
    success = false;
  }
  console.log(
    `${result.status === PASS ? PASS_BADGE : FAIL_BADGE} - ${result.message}`
  );
});

process.exit(success ? 0 : 1);
