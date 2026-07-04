#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <time.h>

const char* ssid = "Wokwi-GUEST";
const char* password = "";
const char* apiUrl = "http://localhost:8000/api/wokwi/status";
// Bangladesh Standard Time = UTC+6, no DST
const long gmtOffset_sec = 6 * 3600;
const int  daylightOffset_sec = 0;

// ---------- Channel definition ----------
// Each channel = one physical pin/switch that drives a GROUP of devices
// (3 lights share Room's light pin, 2 fans share Room's fan pin)
struct Channel {
  const char* room;
  const char* type;        // "light" or "fan"
  int pin;
  int buttonPin;
  int deviceCount;         // individual devices this channel represents
  float baseWatt;          // typical wattage per device when ON
  bool state;
  bool lastButtonState;
  time_t lastChanged;
};

Channel channels[6] = {
  { "Drawing", "light", 23, 2,  3, 15.0, true, HIGH, 0 },
  { "Drawing", "fan",   22, 15, 2, 60.0, true, HIGH, 0 },
  { "Work1", "light", 19, 14, 3, 15.0, true, HIGH, 0 },
  { "Work1", "fan",   18, 27, 2, 60.0, true, HIGH, 0 },
  { "Work2", "light", 13, 26, 3, 15.0, true, HIGH, 0 },
  { "Work2", "fan",   12, 25, 2, 60.0, true, HIGH, 0 },
};

unsigned long lastTelemetry = 0;
const unsigned long TELEMETRY_INTERVAL = 5000; // full snapshot every 5s

float dynamicWatt(float base);
float round2(float val);
String isoTimestamp(time_t t);
void sendTelemetry();

void setup() {
  Serial.begin(115200);
  randomSeed(analogRead(0));

  for (int i = 0; i < 6; i++) {
    pinMode(channels[i].pin, OUTPUT);
    pinMode(channels[i].buttonPin, INPUT_PULLUP);
    digitalWrite(channels[i].pin, channels[i].state ? HIGH : LOW);
  }

  Serial.print("Connecting to WiFi");
  WiFi.begin(ssid, password, 6);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Connected!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());

  // Sync time via NTP, pre-shifted to Bangladesh Standard Time (UTC+6)
  configTime(gmtOffset_sec, daylightOffset_sec, "pool.ntp.org", "time.nist.gov");
  Serial.print("Syncing time");
  time_t now = time(nullptr);
  while (now < 100000) { // wait until a real epoch comes back
    delay(300);
    Serial.print(".");
    now = time(nullptr);
  }
  Serial.println();
  Serial.print("Time synced (BD time): ");
  Serial.println(isoTimestamp(now));

  for (int i = 0; i < 6; i++) {
    channels[i].lastChanged = now;
  }

  sendTelemetry(); // initial snapshot
}

void loop() {
  bool somethingChanged = false;

  for (int i = 0; i < 6; i++) {
    bool current = digitalRead(channels[i].buttonPin);
    if (channels[i].lastButtonState == HIGH && current == LOW) {
      channels[i].state = !channels[i].state;
      digitalWrite(channels[i].pin, channels[i].state ? HIGH : LOW);
      channels[i].lastChanged = time(nullptr);
      somethingChanged = true;
      delay(200); // debounce
    }
    channels[i].lastButtonState = current;
  }

  if (somethingChanged) {
    sendTelemetry();
  }

  if (millis() - lastTelemetry >= TELEMETRY_INTERVAL) {
    sendTelemetry();
  }
}

// Jitters wattage a bit so power draw looks "live" instead of a fixed number
float dynamicWatt(float base) {
  int jitterPercent = random(-8, 9); // -8% .. +8%
  return base * (1.0 + jitterPercent / 100.0);
}

float round2(float val) {
  return round(val * 100.0) / 100.0;
}

String isoTimestamp(time_t t) {
  struct tm timeinfo;
  localtime_r(&t, &timeinfo);
  char buf[30];
  strftime(buf, sizeof(buf), "%Y-%m-%dT%H:%M:%S+06:00", &timeinfo);
  return String(buf);
}

void sendTelemetry() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected, skipping telemetry");
    return;
  }

  DynamicJsonDocument doc(4096);
  JsonArray devices = doc.to<JsonArray>();

  for (int i = 0; i < 6; i++) {
    Channel &c = channels[i];
    for (int d = 1; d <= c.deviceCount; d++) {
      JsonObject dev = devices.createNestedObject();
      String label = (String(c.type) == "light") ? "Light" : "Fan";
      dev["device"]       = String(c.room) + "_" + label + String(d);
      dev["room"]         = c.room;
      dev["type"]         = c.type;
      dev["status"]       = c.state ? "on" : "off";
      dev["power_watts"]  = c.state ? round2(dynamicWatt(c.baseWatt)) : 0.0;
      dev["last_changed"] = isoTimestamp(c.lastChanged);
    }
  }

  String payload;
  serializeJson(doc, payload);

  HTTPClient http;
  http.begin(apiUrl);
  http.addHeader("Content-Type", "application/json");
  int responseCode = http.POST(payload);

  Serial.print("POST status: ");
  Serial.println(responseCode);
  Serial.println(payload);

  http.end();
  lastTelemetry = millis();
}
