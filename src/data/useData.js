import sample from './sample.json';
import { fetchRemoteSeason } from './remote';

const LS_KEY = 'seasonDiaryData';
const RELOAD_FLAG = 'seasonDiaryReloading';

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
  try{
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return mergeBase(sample, JSON.parse(raw));
  }catch{}
  return sample;
}

export function saveData(data){ localStorage.setItem(LS_KEY, JSON.stringify(data)); }
export function clearData(){ localStorage.removeItem(LS_KEY); }

function getCacheRaw(){
  try{ const raw = localStorage.getItem(LS_KEY); return raw ? JSON.parse(raw) : null; }
  catch{ return null; }
}
const serialise = obj => JSON.stringify(obj);

// Called on app load
export async function ensureRemote(seasonId='2025'){
  try{
    const remote = await fetchRemoteSeason(seasonId);
    if (!remote) return;

    // Accept either { athletes:[...] } or { json:"..." }
    const parsed = remote.athletes ? remote
                 : remote.json ? JSON.parse(remote.json)
                 : null;
    if (!parsed || !Array.isArray(parsed.athletes)) return;

    const cached = getCacheRaw();
    if (cached && serialise(cached) === serialise(parsed)) return;

    saveData(parsed);
    localStorage.setItem('seasonDiarySource','cloud');
    localStorage.setItem('seasonDiaryLastRemoteAt', String(Date.now()));

    if (!sessionStorage.getItem(RELOAD_FLAG)) {
      sessionStorage.setItem(RELOAD_FLAG, '1');
      window.location.reload();
    } else {
      sessionStorage.removeItem(RELOAD_FLAG);
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
