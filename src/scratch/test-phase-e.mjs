// Test Phase E regex against "home"" pattern
const phaseE = /(['"])([^'"\\]*?)\1{2,}(?=[\s,}\]])/g;
const phaseA = /"{3,}/g;

const testCases = [
  { input: '{ id: "home"", label: "Home" }', desc: 'double-quote after value' },
  { input: '{ id: "story"", label: "Our Story" }', desc: 'double-quote after story' },
  { input: '{ label: "All"""""", value: "all" }', desc: 'many consecutive quotes' },
  { input: '{ id: "home", label: "Home" }', desc: 'correct (no change needed)' },
];

testCases.forEach(({ input, desc }) => {
  phaseE.lastIndex = 0;
  phaseA.lastIndex = 0;
  const afterA = input.replace(phaseA, '"');
  const afterE = afterA.replace(phaseE, "$1$2$1");
  const changed = afterE !== input;
  console.log(changed ? '✅ FIXED:' : '⬜ NO CHANGE:', desc);
  console.log('  Input: ', input);
  if (changed) console.log('  Output:', afterE);
  console.log();
});

// Direct test of Phase E regex matching
const m = '{ id: "home"", label: "Home" }'.match(phaseE);
console.log('Phase E match result:', m);

// Check what \1{2,} matches
const re2 = /(['"])([^'"\\]*?)\1{2,}/g;
const m2 = '{ id: "home"", label: "Home" }'.match(re2);
console.log('Without lookahead match:', m2);

// Check the lookahead specifically
const text = '{ id: "home"", label: "Home" }';
const idx = text.indexOf('""');
console.log('Char after "": ', JSON.stringify(text[idx + 2]), '(should be , or space)');
