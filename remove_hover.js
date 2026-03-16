const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Replace any Tailwind class starting with hover: or group-hover:
  // We'll replace matching words
  
  const rules = [
    // words that start with hover:
    /\bhover:[^\s'"`]+/g,
    /\bgroup-hover:[^\s'"`]+/g,
    // match Framer motion whileHover prop
    /whileHover=\{[^\}]+\}/g
  ];

  for (let rule of rules) {
    content = content.replace(rule, '');
  }

  // Also remove some specific CSS overrides
  if (filePath.endsWith('.css')) {
    content = content.replace(/\.[\w-]+\:hover\s*{[^}]*}/g, '');
    content = content.replace(/\.btn-primary:hover\s*{[^}]*}/g, '');
    content = content.replace(/\.btn-secondary:hover\s*{[^}]*}/g, '');
    content = content.replace(/::-webkit-scrollbar-thumb:hover\s*{[^}]*}/g, '');
    content = content.replace(/\.card-modern:hover\s*{[^}]*}/g, '');
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Processed', filePath);
  }
}

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    if (fs.statSync(dirPath).isDirectory()) {
      walk(dirPath, callback);
    } else {
      callback(dirPath);
    }
  });
}

try {
    walk('./frontend/src', function(filePath) {
      if (filePath.endsWith('.tsx') || filePath.endsWith('.ts') || filePath.endsWith('.jsx') || filePath.endsWith('.js') || filePath.endsWith('.css')) {
         processFile(filePath);
      }
    });
    console.log("Done");
} catch(e) {
    console.error(e);
}
