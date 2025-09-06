import sample from './sample.json';
import { fetchRemoteSeason } from './remote';

const LS_KEY = 'seasonDiaryData';

function mergeBase(base, local){
  if (!local) return base;
  const byId = Object.fromEntries(base.athletes.map(a => [a.id, a]));
  const merged = (local.athletes || []).map(a => {
    const seed = byId[a.id] || {};
    return { ...seed, ...a, tests: a.tests ?? seed.tests ?? [] };
  });
  for (const a of base.athletes) if (!merged.find(x => x.id === a.id)) merged.push(a);
  return { athletes: merged };
}

export function loadData(){
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return mergeBase(sample, JSON.parse(raw));
  } catch {}
  return sample;
}

export function saveData(data){ localStorage.setItem(LS_KEY, JSON.stringify(data)); }
export function clearData(){ localStorage.removeItem(LS_KEY); }

export async function ensureRemote(seasonId='2025'){
  try{
    const remote = await fetchRemoteSeason(seasonId);
    if (!remote) return;
    const parsed = remote.athletes ? remote
                 : remote.json ? JSON.parse(remote.json)
                 : null;
    if (parsed && parsed.athletes) {
      saveData(parsed);
      window.location.reload();
    }
  }catch(e){
    console.warn('Firestore fetch failed', e);
  }
}

export function getAthletes(){ return loadData().athletes }
export function getAthlete(id){ return loadData().athletes.find(a=>a.id===id) }
export function getTests(){
  const rows=[]; for(const a of loadData().athletes){ for(const t of a.tests){ rows.push({ athlete:a.name, id:a.id, ...t }) } }
  return rows.sort((a,b)=> (a.date<b.date?1:-1));
}
