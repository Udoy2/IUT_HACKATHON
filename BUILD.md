# Office Watch — Build Spec

**Lights, Fans, Discord: The Boss's Big Idea**

This is the single source-of-truth build document. It merges the problem statement with the
three planning drafts, resolves conflicts between them, and is written to be pasted whole into
an AI coding editor (Claude Code, Cursor, etc.) to start building immediately.

---

## 1. Problem Summary

Build a system that lets anyone monitor 18 simulated electrical devices across 3 office rooms
through a real-time web dashboard **and** a Discord bot, both reading from **one shared backend**
that is the single source of truth for device state. No real hardware — device data is simulated.
A circuit schematic and a system diagram are required as separate, non-code deliverables.

**Office layout (fixed):**
- Drawing Room — 2 fans, 3 lights
- Work Room 1 — 2 fans, 3 lights
- Work Room 2 — 2 fans, 3 lights
- 18 devices total

---

## 2. Tech Stack

| Layer | Choice |
|---|---|
| Backend | Python, FastAPI, Uvicorn |
| State store | In-memory dict (single process). SQLite optional, only for alert history, add last if at all |
| Real-time | **SSE** via `sse-starlette`, one-way server → client |
| Simulator | `asyncio` background task, same process as the API |
| Frontend | **React + Vite**, TypeScript, native `EventSource` |
| Charts | Chart.js or Recharts |
| Discord bot | `discord.py`, `httpx` for REST calls to the backend |
| LLM humanization | Groq API (Llama 3) — layered on last, optional at demo time |
| Circuit | Wokwi (ESP32 + relays + ACS712, one representative room) |
| System diagram | Excalidraw or draw.io — **no Mermaid** |

---

## 3. High-Level Architecture

```
Device Simulator (asyncio task)
        |
        v
DeviceStore (in-memory, single source of truth)
        |
   +----+-----------------+
   |                       |
   v                       v
Alert Engine            REST API
   |                       |
   +-----------+-----------+
               |
               v
          SSE Manager (/stream)
               |
      +--------+---------+
      |                  |
      v                  v
React Dashboard    Discord Bot (REST only, never touches DeviceStore directly)
                          |
                          v
                    Groq LLM (optional humanization pass)
```

**Why this satisfies the architecture requirement:** both clients are read-only consumers of the
same backend process. Neither dashboard nor bot ever holds its own copy of device state, so they
cannot disagree with each other.

**Data flow, step by step:**
1. Simulator flips a random device's `status` every 3–15s and updates `last_changed`. It is the
   *only* writer of state.
2. DeviceStore is one in-memory dict of 18 devices — nothing else holds a copy.
3. Alert engine reads DeviceStore on a timer (every 30–60s), checks two rules (after-hours,
   room-stuck-on), and on a new trigger: logs it, pushes it over SSE, and optionally POSTs to a
   Discord webhook.
4. Dashboard does one REST `GET` on load for initial state, then opens one `EventSource`
   connection and applies push updates — no polling, no manual refresh.
5. Discord bot is a separate process. Every command triggers a REST call to the backend, gets
   JSON back, and (optionally) passes that JSON through Groq to produce a friendly sentence.

---

## 4. Data Model

```jsonc
// Device
{
  "id": "wr1-fan1",              // room_prefix-type+index
  "name": "Fan 1",
  "type": "fan",                 // "fan" | "light"
  "room": "work1",               // "drawing" | "work1" | "work2"
  "status": "on",                // "on" | "off"
  "power_w": 58,                 // fans ~60W, lights ~15W, ±5W randomization
  "last_changed": "2026-07-03T14:22:10Z"
}
```

```jsonc
// Alert
{
  "id": "alert-0007",
  "type": "after_hours",         // "after_hours" | "room_stuck_on"
  "room": "work1",               // or null if office-wide
  "message": "Work Room 2 has 2 fans and 3 lights on at 10:04 PM",
  "triggered_at": "2026-07-03T22:04:00Z",
  "active": true
}
```

Room keys are consistent everywhere: `drawing`, `work1`, `work2`.

---

## 5. API Contract

| Endpoint | Method | Returns |
|---|---|---|
| `/api/devices` | GET | List of all 18 device objects |
| `/api/rooms/{room}` | GET | List of 5 device objects for that room |
| `/api/usage` | GET | `{ total_w, per_room: {drawing, work1, work2}, kwh_today }` |
| `/api/alerts` | GET | List of active alert objects |
| `/stream` | SSE (GET) | Streams `{ type: "device_update" \| "alert", data: ... }` events |

Keep the JSON shape identical between what SSE pushes and what REST returns — the bot and
dashboard parse the same schema.

---

## 6. Alert Rules

**After-hours rule**
- Office hours: 9:00 AM–5:00 PM
- Trigger: any device with `status == "on"` and current time outside that window
- One alert per device per continuous on-period outside hours — don't spam every tick

**Room-stuck-on rule**
- Trigger: all 5 devices in a room have had `status == "on"` continuously for 2+ hours
- Track a `room_all_on_since` timestamp per room; reset the moment any device in that room
  turns off
- Fire once when the 2-hour threshold is crossed, not repeatedly

Both rules run in the alert engine's periodic tick against the live DeviceStore — no separate
data source.

---

## 7. Web Dashboard — Minimum Required Features

- **Live Device Status Panel** — all 18 devices, grouped by room, clear on/off indicator per
  device (e.g. "Fan 1", "Light 3"), updates without page refresh (via SSE)
- **Live Power Consumption Meter** — total office wattage + per-room breakdown, updates live
- **Active Alerts Panel** — timestamped, shows after-hours and room-stuck-on alerts
- **(Bonus)** Top-view office layout — lights glow when on, fans animate when running

---

## 8. Discord Bot — Minimum Required Commands

| Command | Behavior |
|---|---|
| `!status` | Full office summary in natural language, e.g. "Drawing Room: 1 fan ON, 2 lights ON. Work Room 1: all off. Work Room 2: 2 fans ON, 3 lights ON." |
| `!room <name>` | Status of one room, e.g. `!room work1` |
| `!usage` | e.g. "Total power right now: 740W. Today's estimated usage: 4.2 kWh." |

- Responses must come from real backend data — never hardcoded or random.
- Responses should be humanized/friendly; Groq-generated tone is encouraged but must have a
  plain-text fallback if the LLM call fails or rate-limits.
- **(Bonus)** Bot proactively posts to a designated channel when an alert triggers, e.g.
  "⚠️ Hey! Work Room 2 still has 2 fans and 3 lights ON and it's 10 PM. Did someone forget to
  leave?"

---

## 9. Circuit Schematic Plan (Wokwi)

**Scope:** one representative room only (e.g. Work Room 1 — 2 fans, 3 lights). Do not wire all
18 devices — the problem statement explicitly says one room is enough.

**Components:**
- ESP32 dev board (WiFi-capable — matches the "sends data to backend" story even though it's
  not literally connected in the demo)
- 5 relay modules (or transistor + flyback diode), one per device, driven by ESP32 GPIO pins
- 1 ACS712 current sensor inline with one load, feeding an ESP32 ADC pin, representing power
  draw sensing
- Status LEDs per relay output for visual on/off confirmation in the simulator

**Caption/story for the README:** ESP32 GPIO → relay → switches the AC load (fan/light) →
ACS712 reads current on that line → ESP32 reads ADC value → (in a real deployment) posts the
reading to the backend's REST API. This satisfies "must make physical sense" without wiring
all 18 devices.

---

## 10. Repo Structure

```
/backend
  main.py            FastAPI app entrypoint
  models.py          Device / Alert data classes
  store.py           DeviceStore (single source of truth)
  simulator.py       Background task that mutates state
  alerts.py          Alert engine + rule checks
  sse_manager.py      SSE connection/broadcast handling
/frontend
  src/
    components/      DeviceStatusPanel, PowerMeter, AlertsPanel, OfficeLayout
    hooks/
      useDeviceStream.ts   EventSource wrapper
    types/
  index.html
  vite.config.ts
/bot
  bot.py             discord.py bot, REST client, Groq integration
/diagrams
  system_diagram.png       (Excalidraw export)
  circuit_schematic.png    (Wokwi export)
README.md
```

---

## 11. Build Order (each step demoable before moving to the next)

1. **Backend skeleton** — returns 18 hardcoded devices. Test: hit it in a browser.
2. **Simulator** — background task mutates state every few seconds. Test: hit twice, see a
   difference.
3. **SSE broadcast** — pushes state on change. Test: open a browser tab pointed at `/stream`
   (or `curl -N`) and watch events land.
4. **`/api/usage`** — computed from current state, no new data needed.
5. **Frontend v0** — fetch on load, render a plain list. Ugly is fine.
6. **Frontend v1** — connect via `EventSource`, update the list live. This is the first real
   end-to-end win — stop and commit here.
7. **Alert engine skeleton** — function that returns `[]`. Wire the `alert` SSE event type now,
   fill in real rules later.
8. **Discord bot skeleton** — bot connects, responds to `!ping`. Confirms token/permissions work
   before building real commands.
9. **Wire the three commands** — plain-text responses straight from REST JSON, no LLM yet. This
   alone satisfies the 10% bot-weight criterion.
10. **Alert rules for real** — after-hours + room-stuck-on logic, now that the pipe exists.
11. **Groq humanization** — drop the LLM step into the bot last, once raw commands already work.
    If it breaks or rate-limits, fall back to plain-text, not to nothing.
12. **Power meter + per-room breakdown** on the dashboard.
13. **Alerts panel** on the dashboard, subscribing to the same SSE stream.
14. **Bonus: office layout visualization** (glowing lights, spinning fans) — only start once
    1–13 all work.
15. **Bonus: proactive alert webhook to Discord.**
16. **Circuit + diagram** — should already be near-done in parallel; finalize into `/diagrams`.
17. **README pass** — setup instructions for a stranger to run backend, frontend, and bot from a
    clean clone.
18. **Feature freeze.** No new code after this point.
19. **Record the demo video** (see outline below).

---

## 12. Time Budget (percentage of total time — scale to your actual hours)

| Chunk | % of total time |
|---|---|
| Setup + contract | 5% |
| Backend core (steps 1–4) | 20% |
| Frontend core (steps 5–6, 12–13) | 20% |
| Bot core (steps 8–9) | 10% |
| Alerts (steps 7, 10) | 10% |
| LLM humanization (step 11) | 5% |
| Circuit + diagram (step 16) | 10% (parallel, doesn't block above) |
| Bonus visuals + webhook (steps 14–15) | 10% — first thing to cut if behind |
| README + commits (step 17) | 5% |
| Video (step 19) | 5% |

---

## 13. Traps That Eat Time for No Grading Benefit

- Don't build a database early. An in-memory dict is enough; SQLite is optional and only for
  alert history — add it last if at all.
- Don't deploy to the cloud unless everything else is finished. Nothing in the rubric requires a
  public URL — a local run + video is sufficient.
- Don't perfect the office-layout visualization before the required panels work. It's a bonus;
  the three "minimum required features" are worth more.
- Don't let the LLM step block the bot. Ship plain-text responses first, layer Groq on top.
- Don't wire all 18 devices in Wokwi. One representative room is explicitly enough — more
  wiring is wasted time, not extra credit.
- Don't skip commits to "save time." One good commit per completed step is free points and a
  fallback checkpoint if something breaks later.

**If behind schedule, cut in this order:**
1. Proactive Discord alert webhook (step 15)
2. Office layout glow/animation (step 14)
3. LLM humanization — fall back to plain-text bot responses (step 11)
4. Per-room usage breakdown → just show total wattage
5. **Never cut:** the three required dashboard panels, the three bot commands, the diagram, the
   circuit, the README.

---

## 14. Definition of Done (freeze checklist before recording)

- [ ] All 18 devices visible and updating live on the dashboard without refresh
- [ ] Power meter shows a live total that matches what the devices imply
- [ ] At least one alert has been seen triggering during testing
- [ ] `!status`, `!room <name>`, `!usage` all return real data, not placeholders
- [ ] Circuit schematic and system diagram are both in `/diagrams`
- [ ] README lets someone else run all three pieces (backend, frontend, bot) from a clean clone
- [ ] Repo has an incremental commit history, not one giant commit

---

## 15. Demo Video Outline (≤3 min)

1. **0:00–0:20** — One-line pitch: what the boss asked for, what you built
2. **0:20–1:10** — Dashboard walkthrough: live device panel updating, power meter changing,
   trigger/show an alert
3. **1:10–2:00** — Discord bot: run `!status`, `!room work1`, `!usage` live, show humanized
   responses
4. **2:00–2:30** — Architecture: 10-second flash of the system diagram, explain "one backend,
   two clients"
5. **2:30–3:00** — Circuit schematic quick look, wrap up

---

## 16. Evaluation Criteria → What Satisfies It

| Criterion | Weight | Satisfied by |
|---|---|---|
| Working web dashboard, real-time | 20% | Build steps 5–6, SSE push |
| Working Discord bot, real data | 10% | Build steps 8–9, REST calls to backend |
| Dashboard visuals/UX | 10% | Step 14, office layout + clean panels |
| System diagram | 15% | Step 16, Excalidraw, no Mermaid |
| Circuit schematic | 15% | Step 16, Wokwi one-room design |
| Dummy data quality | 15% | Steps 1–2, realistic wattages + dynamic changes + alert logic |
| Codebase/commits/docs | 15% | Step 17, README + incremental commits |

---

## 17. Clarifications Carried Over From the Problem Statement

1. No physical hardware required — device data in the demo is simulated.
2. The bot and dashboard must reflect the same live data — they share one backend.
3. Dashboard updates must happen without a manual page refresh.
4. Exact command names, UI layout, and visual design are up to you — just keep it usable and
   clean.
5. Any programming language, library, or AI/LLM is allowed (LLM-generated conversational
   responses are encouraged for the bot).
