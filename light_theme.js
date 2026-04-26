const fs = require('fs');
const path = require('path');

const directoryPath = path.join('c:', 'Users', 'khanf', 'society-backend', 'frontend', 'admin-web', 'src', 'app');

const excludeFiles = [
    path.join(directoryPath, 'dashboard', 'layout.tsx'),
    path.join(directoryPath, 'dashboard', 'page.tsx')
];

function updateFile(filePath) {
    if (excludeFiles.includes(filePath)) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let originalStr = content;

    // Convert Dark Glass components back to Pristine White
    content = content.replace(/bg-\[#040404\] bg-white\/\[0\.02\] backdrop-blur-xl/g, 'bg-white shadow-sm border-slate-100');
    content = content.replace(/bg-white\/\[0\.05\]/g, 'bg-slate-50');
    content = content.replace(/bg-white\/\[0\.02\]/g, 'bg-white');
    
    // borders
    content = content.replace(/border-white\/\[0\.08\]/g, 'border-slate-200');
    content = content.replace(/border-white\/\[0\.04\]/g, 'border-slate-100');
    
    // Text colors (Restore dark clean text)
    // Note: If we had 'text-white' which used to be text-zinc-900, we replace it back.
    content = content.replace(/text-white/g, 'text-slate-900');
    content = content.replace(/text-zinc-100/g, 'text-slate-800');
    content = content.replace(/text-zinc-300/g, 'text-slate-700');
    content = content.replace(/text-zinc-400/g, 'text-slate-500');

    // Replace the dark theme primary (cyan) with pristine theme primary (rose)
    content = content.replace(/cyan-500\/10/g, 'rose-50');
    content = content.replace(/cyan-500\/20/g, 'rose-100');
    content = content.replace(/cyan-[45]00/g, 'rose-600');
    
    // Because some buttons were text-white and we just stripped it to slate-900, let's fix standard button text manually (hack)
    // Actually standard buttons use bg-rose-600 text-white. 
    // The previous script transformed text-zinc-900 to text-white. Let's just fix tailwind components:
    content = content.replace(/bg-rose-600 text-slate-900/g, 'bg-rose-600 text-white');
    content = content.replace(/hover:bg-rose-700 text-slate-900/g, 'hover:bg-rose-700 text-white');

    if (content !== originalStr) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated Light Theme: ${filePath}`);
    }
}

function traverseDir(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            traverseDir(fullPath);
        } else if (fullPath.endsWith('.tsx')) {
            updateFile(fullPath);
        }
    }
}

traverseDir(directoryPath);
console.log("Done upgrading to Pristine Light mode.");
