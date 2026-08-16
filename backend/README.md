# Backend — Tree Monitor API

Node.js + Express REST API. Receives sensor data from the Raspberry Pi and serves it to the frontend dashboard.

## Structure

```
src/
├── config/db.js            MongoDB connection setup
├── controllers/
│   └── treeController.js   Business logic for all endpoints
├── middleware/
│   └── apiKeyAuth.js       X-Secret-Key header validation
├── models/
│   └── TreeData.js         Mongoose schema (treeId, tofMeasurement, imageName)
├── routes/
│   └── tree.js             Route definitions + multer file upload config
└── server.js               App entry point
uploads/                    Tree images stored here (filename only in DB)
```

## Setup

```bash
cd backend
npm install
cp .env.example .env        # then edit .env with your values
npm run dev                 # development (auto-restart on changes)
npm start                   # production
```

## API Reference

| Method | Path | Auth Required | Description |
|--------|------|---------------|-------------|
| `GET`  | `/api/health` | No | Check if server is running |
| `POST` | `/api/tree/data` | `X-Secret-Key` header | Receive data from Pi (`multipart/form-data`) |
| `GET`  | `/api/tree/data` | No | Return all records (newest first) |

### POST Body (multipart/form-data)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `treeId` | string | ✅ | Identifier for the tree |
| `tofMeasurement` | number | ✅ | TOF sensor reading in cm |
| `image` | file | ❌ | Photo of the tree |

### Response Format

```json
{ "success": true, "data": { ... } }
{ "success": false, "message": "..." }
```

## Image Storage

- Files are saved to `backend/uploads/` with a unique timestamped filename.
- Only the filename (e.g. `tree-1234567890.jpg`) is stored in MongoDB.
- Images are served as static files: `GET /uploads/<filename>`

## Environment Variables

See `.env.example` for all variables and their descriptions.
