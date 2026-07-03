# Office Watch 🏢

Real-time electrical monitoring for 18 simulated devices across 3 office rooms, with a live web dashboard and a Discord bot — both reading from one shared FastAPI backend.

---

## Project Structure

```
/backend   — FastAPI + SSE server + simulator + alert engine
/frontend  — React + Vite + TypeScript dashboard
/bot       — Discord bot with Groq humanization
/diagrams  — System diagram + circuit schematic
```

---

## Quick Start

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API will be live at `http://localhost:8000`.  
Test it: `http://localhost:8000/api/devices`  
SSE stream: `curl -N http://localhost:8000/stream`

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Dashboard at `http://localhost:5173`.

### 3. Discord Bot

```bash
cd bot
pip install -r requirements.txt
cp .env.example .env
# Edit .env: add DISCORD_TOKEN and optionally GROQ_API_KEY
python bot.py
```

---

## Bot Commands

| Command | Description |
|---|---|
| `!ping` | Health check |
| `!status` | Full office summary (all 3 rooms) |
| `!room drawing` | Status of Drawing Room |
| `!room work1` | Status of Work Room 1 |
| `!room work2` | Status of Work Room 2 |
| `!usage` | Total wattage + per-room breakdown + kWh estimate |

Room aliases accepted: `draw`, `wr1`, `wr2`.

---

## Bot `.env` Variables

| Variable | Required | Description |
|---|---|---|
| `DISCORD_TOKEN` | ✅ | Bot token from Discord Developer Portal |
| `BACKEND_URL` | ✅ | Backend URL (default: `http://localhost:8000`) |
| `GROQ_API_KEY` | Optional | For humanized responses via Llama 3 |
| `ALERT_CHANNEL_ID` | Optional | Channel ID for proactive alert messages |
| `ALERT_POLL_SECONDS` | Optional | How often to poll alerts (default: 30) |

---

## Architecture

```
Device Simulator (asyncio) → DeviceStore (in-memory, single source of truth)
                                   |
                 +-----------------+----------------+
                 |                                  |
            Alert Engine                       REST API (/api/*)
                 |                                  |
                 +------------- SSE Manager --------+
                                    |
                    +---------------+---------------+
                    |                               |
             React Dashboard               Discord Bot
             (EventSource)            (REST calls to backend)
                                              |
                                        Groq LLM (optional)
```

---

## Alert Rules

- **After-hours**: Any device ON outside 9 AM–5 PM fires one alert per device per continuous on-period.
- **Room stuck-on**: All 5 devices in a room continuously ON for 2+ hours → one alert per period.

---

## Evaluation Criteria Coverage

| Criterion | Component |
|---|---|
| Real-time dashboard | Frontend SSE + React |
| Discord bot | `bot/bot.py` — 3 commands + fallback |
| Dashboard UX | Dark-mode UI, animated fans/lights, power arc gauge |
| System diagram | `/diagrams/system_diagram.png` |
| Circuit schematic | `/diagrams/circuit_schematic.png` |
| Dummy data quality | Realistic wattages (fans ~60W, lights ~15W ±5W) |
| Codebase/docs | This README + incremental commits |
