#!/usr/bin/env node

/**
 * Mock Reset Script
 * 
 * This script provides utilities to reset mock data in development.
 * Since it runs in Node.js, it simulates localStorage operations.
 */

const fs = require('fs');
const path = require('path');

// Simulate localStorage keys that would be used in the browser
const MOCK_STORAGE_KEYS = [
  'taskflow_mock_tasks',
  'taskflow_mock_users', 
  'taskflow_mock_workspaces',
  'taskflow_mock_config'
];

function resetMockData() {
  console.log('🔄 Resetting TaskFlow mock data...');
  
  // In a real browser environment, these keys would be removed from localStorage
  console.log('📋 Mock storage keys that would be cleared:');
  MOCK_STORAGE_KEYS.forEach(key => {
    console.log(`   - ${key}`);
  });
  
  console.log('✅ Mock data reset completed!');
  console.log('💡 Note: When you next open the application, mock services will');
  console.log('   reinitialize with default data.');
  console.log('');
  console.log('🛠️  For runtime mock management, use the browser console:');
  console.log('   window.taskflowMock.reset()     - Reset all mock data');
  console.log('   window.taskflowMock.seed()      - Load demo data');
  console.log('   window.taskflowMock.stats()     - Show data statistics');
  console.log('   window.taskflowMock.config()    - Show current config');
}

function seedDemoData() {
  console.log('🌱 Would seed demo data...');
  console.log('💡 Use window.taskflowMock.seed() in the browser console instead.');
}

function showHelp() {
  console.log('TaskFlow Mock Data Management');
  console.log('');
  console.log('Usage:');
  console.log('  npm run mock:reset          - Reset all mock data');
  console.log('  npm run mock:seed           - Seed with demo data');
  console.log('');
  console.log('Runtime Commands (in browser console):');
  console.log('  window.taskflowMock.reset()     - Reset all data');
  console.log('  window.taskflowMock.seed()      - Load demo data');
  console.log('  window.taskflowMock.export()    - Export data as JSON');
  console.log('  window.taskflowMock.import(json) - Import JSON data');
  console.log('  window.taskflowMock.download()  - Download data file');
  console.log('  window.taskflowMock.stats()     - Show statistics');
  console.log('  window.taskflowMock.config()    - Show configuration');
}

// Parse command line arguments
const command = process.argv[2] || 'reset';

switch (command) {
  case 'reset':
    resetMockData();
    break;
  case 'seed':
    seedDemoData();
    break;
  case 'help':
  case '--help':
  case '-h':
    showHelp();
    break;
  default:
    console.error(`❌ Unknown command: ${command}`);
    console.log('Run "npm run mock:reset help" for usage information.');
    process.exit(1);
}