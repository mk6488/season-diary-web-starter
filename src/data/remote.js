import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

export async function fetchRemoteSeason(seasonId = '2025'){
  const ref = doc(db, 'seasonDiary', seasonId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data(); // might be { athletes: [...] } or { json: "..." }
}
