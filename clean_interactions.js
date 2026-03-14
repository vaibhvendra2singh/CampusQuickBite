const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, 'frontend/src');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function (file) {
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

const regexesToRemove = [
    /\bhover:scale-(x|y)?-\[?[0-9.]+\]?\b/g,
    /\bactive:scale-(x|y)?-\[?[0-9.]+\]?\b/g,
    /\bgroup-hover:scale-(x|y)?-\[?[0-9.]+\]?\b/g,
    /\bscale-(x|y)?-\[?[0-9.]+\]?\b/g, // Might be risky if it's meant to be static, but let's be careful. Wait, I should not remove all scale, only interactive or animated ones. Let's stick to hover/active/group-hover scale and transform.
    /\bhover:-?translate-[xy]-\[?[0-9.]+\]?\b/g,
    /\bgroup-hover:-?translate-[xy]-\[?[0-9.]+\]?\b/g,
    /\bactive:-?translate-[xy]-\[?[0-9.]+\]?\b/g,
    /\btransition-transform\b/g,
    /\btransform\b/g,
    /\banimate-bounce\b/g,
    /\banimate-ping\b/g,
    /\banimate-bounce-slow\b/g,
    /\banimate-shake\b/g,
    /\bhover:-?translate-y-[0-9]+\b/g,
    /\bhover:-?translate-x-[0-9]+\b/g,
    /\bgroup-hover:-?translate-y-[0-9]+\b/g,
    /\bgroup-hover:-?translate-x-[0-9]+\b/g,
];

// Let's replace 'scale-90', 'scale-95' etc if they are attached to hover/active.
const interactiveScaleRegex = /\b(?:hover|active|group-hover|focus):scale-\[?[0-9.]+\]?\b/g;
const transformRegex = /\btransform\b/g;
const transitionTransformRegex = /\btransition-transform\b/g;
const bouncePingRegex = /\banimate-(bounce|ping|shake|bounce-slow)\b/g;
const translateRegex = /\b(?:hover|active|group-hover|focus):-?translate-[xy]-\[?[0-9.]+\]?\b/g;

const durationRegexes = [
    { pattern: /\bduration-1000\b/g, replace: 'duration-200' },
    { pattern: /\bduration-700\b/g, replace: 'duration-200' },
    { pattern: /\bduration-500\b/g, replace: 'duration-200' },
    { pattern: /\bduration-300\b/g, replace: 'duration-200' }
];

let changedFiles = 0;

files.forEach(filePath => {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;

    content = content.replace(interactiveScaleRegex, '');
    content = content.replace(transformRegex, '');
    content = content.replace(transitionTransformRegex, '');
    content = content.replace(bouncePingRegex, '');
    content = content.replace(translateRegex, '');

    durationRegexes.forEach(({ pattern, replace }) => {
        content = content.replace(pattern, replace);
    });

    // Clean up any double spaces introduced by removing classes
    content = content.replace(/ +/g, ' ');
    // Clean up trailing spaces before quote in className e.g. className="foo " -> className="foo"
    content = content.replace(/ \"/g, '"');

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        changedFiles++;
    }
});

console.log(`Cleanup complete. Modified ${changedFiles} files.`);
