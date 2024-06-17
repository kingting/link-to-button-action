const fs = require('fs');
const path = require('path');
const core = require('@actions/core');

// Function to get environment variables
const getEnvVariable = (key, defaultValue) => {
  // GitHub Actions provides environment variables prefixed with INPUT_
  if (process.env.GITHUB_ACTIONS) {
    return process.env[`INPUT_${key.replace(/ /g, '_').toUpperCase()}`] || defaultValue;
  }
  // For local testing, use regular environment variables
  return process.env[key] || defaultValue;
};

// Get the path to the README.md file
const readmePath = getEnvVariable('readme-path', null);

if (!readmePath) {
  core.setFailed("The 'readme-path' input is required and not set.");
  process.exit(1);
} else {
  console.log(`The path to the README.md file is: ${readmePath}`);
}

// Read the Markdown file
let content = fs.readFileSync(readmePath, 'utf8');
console.log('Original Content:', content);

// Define the markers
const startMarker = '<!-- Start Button -->';
const endMarker = '<!-- End Button -->';

// Find the section to replace
const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
  // Extract the link within the markers
  const sectionContent = content.slice(startIndex + startMarker.length, endIndex).trim();
  const regex = /\[(.*?)\]\((.*?)\)/;
  const match = sectionContent.match(regex);

  if (match) {
    const scriptName = match[1].split('/').pop();
    const scriptUrl = match[2].replace('github.com', 'raw.githubusercontent.com').replace('blob/', '');
    const buttonHtml = `
<span class="page-button-container">
  <button data-script-name="${scriptName}" onclick="fetchAndDisplayScript('script-content-${scriptName}', '${scriptUrl}', this)" class="page-button">Show ${scriptName}</button>
</span>
<div id="script-content-${scriptName}" style="display:none; white-space: pre-wrap;"></div>
`;

    // Replace the section with the desired content and remove markers
    const newContent = content.slice(0, startIndex) +
                       buttonHtml +
                       content.slice(endIndex + endMarker.length);
    
    // Write the updated content back to README.md
    fs.writeFileSync(readmePath, newContent, 'utf8');
    console.log('Updated Content:', newContent);

    // Write the updated content to an output file for debugging purposes
    const outputPath = 'output.md';
    fs.writeFileSync(outputPath, newContent, 'utf8');
    core.setOutput('new-content-path', outputPath);
  }
} else {
  console.log("Markers not found in the content.");
}

