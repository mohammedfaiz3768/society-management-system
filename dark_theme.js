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

    // Convert light backgrounds to dark glass
    content = content.replace(/bg-white([^/])/g, 'bg-[#040404] bg-white/[0.02] backdrop-blur-xl$1');
    content = content.replace(/bg-zinc-100/g, 'bg-white/[0.05]');
    content = content.replace(/bg-zinc-50/g, 'bg-white/[0.02]');
    
    // Borders
    content = content.replace(/border-zinc-200/g, 'border-white/[0.08]');
    content = content.replace(/border-zinc-100/g, 'border-white/[0.04]');
    
    // Text colors
    content = content.replace(/text-zinc-900/g, 'text-white');
    content = content.replace(/text-zinc-800/g, 'text-zinc-100');
    content = content.replace(/text-zinc-700/g, 'text-zinc-300');
    content = content.replace(/text-zinc-600/g, 'text-zinc-400');
    
    // Primary / Accents (Emerald to Cyan to match the extreme look)
    content = content.replace(/emerald-600/g, 'cyan-500');
    content = content.replace(/emerald-700/g, 'cyan-400');
    content = content.replace(/emerald-500/g, 'cyan-400');
    content = content.replace(/emerald-50/g, 'cyan-500/10');
    content = content.replace(/emerald-100/g, 'cyan-500/20');

    if (content !== originalStr) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated Dark Theme: ${filePath}`);
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
console.log("Done upgrading to dark mode.");
