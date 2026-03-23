import fs from 'fs';
const file = 'src/App.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Correção do Auto Zoom (Input, Select, Textarea)
code = code.replace(/text-sm focus:ring-2 focus:ring-blue-500\/20 focus:border-blue-500/g, 'text-base md:text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500');
code = code.replace(/text-sm focus:outline-none focus:ring-2 focus:ring-blue-500\/20 focus:border-blue-500\/50/g, 'text-base lg:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50');
code = code.replace(/text-white text-sm focus:outline-none/g, 'text-white text-base sm:text-sm focus:outline-none');

// 2. Modais: Permitir scroll interno limitando a altura
code = code.replace(/<form onSubmit=\{handleSubmit\} className="p-6 space-y-4">/g, '<form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[80dvh]">');
code = code.replace(/className="relative w-full max-w-2xl bg-slate-50 rounded-3xl shadow-2xl overflow-hidden"/g, 'className="relative w-full max-w-2xl bg-slate-50 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90dvh]"');
code = code.replace(/className="relative w-full max-w-2xl bg-slate-50 rounded-3xl shadow-2xl overflow-hidden max-h-\[90vh\] flex flex-col"/g, 'className="relative w-full max-w-2xl bg-slate-50 rounded-3xl shadow-2xl overflow-hidden max-h-[90dvh] flex flex-col"');
code = code.replace(/id="employee-modal-content" className="p-4 lg:p-6 space-y-6 lg:space-y-8"/g, 'id="employee-modal-content" className="p-4 lg:p-6 space-y-6 lg:space-y-8 overflow-y-auto no-scrollbar"');

// 3. Grid cols
code = code.replace(/className="grid grid-cols-2 gap-4/g, 'className="grid grid-cols-1 md:grid-cols-2 gap-4');
code = code.replace(/className="grid grid-cols-2 gap-3/g, 'className="grid grid-cols-1 md:grid-cols-2 gap-3');
code = code.replace(/className="grid grid-cols-2 lg:grid-cols-4 gap-4/g, 'className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4');

// 4. Sidebar Area
code = code.replace(/p-2 text-white hover:bg-white\/10 rounded-lg lg:hidden shrink-0/g, 'p-3 -ml-2 text-white hover:bg-white/10 rounded-lg lg:hidden shrink-0');

fs.writeFileSync(file, code);
console.log('Mobile optimizations applied!');
