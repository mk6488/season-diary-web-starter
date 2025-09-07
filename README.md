
# Season Diary (Coach-Only Website)

A lightweight React app to track athlete profiles, testing logs, and training themes.
Uses mock JSON now; you can later swap to Firebase/Firestore.

## Quick start
```bash
npm install
npm run dev
```

Then open the printed URL (usually http://localhost:5173).
### Environment setup
Create a `.env` file (not committed) with your Firebase config:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...

To enable the optional service worker:

```
VITE_ENABLE_SW=1
```
```


## Add a new athlete
Edit `src/data/sample.json`, add a new athlete object and tests.

## Suggested Firestore schema
See the end of this README when you want to move to Firebase.
