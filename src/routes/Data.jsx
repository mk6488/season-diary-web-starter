import React, { useEffect, useRef, useState } from 'react';
import { publishSeason, fetchRemoteSeason, publishTest, renameAthleteId, renameTestId, renameTestDoc } from '../data/remote';
import { CURRENT_SEASON_ID } from '../data/constants';
import { auth } from '../firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';

export default function Data(){
  const [cloudText, setCloudText] = useState('');   // latest cloud JSON string (for download)
  const [cloudData, setCloudData] = useState(null); // latest cloud parsed
  const [uploaded, setUploaded] = useState(null);   // last uploaded parsed JSON
  const [uploadInfo, setUploadInfo] = useState(''); // summary or error
  const [msg, setMsg] = useState('');
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const fileRef = useRef(null);
  // manual entry state
  const [mId, setMId] = useState('');
  const [mName, setMName] = useState('');
  const [mType, setMType] = useState('1k@24');
  const [mDate, setMDate] = useState('');
  const [mTime, setMTime] = useState('');
  const [mSplit, setMSplit] = useState('');
  const [mRate, setMRate] = useState('');
  const [mValue, setMValue] = useState('');
  const [mUnit, setMUnit] = useState('');
  const [oldId, setOldId] = useState('');
  const [newId, setNewId] = useState('');
  const [newName, setNewName] = useState('');
  const [tOldId, setTOldId] = useState('');
  const [tNewId, setTNewId] = useState('');

  // Auth state
  useEffect(() => onAuthStateChanged(auth, u => setUser(u)), []);

  // Always fetch current cloud JSON on mount (to power downloads and validation)
  useEffect(() => {
    (async () => {
      try{
        const remote = await fetchRemoteSeason(CURRENT_SEASON_ID);
        const parsed = remote?.athletes ? remote
                     : remote?.json ? JSON.parse(remote.json)
                     : { athletes: [] };
        setCloudData(parsed);
        setCloudText(JSON.stringify(parsed, null, 2));
      }catch(e){
        setMsg('Could not load cloud data: ' + e.message);
      }
    })();
  }, []);

  // Actions
  async function onPublish(){
    try{
      if (!user) throw new Error('Please sign in first.');
      if (!uploaded) throw new Error('Please upload a JSON file first.');
      const errors = validateSeason(uploaded);
      if (errors.length) throw new Error('Invalid JSON: ' + errors[0]);
      const merged = mergeSeason(cloudData || { athletes: [] }, uploaded);
      await publishSeason(CURRENT_SEASON_ID, merged, { uid: user.uid, email: user.email });
      setMsg('Published to Firestore ✓ — everyone will see this after reload.');
      setUploaded(null); setUploadInfo('');
    }catch(e){
      setMsg('Publish error: ' + e.message);
    }
  }
  function onDownload(){
    try{
      const blob = new Blob([cloudText || '{}'], {type:'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'season-diary-data.json'; a.click();
      URL.revokeObjectURL(url);
    }catch(e){ setMsg('Download error: ' + e.message); }
  }
  function onUpload(e){
    const f = e.target.files?.[0]; if(!f) return;
    const r = new FileReader();
    r.onload = () => {
      try{
        const raw = String(r.result);
        const parsed = JSON.parse(raw);
        const errors = validateSeason(parsed);
        if (errors.length){
          setUploaded(null);
          setUploadInfo('Invalid JSON: ' + errors[0]);
        } else {
          const athletes = Array.isArray(parsed.athletes) ? parsed.athletes.length : 0;
          const tests = Array.isArray(parsed.athletes) ? parsed.athletes.reduce((n,a)=> n + (Array.isArray(a.tests)?a.tests.length:0), 0) : 0;
          setUploaded(parsed);
          setUploadInfo(`Ready ✓ — ${athletes} athletes, ${tests} tests`);
        }
      }catch(err){
        setUploaded(null);
        setUploadInfo('Upload error: invalid JSON');
      }
    };
    r.readAsText(f);
  }

  async function onLogin(e){
    e.preventDefault();
    try{
      await signInWithEmailAndPassword(auth, email, password);
      setMsg('Signed in ✓'); setEmail(''); setPassword('');
    }catch(e){ setMsg('Sign-in error: ' + e.message); }
  }
  async function onLogout(){ await signOut(auth); setMsg('Signed out.'); }

  return (
    <div className="card">
      <h2>Data Manager</h2>
      <p className="small">
        The site reads <strong>directly from Firestore</strong>. Sign in to publish updates.
      </p>

      {/* Auth box */}
      <div className="card" style={{padding:12, marginBottom:12}}>
        {user ? (
          <div style={{display:'flex', gap:8, alignItems:'center', flexWrap:'wrap'}}>
            <span className="small">Signed in as <strong>{user.email}</strong></span>
            <button onClick={onLogout}>Sign out</button>
          </div>
        ) : (
          <form onSubmit={onLogin} style={{display:'flex', gap:8, flexWrap:'wrap', alignItems:'center'}}>
            <input required placeholder="Coach email" value={email} onChange={e=>setEmail(e.target.value)} />
            <input required type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />
            <button type="submit">Sign in</button>
          </form>
        )}
      </div>

      {/* Download is OK for everyone (reads cloud). Upload/publish only after sign-in */}
      <div className="card" style={{padding:12, marginBottom:12}}>
        <div style={{display:'flex', gap:8, flexWrap:'wrap', alignItems:'center'}}>
          <button onClick={onDownload}>Download current JSON</button>
          {user && (
            <>
              <label style={{cursor:'pointer'}}>
                <input ref={fileRef} type="file" accept="application/json" onChange={onUpload} style={{display:'none'}} />
                <span className="tag">Upload JSON</span>
              </label>
              <button onClick={onPublish} disabled={!uploaded || uploadInfo.startsWith('Invalid')}>Publish to Cloud</button>
              {uploadInfo && <span className="small">{uploadInfo}</span>}
              {/* Optional: Migrate legacy single-document data to normalized subcollections */}
              <button onClick={async ()=>{
                try{
                  if(!user) throw new Error('Please sign in first.');
                  if (!cloudData) throw new Error('No cloud data to migrate.');
                  await publishSeason(CURRENT_SEASON_ID, cloudData, { uid:user.uid, email:user.email });
                  setMsg('Migration completed ✓');
                }catch(e){ setMsg('Migration error: ' + e.message); }
              }}>Migrate legacy → normalized</button>
            </>
          )}
        </div>
      </div>
      {!user && <p className="small">Sign in to upload and publish new data.</p>}

      {user && (
        <div className="card" style={{padding:12, marginTop:12}}>
          <h3>Add single test</h3>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:8}}>
            <input required placeholder="Athlete ID (e.g., rocky)" value={mId} onChange={e=>setMId(e.target.value)} />
            <input required placeholder="Athlete name" value={mName} onChange={e=>setMName(e.target.value)} />
            <input required placeholder="Test type (e.g., 1k@24)" value={mType} onChange={e=>setMType(e.target.value)} />
            <input required type="date" placeholder="Date" value={mDate} onChange={e=>setMDate(e.target.value)} />
            <input placeholder="Time (e.g., 3:49.0)" value={mTime} onChange={e=>setMTime(e.target.value)} />
            <input placeholder="Split (e.g., 1:54.5)" value={mSplit} onChange={e=>setMSplit(e.target.value)} />
            <input placeholder="Rate (e.g., 24)" value={mRate} onChange={e=>setMRate(e.target.value)} />
            <input placeholder="Value (e.g., 150)" value={mValue ?? ''} onChange={e=>setMValue(e.target.value)} />
            <input placeholder="Unit (e.g., kg)" value={mUnit ?? ''} onChange={e=>setMUnit(e.target.value)} />
          </div>
          <div style={{marginTop:8}}>
            <button onClick={async ()=>{
              try{
                if(!mId || !mName || !mType || !mDate) throw new Error('Please fill ID, name, type, and date');
                const rateNum = mRate === '' ? null : Number(mRate);
                await publishTest(CURRENT_SEASON_ID,
                  { id:mId, name:mName },
                  { type:mType, date:mDate, time:mTime, split:mSplit, rate: Number.isNaN(rateNum)? null: rateNum, value: mValue===''? undefined: Number(mValue), unit: mUnit||undefined },
                  { uid:user.uid, email:user.email }
                );
                setMsg('Test saved ✓');
                setMTime(''); setMSplit(''); setMRate(''); setMValue(''); setMUnit('');
              }catch(e){ setMsg('Save error: ' + e.message); }
            }}>Save test</button>
          </div>
        </div>
      )}

      {user && (
        <div className="card" style={{padding:12, marginTop:12}}>
          <h3>Rename athlete ID</h3>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:8}}>
            <input placeholder="Old ID (e.g., rocky)" value={oldId} onChange={e=>setOldId(e.target.value)} />
            <input placeholder="New ID (e.g., rocky-hooper)" value={newId} onChange={e=>setNewId(e.target.value)} />
            <input placeholder="New name (optional)" value={newName} onChange={e=>setNewName(e.target.value)} />
          </div>
          <div style={{marginTop:8}}>
            <button onClick={async ()=>{
              try{
                if(!oldId || !newId) throw new Error('Please fill old and new IDs');
                await renameAthleteId(CURRENT_SEASON_ID, oldId, newId, newName || undefined, { uid:user.uid, email:user.email });
                setMsg('Athlete ID renamed ✓'); setOldId(''); setNewId(''); setNewName('');
              }catch(e){ setMsg('Rename error: ' + e.message); }
            }}>Rename</button>
          </div>
        </div>
      )}

      {user && (
        <div className="card" style={{padding:12, marginTop:12}}>
          <h3>Rename test ID</h3>
          <div className="small" style={{marginBottom:8}}>Old and new full test IDs (e.g., rocky_2025-09-06_1k-24).</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:8}}>
            <input placeholder="Old test ID" value={tOldId} onChange={e=>setTOldId(e.target.value)} />
            <input placeholder="New test ID" value={tNewId} onChange={e=>setTNewId(e.target.value)} />
          </div>
          <div style={{marginTop:8}}>
            <button onClick={async ()=>{
              try{
                if(!tOldId || !tNewId) throw new Error('Please fill old and new test IDs');
                await renameTestDoc(CURRENT_SEASON_ID, tOldId, tNewId, { uid:user.uid, email:user.email });
                setMsg('Test ID renamed ✓'); setTOldId(''); setTNewId('');
              }catch(e){ setMsg('Rename error: ' + e.message); }
            }}>Rename test</button>
          </div>
        </div>
      )}

      <p className="small" style={{marginTop:8}}>{msg}</p>
    </div>
  );
}

// --- helpers ---
function validateSeason(json){
  const errors = [];
  if (!json || !Array.isArray(json.athletes)){
    errors.push('Root must be an object with athletes: []');
    return errors;
  }
  for (const [i,a] of json.athletes.entries()){
    if (!a || typeof a !== 'object'){ errors.push(`athletes[${i}] must be object`); break; }
    if (!a.id || !a.name) { errors.push(`athletes[${i}] missing id or name`); break; }
    if (!Array.isArray(a.tests)) { errors.push(`athletes[${i}].tests must be array`); break; }
    for (const [j,t] of a.tests.entries()){
      if (!t || typeof t !== 'object'){ errors.push(`tests[${i}][${j}] must be object`); break; }
      if (!t.date || !t.type){ errors.push(`tests[${i}][${j}] missing date or type`); break; }
      // Either time/split (erg/water) OR value/unit (strength), allow both too
      const hasTime = typeof t.time !== 'undefined' && typeof t.split !== 'undefined';
      const hasValue = typeof t.value !== 'undefined' && typeof t.unit !== 'undefined';
      if (!hasTime && !hasValue){
        errors.push(`tests[${i}][${j}] must include time/split or value/unit`); break;
      }
    }
  }
  return errors;
}

function mergeSeason(current, incoming){
  const idToAthlete = new Map();
  for (const a of (current.athletes || [])){
    idToAthlete.set(a.id, { ...a, tests: Array.isArray(a.tests)? a.tests.slice(): [] });
  }
  for (const a of (incoming.athletes || [])){
    const prev = idToAthlete.get(a.id);
    if (!prev){
      idToAthlete.set(a.id, { ...a, tests: Array.isArray(a.tests)? a.tests.slice(): [] });
    } else {
      const merged = { ...prev, ...a };
      const key = t => `${t.date}|${t.type}`;
      const map = new Map();
      for (const t of prev.tests || []) map.set(key(t), t);
      for (const t of a.tests || []) map.set(key(t), t);
      merged.tests = Array.from(map.values()).sort((x,y)=> (x.date<y.date?1:-1));
      idToAthlete.set(a.id, merged);
    }
  }
  return { athletes: Array.from(idToAthlete.values()) };
}
