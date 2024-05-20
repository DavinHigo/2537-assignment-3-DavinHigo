const ejs = require('ejs');
const fs = require('fs');
const path = require('path');

// Define the path to your EJS template and the output HTML file
const templatePath = path.join(__dirname, 'views', 'index.ejs');
const outputPath = path.join(__dirname, 'public', 'index.html');

// Render the EJS template to HTML
ejs.renderFile(templatePath, {}, (err, str) => {
  if (err) {
    console.error('Error rendering EJS template:', err);
    process.exit(1);
  }

  // Write the rendered HTML to the output file
  fs.writeFileSync(outputPath, str);
  console.log('EJS template rendered to HTML successfully');
});
