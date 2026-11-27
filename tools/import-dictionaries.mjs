import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync,writeFileSync} from 'node:fs';
const db=new DatabaseSync(process.argv[2],{readOnly:true});
const existing=readdirSync('entries').filter(f=>f.endsWith('.yaml')).map(f=>JSON.parse(readFileSync('entries/'+f)));
const rows=[], held=[];
const norm=s=>s.normalize('NFKC').trim().toLowerCase();
function clean(value=''){
  const text=value.replace(/&(?:nbsp|#0*160|#x0*a0);/gi,' ').replace(/<ref\b[^>]*(?:\/>|>[\s\S]*?<\/ref>)/gi,'').replace(/\{\{([^{}|]+)\}\}/g,'$1').replace(/\[\[(?:[^|\]]+\|)?([^\]]+)\]\]/g,'$1').trim();
  return /[{}<>|[\]]/.test(text)||/^(?:未明|不明|未知|同上)$/.test(text)?'':text;
}
const field=(s,k)=>clean(s.match(new RegExp('^\\|'+k+'\\s*=([^\\n\\r]*)','m'))?.[1]);
const known={Perikan:'ペリカン',Gear:'ギア',Yuukichi:'ゆーきち','I-Jack':'藍弱',Miza:'みざ',Latte:'らて'};
function take(row){
  const found=existing.filter(e=>norm(e.name)===norm(row.name));
  const prior=rows.filter(e=>norm(e.name)===norm(row.name));
  const match=[...found,...prior].find(e=>e.sources?.some(s=>s.url===row.source)||e.source===row.source||e.creators.some(c=>row.creators.includes(c)));
  if((found.length||prior.length)&&!match){held.push([row.name,row.source]);return;}
  if(match?.id?.startsWith('w0') && match.sources){
    row.target=match.id;
  }else if(match){row.target=match.target||match.id;}
  rows.push(row);
}
for(const r of db.prepare('select * from skills_times order by id').all()){
  const u=r.youtube_url?.replace(/^\/\//,'https://');
  let videos=[];
  if(u && /^https?:\/\/(?:www\.)?youtube\.com\/embed\/[\w-]+/.test(u)){
    const link=new URL(u),t=link.searchParams.get('start');
    videos=['https://www.youtube.com/watch?v='+link.pathname.split('/').pop()+(t?'&t='+t+'s':'')];
  }
  take({id:'t'+r.id,name:r.title,reading:r.reading,aliases:[r.creator?.match(/英語名：(.+)$/)?.[1]].filter(Boolean),creators:(clean((r.creator||'').split(/読み方：|英語名：|現本家：/)[0])).split(/\s*、\s*/).filter(Boolean),honke:r.creator?.match(/現本家：(.+)/)?.[1]||'',source:r.source_url,videos});
}
for(const r of db.prepare('select * from skills order by id').all()){
  if(/^模板:/.test(r.title))continue;
  const raw=r.content_raw;
  const name=field(raw,'原')||r.title.split('〈')[0];
  if(!name){held.push([r.title,'title']);continue;}
  const creators=field(raw,'作成者').split(/\s*[&＆⧸]\s*/).filter(Boolean).map(c=>known[c]||c);
  const videos=[];
  for(const line of raw.split('\n').filter(l=>l.includes('{{参考'))){
    const urls=[...line.matchAll(/https?:\/\/(?:www\.bilibili\.com\/video\/|youtu\.be\/|www\.youtube\.com\/watch\?v=|(?:x|twitter)\.com\/)[^\s|{}<>\]"]+/g)].map(m=>m[0]);
    const url=urls.at(-1);
    if(url && !videos.includes(url))videos.push(url);
  }
  const h=field(raw,'本家');
  take({id:'h'+r.id,name,reading:field(raw,'读音'),aliases:[field(raw,'中'),field(raw,'音')].filter(v=>v&&v!==name),creators,honke:known[h]||h||(/^\|本家=同上\s*$/m.test(raw)?creators.join('、'):''),source:'https://wotagei.huijiwiki.com/wiki/'+encodeURIComponent(r.title),videos});
}
writeFileSync('docs/catalog.js','const dictionaryRows='+JSON.stringify(rows).replaceAll('<','\\u003c')+';\n');
writeFileSync('legacy-holds.json',JSON.stringify(held,null,2)+'\n');
console.log({sourceRows:rows.length,newEntries:rows.filter(r=>!r.target).length,held:held.length,withVideo:rows.filter(r=>r.videos.length).length});

