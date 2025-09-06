import React, { useEffect, useRef, useState } from 'react';
import { loadData, saveData, clearData } from '../data/useData';
import { publishSeason } from '../data/remote';
import { auth } from '../firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';

export default function Data(){
  const [text, setText] = useState(JSON.stringify(loadData(), null, 2));
  const [msg, setMsg] = useState('');
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const fileRef = useRef(null);

  // auth state
  useEffect(() => {
    return onAuthStateChanged(auth, u => setUser(u));
  }, []);

  function onSaveLocal(){
    try{
      const json = JSON.parse(text);
      if (!json.athletes) throw new Error('Missing "athletes" array');
      saveData(json);
      setMsg('Saved locally. Reloading…');
      setTimeout(()=> window.location.reload(), 400);
    }catch(e){ setMsg('Local save error: ' + e.message); }
  }
  function onReset(){
    clearData();
    setMsg('Reset to bundled sample. Reloading…');
    setTimeout(()=> window.location.reload(), 400);
  }
  function onDownload(){
    const blob = new Blob([text], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'season-diary-data.json'; a.click();
    URL.revokeObjectURL(url);
  }
  function onUpload(e){
    const f = e.target.files?.[0]; if(!f) return;
    const r = new FileReader(); r.onload = () => setText(String(r.result)); r.readAsText(f);
  }

  async function onPublish(){
    try{
      const json = JSON.parse(text);
      if (!Array.isArray(json.athletes)) throw new Error('JSON must be { "athletes": [...] }');
      if (!user) throw new Error('Please sign in first.');
      await publishSeason('2025', json);
      setMsg('Published to Firestore ✓ — everyone will see this after reload.');
    }catch(e){
      setMsg('Publish error: ' + e.message);
    }
  }

  async function onLogin(e){
    e.preventDefault();
    try{
      await signInWithEmailAndPassword(auth, email, password);
      setMsg('Signed in ✓');
      setEmail(''); setPassword('');
    }catch(e){
      setMsg('Sign-in error: ' + e.message);
    }
  }
  async function onLogout(){
    await signOut(auth); setMsg('Signed out.');
  }

  return (
    <div className="card">
      <h2>Data Manager</h2>
      <p className="small">Paste or import JSON. Save locally to preview; <strong>Publish to Cloud</strong> sends it to Firestore for all coaches.</p>

      {/* Auth box */}
      <div className="card" style={{padding:12, marginBottom:12}}>
        {user ? (
          <div>
            <p className="small">Signed in as <strong>{user.email}</strong></p>
            <button onClick={onLogout}>Sign out</button>
            <button onClick={onPublish} style={{marginLeft:8}}>Publish to Cloud</button>
          </div>
        ) : (
          <form onSubmit={onLogin} style={{display:'flex', gap:8, flexWrap:'wrap', alignItems:'center'}}>
            <input required placeholder="Coach email" value={email} onChange={e=>setEmail(e.target.value)} />
            <input required type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />
            <button type="submit">Sign in</button>
          </form>
        )}
      </div>

      {/* JSON editor */}
      <textarea
        value={text}
        onChange={e=>setText(e.target.value)}
        style={{width:'100%', minHeight:'420px', fontFamily:'ui-monospace'}}
      />

      <div style={{display:'flex', gap:8, marginTop:8, flexWrap:'wrap'}}>
        <button onClick={onSaveLocal}>Save locally</button>
        <button onClick={onReset}>Reset to sample</button>
        <button onClick={onDownload}>Download JSON</button>
        <label style={{cursor:'pointer'}}>
          <input ref={fileRef} type="file" accept="application/json" onChange={onUpload} style={{display:'none'}} />
          <span className="tag">Upload JSON</span>
        </label>
      </div>

      <p className="small" style={{marginTop:8}}>{msg}</p>
    </div>
  );
}
