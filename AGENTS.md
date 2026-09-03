# AGENTS.md

Guidance for AI coding agents working in this repository.

Wind Turbine Diagnostics is a two-service demo: a FastAPI backend (`api/`) that runs a
PANNs audio-tagging model and MongoDB Atlas Vector Search over stored embeddings, and a
Next.js frontend (`frontend/`) that records audio in the browser, drives the backend,
and reads/writes MongoDB directly through its own API routes. All persistent state lives
in the `audio` database on the Atlas cluster referenced by `MONGODB_URI` — see
[EDD.md](./EDD.md) for the collections and vector index.

## Build and test commands

There is no automated test suite in this repository. Verification means running both
services against a real MongoDB Atlas cluster and exercising the UI by hand (record
training samples, then run diagnostics). Do not claim tests pass — there are none.

Backend (`api/`):

```bash
python3 -m venv venv && source venv/bin/activate   # create/activate virtualenv
python3 -m pip install -r requirements.txt         # install dependencies
uvicorn main:app --reload --port 8000              # run the dev server (from api/)
```

The backend also needs the PANNs model checkpoint downloaded once (see README
"Prerequisites") and `ffmpeg` installed for `pydub`/audio conversion.

Frontend (`frontend/`):

```bash
npm install     # install dependencies
npm run dev     # dev server on port 8080 (frontend/package.json: "next dev -p 8080")
npm run build   # production build
npm run start   # run the production build ("next start -p 8080")
```

Everything together, via Docker Compose (from the repo root, after creating `api/.env`
and `frontend/.env.production` from `.env.example`):

```bash
docker-compose up --build
```

This builds `api/Dockerfile` (multi-stage: installs CPU-only torch, pre-downloads the
PANNs checkpoint, runs `uvicorn main:app --host 0.0.0.0 --port 8000`) and
`frontend/Dockerfile` (multi-stage Next.js build on `node:24-alpine`, runs `npm start` on
port 8080), and wires them together per `docker-compose.yml`.

One-time setup step after the first Atlas connection: create the vector search index
(Atlas only — this does not work against a plain `mongod`):

```bash
python3 utils/indexes/create_vector_index.py
```

Smoke check after a change:

1. Start both services (Docker Compose or the two commands above).
2. Open `http://localhost:8080`, pick a microphone, and record a few training samples
   for each category in the `dictionary` collection.
3. Click "Start Diagnostics" and confirm the log list updates and the correct GIF
   appears — this exercises `/embed-audio`, `knnbeta_search()`, the `results` insert,
   and the SSE change-stream path end to end.

## Project structure

```
api/                        FastAPI backend
  main.py                   Model loading, embedding, insert/search functions, /embed-audio route
  requirements.txt          Python dependencies (fastapi, librosa, panns-inference, pymongo, ...)
  Dockerfile                Multi-stage build: CPU-only torch + PANNs checkpoint pre-download
frontend/                   Next.js 15 app
  src/app/page.js           Main page: loads `dictionary`, renders training/diagnostics steps
  src/app/api/action/[action]/route.js   Generic Mongo proxy: findOne/find/updateOne/deleteMany/aggregate
  src/app/api/sse/route.js  Server-Sent Events endpoint backed by a MongoDB change stream
  src/lib/mongodb.js        Mongo client singleton + getChangeStream()
  src/lib/audio.js          Browser audio recording, POST to /embed-audio, deleteMany helper
  src/components/SampleRecorder/        Training-sample recording UI
  src/components/DiagnosticsModule/     Diagnostics UI; listens to SSE, matches audio to dictionary GIFs
  src/components/AudioDevicePicker/     Microphone selection UI
utils/
  indexes/search_index.json        Vector search index definition (source of truth for the index)
  indexes/create_vector_index.py   Script that creates the index in Atlas from that definition
  charts/Sounds.charts             Atlas Charts dashboard import for the `results` collection
docker-compose.yml           Runs api/ and frontend/ together
environments/                Kubernetes Helm values for the internal staging/production deploy (not needed for local dev)
.drone.yml                   Internal CI/CD pipeline (builds+pushes Docker images, deploys via Helm) — unrelated to local dev workflow
```

Notable files:

- `api/main.py` — everything the backend does: model init, `get_embedding()`,
  `insert_mongo_sounds()`, `insert_mongo_results()`, `knnbeta_search()`, and the single
  `POST /embed-audio` route that branches on whether `audio_name` is present (training
  vs. diagnostics).
- `utils/indexes/search_index.json` — the vector index definition; keep in sync with
  `create_vector_index.py`'s defaults (`emb`, 2048 dimensions, cosine) and with
  [EDD.md](./EDD.md) if either changes.
- `frontend/src/app/api/action/[action]/route.js` — the only way the frontend talks to
  MongoDB directly (no ORM); every `collection` name it's called with must exist in the
  `audio` database.

## Environment variables and configuration

From `.env.example` (shared by `api/` and `frontend/`) and env reads in `api/main.py`,
`utils/indexes/create_vector_index.py`, and `frontend/src/lib/mongodb.js`:

| Name | Required | Example | Description |
| --- | --- | --- | --- |
| `MONGODB_URI` | Yes | `mongodb+srv://user:pass@cluster.mongodb.net` | Atlas connection string. Read by both the FastAPI backend and the Next.js frontend — this repo needs no other cloud credentials (no AWS/Bedrock/LLM keys) |
| `DATABASE_NAME` | Yes (frontend) | `audio` | Database name used by the frontend's generic Mongo proxy route and its change-stream helper; defaults to `audio` if unset in code paths that fall back, but `.env.example` sets it explicitly |
| `APP_NAME` | No | `devrel-demo-vectorsearch-audio-turbine` | MongoDB driver `appName`, set in both `api/main.py`'s `MongoClient(...)` and `frontend/src/lib/mongodb.js`'s `getClientPromise()`; defaults to `devrel-demo-vectorsearch-audio-turbine` in code |
| `TORCH_DEVICE` | No | `cpu` | Device passed to `panns_inference.AudioTagging`. Defaults to `cpu` to match the CPU-only torch install in `api/Dockerfile`; set to `cuda` only on a GPU host running its own torch+CUDA install |
| `VECTOR_INDEX_NAME` | No | `vector_index` | Name of the Atlas Vector Search index, read by both `api/main.py` (`knnbeta_search()`) and `utils/indexes/create_vector_index.py`; must match the `name` field in `utils/indexes/search_index.json` |
| `API_HOST` | No | `localhost` | Frontend-only; used to reach the backend (also passed as a Docker build arg in `docker-compose.yml`) |

Constraints worth knowing before you debug a failure:

- The vector search index can only be created on Atlas — `create_search_index()` /
  `create_vector_index.py` will fail against a local, non-Atlas `mongod`.
- The backend and frontend each read `MONGODB_URI` from their own `.env` file
  (`api/.env` and `frontend/.env` or `frontend/.env.production`) — setting it in one
  does not make it visible to the other process.
- `api/Dockerfile` installs CPU-only torch; do not set `TORCH_DEVICE=cuda` unless the
  image (or host, when running without Docker) actually has a CUDA-enabled torch
  install, or model inference will fail at startup.
- The `dictionary` collection is never written by any code in this repo (see
  [EDD.md](./EDD.md) "Known inconsistencies") — it must already contain documents with
  `audio`, `rank`, and `image` fields before the frontend's stepper and diagnostics GIFs
  will work.

## MongoDB Skills

Use the official MongoDB agent skills from https://github.com/mongodb/agent-skills
whenever the task is MongoDB-specific and a matching skill exists.

## When To Use EDD.md

Use [EDD.md](./EDD.md) as the source of truth for the MongoDB data model in this repository.

Consult [EDD.md](./EDD.md) before making changes that touch:

- MongoDB collections, document structure, or field names
- FastAPI routes (`api/main.py`) or Next.js API routes (`frontend/src/app/api/`) that read or write database records
- Validation, form fields, API payloads, or UI that depend on persisted data
- Schema documentation, Mermaid diagrams, or entity modeling discussions
