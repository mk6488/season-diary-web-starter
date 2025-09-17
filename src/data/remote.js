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
  query,
  where,
  orderBy,
  addDoc,
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
        value: typeof t.value === 'number' ? t.value : (Number(t.value) || undefined),
        unit: t.unit,
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
        rate: (typeof t.rate === 'number' || t.rate === null) ? t.rate : (Number(t.rate) || null),
        value: (t.value == null) ? null : (Number(t.value) || null),
        unit: (t.unit == null) ? null : t.unit,
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

// Rename an athlete ID and re-key all their tests
export async function renameAthleteId(seasonId, oldId, newId, newName, publisher){
  if (!oldId || !newId || oldId === newId) throw new Error('Provide different old and new IDs');
  const seasonRef = doc(db, 'seasonDiary', seasonId);

  // Load existing athlete to carry fields
  const oldARef = doc(seasonRef, 'athletes', oldId);
  const oldSnap = await getDoc(oldARef);
  const oldData = oldSnap.exists() ? oldSnap.data() : {};
  const targetName = newName || oldData.name || newId;

  // Fetch all tests for oldId
  const testsQ = query(collection(seasonRef, 'tests'), where('athleteId', '==', oldId));
  const testsSnap = await getDocs(testsQ);

  let batch = writeBatch(db);
  let opCount = 0;
  const commitIfNeeded = async () => {
    if (opCount >= 400) { await batch.commit(); batch = writeBatch(db); opCount = 0; }
  };

  // Upsert new athlete doc
  const newARef = doc(seasonRef, 'athletes', newId);
  batch.set(newARef, {
    name: targetName,
    group: oldData.group ?? '',
    experience: oldData.experience ?? '',
    focus: oldData.focus ?? '',
    coachNote: oldData.coachNote ?? '',
    updatedAt: serverTimestamp(),
    updatedByUid: publisher?.uid ?? null,
    updatedByEmail: publisher?.email ?? null,
  }, { merge: true });
  opCount++;
  await commitIfNeeded();

  // Migrate tests
  for (const d of testsSnap.docs){
    const t = d.data();
    const newTRef = doc(seasonRef, 'tests', makeTestId(newId, t.date, t.type));
    batch.set(newTRef, {
      athleteId: newId,
      athleteName: targetName,
      date: t.date,
      type: t.type,
      time: t.time ?? '',
      split: t.split ?? '',
      rate: (typeof t.rate === 'number' || t.rate === null) ? t.rate : (Number(t.rate) || null),
      value: (t.value == null) ? null : (Number(t.value) || null),
      unit: (t.unit == null) ? null : t.unit,
      createdAt: t.createdAt ?? serverTimestamp(),
      updatedAt: serverTimestamp(),
      updatedByUid: publisher?.uid ?? null,
      updatedByEmail: publisher?.email ?? null,
    }, { merge: true });
    opCount++;
    await commitIfNeeded();

    // Delete old test doc
    batch.delete(d.ref); opCount++; await commitIfNeeded();
  }

  // Delete old athlete doc
  if (oldSnap.exists()) { batch.delete(oldARef); opCount++; }
  batch.set(seasonRef, { updatedAt: Date.now() }, { merge: true }); opCount++;

  await batch.commit();
}

// Rename a single test document ID (e.g., change date and/or type) for an athlete
export async function renameTestId(seasonId, athleteId, oldDate, oldType, newDate, newType, publisher){
  if (!athleteId || !oldDate || !oldType) throw new Error('athleteId, oldDate and oldType are required');
  const fromDate = oldDate;
  const fromType = oldType;
  const toDate = newDate || oldDate;
  const toType = newType || oldType;
  const seasonRef = doc(db, 'seasonDiary', seasonId);
  const oldRef = doc(seasonRef, 'tests', makeTestId(athleteId, fromDate, fromType));
  const newRef = doc(seasonRef, 'tests', makeTestId(athleteId, toDate, toType));
  if (oldRef.path === newRef.path) throw new Error('Old and new test IDs are identical');

  const snap = await getDoc(oldRef);
  if (!snap.exists()) throw new Error('Original test not found');
  const t = snap.data();

  const batch = writeBatch(db);
  batch.set(newRef, {
    ...t,
    date: toDate,
    type: toType,
    updatedAt: serverTimestamp(),
    updatedByUid: publisher?.uid ?? null,
    updatedByEmail: publisher?.email ?? null,
  }, { merge: true });
  batch.delete(oldRef);
  batch.set(seasonRef, { updatedAt: Date.now() }, { merge: true });
  await batch.commit();
}

// Rename by full test doc ID (e.g., "rocky_2025-09-06_1k-24" → "rocky-hooper_2025-09-06_1k-24")
export async function renameTestDoc(seasonId, oldTestId, newTestId, publisher){
  if (!oldTestId || !newTestId) throw new Error('Provide old and new test IDs');
  const seasonRef = doc(db, 'seasonDiary', seasonId);
  const oldRef = doc(seasonRef, 'tests', oldTestId);
  const newRef = doc(seasonRef, 'tests', newTestId);
  if (oldRef.path === newRef.path) throw new Error('Old and new test IDs are identical');

  const snap = await getDoc(oldRef);
  if (!snap.exists()) throw new Error('Original test not found');
  const t = snap.data();

  // Try to parse athleteId and date from the new ID: {athleteId}_{YYYY-MM-DD}_rest
  let parsedAthleteId = undefined;
  let parsedDate = undefined;
  const parts = newTestId.split('_');
  if (parts.length >= 2){
    parsedAthleteId = parts[0];
    parsedDate = parts[1];
  }

  const batch = writeBatch(db);
  batch.set(newRef, {
    ...t,
    athleteId: parsedAthleteId ?? t.athleteId,
    date: parsedDate ?? t.date,
    updatedAt: serverTimestamp(),
    updatedByUid: publisher?.uid ?? null,
    updatedByEmail: publisher?.email ?? null,
  }, { merge: true });
  batch.delete(oldRef);
  batch.set(seasonRef, { updatedAt: Date.now() }, { merge: true });
  await batch.commit();
}

// --- Erg sessions ---

// Fetch erg sessions for a season, newest first
export async function fetchErgSessions(seasonId = '2025'){
  const seasonRef = doc(db, 'seasonDiary', seasonId);
  const ergCol = collection(seasonRef, 'ergSessions');
  const q = query(ergCol, orderBy('date', 'desc'));
  const snap = await getDocs(q);
  const rows = [];
  snap.forEach((d) => {
    const data = d.data();
    rows.push({ id: d.id, ...data });
  });
  return rows;
}

// Publish a single erg session; if id provided, upsert with that id, otherwise add new
export async function publishErgSession(seasonId, session, publisher){
  if (!session || !session.markdown) throw new Error('session.markdown is required');
  if (!session.date && typeof session.date !== 'number') throw new Error('session.date is required');

  const seasonRef = doc(db, 'seasonDiary', seasonId);
  const ergCol = collection(seasonRef, 'ergSessions');

  const payload = {
    title: session.title || '',
    markdown: session.markdown,
    date: session.date, // ISO string (YYYY-MM-DD) or timestamp; consumer must handle
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    updatedByUid: publisher?.uid ?? null,
    updatedByEmail: publisher?.email ?? null,
  };

  if (session.id) {
    await setDoc(doc(ergCol, session.id), payload, { merge: true });
  } else {
    await addDoc(ergCol, payload);
  }
}

// --- Erg session reports ---

export async function fetchErgReports(seasonId = '2025'){
  const seasonRef = doc(db, 'seasonDiary', seasonId);
  const repCol = collection(seasonRef, 'ergReports');
  const q = query(repCol, orderBy('date', 'desc'));
  const snap = await getDocs(q);
  const rows = [];
  snap.forEach((d) => rows.push({ id: d.id, ...d.data() }));
  return rows;
}

export async function fetchErgReportByDate(seasonId, dateStr){
  const seasonRef = doc(db, 'seasonDiary', seasonId);
  const repCol = collection(seasonRef, 'ergReports');
  const q = query(repCol, where('date', '==', dateStr));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() };
}

export async function publishErgReport(seasonId, report, publisher){
  if (!report || !report.markdown) throw new Error('report.markdown is required');
  if (!report.date) throw new Error('report.date is required');
  const seasonRef = doc(db, 'seasonDiary', seasonId);
  const repCol = collection(seasonRef, 'ergReports');
  const payload = {
    title: report.title || '',
    markdown: report.markdown,
    date: report.date, // YYYY-MM-DD
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    updatedByUid: publisher?.uid ?? null,
    updatedByEmail: publisher?.email ?? null,
  };
  let newReportId = report.id;
  if (report.id) {
    await setDoc(doc(repCol, report.id), payload, { merge: true });
  } else {
    const added = await addDoc(repCol, payload);
    newReportId = added.id;
  }

  // Link matching ergSessions by date with reportId for stronger association
  try{
    const ergCol = collection(seasonRef, 'ergSessions');
    const qSessions = query(ergCol, where('date', '==', report.date));
    const snap = await getDocs(qSessions);
    if (!snap.empty && newReportId){
      const batch = writeBatch(db);
      snap.docs.forEach((d)=>{
        batch.set(d.ref, { reportId: newReportId, updatedAt: serverTimestamp() }, { merge: true });
      });
      await batch.commit();
    }
  }catch(_){ /* non-fatal */ }
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
    rate: (typeof test.rate === 'number' || test.rate === null) ? test.rate : (Number(test.rate) || null),
    value: (test.value == null) ? null : (Number(test.value) || null),
    unit: (test.unit == null) ? null : test.unit,
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    updatedByUid: publisher?.uid ?? null,
    updatedByEmail: publisher?.email ?? null,
  }, { merge: true });

  batch.set(seasonRef, { updatedAt: Date.now() }, { merge: true });
  await batch.commit();
}
