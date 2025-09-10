const fs = require('fs');
const path = require('path');

const commandNames = new Map();

function scanDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      scanDirectory(fullPath);
    } else if (file.endsWith('.js')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const match = content.match(/\.setName\(['"`](.*?)['"`]\)/);
      if (match) {
        const name = match[1];
        if (commandNames.has(name)) {
          console.log(`❌ Duplicate command name: "${name}" in ${fullPath} and ${commandNames.get(name)}`);
        } else {
          commandNames.set(name, fullPath);
        }
      }
    }
  }
}

scanDirectory('./commands');
