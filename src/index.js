#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const {FAIL, PASS} = require('./status');

const WORK_DIR = process.cwd();
const PACKAGE_JSON_FILE = path.join(WORK_DIR, 'package.json');
const PACKAGE_LOCK_JSON_FILE = path.join(WORK_DIR, 'package-lock.json');

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

try {
  fs.accessSync(PACKAGE_LOCK_JSON_FILE, fs.constants.R_PASS);
} catch (err) {
  chalk.red(
    '`package-lock.json` file is not found. It is required for most of health checks.'
  );
  process.exit(1);
}

const config = {
  packageJson: JSON.parse(fs.readFileSync(PACKAGE_JSON_FILE)),
  packageLockJson: JSON.parse(fs.readFileSync(PACKAGE_LOCK_JSON_FILE))
};

const checks = [
  require('./checks/findDuplicateDependencies'),
  require('./checks/findCounterparts')
];

let success = true;
checks.forEach(check => {
  const result = check.run(config);
  if (success && result.status === FAIL) {
    success = false;
  }
  const report = check.report(result);
  const badge =
    result.status === PASS
      ? chalk.whiteBright.bgGreen(' PASS ')
      : chalk.whiteBright.bgRed(' FAIL ');
  console.log(`${badge} - ${check.description}`);
  if (report) {
    console.log(report);
  }
});

process.exit(success ? 0 : 1);
