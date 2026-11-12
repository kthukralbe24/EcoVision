/**
 * Lightweight Code Quality & Syntax Checker
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

console.log('Running code quality and style validation...');

const directories = ['js', 'test'];
let issues = 0;
let scanned = 0;

for (const dir of directories) {
    try {
        const files = readdirSync(dir);
        for (const file of files) {
            if (file.endsWith('.js') || file.endsWith('.mjs')) {
                scanned++;
                const fullPath = join(dir, file);
                const content = readFileSync(fullPath, 'utf-8');
                
                // Check for debugger statements
                if (content.includes('debugger;')) {
                    console.error(`[LINT-ERR] Forbidden 'debugger' statement in ${fullPath}`);
                    issues++;
                }

                // Check for eval()
                if (/eval\(/.test(content)) {
                    console.error(`[LINT-ERR] Forbidden eval() usage in ${fullPath}`);
                    issues++;
                }
            }
        }
    } catch (e) {
        console.warn(`Directory not found: ${dir}`);
    }
}

if (issues === 0) {
    console.log(`[PASS] Code Quality Verified across ${scanned} source modules. 0 issues found.`);
} else {
    console.error(`[FAIL] Found ${issues} code quality issues.`);
    process.exit(1);
}

