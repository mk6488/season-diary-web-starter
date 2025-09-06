import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// READ central JSON
export async function fetchRemoteSeason(seasonId = '2025'){
  const ref = doc(db, 'seasonDiary', seasonId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data(); // either { athletes:[...] } or { json:"..." }
}

// WRITE central JSON (publishes the athletes array)
export async function publishSeason(seasonId, data){
  if (!data || !Array.isArray(data.athletes)) {
    throw new Error('Data must be { athletes: [...] }');
  }
  const ref = doc(db, 'seasonDiary', seasonId);
  await setDoc(ref, {
    athletes: data.athletes,
    updatedAt: Date.now()
  }, { merge: true });
}
