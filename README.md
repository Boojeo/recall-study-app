# 🧠 Recall: an evidence-based study app

Recall is a flashcard and study app built on what learning research shows works:
**retrieval practice, spaced repetition, interleaving and self-explanation**. It also
includes a **Gemini AI tutor** that explains cards, writes cards from your notes, and
quizzes you on what you've learned.

- Works on phone and computer. You can install it to your home screen.
- Your cards sync between all your devices (stored in Upstash Redis).
- A password you choose protects your data and your Gemini quota.
- Free to run: Vercel Hobby, the Upstash free tier and the Gemini free tier are all enough for one person.

## Deploy (about 10 minutes, one time)

### 1. Get a Gemini API key
Go to <https://aistudio.google.com/apikey>, sign in, and click **Create API key**. Copy it.

### 2. Import the repo into Vercel
1. Sign in at <https://vercel.com> with your GitHub account.
2. **Add New → Project**, pick this repository, and click **Import**.
3. Leave the framework preset on **Other** and the build settings empty.
4. Open **Environment Variables** and add:

   | Name | Value |
   |---|---|
   | `APP_PASSWORD` | a password you'll type on each device |
   | `GEMINI_API_KEY` | the key from step 1 |
   | `GEMINI_MODEL` | *(optional)* defaults to `gemini-flash-latest` |

5. Click **Deploy**.

### 3. Add the database
1. In your Vercel project, open the **Storage** tab, then **Create Database**, and choose **Upstash for Redis** (free plan).
2. Connect it to this project. Vercel adds `KV_REST_API_URL` and `KV_REST_API_TOKEN` automatically.
3. Go to **Deployments**, open the **⋯** menu on the latest one, and click **Redeploy** so the new variables are picked up.

### 4. Open it on your phone
Open your `https://<project>.vercel.app` link and enter your password.
- **iPhone (Safari):** tap Share, then **Add to Home Screen**.
- **Android (Chrome):** tap ⋮, then **Add to Home screen** / **Install app**.

Every `git push` to the main branch redeploys automatically.

## Moving cards from the old single-file version
In the old file, go to **Cards → Export backup**. Then in the hosted app, use **Cards → Import backup**.

## How it's built
| File | What it does |
|---|---|
| `index.html` | The whole app (UI, spaced-repetition scheduler, AI tutor screens) |
| `merge.js` | Merges data from two devices; shared by browser and server |
| `api/sync.js` | Saves and loads your data in Upstash Redis |
| `api/ai.js` | Forwards requests to Gemini, so your API key never reaches the browser |
| `api/_lib.js` | Password check and helpers |
| `sw.js`, `manifest.webmanifest`, icons | Phone install and offline support |

No npm packages or build step are needed.

### Offline
Reviews work without a connection and sync when you're back online. The AI features need a connection.
