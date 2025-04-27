#!/usr/bin/env node

/**
 * This script updates the workflow configuration for the YoBot application
 * It specifically targets the "Start application" workflow task
 */

import fs from 'fs';

// Path to the .replit file
const replitFilePath = './.replit';

// Read the current .replit content
try {
  console.log('Attempting to read .replit file...');
  const content = fs.readFileSync(replitFilePath, 'utf8');
  
  // Print the original content
  console.log('Current .replit content:');
  console.log(content);
  
  // Replace the npm run dev command with our node server-express.js command
  const updatedContent = content.replace(
    /args = "npm run dev"/g,
    'args = "node server-express.js"'
  );
  
  // Check if any changes were made
  if (content !== updatedContent) {
    // Save the updated content
    fs.writeFileSync(replitFilePath, updatedContent, 'utf8');
    console.log('Successfully updated .replit file with new server command.');
  } else {
    console.log('No changes needed in .replit file.');
  }
} catch (error) {
  console.error('Error updating .replit file:', error.message);
}