import React, { useState, useRef } from 'react';
import { loadData, saveData, clearData } from '../data/useData';

export default function Data(){
  const [text, setText] = useState(JSON.stringify(loadData(), null, 2));
  const [msg, setMsg] = useState('');
  const fileRef = useRef(null);

  function onSave(){
    try{
      const json = JSON.parse(text);
      if (!json.athletes) throw new Error('Missing "athletes" array');
      saveData(json);
      setMsg('Saved! Reloading…');
      setTimeout(()=> window.location.reload(), 500);
    }catch(e){ setMsg('Error: ' + e.message); }
  }
  function onReset(){
    clearData();
    setMsg('Reset to bundled sample data. Reloading…');
    setTimeout(()=> window.location.reload(), 500);
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

  return (
    <div className="card">
      <h2>Data Manager</h2>
      <p className="small">Paste or import JSON to update athletes/tests (saved to this browser only).</p>
      <textarea
        value={text}
        onChange={e=>setText(e.target.value)}
        style={{width:'100%', minHeight:'420px', fontFamily:'ui-monospace'}}
      />
      <div style={{display:'flex', gap:8, marginTop:8, flexWrap:'wrap'}}>
        <button onClick={onSave}>Save</button>
        <button onClick={onReset}>Reset to sample</button>
        <button onClick={onDownload}>Download JSON</button>
        <label style={{cursor:'pointer'}}>
          <input ref={fileRef} type="file" accept="application/json" onChange={onUpload} style={{display:'none'}} />
          <span className="tag">Upload JSON</span>
        </label>
      </div>
      <p className="small">{msg}</p>
    </div>
  );
}
