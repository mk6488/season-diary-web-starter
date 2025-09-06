import sample from './sample.json';          // used only as a temporary placeholder
import { fetchRemoteSeason } from './remote';
import { CURRENT_SEASON_ID } from './constants';

let currentData = sample;                     // in-memory only (no localStorage)
const SESSION_HASH_KEY = 'seasonDiaryHash';   // session-only guards (not your data)
const SESSION_RELOADED = 'seasonDiaryReloaded';
const SESSION_LAST_REMOTE_AT = 'seasonDiaryLastRemoteAt';
const SESSION_SHOW_TOAST = 'seasonDiaryShowToast';

const serialise = obj => JSON.stringify(obj);

// App pages read from this in-memory copy
export function loadData(){ return currentData; }
export function getAthletes(){ return loadData().athletes }
export function getAthlete(id){ return loadData().athletes.find(a=>a.id===id) }
let memo = { key:'', rows:[] };
export function getTests(){
  const data = loadData();
  const key = serialise(data);
  if (memo.key === key) return memo.rows;
  const rows=[];
  for(const a of data.athletes){
    for(const t of a.tests){ rows.push({ athlete:a.name, id:a.id, focus:a.focus, ...t }) }
  }
  memo = { key, rows: rows.sort((a,b)=> (a.date<b.date?1:-1)) };
  return memo.rows;
}

// On app load: fetch Firestore. If data changed vs last session, do one reload.
// Either way, set currentData = remote so the UI shows cloud data.
export async function ensureRemote(seasonId=CURRENT_SEASON_ID){
  try{
    const remote = await fetchRemoteSeason(seasonId);
    if (!remote) return;

    const parsed = remote.athletes ? remote
                 : remote.json ? JSON.parse(remote.json)
                 : null;
    if (!parsed || !Array.isArray(parsed.athletes)) return;

    currentData = parsed;

    const newHash = serialise(parsed);
    const prevHash = sessionStorage.getItem(SESSION_HASH_KEY);

    // stamp a session time for the (optional) badge
    sessionStorage.setItem(SESSION_LAST_REMOTE_AT, String(Date.now()));

    if (newHash !== prevHash) {
      sessionStorage.setItem(SESSION_HASH_KEY, newHash);
      if (!sessionStorage.getItem(SESSION_RELOADED)) {
        // Flag a toast to inform the user after the reload
        sessionStorage.setItem(SESSION_SHOW_TOAST, '1');
        sessionStorage.setItem(SESSION_RELOADED, '1');
        window.location.reload();
      } else {
        sessionStorage.removeItem(SESSION_RELOADED);
      }
    }
  }catch(e){
    console.warn('Firestore fetch failed', e);
  }
}
