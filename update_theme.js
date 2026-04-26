const fs = require('fs');
const path = require('path');

const directoryPath = path.join('c:', 'Users', 'khanf', 'society-backend', 'frontend', 'admin-web', 'src', 'app');

// Do not overwrite layout.tsx and page.tsx at the root of dashboard as they were manually curated
const excludeFiles = [
    path.join(directoryPath, 'dashboard', 'layout.tsx'),
    path.join(directoryPath, 'dashboard', 'page.tsx')
];

function updateFile(filePath) {
    if (excludeFiles.includes(filePath)) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let originalStr = content;

    // Replace slate with zinc
    content = content.replace(/slate/g, 'zinc');
    
    // Replace teal with emerald to match our new theme
    content = content.replace(/teal/g, 'emerald');

    // Upgrade borders and radius to match new modern look
    content = content.replace(/rounded-xl/g, 'rounded-2xl');
    
    if (content !== originalStr) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated: ${filePath}`);
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
console.log("Done updating all remaining pages.");
