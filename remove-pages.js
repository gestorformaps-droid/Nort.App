import fs from 'fs';

const file = 'src/App.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Initial State
code = code.replace(
  "const [view, setView] = useState<'splash' | 'landing' | 'login' | 'register' | 'dashboard'>('splash');",
  "const [view, setView] = useState<'login' | 'register' | 'dashboard'>('login');"
);

// 2. Logout state
code = code.replace(
  "setView('splash');",
  "setView('login');"
);

// 3. Conditional rendering
code = code.replace(
  /\s*if \(view === 'splash'\) \{\s*return <SplashPage onNext=\{\(\) => setView\('landing'\)\} \/>;\s*\}\s*if \(view === 'landing'\) \{\s*return <LandingPage onLogin=\{\(\) => setView\('login'\)\} \/>;\s*\}/,
  ""
);

// 4. Component definitions:
// We locate SplashPage and LandingPage by finding their function headers and removing everything until "// --- Auth Page ---"
const pattern = /\/\/ --- Splash Page ---[\s\S]*?\/\/ --- Auth Page ---/;
code = code.replace(pattern, "// --- Auth Page ---");

fs.writeFileSync(file, code);
console.log('Splash and Landing pages successfully removed!');
