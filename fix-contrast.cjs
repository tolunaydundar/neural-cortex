const fs = require('fs');
const path = require('path');

const filesToFix = [
  'src/pages/NoteDetail.tsx',
  'src/pages/Notes.tsx',
  'src/components/NoteCard.tsx',
  'src/components/TipTapEditor.tsx'
];

filesToFix.forEach(relPath => {
  const fullPath = path.join(__dirname, relPath);
  if (!fs.existsSync(fullPath)) return;
  
  let content = fs.readFileSync(fullPath, 'utf8');

  // Replace hardcoded white borders with adaptive on-surface borders
  content = content.replace(/border-white\/5/g, 'border-on-surface/10');
  content = content.replace(/border-white\/10/g, 'border-on-surface/20');
  
  // Replace hardcoded white backgrounds
  content = content.replace(/bg-white\/5/g, 'bg-on-surface/5');
  content = content.replace(/bg-white\/10/g, 'bg-on-surface/10');
  content = content.replace(/bg-white\/20/g, 'bg-on-surface/20');
  
  // Replace hardcoded text-white
  content = content.replace(/text-white/g, 'text-on-surface');
  
  // Increase contrast on text opacities
  content = content.replace(/text-on-surface-variant\/10/g, 'text-on-surface-variant/40');
  content = content.replace(/text-on-surface-variant\/20/g, 'text-on-surface-variant/50');
  content = content.replace(/text-on-surface-variant\/30/g, 'text-on-surface-variant/60');
  content = content.replace(/text-on-surface-variant\/40/g, 'text-on-surface-variant/70');
  content = content.replace(/text-on-surface-variant\/50/g, 'text-on-surface-variant/80');

  // Specific placeholders
  content = content.replace(/placeholder:text-on-surface-variant\/20/g, 'placeholder:text-on-surface-variant/50');
  content = content.replace(/placeholder:text-on-surface-variant\/30/g, 'placeholder:text-on-surface-variant/50');

  fs.writeFileSync(fullPath, content, 'utf8');
});

console.log("Contrast fixes applied!");
