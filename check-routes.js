#!/usr/bin/env node

/**
 * Check main modules for undefined controller functions
 */

const fs = require('fs');
const path = require('path');

// Only check main modules, ignore hidden/
const modulesDir = path.join(__dirname, 'src/modules');
const routeFiles = [];

function findRouteFiles(dir) {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) {
            findRouteFiles(fullPath);
        } else if (item.name.endsWith('Routes.js')) {
            routeFiles.push(fullPath);
        }
    }
}

findRouteFiles(modulesDir);

console.log('🔍 Checking main modules for undefined functions...\n');

const issues = [];

routeFiles.forEach(routeFile => {
    try {
        const content = fs.readFileSync(routeFile, 'utf-8');
        const moduleName = path.basename(path.dirname(routeFile));

        // Extract require statement
        const requireMatch = content.match(/require\(["']\.\/(\w+)Controller["']\)/);
        if (!requireMatch) {
            console.log(`⏭️  ${moduleName}: No controller import found`);
            return;
        }

        const controllerPath = routeFile.replace('Routes.js', 'Controller.js');

        if (!fs.existsSync(controllerPath)) {
            issues.push({ module: moduleName, error: 'Controller file not found' });
            return;
        }

        const controllerContent = fs.readFileSync(controllerPath, 'utf-8');

        // Extract imported functions
        const importMatch = content.match(/const\s*\{([^}]+)\}\s*=\s*require/);
        if (!importMatch) {
            console.log(`⏭️  ${moduleName}: No destructured imports`);
            return;
        }

        const importedFunctions = importMatch[1]
            .split(',')
            .map(f => f.trim())
            .filter(f => f.length > 0);

        // Check each function
        const missing = [];
        importedFunctions.forEach(func => {
            const exportPattern = new RegExp(`exports\\.${func}\\s*=`);
            if (!exportPattern.test(controllerContent)) {
                missing.push(func);
            }
        });

        if (missing.length > 0) {
            issues.push({ module: moduleName, missing: missing });
            console.log(`❌ ${moduleName}:`);
            missing.forEach(func => {
                // Find what it's actually called in controller
                const allExports = controllerContent.match(/exports\.(\w+)\s*=/g) || [];
                const actualNames = allExports.map(e => e.match(/exports\.(\w+)/)[1]);
                console.log(`   Missing: ${func}`);
                console.log(`   Available: ${actualNames.join(', ')}`);
            });
        } else {
            console.log(`✅ ${moduleName}`);
        }

    } catch (err) {
        console.error(`Error checking ${path.basename(routeFile)}:`, err.message);
    }
});

console.log('\n' + '='.repeat(50));
if (issues.length === 0) {
    console.log('✅ All modules look good!');
} else {
    console.log(`❌ Found ${issues.length} module(s) with issues`);
    console.log('\nSummary:');
    issues.forEach(issue => {
        console.log(`- ${issue.module}: ${issue.error || issue.missing.join(', ')}`);
    });
}
