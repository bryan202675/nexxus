const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

const dirToScan = path.join(__dirname, 'apps/mobile/src');
const filesToProcess = [];

walkDir(dirToScan, (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    filesToProcess.push(filePath);
  }
});

filesToProcess.push(path.join(__dirname, 'apps/mobile/App.tsx'));

let totalFixed = 0;

filesToProcess.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Find import of SafeAreaView from react-native
  // The regex finds: import { ..., SafeAreaView, ... } from 'react-native';
  const importRegex = /import\s+({[^}]*})\s+from\s+['"]react-native['"];/g;
  
  let modified = false;
  let newContent = content.replace(importRegex, (match, importsStr) => {
    if (importsStr.includes('SafeAreaView')) {
      modified = true;
      let newImportsStr = importsStr.replace(/\bSafeAreaView\b,?\s*/g, '');
      // Clean up empty imports or trailing commas
      newImportsStr = newImportsStr.replace(/,\s*}/, '}').replace(/{\s*,/, '{').replace(/{\s*}/, '');
      
      if (newImportsStr.trim() === '') {
        return ''; // remove the import entirely
      }
      return `import ${newImportsStr} from 'react-native';`;
    }
    return match;
  });

  if (modified) {
    // Add the import from react-native-safe-area-context
    const rnsacImport = `import { SafeAreaView } from 'react-native-safe-area-context';\n`;
    
    // Find the last import to append or put at top
    if (newContent.includes('import ')) {
      newContent = newContent.replace(/import .*\n/, (match) => rnsacImport + match);
    } else {
      newContent = rnsacImport + newContent;
    }
    
    fs.writeFileSync(filePath, newContent, 'utf-8');
    totalFixed++;
    console.log(`Fixed: ${filePath}`);
  }
});

console.log(`Total files fixed: ${totalFixed}`);
