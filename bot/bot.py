"""
Office Watch — Discord Bot
Commands: !status  !room <name>  !usage  !ping
Responses are humanized via Groq (Llama 3) with a plain-text fallback.
"""

import os
import asyncio
import logging
from datetime import datetime, timezone, timedelta

import discord
import httpx
from discord.ext import commands
from dotenv import load_dotenv

try:
    from groq import Groq
    groq_available = True
except ImportError:
    groq_available = False

load_dotenv()

DISCORD_TOKEN = os.getenv("DISCORD_TOKEN", "")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
ALERT_CHANNEL_ID = int(os.getenv("ALERT_CHANNEL_ID", "0"))
ALERT_POLL_SECONDS = int(os.getenv("ALERT_POLL_SECONDS", "30"))

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("officewatch-bot")

intents = discord.Intents.default()
intents.message_content = True
bot = commands.Bot(command_prefix="!", intents=intents)

ROOM_DISPLAY = {
    "drawing": "Drawing Room",
    "work1": "Work Room 1",
    "work2": "Work Room 2",
}

# ── Groq humanization ─────────────────────────────────────────────────────────

groq_client = None
if groq_available and GROQ_API_KEY:
    groq_client = Groq(api_key=GROQ_API_KEY)


def humanize(prompt: str, fallback: str) -> str:
    if groq_client is None:
        return fallback
    try:
        response = groq_client.chat.completions.create(
            model="llama3-8b-8192",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a friendly office assistant bot. "
                        "Summarize the given raw device status data into one or two clear, "
                        "friendly sentences. Keep it concise. Use emojis sparingly."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            max_tokens=200,
            temperature=0.7,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        log.warning("Groq error: %s — using plain-text fallback", e)
        return fallback


# ── REST helpers ──────────────────────────────────────────────────────────────

async def _get(path: str):
    async with httpx.AsyncClient(base_url=BACKEND_URL, timeout=10) as client:
        r = await client.get(path)
        r.raise_for_status()
        return r.json()


# ── Commands ──────────────────────────────────────────────────────────────────

@bot.event
async def on_ready():
    log.info("Logged in as %s (id=%s)", bot.user, bot.user.id)
    if ALERT_CHANNEL_ID:
        bot.loop.create_task(proactive_alert_task())


@bot.command(name="ping")
async def ping(ctx):
    await ctx.send("🟢 Office Watch bot is online and connected to the backend!")


@bot.command(name="status")
async def status(ctx):
    await ctx.send("⏳ Fetching office status…")
    try:
        devices = await _get("/api/devices")
    except Exception as e:
        await ctx.send(f"❌ Could not reach backend: {e}")
        return

    # Build plain-text summary per room
    by_room: dict[str, list] = {"drawing": [], "work1": [], "work2": []}
    for d in devices:
        by_room[d["room"]].append(d)

    lines = []
    raw_lines = []
    for room_key, label in ROOM_DISPLAY.items():
        room_devices = by_room[room_key]
        fans_on = sum(1 for d in room_devices if d["type"] == "fan" and d["status"] == "on")
        lights_on = sum(1 for d in room_devices if d["type"] == "light" and d["status"] == "on")
        total_fans = sum(1 for d in room_devices if d["type"] == "fan")
        total_lights = sum(1 for d in room_devices if d["type"] == "light")
        if fans_on == 0 and lights_on == 0:
            summary = "all off"
        else:
            parts = []
            if fans_on:
                parts.append(f"{fans_on}/{total_fans} fan(s) ON")
            if lights_on:
                parts.append(f"{lights_on}/{total_lights} light(s) ON")
            summary = ", ".join(parts)
        lines.append(f"**{label}**: {summary}")
        raw_lines.append(f"{label}: {summary}")

    plain = "\n".join(raw_lines)
    prompt = f"Office status right now:\n{plain}"
    human = humanize(prompt, plain)

    embed = discord.Embed(
        title="🏢 Office Status",
        description=human,
        colour=discord.Colour.blue(),
        timestamp=datetime.now(timezone.utc),
    )
    for room_key, label in ROOM_DISPLAY.items():
        room_devices = by_room[room_key]
        device_lines = []
        for d in room_devices:
            icon = ("🌀" if d["type"] == "fan" else "💡") + (" ON" if d["status"] == "on" else " off")
            w = f" ({d['power_w']}W)" if d["status"] == "on" else ""
            device_lines.append(f"{d['name']}: {icon}{w}")
        embed.add_field(name=label, value="\n".join(device_lines), inline=True)

    await ctx.send(embed=embed)


@bot.command(name="room")
async def room_cmd(ctx, room_name: str = ""):
    room_map = {
        "drawing": "drawing",
        "draw": "drawing",
        "work1": "work1",
        "wr1": "work1",
        "work2": "work2",
        "wr2": "work2",
    }
    key = room_map.get(room_name.lower(), "")
    if not key:
        await ctx.send(
            "❓ Unknown room. Use: `!room drawing`, `!room work1`, or `!room work2`"
        )
        return

    try:
        devices = await _get(f"/api/rooms/{key}")
    except Exception as e:
        await ctx.send(f"❌ Could not reach backend: {e}")
        return

    label = ROOM_DISPLAY[key]
    fans_on = sum(1 for d in devices if d["type"] == "fan" and d["status"] == "on")
    lights_on = sum(1 for d in devices if d["type"] == "light" and d["status"] == "on")
    total_w = sum(d["power_w"] for d in devices if d["status"] == "on")

    plain = (
        f"{label}: {fans_on} fan(s) ON, {lights_on} light(s) ON. "
        f"Current draw: {total_w:.0f}W."
    )
    human = humanize(f"Room status for {label}:\n{plain}", plain)

    embed = discord.Embed(
        title=f"🚪 {label}",
        description=human,
        colour=discord.Colour.green(),
        timestamp=datetime.now(timezone.utc),
    )
    device_lines = []
    for d in devices:
        icon = ("🌀" if d["type"] == "fan" else "💡") + (" ON" if d["status"] == "on" else " off")
        w = f" ({d['power_w']}W)" if d["status"] == "on" else ""
        device_lines.append(f"{d['name']}: {icon}{w}")
    embed.add_field(name="Devices", value="\n".join(device_lines), inline=False)
    await ctx.send(embed=embed)


@bot.command(name="usage")
async def usage_cmd(ctx):
    try:
        data = await _get("/api/usage")
    except Exception as e:
        await ctx.send(f"❌ Could not reach backend: {e}")
        return

    total_w = data["total_w"]
    kwh = data["kwh_today"]
    per_room = data["per_room"]

    plain = (
        f"Total power right now: {total_w}W. "
        f"Today's estimated usage: {kwh} kWh. "
        f"Drawing Room: {per_room['drawing']}W, "
        f"Work Room 1: {per_room['work1']}W, "
        f"Work Room 2: {per_room['work2']}W."
    )
    human = humanize(f"Power usage data:\n{plain}", plain)

    embed = discord.Embed(
        title="⚡ Power Usage",
        description=human,
        colour=discord.Colour.gold(),
        timestamp=datetime.now(timezone.utc),
    )
    embed.add_field(name="Total Now", value=f"{total_w} W", inline=True)
    embed.add_field(name="Est. Today", value=f"{kwh} kWh", inline=True)
    embed.add_field(name="\u200b", value="\u200b", inline=True)
    for room_key, label in ROOM_DISPLAY.items():
        embed.add_field(name=label, value=f"{per_room[room_key]} W", inline=True)
    await ctx.send(embed=embed)


# ── Bonus: proactive alert webhook ────────────────────────────────────────────

_seen_alert_ids: set[str] = set()


async def proactive_alert_task():
    await bot.wait_until_ready()
    channel = bot.get_channel(ALERT_CHANNEL_ID)
    if channel is None:
        log.warning("ALERT_CHANNEL_ID %s not found — proactive alerts disabled", ALERT_CHANNEL_ID)
        return
    log.info("Proactive alert task started → channel #%s", channel.name)
    while not bot.is_closed():
        await asyncio.sleep(ALERT_POLL_SECONDS)
        try:
            alerts = await _get("/api/alerts")
        except Exception as e:
            log.warning("Alert poll failed: %s", e)
            continue
        for a in alerts:
            if a["id"] not in _seen_alert_ids:
                _seen_alert_ids.add(a["id"])
                icon = "⚠️" if a["type"] == "after_hours" else "🔴"
                local_ts = datetime.fromisoformat(a["triggered_at"]).astimezone(
                    timezone(timedelta(hours=6))
                )
                ts_str = local_ts.strftime("%I:%M %p")
                embed = discord.Embed(
                    title=f"{icon} Office Alert",
                    description=a["message"],
                    colour=discord.Colour.red(),
                )
                embed.set_footer(text=f"Triggered at {ts_str}")
                await channel.send(embed=embed)


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    if not DISCORD_TOKEN:
        log.error("DISCORD_TOKEN not set. Create a .env file in /bot with DISCORD_TOKEN=...")
    else:
        bot.run(DISCORD_TOKEN)
