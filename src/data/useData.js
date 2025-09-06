import sample from './sample.json';
const LS_KEY = 'seasonDiaryData';

export function loadData(){
  try{
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  }catch(e){}
  return sample;
}
export function saveData(data){ localStorage.setItem(LS_KEY, JSON.stringify(data)); }
export function clearData(){ localStorage.removeItem(LS_KEY); }

export function getAthletes(){ return loadData().athletes }
export function getAthlete(id){ return loadData().athletes.find(a=>a.id===id) }
export function getTests(){
  const rows = [];
  for (const a of loadData().athletes){
    for (const t of a.tests){ rows.push({ athlete:a.name, id:a.id, ...t }); }
  }
  return rows.sort((a,b)=> (a.date < b.date ? 1 : -1));
}
