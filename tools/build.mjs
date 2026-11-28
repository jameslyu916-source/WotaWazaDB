import { mkdirSync, readdirSync, readFileSync, writeFileSync, renameSync } from 'node:fs';
const dir = new URL('../entries/',import.meta.url);
const read = f => JSON.parse(readFileSync(new URL(f,dir),'utf8'));
const files = readdirSync(dir).filter(f=>f.endsWith('.yaml')).sort();
const entries = files.map(f=>{
  const e=read(f);
  if(f!==e.id+'.yaml' || !/^w\d{4}$/.test(e.id) || !['pending','approved'].includes(e.status) || !e.name || !e.sources.length) throw Error(f);
  for(const ref of [...e.sources,...e.videos,...(e.pendingVideos ?? [])]) if(!/^https?:$/.test(new URL(ref.url).protocol)) throw Error('Invalid URL '+f);
  if(e.creation && (!e.creation.date || !e.sources.some(s=>s.url===e.creation.source) || !e.creation.evidence)) throw Error('Missing creation evidence '+f);
  return e;
});
if(process.argv[2]==='approve'){
  const e=entries.find(e=>e.id===process.argv[3]);
  if(!e) throw Error('Unknown entry');
  if(e.status==='pending'){
    e.status='approved';
    e.updated=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Berlin'}).format(new Date());
    const dest=new URL(e.id+'.yaml',dir), tmp=new URL(e.id+'.tmp',dir);
    writeFileSync(tmp,JSON.stringify(e,null,2)+'\n',{flag:'wx'});renameSync(tmp,dest);
  }
}
const template=readFileSync(new URL('../site.html',import.meta.url),'utf8');
for(const review of [true,false]){
  const data=entries.filter(e=>review ? e.status==='pending' || e.pendingVideos?.length : e.status==='approved').map(({pendingVideos=[],...entry})=>{
    if(review) entry.videos=[...entry.videos,...pendingVideos.map(v=>({...v,pending:true}))];
    return entry;
  });
  const html=template.replace('<!--DICTIONARIES-->',review?'':'<script src="docs/catalog.js"></script>').replace('@@HAN@@',readFileSync(new URL('./han-pairs.txt',import.meta.url),'utf8')).replace('@@MODE@@',review?'review':'public').replace('/*DATA*/[]',()=>JSON.stringify(data).replaceAll('<','\\u003c'));
  writeFileSync(new URL(review?'../review.html':'../index.html',import.meta.url),html);
  if(!review){
    mkdirSync(new URL('../docs/',import.meta.url),{recursive:true});
    const deployed=html.replace('src="docs/catalog.js"','src="catalog.js"');
    writeFileSync(new URL('../docs/index.html',import.meta.url),deployed);
    for(const style of ['folio','studio','index']){
      const preview=deployed.replace('<body data-style="studio"><main>', '<body data-style="'+style+'"><main>');
      writeFileSync(new URL('../docs/preview-'+style+'.html',import.meta.url),preview);
    }
  }
}
console.log(entries.length+' entries, '+entries.filter(e=>e.status==='approved').length+' approved');
const catalog = readFileSync(new URL('../docs/catalog.js', import.meta.url), 'utf8').trim();
const dictionaryRows = JSON.parse(catalog.slice('const dictionaryRows='.length, -1));
const ids = new Set(entries.filter(e => e.status === 'approved').map(e => e.id));
for (const row of dictionaryRows) ids.add(row.target || row.id);
const readmePath = new URL('../README.md', import.meta.url);
const readme = readFileSync(readmePath, 'utf8');
const updatedReadme = readme.replace(/(<!-- public-count -->)\d+(<!-- \/public-count -->)/, (_, start, end) => start + ids.size + end);
if (updatedReadme !== readme) writeFileSync(readmePath, updatedReadme);
