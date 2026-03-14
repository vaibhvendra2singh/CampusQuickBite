const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, 'frontend/src');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
          results.push(file);
      }
    }
  });
  return results;
}

const files = walk(targetDir);

const durationRegexes = [
    { pattern: /\bduration-1000\b/g, replace: 'duration-150' },
    { pattern: /\bduration-700\b/g, replace: 'duration-150' },
    { pattern: /\bduration-500\b/g, replace: 'duration-150' },
    { pattern: /\bduration-300\b/g, replace: 'duration-150' },
    { pattern: /\bduration-200\b/g, replace: 'duration-150' }
];

const animationRegexes = [
    { pattern: /\banimate-fade-in\b/g, replace: 'animate-none' },
    { pattern: /\banimate-slide-up\b/g, replace: 'animate-none' },
    { pattern: /\banimate-pulse-soft\b/g, replace: 'animate-none' }
];

let changedFiles = 0;

files.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  durationRegexes.forEach(({pattern, replace}) => {
      content = content.replace(pattern, replace);
  });

  animationRegexes.forEach(({pattern, replace}) => {
      content = content.replace(pattern, replace);
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    changedFiles++;
  }
});

console.log(`UI Speed Optimization complete. Modified ${changedFiles} files with faster transitions.`);
