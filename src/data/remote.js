import { db } from '../firebase';
import { doc, getDoc, setDoc, deleteField } from 'firebase/firestore';

// READ
export async function fetchRemoteSeason(seasonId = '2025'){
  const ref = doc(db, 'seasonDiary', seasonId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data();
}

// WRITE (cleanly replaces the data and removes legacy "json")
export async function publishSeason(seasonId, data){
  if (!data || !Array.isArray(data.athletes)) {
    throw new Error('Data must be { athletes: [...] }');
  }
  const ref = doc(db, 'seasonDiary', seasonId);
  await setDoc(
    ref,
    {
      athletes: data.athletes,
      updatedAt: Date.now(),
      json: deleteField()   // ← this removes the old string field
    },
    { merge: true }         // keep any other future metadata
  );
}
