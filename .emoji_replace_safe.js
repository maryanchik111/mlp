const fs = require('fs');
const path = require('path');
const emojiRegex = /\p{Extended_Pictographic}/gu;
const allowedExt = new Set(['.js','.jsx','.ts','.tsx','.json','.md','.html','.txt','.css','.mjs','.map']);
const includePaths = ['src','public','scripts','README.md','SETUP.md','database.rules.json','package.json'];
function isBinaryLike(name){ const binExt = ['.png','.jpg','.jpeg','.gif','.ico','.woff2','.dll','.node','.exe']; return binExt.some(e=>name.endsWith(e)); }
function processFile(full){
  try{
    const text = fs.readFileSync(full, 'utf8');
    if(emojiRegex.test(text)){
      const replaced = text.replace(emojiRegex, 'icons');
      fs.writeFileSync(full, replaced, 'utf8');
      console.log('Replaced emojis in', full);
    }
  }catch(e){ }
}
function scanDir(base){
  if(!fs.existsSync(base)) return;
  const st = fs.statSync(base);
  if(st.isFile()){
    if(isBinaryLike(base)) return;
    const ext = path.extname(base).toLowerCase();
    if(allowedExt.has(ext) || includePaths.includes(path.basename(base))) processFile(base);
    return;
  }
  for(const name of fs.readdirSync(base, { withFileTypes: true })){
    const full = path.join(base, name.name);
    if(name.isDirectory()){
      if(full.includes('node_modules') || full.includes('.next') || full.includes('.git')) continue;
      scanDir(full);
    }else{
      const ext = path.extname(name.name).toLowerCase();
      if(isBinaryLike(name.name)) continue;
      if(allowedExt.has(ext) || includePaths.includes(name.name)) processFile(full);
    }
  }
}
for(const p of includePaths){
  const fp = path.join(process.cwd(), p);
  scanDir(fp);
}
scanDir(path.join(process.cwd(),'src'));
scanDir(path.join(process.cwd(),'public'));
scanDir(path.join(process.cwd(),'scripts'));
console.log('Done');
