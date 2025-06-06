// This is a placeholder script to document how to generate a favicon.ico from SVG
// In a real environment, you would use a package like 'svg2png' and 'to-ico'

console.log('To generate favicon.ico from SVG:');
console.log('1. Install the required packages: npm install svg2png to-ico');
console.log('2. Use a script like this:');
console.log(`
const fs = require('fs');
const svg2png = require('svg2png');
const toIco = require('to-ico');

// Convert SVG to PNG
const svgBuffer = fs.readFileSync('./public/images/osroom/favicon-color.svg');
svg2png(svgBuffer, { width: 16, height: 16 })
  .then(pngBuffer16 => {
    svg2png(svgBuffer, { width: 32, height: 32 })
      .then(pngBuffer32 => {
        svg2png(svgBuffer, { width: 48, height: 48 })
          .then(pngBuffer48 => {
            // Convert PNG buffers to ICO
            toIco([pngBuffer16, pngBuffer32, pngBuffer48])
              .then(icoBuffer => {
                fs.writeFileSync('./public/favicon.ico', icoBuffer);
                console.log('favicon.ico created successfully!');
              })
              .catch(err => console.error('Error creating ICO:', err));
          })
          .catch(err => console.error('Error creating PNG:', err));
      })
      .catch(err => console.error('Error creating PNG:', err));
  })
  .catch(err => console.error('Error creating PNG:', err));
`);
console.log('3. Run the script with: node scripts/generate-favicon.js'); 