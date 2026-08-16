# 🌳 Tree Monitor

A system that collects **Time-of-Flight (TOF) sensor** readings and **tree images** from a Raspberry Pi and displays them in a live web dashboard.

---

## What Does This Do?

```
Raspberry Pi  ──►  Backend API  ──►  MongoDB  ──►  Frontend Dashboard
  (sensor)         (Node.js)          (DB)          (React table)
```

1. A **Raspberry Pi** measures the distance to a tree using a TOF sensor and takes a photo.
2. It **sends** this data to our backend server every few seconds.
3. The backend **stores** the data in a database.
4. The **web dashboard** displays all readings in a table — updated automatically.

---

## Project Structure

```
drone web hook/
├── backend/          ← Node.js server (API + database)
├── frontend/         ← React web dashboard
└── raspberry-pi/     ← Python script that runs on the Pi
```

---

## 🚀 Quick Start — Step by Step

### Step 1 — Install MongoDB

You need MongoDB running on your computer. Download and install it from:
👉 https://www.mongodb.com/try/download/community

After installing, start it:
- **Windows**: It usually starts automatically as a service.
- **Mac/Linux**: Run `mongod` in a terminal.

---

### Step 2 — Set Up the Backend

Open a terminal and navigate to the `backend` folder.

```bash
# 1. Install dependencies
npm install

# 2. Create your config file
copy .env.example .env     # Windows
cp .env.example .env       # Mac / Linux

# 3. Open .env in any text editor — the defaults work for local development
#    (no changes needed if MongoDB is running locally)

# 4. Start the backend server
npm run dev
```

You should see:
```
🚀 Server running on http://localhost:3001
✅ MongoDB connected: localhost
```

---

### Step 3 — Set Up the Frontend

Open a **new terminal** and navigate to the `frontend` folder.

```bash
# 1. Install dependencies
npm install

# 2. Create your config file
copy .env.example .env     # Windows
cp .env.example .env       # Mac / Linux

# 3. Start the frontend
npm run dev
```

Open your browser and go to **http://localhost:5173** — you should see the dashboard.

---

### Step 4 — Set Up the Raspberry Pi

On the Raspberry Pi, navigate to the `raspberry-pi` folder.

```bash
# 1. Install Python dependencies
pip install requests python-dotenv

# 2. Create your config file
cp .env.example .env

# 3. Edit .env — set API_URL to your backend's address
#    and DEVICE_SECRET to the same value as in the backend's .env

# 4. Run the script
python send_data.py
```

> ⚠️ **Important**: The `DEVICE_SECRET` value in the Pi's `.env` must match `DEVICE_SECRET` in the backend's `.env`. This is how the Pi proves it's allowed to send data.

---

## 🔑 Environment Variables Explained

### `backend/.env`

| Variable | What it does |
|---|---|
| `PORT` | Which port the server runs on (default: `3001`) |
| `MONGO_URI` | Address of the MongoDB database |
| `DEVICE_SECRET` | Secret password shared with the Raspberry Pi |
| `FRONTEND_URL` | URL of the frontend (for security — only allows this origin) |

### `frontend/.env`

| Variable | What it does |
|---|---|
| `VITE_API_URL` | Address of the backend server |

### `raspberry-pi/.env`

| Variable | What it does |
|---|---|
| `API_URL` | Address of the backend server |
| `DEVICE_SECRET` | Must match `DEVICE_SECRET` in the backend `.env` |
| `TREE_ID` | Unique name for the tree being monitored |
| `SEND_INTERVAL_SECONDS` | How often the Pi sends data (in seconds) |
| `MAX_RETRIES` | How many times to retry if the network fails |

---

## 📡 API Reference

Base URL: `http://localhost:3001` (or your deployed server address)

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `GET` | `/api/health` | No | Check if the server is alive |
| `POST` | `/api/tree/data` | ✅ `X-Secret-Key` header | Submit a new sensor reading + photo |
| `GET` | `/api/tree/data` | No | Retrieve all stored readings |

---

### 1. `GET /api/health` — Health Check

Verify the server is up and running. No authentication needed.

**Request**
```
GET http://localhost:3001/api/health
```

**Response** `200 OK`
```json
{
  "success": true,
  "message": "Tree Monitor API is running 🌳"
}
```

**curl example**
```bash
curl http://localhost:3001/api/health
```

---

### 2. `POST /api/tree/data` — Submit a Sensor Reading

Used by the **Raspberry Pi** to send a TOF measurement and (optionally) a tree photo.

**Authentication**: Every request must include the `X-Secret-Key` header matching the `DEVICE_SECRET` in the backend `.env`.

**Request**

| Header | Value |
|---|---|
| `X-Secret-Key` | Your `DEVICE_SECRET` value |
| `Content-Type` | `multipart/form-data` |

| Form Field | Type | Required | Description |
|---|---|---|---|
| `treeId` | `string` | ✅ Yes | Unique identifier for the tree (e.g. `TREE-001`) |
| `tofMeasurement` | `number` | ✅ Yes | Distance reading from the TOF sensor in **centimetres** |
| `image` | `file` | ❌ Optional | Photo of the tree (jpeg, jpg, png, gif, webp — max 10 MB) |

**Response** `201 Created`
```json
{
  "success": true,
  "message": "Data saved successfully",
  "data": {
    "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
    "treeId": "TREE-001",
    "tofMeasurement": 123.4,
    "imageName": "tree-1722345678901-483920.jpg",
    "createdAt": "2024-07-30T10:14:38.000Z",
    "updatedAt": "2024-07-30T10:14:38.000Z"
  }
}
```

**Error Responses**

| Status | Cause |
|---|---|
| `400 Bad Request` | Missing `treeId` or `tofMeasurement` |
| `401 Unauthorized` | Missing or incorrect `X-Secret-Key` |
| `500 Internal Server Error` | Database or server error |

**Example — curl**
```bash
curl -X POST http://localhost:3001/api/tree/data \
  -H "X-Secret-Key: dev-secret-key-change-in-production" \
  -F "treeId=TREE-001" \
  -F "tofMeasurement=123.4" \
  -F "image=@/path/to/photo.jpg"
```

**Example — Python (Raspberry Pi script)**
```python
import requests

url = "http://localhost:3001/api/tree/data"
headers = {"X-Secret-Key": "dev-secret-key-change-in-production"}

payload = {
    "treeId": "TREE-001",
    "tofMeasurement": 123.4
}

# Attach an image file (optional)
with open("/path/to/photo.jpg", "rb") as img:
    files = {"image": ("photo.jpg", img, "image/jpeg")}
    response = requests.post(url, headers=headers, data=payload, files=files)

print(response.json())
# {"success": true, "message": "Data saved successfully", "data": {...}}
```

**Example — JavaScript (fetch)**
```javascript
const form = new FormData();
form.append("treeId", "TREE-001");
form.append("tofMeasurement", "123.4");
form.append("image", imageFile); // a File or Blob object

const response = await fetch("http://localhost:3001/api/tree/data", {
  method: "POST",
  headers: { "X-Secret-Key": "dev-secret-key-change-in-production" },
  body: form,
});

const result = await response.json();
console.log(result);
// { success: true, message: "Data saved successfully", data: { ... } }
```

---

### 3. `GET /api/tree/data` — Get All Readings

Returns every stored reading, sorted **newest first**. Used by the frontend dashboard. No authentication required.

**Request**
```
GET http://localhost:3001/api/tree/data
```

**Response** `200 OK`
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "64f1a2b3c4d5e6f7a8b9c0d2",
      "treeId": "TREE-001",
      "tofMeasurement": 145.7,
      "imageName": "tree-1722345999001-112233.jpg",
      "imageUrl": "http://localhost:3001/uploads/tree-1722345999001-112233.jpg",
      "createdAt": "2024-07-30T10:26:39.000Z"
    },
    {
      "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
      "treeId": "TREE-001",
      "tofMeasurement": 123.4,
      "imageName": "tree-1722345678901-483920.jpg",
      "imageUrl": "http://localhost:3001/uploads/tree-1722345678901-483920.jpg",
      "createdAt": "2024-07-30T10:14:38.000Z"
    }
  ]
}
```

> **Note**: If no image was uploaded for a record, `imageName` and `imageUrl` will be `null`.

**curl example**
```bash
curl http://localhost:3001/api/tree/data
```

**JavaScript (fetch) example**
```javascript
const response = await fetch("http://localhost:3001/api/tree/data");
const result = await response.json();

console.log(`Total readings: ${result.count}`);
result.data.forEach((record) => {
  console.log(`${record.treeId}: ${record.tofMeasurement} cm — ${record.createdAt}`);
});
```

---

## 🖼️ Where Are Images Stored?

Images are saved to the **`backend/uploads/`** folder on the server.
Only the **filename** is stored in the database — the server serves the actual file at:
```
http://localhost:3001/uploads/<filename>
```

---

## 🔒 Security Notes

- **Never share your `.env` files** — they contain your secret key.
- The `.env` files are in `.gitignore` so they won't be pushed to GitHub.
- Only the file `.env.example` (without real values) is tracked by Git.

---

## 🛠️ Troubleshooting

| Problem | Solution |
|---|---|
| `MongoDB connection failed` | Make sure MongoDB is installed and running |
| `401 Unauthorized` from the Pi | Check that `DEVICE_SECRET` matches in both `.env` files |
| Dashboard shows "Could not connect" | Make sure the backend is running (`npm run dev` in the `backend` folder) |
| No data appears | Check that the Pi script is running and the `API_URL` points to the right address |

---

## Adding More Features

The codebase is designed to be easily extended:
- **New sensor field**: Add it to `backend/src/models/TreeData.js`, update `treeController.js`, and add a column in `frontend/src/App.jsx`.
- **New API endpoint**: Add a route in `backend/src/routes/tree.js` and a handler in `backend/src/controllers/treeController.js`.
