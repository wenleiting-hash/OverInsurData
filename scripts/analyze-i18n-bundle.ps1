/**
 * Performance Test: Static vs Lazy Loading
 * 
 * Run this script to compare bundle sizes and load times
 */

const fs = require('fs');
const path = require('path');

console.log('\n========================================');
console.log('i18n BUNDLE SIZE ANALYSIS');
console.log('========================================\n');

const localeDir = 'insurance-platform/apps/web-carrier-admin/src/i18n/locales';

// Count all JSON files in locales directory
let totalSize = 0;
let fileCount = 0;
const languageStats = {};

['en-US', 'zh-CN'].forEach(lang => {
  const langPath = path.join(localeDir, lang);
  
  if (!fs.existsSync(langPath)) {
    console.error(`❌ Directory not found: ${langPath}`);
    return;
  }
  
  const files = fs.readdirSync(langPath).filter(f => f.endsWith('.json'));
  const langSize = { size: 0, count: 0, namespaces: [] };
  
  files.forEach(file => {
    const filePath = path.join(langPath, file);
    const stats = fs.statSync(filePath);
    
    langSize.size += stats.size;
    langSize.count++;
    langSize.namespaces.push({
      name: file.replace('.json', ''),
      size: stats.size
    });
  });
  
  languageStats[lang] = langSize;
  totalSize += langSize.size;
  fileCount += langSize.count;
});

// Output analysis
console.log('📊 FILE COUNT');
console.log('─────────────────────────');
Object.entries(languageStats).forEach(([lang, data]) => {
  console.log(`${lang}: ${data.count} files`);
});
console.log(`Total: ${fileCount} files\n`);

console.log('💾 BUNDLE SIZE (bytes)');
console.log('─────────────────────────');
Object.entries(languageStats).forEach(([lang, data]) => {
  const mb = (data.size / 1024 / 1024).toFixed(2);
  const kb = (data.size / 1024).toFixed(2);
  console.log(`${lang}: ${mb} MB (${kb} KB)`);
});
console.log(`\nGrand Total: ${(totalSize / 1024 / 1024).toFixed(2)} MB (${(totalSize / 1024).toFixed(2)} KB)\n`);

// Namespace breakdown
console.log('📋 NAMESPACE BREAKDOWN (EN-US)');
console.log('─────────────────────────');
languageStats['en-US'].namespaces
  .sort((a, b) => b.size - a.size)
  .forEach((ns, idx) => {
    const percent = ((ns.size / totalSize) * 100).toFixed(1);
    console.log(`${idx + 1}. ${ns.name.padEnd(15)} - ${ns.size.toString().padStart(6)} bytes (${percent}%)`);
  });

// Calculate potential savings with lazy loading
const commonNamespaceSize = languageStats['en-US'].namespaces.find(n => n.name === 'common')?.size || 0;
const primaryNamespacesSize = languageStats['en-US'].namespaces.slice(0, 5).reduce((sum, ns) => sum + ns.size, 0);

console.log('\n⚡ LAZY LOADING POTENTIAL SAVINGS');
console.log('─────────────────────────');
console.log('Initial load (common + fallback):');
console.log(`  Size: ${(commonNamespaceSize * 2 / 1024).toFixed(2)} KB`);
console.log(`  % of total: ${((commonNamespaceSize * 2 / totalSize) * 100).toFixed(1)}%`);

console.log('\nFirst-screen namespaced (dashboard, insurer, product, channel, permission):');
console.log(`  Size: ${(primaryNamespacesSize * 2 / 1024).toFixed(2)} KB`);
console.log(`  % of total: ${((primaryNamespacesSize * 2 / totalSize) * 100).toFixed(1)}%`);

console.log('\n⏸️ Deferred namespaces (loaded on navigation):');
const deferredSize = totalSize - (commonNamespaceSize * 2) - (primaryNamespacesSize * 2);
console.log(`  Size: ${(deferredSize / 1024).toFixed(2)} KB`);
console.log(`  % of total: ${((deferredSize / totalSize) * 100).toFixed(1)}%`);

console.log('\n========================================');
console.log('✅ PERFORMANCE ANALYSIS COMPLETE');
console.log('========================================\n');
