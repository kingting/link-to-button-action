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


// Get the path to the input file (README.md by default)
const inputFilePath = getEnvVariable('input-file', 'README.md');

// Get the path to the output file (index.md by default)
const outputFilePath = getEnvVariable('output-file', 'index.md');

if (!inputFilePath) {
  core.setFailed("The 'input-file' input is required and not set.");
  process.exit(1);
} else {
  console.log(`The path to the input file is: ${inputFilePath}`);
}

if (!outputFilePath) {
  core.setFailed("The 'output-file' input is required and not set.");
  process.exit(1);
} else {
  console.log(`The path to the output file is: ${outputFilePath}`);
}

// Read the Markdown file
let content = fs.readFileSync(inputFilePath, 'utf8');
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
    
    // Write the updated content back to output file
    fs.writeFileSync(outputFilePath, newContent, 'utf8');
    console.log('Updated Content:', newContent);

    // Set the output path for the action
    core.setOutput('new-content-path', outputFilePath);
  }
} else {
  console.log("Markers not found in the content.");
}

