import { db } from '../firebase';
import {
  doc,
  getDoc,
  setDoc,
  deleteField,
  collection,
  getDocs,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';

// READ central JSON: supports either { athletes:[...] } or legacy { json:"..." }
export async function fetchRemoteSeason(seasonId = '2025'){
  // Try normalized model first: subcollections under seasonDiary/{seasonId}
  const seasonRef = doc(db, 'seasonDiary', seasonId);
  const athletesCol = collection(seasonRef, 'athletes');
  const testsCol = collection(seasonRef, 'tests');

  const [athletesSnap, testsSnap] = await Promise.all([
    getDocs(athletesCol),
    getDocs(testsCol),
  ]);

  if (!athletesSnap.empty || !testsSnap.empty) {
    const idToAthlete = new Map();
    athletesSnap.forEach((d) => {
      const a = d.data();
      idToAthlete.set(d.id, {
        id: d.id,
        name: a.name,
        group: a.group,
        experience: a.experience,
        focus: a.focus,
        coachNote: a.coachNote,
        tests: [],
      });
    });

    testsSnap.forEach((d) => {
      const t = d.data();
      const a = idToAthlete.get(t.athleteId);
      if (!a) return;
      a.tests.push({
        date: t.date,
        type: t.type,
        time: t.time,
        split: t.split,
        rate: typeof t.rate === 'number' || t.rate === null ? t.rate : Number(t.rate) || null,
      });
    });

    const athletes = Array.from(idToAthlete.values()).map((a) => ({
      ...a,
      tests: a.tests.slice().sort((x, y) => (x.date < y.date ? 1 : -1)),
    }));
    // Sort athletes by name for stable output
    athletes.sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));
    return { athletes };
  }

  // Fallback to legacy single-document model { athletes: [...] }
  const legacySnap = await getDoc(seasonRef);
  if (!legacySnap.exists()) return null;
  return legacySnap.data();
}

// WRITE central JSON: publish athletes array and remove legacy "json"
export async function publishSeason(seasonId, data, publisher){
  if (!data || !Array.isArray(data.athletes)) {
    throw new Error('Data must be { athletes: [...] }');
  }

  const seasonRef = doc(db, 'seasonDiary', seasonId);
  const batch = writeBatch(db);

  // Upsert athletes
  for (const a of data.athletes){
    if (!a.id || !a.name) continue;
    const aRef = doc(seasonRef, 'athletes', a.id);
    batch.set(aRef, {
      name: a.name,
      group: a.group ?? '',
      experience: a.experience ?? '',
      focus: a.focus ?? '',
      coachNote: a.coachNote ?? '',
      updatedAt: serverTimestamp(),
      updatedByUid: publisher?.uid ?? null,
      updatedByEmail: publisher?.email ?? null,
    }, { merge: true });

    // Upsert tests for this athlete
    const tests = Array.isArray(a.tests) ? a.tests : [];
    for (const t of tests){
      if (!t || !t.date || !t.type) continue;
      const docId = makeTestId(a.id, t.date, t.type);
      const tRef = doc(seasonRef, 'tests', docId);
      batch.set(tRef, {
        athleteId: a.id,
        athleteName: a.name,
        date: t.date,
        type: t.type,
        time: t.time ?? '',
        split: t.split ?? '',
        rate: typeof t.rate === 'number' || t.rate === null ? t.rate : Number(t.rate) || null,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedByUid: publisher?.uid ?? null,
        updatedByEmail: publisher?.email ?? null,
      }, { merge: true });
    }
  }

  // Stamp season root doc (and remove legacy json if present)
  batch.set(seasonRef, {
    updatedAt: Date.now(),
    json: deleteField(),
    lastPublishedByUid: publisher?.uid ?? null,
    lastPublishedByEmail: publisher?.email ?? null,
  }, { merge: true });

  await batch.commit();
}

function makeTestId(athleteId, date, type){
  const safeType = String(type).toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return `${athleteId}_${date}_${safeType}`;
}

// Add or update a single test for an athlete (idempotent)
export async function publishTest(seasonId, athlete, test, publisher){
  const seasonRef = doc(db, 'seasonDiary', seasonId);
  if (!athlete?.id || !athlete?.name) throw new Error('athlete.id and athlete.name are required');
  if (!test?.date || !test?.type) throw new Error('test.date and test.type are required');

  const aRef = doc(seasonRef, 'athletes', athlete.id);
  const tRef = doc(seasonRef, 'tests', makeTestId(athlete.id, test.date, test.type));

  const batch = writeBatch(db);
  batch.set(aRef, {
    name: athlete.name,
    group: athlete.group ?? '',
    experience: athlete.experience ?? '',
    focus: athlete.focus ?? '',
    coachNote: athlete.coachNote ?? '',
    updatedAt: serverTimestamp(),
    updatedByUid: publisher?.uid ?? null,
    updatedByEmail: publisher?.email ?? null,
  }, { merge: true });

  batch.set(tRef, {
    athleteId: athlete.id,
    athleteName: athlete.name,
    date: test.date,
    type: test.type,
    time: test.time ?? '',
    split: test.split ?? '',
    rate: typeof test.rate === 'number' || test.rate === null ? test.rate : Number(test.rate) || null,
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    updatedByUid: publisher?.uid ?? null,
    updatedByEmail: publisher?.email ?? null,
  }, { merge: true });

  batch.set(seasonRef, { updatedAt: Date.now() }, { merge: true });
  await batch.commit();
}
