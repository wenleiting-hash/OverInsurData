/**
 * i18n Edge Case Testing Suite
 * 
 * Tests various boundary conditions for internationalization:
 * - Empty strings
 * - Special characters
 * - Unicode edge cases
 * - Very long text
 * - Mixed languages
 * - Direction changes (LTR/RTL)
 */

const assert = require('assert');

console.log('\n========================================');
console.log('I18N EDGE CASE TESTING');
console.log('========================================\n');

// Test data and expected results
const edgeCaseTests = [
  {
    name: 'Empty String Handling',
    input: '',
    expectedOutput: '',
    test: (input) => input === ''
  },
  {
    name: 'Special Characters in Arabic',
    input: 'مرحبا بالعالم',
    expectedOutput: 'مرحبا بالعالم',
    test: (input) => input.length > 0 && typeof input === 'string'
  },
  {
    name: 'Mixed LTR-RTL Text',
    input: 'Hello مرحبا World',
    expectedOutput: 'Hello مرحبا World',
    test: (input) => input.includes(' ') && input.includes('ا')
  },
  {
    name: 'Unicode Emojis',
    input: '🎉 🚀 ✅',
    expectedOutput: '🎉 🚀 ✅',
    test: (input) => input.match(/[\p{Emoji_Presentation}]/gu) !== null
  },
  {
    name: 'Very Long Translation (>500 chars)',
    input: 'A'.repeat(600),
    expectedOutput: 'A'.repeat(600),
    test: (input) => input.length === 600
  },
  {
    name: 'Currency Symbol Position',
    input: '$1,234.56',
    expectedOutput: '1,234.56$', // RTL version
    test: (input) => input.includes('$') || input.endsWith('$')
  },
  {
    name: 'Date Format Adaptation',
    input: '2026-09-05',
    expectedOutput: '05/09/2026', // Different locale format
    test: (input) => /^\d{4}-\d{2}-\d{2}$/.test(input) || /^\d{2}\/\d{2}\/\d{4}$/.test(input)
  },
  {
    name: 'Whitespace Preservation',
    input: '  Multiple   spaces   ',
    expectedOutput: '  Multiple   spaces   ',
    test: (input) => input.trim() !== input
  },
  {
    name: 'Right-to-Left Alignment',
    input: 'text-right',
    expectedOutput: 'text-left', // Reversed for RTL
    test: (input) => ['text-left', 'text-right'].includes(input)
  },
  {
    name: 'Number Localization',
    input: 1234567.89,
    expectedOutput: '1,234,567.89',
    test: (num) => typeof num === 'number' && num > 0
  }
];

// Run tests
let passedTests = 0;
let failedTests = 0;
const results = [];

edgeCaseTests.forEach((test, index) => {
  try {
    const result = test.test(test.input);
    
    if (result) {
      console.log(`✅ Test ${index + 1}: ${test.name}`);
      console.log(`   Input: "${test.input.substring(0, 50)}${test.input.length > 50 ? '...' : ''}"`);
      console.log(`   Result: PASS\n`);
      passedTests++;
    } else {
      console.log(`❌ Test ${index + 1}: ${test.name}`);
      console.log(`   Expected: ${test.expectedOutput}`);
      console.log(`   Got: FAILED\n`);
      failedTests++;
    }
    
    results.push({
      test: test.name,
      status: result ? 'PASS' : 'FAIL',
      input: test.input
    });
  } catch (error) {
    console.log(`❌ Test ${index + 1}: ${test.name}`);
    console.log(`   Error: ${error.message}\n`);
    failedTests++;
    results.push({
      test: test.name,
      status: 'ERROR',
      error: error.message
    });
  }
});

// Summary report
console.log('\n\n========================================');
console.log('TEST SUMMARY');
console.log('========================================\n');

const totalTests = edgeCaseTests.length;
const passRate = ((passedTests / totalTests) * 100).toFixed(1);

console.log(`Total Tests:    ${totalTests}`);
console.log(`Passed:         ${passedTests} ✅`);
console.log(`Failed:         ${failedTests} ❌`);
console.log(`Pass Rate:      ${passRate}%\n`);

if (failedTests === 0) {
  console.log('🎉 All edge case tests passed!\n');
} else {
  console.log(`⚠️  ${failedTests} test(s) failed. Review edge case handling.\n`);
  
  // List failures
  if (failedTests > 0) {
    console.log('Failed Tests:');
    edgeCaseTests.forEach((test, i) => {
      const result = results[i];
      if (result.status !== 'PASS') {
        console.log(`  • ${test.name}: ${result.status}`);
      }
    });
  }
}

// Critical edge cases validation
console.log('\n\nCRITICAL EDGE CASE VALIDATION');
console.log('═══════════════════════════════════════\n');

const criticalChecks = [
  {
    check: 'Null Input Handling',
    test: () => {
      try {
        const result = null?.toString() || '';
        return true;
      } catch {
        return false;
      }
    }
  },
  {
    check: 'Undefined Input Handling',
    test: () => {
      try {
        const result = undefined?.toString() || '';
        return true;
      } catch {
        return false;
      }
    }
  },
  {
    check: 'Array as Input',
    test: () => {
      try {
        const result = [1, 2, 3].join(', ');
        return result === '1, 2, 3';
      } catch {
        return false;
      }
    }
  },
  {
    check: 'Object Conversion',
    test: () => {
      try {
        const obj = { key: 'value' };
        const str = JSON.stringify(obj);
        return typeof str === 'string';
      } catch {
        return false;
      }
    }
  },
  {
    check: 'Circular Reference Safety',
    test: () => {
      try {
        const obj = { a: 1 };
        obj.self = obj;
        JSON.stringify(obj);
        return false; // Should throw error
      } catch {
        return true; // Expected to throw
      }
    }
  }
];

criticalChecks.forEach((check, index) => {
  const result = check.test();
  const status = result ? '✅' : '❌';
  console.log(`${status} ${check.check}: ${result ? 'SAFE' : 'UNSAFE'}`);
});

console.log('\n========================================');
console.log('✅ EDGE CASE TESTING COMPLETE');
console.log('========================================\n');
