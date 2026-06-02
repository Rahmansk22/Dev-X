// Test section 4.8 mangled empty string repair
const re = /\b((?:use\w+|set\w+)(?:<[^>]+>)?)\s*\(\s*"([)};,\s]{1,8})"\s*$/gm;

function testCase(name, input, expected) {
  re.lastIndex = 0;
  const result = input.replace(re, '$1("");');
  const pass = result === expected;
  console.log(pass ? '✅' : '❌', name);
  if (!pass) {
    console.log('  Input:   ', JSON.stringify(input));
    console.log('  Expected:', JSON.stringify(expected));
    console.log('  Got:     ', JSON.stringify(result));
  }
}

// Should fix: mangled empty string with ); inside
testCase(
  'useState<string>(");" → useState<string>("");',
  '  const [q, setQ] = useState<string>(");"',
  '  const [q, setQ] = useState<string>("");'
);

// Should fix: without generic type
testCase(
  'useState(");" → useState("");',
  '  const [q, setQ] = useState(");"',
  '  const [q, setQ] = useState("");'
);

// Should fix: setFoo(");"
testCase(
  'setFoo(");" → setFoo("");',
  '  setFoo(");"',
  '  setFoo("");'
);

// Should fix: useRef with complex generic
testCase(
  'useRef<HTMLDivElement>(");" → useRef<HTMLDivElement>("");',
  '  const ref = useRef<HTMLDivElement>(");"',
  '  const ref = useRef<HTMLDivElement>("");'
);

// Should NOT fix: normal string argument
testCase(
  'useState("hello"); → unchanged',
  '  const [q, setQ] = useState("hello");',
  '  const [q, setQ] = useState("hello");'
);

// Should NOT fix: correct empty string
testCase(
  'useState(""); → unchanged',
  '  const [q, setQ] = useState("");',
  '  const [q, setQ] = useState("");'
);

// Should NOT fix: boolean argument
testCase(
  'useState(false); → unchanged',
  '  const [q, setQ] = useState(false);',
  '  const [q, setQ] = useState(false);'
);

// Should NOT fix: non-hook function
testCase(
  'console.log(");" → unchanged',
  '  console.log(");"',
  '  console.log(");"'
);

// Multi-line test
testCase(
  'Multi-line: only fixes the broken line',
  '  const [a, setA] = useState<boolean>(false);\n  const [q, setQ] = useState<string>(");"',
  '  const [a, setA] = useState<boolean>(false);\n  const [q, setQ] = useState<string>("");'
);

console.log('\nDone!');
