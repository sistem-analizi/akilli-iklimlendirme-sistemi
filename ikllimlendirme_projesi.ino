#include <ArduinoJson.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <time.h>
#include <DHT.h>
#include <Wire.h>
#include <U8g2lib.h>

// ======================
// WiFi
// ======================
// const char* WIFI_SSID = "SUPERBOX_Wi-Fi_5304";
// const char* WIFI_PASS = "cevizli1907.";
const char* WIFI_SSID = "KMLAKGN";
const char* WIFI_PASS = "qazxsw123456";

// ======================
// Firebase
// ======================
const char* API_KEY = "AIzaSyDjRHWvvcpWcyNe5SHLtW40eEOkJZ4DN_Q";
const char* PROJECT_ID = "iklimlendirme-projesi-c44c7";
const char* USER_EMAIL = "esp32@gmail.com";
const char* USER_PASSWORD = "123456";

// ======================
// Firestore document paths
// ======================
const char* DOC_REFERANS       = "referans/referansid";
const char* DOC_ANLIK          = "anlik_veriler/anlikveriid";
const char* DOC_CIHAZ_DURUMU   = "cihaz_durumu/cihazdurumuid";
const char* COL_SENSOR         = "sensor_verileri";
const char* COL_CIHAZ_LOG      = "cihaz_durumu_log";
const char* COL_REFERANS_LOG   = "referans_log";

// ======================
// Donanim ayarlari
// ======================

// DHT22
#define DHTPIN 4
#define DHTTYPE DHT22

// MQ135
#define GAZ_PIN 34

// OLED I2C
#define I2C_SDA 21
#define I2C_SCL 22
#define OLED_ADDR 0x3C

// L298N - Fan Kanal A
#define FAN_PWM 14
#define FAN_IN1 26
#define FAN_IN2 27

// L298N - Ampul Kanal B
#define AMPUL_PWM 13
#define LAMP_IN3 33
#define LAMP_IN4 25

// PWM
#define PWM_FREQ 5000
#define PWM_RES  8

DHT dht(DHTPIN, DHTTYPE);
U8G2_SH1106_128X64_NONAME_F_HW_I2C u8g2(U8G2_R0, U8X8_PIN_NONE);

const unsigned long OLCUM_ARALIGI = 15000;
unsigned long sonOlcumZamani = 0;

String idToken = "";

// Referans değerleri
float sicaklikRef = 0;
float nemRef = 0;
float gazRef = 0;
bool refFanDurumu = true;
bool refAmpulDurumu = true;

// Manuel kontrol değerleri
bool manuelFan = false;
bool manuelAmpul = false;
int manuelFanPwm = 255;
int manuelAmpulPwm = 255;
String cihazModu = "auto";

String sonSensorDocName = "";

// ======================
// URL fonksiyonları
// ======================
String firestoreDocUrl(const String& docPath) {
  return "https://firestore.googleapis.com/v1/projects/" +
         String("iklimlendirme-projesi-c44c7") +
         "/databases/(default)/documents/" + docPath;
}

String firestoreCollectionUrl(const String& collectionPath) {
  return "https://firestore.googleapis.com/v1/projects/" +
         String("iklimlendirme-projesi-c44c7") +
         "/databases/(default)/documents/" + collectionPath;
}

// ======================
// OLED
// ======================
void oledYazBoot(const String& satir1, const String& satir2 = "", const String& satir3 = "") {
  u8g2.clearBuffer();
  u8g2.setFont(u8g2_font_6x12_tr);
  u8g2.drawStr(0, 15, satir1.c_str());
  if (satir2.length()) u8g2.drawStr(0, 30, satir2.c_str());
  if (satir3.length()) u8g2.drawStr(0, 50, satir3.c_str());
  u8g2.sendBuffer();
}

void oledGoster(float sicaklik, float nem, float gaz, int fanPwm, int ampulPwm, const String& mod) {
  char line1[24];
  char line2[24];
  char line3[24];
  char line4[24];
  char line5[24];

  snprintf(line1, sizeof(line1), "IKLIM TAKIP");
  snprintf(line2, sizeof(line2), "Sic: %.1f C", sicaklik);
  snprintf(line3, sizeof(line3), "Nem: %.1f %%", nem);
  snprintf(line4, sizeof(line4), "Gaz: %.0f F:%d", gaz, fanPwm);
  snprintf(line5, sizeof(line5), "Mod:%s A:%d", mod.c_str(), ampulPwm);

  u8g2.clearBuffer();
  u8g2.setFont(u8g2_font_6x12_tr);
  u8g2.drawStr(0, 10, line1);
  u8g2.drawStr(0, 22, line2);
  u8g2.drawStr(0, 34, line3);
  u8g2.drawStr(0, 46, line4);
  u8g2.drawStr(0, 58, line5);
  u8g2.sendBuffer();
}

// ======================
// WiFi
// ======================
void connectWiFi() {
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.print("WiFi baglaniliyor");

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.println("WiFi baglandi");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());
}

// ======================
// Saat
// ======================
void syncTime() {
  configTime(3 * 3600, 0, "pool.ntp.org", "time.nist.gov");

  Serial.println("Saat aliniyor...");
  time_t now = time(nullptr);

  while (now < 100000) {
    delay(500);
    Serial.print(".");
    now = time(nullptr);
  }

  Serial.println();
  Serial.println("Saat alindi!");
}

// ======================
// Firebase login
// ======================
bool firebaseLogin() {
  WiFiClientSecure client;
  client.setInsecure();

  HTTPClient https;
  String url = "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=" + String(API_KEY);

  if (!https.begin(client, url)) {
    Serial.println("Login baslatilamadi");
    return false;
  }

  https.addHeader("Content-Type", "application/json");

  String body = "{";
  body += "\"email\":\"" + String(USER_EMAIL) + "\",";
  body += "\"password\":\"" + String(USER_PASSWORD) + "\",";
  body += "\"returnSecureToken\":true";
  body += "}";

  int httpCode = https.POST(body);
  String response = https.getString();

  Serial.print("Login code: ");
  Serial.println(httpCode);

  if (httpCode != 200) {
    Serial.println(response);
    https.end();
    return false;
  }

  DynamicJsonDocument doc(4096);
  DeserializationError err = deserializeJson(doc, response);

  if (err) {
    Serial.println("Login JSON parse hatasi");
    https.end();
    return false;
  }

  idToken = doc["idToken"].as<String>();
  https.end();

  if (idToken.length() == 0) {
    Serial.println("idToken alinamadi");
    return false;
  }

  Serial.println("Firebase login basarili");
  return true;
}

// ======================
// Firestore
// ======================
bool firestoreGet(const String& docPath, String& responseOut) {
  WiFiClientSecure client;
  client.setInsecure();

  HTTPClient https;
  String url = firestoreDocUrl(docPath);

  if (!https.begin(client, url)) {
    Serial.println("GET baslatilamadi");
    return false;
  }

  https.addHeader("Authorization", "Bearer " + idToken);

  int httpCode = https.GET();
  responseOut = https.getString();

  Serial.print("GET code: ");
  Serial.println(httpCode);

  if (httpCode != 200) {
    Serial.println(responseOut);
  }

  https.end();
  return httpCode == 200;
}

bool firestorePatch(const String& docPath, const String& jsonBody) {
  WiFiClientSecure client;
  client.setInsecure();

  HTTPClient https;
  String url = firestoreDocUrl(docPath);

  if (!https.begin(client, url)) {
    Serial.println("PATCH baslatilamadi");
    return false;
  }

  https.addHeader("Authorization", "Bearer " + idToken);
  https.addHeader("Content-Type", "application/json");

  int httpCode = https.sendRequest("PATCH", jsonBody);
  String response = https.getString();

  Serial.print("PATCH code: ");
  Serial.println(httpCode);

  if (httpCode != 200) {
    Serial.println(response);
  }

  https.end();
  return httpCode == 200;
}

bool firestorePatchWithMask(const String& docPath, const String& jsonBody, const String& maskQuery) {
  WiFiClientSecure client;
  client.setInsecure();

  HTTPClient https;
  String url = firestoreDocUrl(docPath) + "?" + maskQuery;

  if (!https.begin(client, url)) {
    Serial.println("PATCH baslatilamadi");
    return false;
  }

  https.addHeader("Authorization", "Bearer " + idToken);
  https.addHeader("Content-Type", "application/json");

  int httpCode = https.sendRequest("PATCH", jsonBody);
  String response = https.getString();

  Serial.print("PATCH MASK code: ");
  Serial.println(httpCode);

  if (httpCode != 200) {
    Serial.println(response);
  }

  https.end();
  return httpCode == 200;
}

bool firestorePostAndGetName(const String& collectionPath, const String& jsonBody, String& createdDocNameOut) {
  createdDocNameOut = "";

  WiFiClientSecure client;
  client.setInsecure();

  HTTPClient https;
  String url = firestoreCollectionUrl(collectionPath);

  if (!https.begin(client, url)) {
    Serial.println("POST baslatilamadi");
    return false;
  }

  https.addHeader("Authorization", "Bearer " + idToken);
  https.addHeader("Content-Type", "application/json");

  int httpCode = https.POST(jsonBody);
  String response = https.getString();

  Serial.print("POST code: ");
  Serial.println(httpCode);

  if (httpCode != 200 && httpCode != 201) {
    Serial.println(response);
    https.end();
    return false;
  }

  DynamicJsonDocument doc(4096);
  DeserializationError err = deserializeJson(doc, response);

  if (err) {
    Serial.println("POST response parse hatasi");
    https.end();
    return false;
  }

  createdDocNameOut = doc["name"].as<String>();
  https.end();

  return createdDocNameOut.length() > 0;
}

// ======================
// JSON yardımcıları
// ======================
float parseNumberField(JsonVariant v) {
  if (!v.is<JsonObject>()) return 0;

  if (v["integerValue"].is<const char*>()) return String(v["integerValue"].as<const char*>()).toFloat();
  if (v["doubleValue"].is<const char*>())  return String(v["doubleValue"].as<const char*>()).toFloat();
  if (v["integerValue"].is<long>())        return v["integerValue"].as<long>();
  if (v["doubleValue"].is<float>())        return v["doubleValue"].as<float>();
  if (v["doubleValue"].is<double>())       return (float)v["doubleValue"].as<double>();

  return 0;
}

bool parseBoolField(JsonVariant v) {
  if (!v.is<JsonObject>()) return false;
  return v["booleanValue"] | false;
}

// ======================
// Referans oku
// ======================
bool readReferans() {
  String response;

  if (!firestoreGet(DOC_REFERANS, response)) {
    Serial.println("Referans okunamadi");
    return false;
  }

  DynamicJsonDocument doc(4096);
  DeserializationError err = deserializeJson(doc, response);

  if (err) {
    Serial.println("Referans JSON parse hatasi");
    return false;
  }

  JsonObject fields = doc["fields"];

  sicaklikRef     = parseNumberField(fields["sicaklik_ref"]);
  nemRef          = parseNumberField(fields["nem_ref"]);
  gazRef          = parseNumberField(fields["gaz_ref"]);
  refFanDurumu    = parseBoolField(fields["fandurumu"]);
  refAmpulDurumu  = parseBoolField(fields["ampuldurumu"]);

  return true;
}

// ======================
// Cihaz durumu oku
// ======================
bool readCihazDurumu() {
  String response;

  if (!firestoreGet(DOC_CIHAZ_DURUMU, response)) {
    Serial.println("Cihaz durumu okunamadi");
    return false;
  }

  DynamicJsonDocument doc(4096);
  DeserializationError err = deserializeJson(doc, response);

  if (err) {
    Serial.println("Cihaz durumu JSON parse hatasi");
    return false;
  }

  JsonObject fields = doc["fields"];

  manuelFan = parseBoolField(fields["fandurumu"]);
  manuelAmpul = parseBoolField(fields["ampuldurumu"]);

  manuelFanPwm = (int)parseNumberField(fields["fan_pwm"]);
  manuelAmpulPwm = (int)parseNumberField(fields["ampul_pwm"]);

  if (manuelFanPwm < 0) manuelFanPwm = 0;
  if (manuelFanPwm > 255) manuelFanPwm = 255;

  if (manuelAmpulPwm < 0) manuelAmpulPwm = 0;
  if (manuelAmpulPwm > 255) manuelAmpulPwm = 255;

  if (fields["mod"].is<JsonObject>() && fields["mod"]["stringValue"].is<const char*>()) {
    cihazModu = fields["mod"]["stringValue"].as<String>();
  } else {
    cihazModu = "auto";
  }

  return true;
}

// ======================
// Sensör okumaları
// ======================
float okuSicaklik() {
  for (int i = 0; i < 3; i++) {
    float t = dht.readTemperature();
    if (!isnan(t)) return t;
    delay(200);
  }

  return -1000;
}

float okuNem() {
  for (int i = 0; i < 3; i++) {
    float h = dht.readHumidity();
    if (!isnan(h)) return h;
    delay(200);
  }

  return -1000;
}

float okuGaz() {
  int analogDeger = analogRead(GAZ_PIN);
  return (float)analogDeger;
}

// ======================
// Karar verme
// ======================
void kararVer(float sicaklik, float nem, float gaz, bool &fanDurumu, bool &ampulDurumu) {
  fanDurumu = false;
  ampulDurumu = false;

  if (refFanDurumu && (sicaklik > sicaklikRef || nem > nemRef || gaz > gazRef)) {
    fanDurumu = true;
  }

  if (refAmpulDurumu && sicaklik < sicaklikRef) {
    ampulDurumu = true;
  }
}

// ======================
// Fan PWM kontrol
// ======================
void fanPwmAyarla(int pwm) {
  if (pwm < 0) pwm = 0;
  if (pwm > 255) pwm = 255;

  if (pwm == 0) {
    digitalWrite(FAN_IN1, LOW);
    digitalWrite(FAN_IN2, LOW);
    ledcWrite(FAN_PWM, 0);
  } else {
    digitalWrite(FAN_IN1, HIGH);
    digitalWrite(FAN_IN2, LOW);
    ledcWrite(FAN_PWM, pwm);
  }
}

void fanKapat() {
  fanPwmAyarla(0);
}

// ======================
// Ampul PWM kontrol
// ======================
void ampulPwmAyarla(int pwm) {
  if (pwm < 0) pwm = 0;
  if (pwm > 255) pwm = 255;

  if (pwm == 0) {
    digitalWrite(LAMP_IN3, LOW);
    digitalWrite(LAMP_IN4, LOW);
    ledcWrite(AMPUL_PWM, 0);
  } else {
    digitalWrite(LAMP_IN3, HIGH);
    digitalWrite(LAMP_IN4, LOW);
    ledcWrite(AMPUL_PWM, pwm);
  }
}

void ampulKapat() {
  ampulPwmAyarla(0);
}

void cikislariGuncelle(int fanPwm, int ampulPwm) {
  fanPwmAyarla(fanPwm);
  ampulPwmAyarla(ampulPwm);
}

// ======================
// Zaman
// ======================
String zamanDamgasiUret() {
  time_t now = time(nullptr);
  struct tm *timeinfo = localtime(&now);

  char buffer[30];
  strftime(buffer, sizeof(buffer), "%Y-%m-%d %H:%M:%S", timeinfo);

  return String(buffer);
}

// ======================
// Firestore yazımları
// ======================
bool addSensorVerileri(float sicaklik, float nem, float gaz, const String& timestampValue, String& createdDocNameOut) {
  String body = "{";
  body += "\"fields\":{";
  body += "\"sicaklik\":{\"doubleValue\":" + String(sicaklik, 2) + "},";
  body += "\"nem\":{\"doubleValue\":" + String(nem, 2) + "},";
  body += "\"gaz\":{\"doubleValue\":" + String(gaz, 2) + "},";
  body += "\"timestamp\":{\"stringValue\":\"" + timestampValue + "\"}";
  body += "}}";

  return firestorePostAndGetName(COL_SENSOR, body, createdDocNameOut);
}

bool updateAnlikVeriler(float sicaklik, float nem, float gaz, const String& timestampValue, const String& sensorDocName) {
  String body = "{";
  body += "\"fields\":{";
  body += "\"sicaklik\":{\"doubleValue\":" + String(sicaklik, 2) + "},";
  body += "\"nem\":{\"doubleValue\":" + String(nem, 2) + "},";
  body += "\"gaz\":{\"doubleValue\":" + String(gaz, 2) + "},";
  body += "\"timestamp\":{\"stringValue\":\"" + timestampValue + "\"}";

  if (sensorDocName.length() > 0) {
    body += ",";
    body += "\"veriid\":{\"referenceValue\":\"" + sensorDocName + "\"}";
  }

  body += "}}";

  return firestorePatch(DOC_ANLIK, body);
}

bool addReferansLog(const String& timestampValue, const String& sensorDocName) {
  String body = "{";
  body += "\"fields\":{";
  body += "\"sicaklik_ref\":{\"doubleValue\":" + String(sicaklikRef, 2) + "},";
  body += "\"nem_ref\":{\"doubleValue\":" + String(nemRef, 2) + "},";
  body += "\"gaz_ref\":{\"doubleValue\":" + String(gazRef, 2) + "},";
  body += "\"fandurumu\":{\"booleanValue\":" + String(refFanDurumu ? "true" : "false") + "},";
  body += "\"ampuldurumu\":{\"booleanValue\":" + String(refAmpulDurumu ? "true" : "false") + "},";
  body += "\"timestamp\":{\"stringValue\":\"" + timestampValue + "\"}";

  if (sensorDocName.length() > 0) {
    body += ",";
    body += "\"veriid\":{\"referenceValue\":\"" + sensorDocName + "\"}";
  }

  body += "}}";

  String dummy;
  return firestorePostAndGetName(COL_REFERANS_LOG, body, dummy);
}

bool updateCihazDurumu(
  bool fanDurumu,
  bool ampulDurumu,
  int fanPwm,
  int ampulPwm,
  const String& timestampValue,
  const String& sensorDocName
) {
  String body = "{";
  body += "\"fields\":{";
  body += "\"fandurumu\":{\"booleanValue\":" + String(fanDurumu ? "true" : "false") + "},";
  body += "\"ampuldurumu\":{\"booleanValue\":" + String(ampulDurumu ? "true" : "false") + "},";
  body += "\"fan_pwm\":{\"integerValue\":\"" + String(fanPwm) + "\"},";
  body += "\"ampul_pwm\":{\"integerValue\":\"" + String(ampulPwm) + "\"},";
  body += "\"mod\":{\"stringValue\":\"" + cihazModu + "\"},";
  body += "\"timestamp\":{\"stringValue\":\"" + timestampValue + "\"}";

  if (sensorDocName.length() > 0) {
    body += ",";
    body += "\"veriid\":{\"referenceValue\":\"" + sensorDocName + "\"}";
  }

  body += "}}";

  String mask = "updateMask.fieldPaths=fandurumu";
  mask += "&updateMask.fieldPaths=ampuldurumu";
  mask += "&updateMask.fieldPaths=fan_pwm";
  mask += "&updateMask.fieldPaths=ampul_pwm";
  mask += "&updateMask.fieldPaths=mod";
  mask += "&updateMask.fieldPaths=timestamp";

  if (sensorDocName.length() > 0) {
    mask += "&updateMask.fieldPaths=veriid";
  }

  return firestorePatchWithMask(DOC_CIHAZ_DURUMU, body, mask);
}

bool addCihazDurumuLog(
  bool fanDurumu,
  bool ampulDurumu,
  int fanPwm,
  int ampulPwm,
  const String& timestampValue,
  const String& sensorDocName
) {
  String body = "{";
  body += "\"fields\":{";
  body += "\"fandurumu\":{\"booleanValue\":" + String(fanDurumu ? "true" : "false") + "},";
  body += "\"ampuldurumu\":{\"booleanValue\":" + String(ampulDurumu ? "true" : "false") + "},";
  body += "\"fan_pwm\":{\"integerValue\":\"" + String(fanPwm) + "\"},";
  body += "\"ampul_pwm\":{\"integerValue\":\"" + String(ampulPwm) + "\"},";
  body += "\"mod\":{\"stringValue\":\"" + cihazModu + "\"},";
  body += "\"timestamp\":{\"stringValue\":\"" + timestampValue + "\"},";
  body += "\"cihazdurumuid\":{\"referenceValue\":\"projects/" + String(PROJECT_ID) + "/databases/(default)/documents/" + String(DOC_CIHAZ_DURUMU) + "\"}";

  if (sensorDocName.length() > 0) {
    body += ",";
    body += "\"veriid\":{\"referenceValue\":\"" + sensorDocName + "\"}";
  }

  body += "}}";

  String dummyName;
  return firestorePostAndGetName(COL_CIHAZ_LOG, body, dummyName);
}

// ======================
// Setup
// ======================
void setup() {
  Serial.begin(115200);
  delay(500);

  Wire.begin(I2C_SDA, I2C_SCL);
  u8g2.begin();
  u8g2.setI2CAddress(OLED_ADDR << 1);

  oledYazBoot("OLED basladi");
  delay(1500);

  pinMode(GAZ_PIN, INPUT);
  analogReadResolution(12);

  dht.begin();
  delay(2000);

  pinMode(FAN_PWM, OUTPUT);
  pinMode(FAN_IN1, OUTPUT);
  pinMode(FAN_IN2, OUTPUT);

  pinMode(AMPUL_PWM, OUTPUT);
  pinMode(LAMP_IN3, OUTPUT);
  pinMode(LAMP_IN4, OUTPUT);

  if (!ledcAttach(FAN_PWM, PWM_FREQ, PWM_RES)) {
    Serial.println("Fan PWM baglanamadi!");
    oledYazBoot("Fan PWM hata");
    delay(1500);
  }

  if (!ledcAttach(AMPUL_PWM, PWM_FREQ, PWM_RES)) {
    Serial.println("Ampul PWM baglanamadi!");
    oledYazBoot("Ampul PWM hata");
    delay(1500);
  }

  fanKapat();
  ampulKapat();

  oledYazBoot("WiFi baglaniyor");
  connectWiFi();

  oledYazBoot("Saat aliniyor");
  syncTime();

  oledYazBoot("Firebase giris");
  if (!firebaseLogin()) {
    oledYazBoot("Firebase hata");
    return;
  }

  oledYazBoot("Sistem hazir");
  delay(1000);
}

// ======================
// Loop
// ======================
void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    oledYazBoot("WiFi koptu");
    connectWiFi();
    syncTime();
  }

  if (millis() - sonOlcumZamani < OLCUM_ARALIGI) {
    return;
  }

  sonOlcumZamani = millis();

  if (idToken.length() == 0) {
    if (!firebaseLogin()) {
      oledYazBoot("Firebase hata");
      return;
    }
  }

  if (!readReferans()) {
    oledYazBoot("Referans hata");
    return;
  }

  if (!readCihazDurumu()) {
    oledYazBoot("Cihaz hata");
    return;
  }

  float sicaklik = okuSicaklik();
  float nem      = okuNem();
  float gaz      = okuGaz();

  if (sicaklik == -1000 || nem == -1000) {
    oledYazBoot("DHT veri hatasi");
    return;
  }

  bool fanDurumu = false;
  bool ampulDurumu = false;

  int fanPwm = 0;
  int ampulPwm = 0;

  if (cihazModu == "manual") {
    fanDurumu = manuelFan;
    ampulDurumu = manuelAmpul;

    fanPwm = fanDurumu ? manuelFanPwm : 0;
    ampulPwm = ampulDurumu ? manuelAmpulPwm : 0;
  } else {
    kararVer(sicaklik, nem, gaz, fanDurumu, ampulDurumu);

    fanPwm = fanDurumu ? 255 : 0;
    ampulPwm = ampulDurumu ? 255 : 0;
  }

  cikislariGuncelle(fanPwm, ampulPwm);
  oledGoster(sicaklik, nem, gaz, fanPwm, ampulPwm, cihazModu);

  String timestampValue = zamanDamgasiUret();

  String yeniSensorDocName = "";
  bool ok1 = addSensorVerileri(sicaklik, nem, gaz, timestampValue, yeniSensorDocName);

  if (ok1) {
    sonSensorDocName = yeniSensorDocName;
  }

  addReferansLog(timestampValue, sonSensorDocName);
  updateAnlikVeriler(sicaklik, nem, gaz, timestampValue, sonSensorDocName);

  if (cihazModu == "auto") {
    updateCihazDurumu(fanDurumu, ampulDurumu, fanPwm, ampulPwm, timestampValue, sonSensorDocName);
  }

  addCihazDurumuLog(fanDurumu, ampulDurumu, fanPwm, ampulPwm, timestampValue, sonSensorDocName);
}