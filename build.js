#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔨 Starting TypeScript build...');

try {
  // Run TypeScript compilation
  execSync('npx tsc', { stdio: 'inherit' });
  
  // Check if the output file exists
  const outputFile = path.join(__dirname, 'dist', 'app.js');
  if (fs.existsSync(outputFile)) {
    console.log('✅ Build successful! app.js generated');
    console.log('📁 Checking dist directory:');
    execSync('ls -la dist/', { stdio: 'inherit' });
  } else {
    console.error('❌ Build failed: app.js not found');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
} 