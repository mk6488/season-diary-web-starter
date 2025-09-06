import React, { useEffect, useRef, useState } from 'react';
import { publishSeason, fetchRemoteSeason } from '../data/remote';
import { CURRENT_SEASON_ID } from '../data/constants';
import { auth } from '../firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';

export default function Data(){
  const [text, setText] = useState('');         // editor text (shown only when signed in)
  const [msg, setMsg] = useState('');
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const fileRef = useRef(null);

  // Auth state
  useEffect(() => onAuthStateChanged(auth, u => setUser(u)), []);

  // Always fetch current cloud JSON on mount (to power downloads and, once signed in, prefill editor)
  useEffect(() => {
    (async () => {
      try{
        const remote = await fetchRemoteSeason(CURRENT_SEASON_ID);
        const parsed = remote?.athletes ? remote
                     : remote?.json ? JSON.parse(remote.json)
                     : { athletes: [] };
        setText(JSON.stringify(parsed, null, 2));
      }catch(e){
        setMsg('Could not load cloud data: ' + e.message);
      }
    })();
  }, []);

  // Actions
  async function onPublish(){
    try{
      const json = JSON.parse(text);
      if (!Array.isArray(json.athletes)) throw new Error('JSON must be { "athletes": [...] }');
      if (!user) throw new Error('Please sign in first.');
      await publishSeason(CURRENT_SEASON_ID, json);
      setMsg('Published to Firestore ✓ — everyone will see this after reload.');
    }catch(e){
      setMsg('Publish error: ' + e.message);
    }
  }
  function onDownload(){
    try{
      const blob = new Blob([text], {type:'application/json'});
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
        setText(JSON.stringify(parsed, null, 2));
        setMsg('Upload loaded ✓');
      }catch(err){
        setText(String(r.result));
        setMsg('Upload error: invalid JSON');
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

      {/* Download is OK for everyone (reads cloud). Editor & upload/publish only after sign-in */}
      <div className="card" style={{padding:12, marginBottom:12}}>
        <div style={{display:'flex', gap:8, flexWrap:'wrap', alignItems:'center'}}>
          <button onClick={onDownload}>Download current JSON</button>
          {user && (
            <>
              <label style={{cursor:'pointer'}}>
                <input ref={fileRef} type="file" accept="application/json" onChange={onUpload} style={{display:'none'}} />
                <span className="tag">Upload JSON</span>
              </label>
              <button onClick={onPublish}>Publish to Cloud</button>
            </>
          )}
        </div>
      </div>

      {/* Editor shown only when signed in */}
      {user ? (
        <textarea
          value={text}
          onChange={e=>setText(e.target.value)}
          style={{width:'100%', minHeight:'420px', fontFamily:'ui-monospace'}}
        />
      ) : (
        <p className="small">Sign in to edit or upload new data.</p>
      )}

      <p className="small" style={{marginTop:8}}>{msg}</p>
    </div>
  );
}
