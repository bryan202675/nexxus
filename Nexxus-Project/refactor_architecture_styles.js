const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.tsx')) results.push(file);
    }
  });
  return results;
}

const files = walk('app/src/presentation/screens');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf-8');
  let original = content;

  // Add the round blurred NavBar everywhere
  const appBarRegex = /(appBar:\s*\{)([^}]*)(\})/;
  content = content.replace(appBarRegex, (match, p1, p2, p3) => {
    let newMatch = p2;
    newMatch = newMatch.replace(/paddingHorizontal:\s*[^,]+,/, 'paddingHorizontal: ESPACIADO.lg,');
    newMatch = newMatch.replace(/backgroundColor:\s*[^,]+,/, '');
    newMatch = newMatch.replace(/borderBottomWidth:\s*[^,]+,/, '');
    newMatch = newMatch.replace(/borderBottomColor:\s*[^,]+,/, '');
    
    if (!newMatch.includes('borderRadius:')) {
      newMatch += `  borderRadius: RADIOS.xxl, marginHorizontal: ESPACIADO.md, marginTop: Platform.OS === 'ios' ? 0 : ESPACIADO.md, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.4)', overflow: 'hidden', backgroundColor: 'transparent', `;
    } else {
      newMatch = newMatch.replace(/borderRadius:\s*[^,]+,/, 'borderRadius: RADIOS.xxl,');
    }
    return p1 + newMatch + p3;
  });

  if (content !== original && !content.includes('Platform.OS')) {
     content = content.replace(/import \{/i, 'import { Platform, ');
  }

  // Restore the white backgrounds with fade effect
  content = content.replace(/backgroundColor:\s*'#fff'/g, "backgroundColor: 'rgba(255, 255, 255, 0.92)'");
  content = content.replace(/backgroundColor:\s*'rgba\(255,\s*255,\s*255,\s*0\.7\)'/g, "backgroundColor: 'rgba(255, 255, 255, 0.92)'");
  content = content.replace(/backgroundColor:\s*'rgba\(255,\s*255,\s*255,\s*0\.85\)'/g, "backgroundColor: 'rgba(255, 255, 255, 0.92)'");
  content = content.replace(/backgroundColor:\s*'rgba\(255,\s*255,\s*255,\s*0\.8\)'/g, "backgroundColor: 'rgba(255, 255, 255, 0.92)'");

  // Fix BlurView usage to be consistent
  content = content.replace(/<BlurView intensity=\{70\} tint="light"/g, '<BlurView intensity={40} tint="light"');
  content = content.replace(/<BlurView intensity=\{50\} tint="transparent"/g, '<BlurView intensity={40} tint="light"');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf-8');
    console.log('Updated', file);
  }
});
