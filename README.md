
# Season Diary (Coach-Only Website)

A lightweight React app to track athlete profiles, testing logs, and training themes.
Uses Firebase/Firestore with a normalized data model.

## Quick start
```bash
npm install
npm run dev
```

Then open the printed URL (usually http://localhost:5173).

## Add a new athlete
Edit `src/data/sample.json`, add a new athlete object and tests.

## Firestore data model

- Collection `seasonDiary/{season}`
  - Subcollection `athletes/{athleteId}`: name, group, experience, focus, coachNote, updatedAt
  - Subcollection `tests/{athleteId_date_type}`: athleteId, athleteName, date, type, time, split, rate, createdAt, updatedAt
  - Root doc fields: updatedAt, lastPublishedByUid, lastPublishedByEmail

The app assembles this into `{ athletes:[{ id,name,..., tests:[...] }] }` for UI and for the public download.

## Rules (coach-only write)

1) Open Firebase console → Firestore → Rules and paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /seasonDiary/{season} {
      allow read: if true;
      allow write: if isCoach();
      match /athletes/{athleteId} { allow read: if true; allow write: if isCoach(); }
      match /tests/{testId} { allow read: if true; allow write: if isCoach(); }
    }
    function isCoach() {
      return request.auth != null && (
        request.auth.uid in ["sLGBzcsx35fQtcxp0R75Zvnmefm1"] || (request.auth.token.coach == true)
      );
    }
  }
}
```

2) Publish rules.

## Data Manager

- Anyone can download the current JSON.
- After sign-in, coaches can upload a JSON file; the app validates and merges into Firestore.
- “Migrate legacy → normalized” will upsert current cloud JSON into subcollections.
