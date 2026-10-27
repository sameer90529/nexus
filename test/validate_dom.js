const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '../index.html');
const appJsPath = path.join(__dirname, '../js/app.js');

const html = fs.readFileSync(htmlPath, 'utf8');
const appJs = fs.readFileSync(appJsPath, 'utf8');

console.log('=== VALIDATING DOM ELEMENT ID REFERENCES ===\n');

// Find all document.getElementById('...') in app.js
const regex = /getElementById\(['"]([^'"]+)['"]\)/g;
let match;
const ids = new Set();
while ((match = regex.exec(appJs)) !== null) {
  ids.add(match[1]);
}

let passed = 0;
let missing = 0;

ids.forEach(id => {
  const idPattern = new RegExp(`id=["']${id}["']`);
  if (idPattern.test(html)) {
    console.log(`[PASS] Element #${id} exists in index.html`);
    passed++;
  } else {
    console.error(`[FAIL] Element #${id} is referenced in app.js but MISSING from index.html!`);
    missing++;
  }
});

console.log(`\n=== DOM VALIDATION SUMMARY: ${passed} found, ${missing} missing ===`);
if (missing > 0) process.exit(1);
