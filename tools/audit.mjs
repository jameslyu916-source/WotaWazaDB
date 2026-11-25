import { DatabaseSync } from 'node:sqlite';
import { writeFileSync } from 'node:fs';

const db = new DatabaseSync(process.argv[2], { readOnly: true });
const wiki = db.prepare('SELECT title, content_raw FROM skills ORDER BY title').all();
const times = db.prepare('SELECT title, creator, source_url FROM skills_times ORDER BY title').all();
// Match only plain, single-line template values for identity hints. Keep raw credits.
function field(raw, name) {
  return raw.match(new RegExp('^\\|'+name+'=([^\\r\\n]*)','m'))?.[1].trim() || null;
}
const key = s => s.normalize('NFKC').trim().toLowerCase();
const candidates = times.map(row => ({
  title: row.title, timesCredit: row.creator, source: row.source_url,
  wikiMatches: wiki.filter(w => [w.title, field(w.content_raw,'原')].some(v => v && key(v) === key(row.title)))
    .map(w => ({title:w.title, original:field(w.content_raw,'原'), wikiCredit:field(w.content_raw,'作成者'), wikiHonke:field(w.content_raw,'本家')}))
}));
const report = {wikiRows:wiki.length, timesRows:times.length,
  exactTitles:times.filter(t => wiki.some(w=>w.title===t.title)).length,
  matchedTimesRows:candidates.filter(c=>c.wikiMatches.length).length,
  missingTimesCredits:times.filter(t=>!t.creator?.trim()).length,
  mixedCredits:times.filter(t=>/読み方|英語名/.test(t.creator)).map(t=>t.title),
  candidates};
writeFileSync('legacy-audit.json', JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({...report,candidates:undefined}));
db.close();
