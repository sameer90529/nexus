const NexusCipher = require('../js/cipher.js');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    passed++;
  } else {
    console.error(`[FAIL] ${message}`);
    failed++;
  }
}

console.log('=== RUNNING NEXUS RAIL FENCE CIPHER ENGINE TESTS ===\n');

// 1. Master prompt canonical test
const t1 = NexusCipher.encrypt('HELLOWORLD', 3);
assert(t1.ciphertext === 'HOLELWRDLO', `Canonical test encrypt('HELLOWORLD', 3) === 'HOLELWRDLO' (got '${t1.ciphertext}')`);

const d1 = NexusCipher.decrypt('HOLELWRDLO', 3);
assert(d1.plaintext === 'HELLOWORLD', `Canonical test decrypt('HOLELWRDLO', 3) === 'HELLOWORLD' (got '${d1.plaintext}')`);

// 2. Invariant verification
const testCases = [
  { msg: 'NEXUSCIPHER', key: 2 },
  { msg: 'NEXUSCIPHER', key: 3 },
  { msg: 'NEXUSCIPHER', key: 4 },
  { msg: 'NEXUSCIPHER', key: 5 },
  { msg: 'DEFEND THE EAST WALL AT DAWN', key: 3 },
  { msg: 'MISSISSIPPI', key: 4 },
  { msg: 'A', key: 3 },
  { msg: 'AB', key: 2 },
  { msg: 'ABC', key: 5 }, // key > length
  { msg: '', key: 3 },
  { msg: 'ONE RAIL CASE', key: 1 },
  { msg: 'THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG 12345!', key: 5 }
];

testCases.forEach(({ msg, key }, idx) => {
  const inv = NexusCipher.verifyCipherInvariant(msg, key);
  assert(inv.valid, `Invariant #${idx + 1}: key=${key}, len=${msg.length} -> recovered === original`);
});

// 3. Normalization checks
assert(NexusCipher.normalizeText('hello world', { uppercase: true, stripSpaces: true }) === 'HELLOWORLD', 'Normalization uppercase + strip spaces');
assert(NexusCipher.normalizeText('Hello, World! 123', { lettersOnly: true }) === 'HELLOWORLD', 'Normalization letters only');

console.log(`\n=== TEST SUMMARY: ${passed} passed, ${failed} failed ===`);
if (failed > 0) process.exit(1);
