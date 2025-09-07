import React, { useEffect, useRef, useState } from 'react';
import { publishSeason, fetchRemoteSeason } from '../data/remote';
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
    <div className="grid">
      <div className="card">
        <h2>Data Manager</h2>
        <p className="small">
          The site reads <strong>directly from Firestore</strong>. Sign in to publish updates.
        </p>
        <div className="stat-grid" style={{marginTop:8}}>
          <div className="stat"><div className="label">Athletes</div><div className="num">{cloudData?.athletes?.length ?? 0}</div></div>
          <div className="stat"><div className="label">Tests</div><div className="num">{(cloudData?.athletes||[]).reduce((n,a)=> n + (a.tests?.length||0), 0)}</div></div>
          <div className="stat"><div className="label">Last update</div><div className="num small">{cloudText ? new Date().toLocaleString() : '-'}</div></div>
        </div>
      </div>

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

      {/* Forms removed per request: manual test entry and rename tools */}

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
