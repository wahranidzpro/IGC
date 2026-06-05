'use client';

import Link from 'next/link';
import { ArrowLeft, Radio, Monitor, Wifi, Terminal, ArrowRight, Cpu, CheckCircle, Shield, Smartphone, Key } from 'lucide-react';
import { useState } from 'react';
import { logger } from "@/lib/logger"

export default function RfidHardwarePage() {
  const [tab, setTab] = useState<'usb' | 'esp32'>('usb');

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/turnstiles" className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-white">Installation du Lecteur RFID</h2>
          <p className="text-gray-400 text-sm">Connectez un lecteur RFID physique au système Infinity Gym</p>
        </div>
      </div>

      {/* Architecture diagram */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-white mb-4">Architecture de connexion</h3>
        <div className="flex items-center justify-center gap-4 text-xs">
          <div className="text-center">
            <div className="w-20 h-20 bg-gray-800 rounded-xl flex items-center justify-center mx-auto mb-2">
              <Radio className="w-8 h-8 text-blue-400" />
            </div>
            <p className="text-gray-300 font-medium">Lecteur RFID</p>
            <p className="text-gray-500">USB / ESP32</p>
          </div>
          <ArrowRight className="w-6 h-6 text-gray-600" />
          <div className="text-center">
            <div className="w-20 h-20 bg-gray-800 rounded-xl flex items-center justify-center mx-auto mb-2">
              <Monitor className="w-8 h-8 text-green-400" />
            </div>
            <p className="text-gray-300 font-medium">PC / ESP32</p>
            <p className="text-gray-500">Traitement local</p>
          </div>
          <ArrowRight className="w-6 h-6 text-gray-600" />
          <div className="text-center">
            <div className="w-20 h-20 bg-gray-800 rounded-xl flex items-center justify-center mx-auto mb-2">
              <Terminal className="w-8 h-8 text-orange-400" />
            </div>
            <p className="text-gray-300 font-medium">API</p>
            <p className="text-gray-500">Validation</p>
          </div>
          <ArrowRight className="w-6 h-6 text-gray-600" />
          <div className="text-center">
            <div className="w-20 h-20 bg-gray-800 rounded-xl flex items-center justify-center mx-auto mb-2">
              <Wifi className="w-8 h-8 text-purple-400" />
            </div>
            <p className="text-gray-300 font-medium">Supabase</p>
            <p className="text-gray-500">Cloud</p>
          </div>
          <ArrowRight className="w-6 h-6 text-gray-600" />
          <div className="text-center">
            <div className="w-20 h-20 bg-gray-800 rounded-xl flex items-center justify-center mx-auto mb-2">
              <Smartphone className="w-8 h-8 text-red-400" />
            </div>
            <p className="text-gray-300 font-medium">Tourniquet</p>
            <p className="text-gray-500">Porte / Gâche</p>
          </div>
        </div>
      </div>

      {/* Tab toggle */}
      <div className="flex gap-2">
        <button onClick={() => setTab('usb')}
          className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
            tab === 'usb'
              ? 'bg-orange-500 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}>
          Simple (USB)
        </button>
        <button onClick={() => setTab('esp32')}
          className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
            tab === 'esp32'
              ? 'bg-orange-500 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}>
          Pro (ESP32 + RC522)
        </button>
      </div>

      {tab === 'usb' ? (
        <>
          {/* Matériel nécessaire */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Radio className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">Matériel nécessaire</h3>
            </div>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>• Lecteur RFID USB 125kHz (EM4100) — ~15€</li>
              <li>• PC sous Windows / macOS / Linux</li>
              <li>• Badges RFID compatibles 125kHz</li>
            </ul>
          </div>

          {/* Steps */}
          <div className="space-y-4">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-sm">1</div>
                <h3 className="text-lg font-semibold text-white">Brancher le lecteur USB</h3>
              </div>
              <p className="text-sm text-gray-400">Connectez le lecteur RFID sur un port USB libre. Le voyant du lecteur doit s'allumer (rouge ou bleu selon le modèle).</p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-sm">2</div>
                <h3 className="text-lg font-semibold text-white">Installer le driver (si nécessaire)</h3>
              </div>
              <p className="text-sm text-gray-400">La plupart des lecteurs 125kHz sont reconnus automatiquement comme un clavier HID. Si un driver est requis, le fabricant le fournit sur sa page support.</p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-sm">3</div>
                <h3 className="text-lg font-semibold text-white">Mode clavier émulé</h3>
              </div>
              <p className="text-sm text-gray-400">Le lecteur se comporte comme un clavier. Quand un badge est scanné, le code RFID est tapé automatiquement comme du texte, suivi d'un <strong className="text-white">Entrée</strong>.</p>
              <code className="block mt-2 px-4 py-2 bg-gray-800 rounded-lg text-sm text-green-300 font-mono w-fit">0005123456 (suivi de ↵)</code>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-sm">4</div>
                <h3 className="text-lg font-semibold text-white">Tester dans la page Pointage</h3>
              </div>
              <p className="text-sm text-gray-400">Ouvrez la page <Link href="/checkin" className="text-orange-400 hover:text-orange-300">Pointage</Link>, activez le mode RFID, puis scannez un badge. Le code doit apparaître dans le champ de saisie.</p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-sm">5</div>
                <h3 className="text-lg font-semibold text-white">Associer le badge à un membre</h3>
              </div>
              <p className="text-sm text-gray-400">Allez dans la section <strong className="text-white">Gestion RFID</strong> (paramètres du membre) et associez le code scanné au compte adhérent.</p>
            </div>

            {/* Code example */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Terminal className="w-5 h-5 text-green-400" />
                <h3 className="text-lg font-semibold text-white">Script de test (Node.js)</h3>
              </div>
              <p className="text-sm text-gray-400 mb-3">Script minimal qui lit le code depuis stdin (lecture badge) et l'envoie à l'API :</p>
              <pre className="bg-gray-950 border border-gray-800 rounded-xl p-4 text-sm font-mono text-gray-300 overflow-x-auto">
{`const http = require('http');

const API_URL = 'VOTRE_URL_SUPABASE';
const API_KEY = 'VOTRE_CLE_API';

process.stdin.on('data', async (data) => {
  const rfidCode = data.toString().trim();
  if (!rfidCode) return;

  const body = JSON.stringify({
    rfid: rfidCode,
    method: 'rfid_usb',
  });

  const res = await fetch(\`\${API_URL}/functions/v1/rfid-check\`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
    },
    body,
  });

  const result = await res.json();
  logger.info('Résultat:', result);
  process.stdout.write('✓ ');
});`}
              </pre>
              <p className="text-xs text-gray-500 mt-2">Lancez avec : <code className="text-gray-300">node rfid.js</code> — scannez un badge et le script envoie la requête automatiquement.</p>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Matériel nécessaire */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Cpu className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">Matériel nécessaire</h3>
            </div>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>• ESP32 (ESP32-WROOM ou ESP32-S3) — ~8€</li>
              <li>• Module RC522 RFID — ~3€</li>
              <li>• Relais 1 canal 5V — ~4€</li>
              <li>• Serrure magnétique ou tourniquet — ~50-200€</li>
              <li>• Alimentation 12V (pour serrure)</li>
              <li>• Badges RFID 13.56MHz (MIFARE) ou 125kHz selon module</li>
            </ul>
          </div>

          {/* Schéma de câblage */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Terminal className="w-5 h-5 text-orange-400" />
              <h3 className="text-lg font-semibold text-white">Schéma de câblage</h3>
            </div>

            <h4 className="text-sm font-semibold text-white mb-2">RC522 → ESP32</h4>
            <pre className="bg-gray-950 border border-gray-800 rounded-xl p-4 text-sm font-mono text-gray-300 overflow-x-auto mb-4">
{`RC522         ESP32
─────         ─────
SDA   ─────── GPIO5  (SS)
SCK   ─────── GPIO18
MOSI  ─────── GPIO23
MISO  ─────── GPIO19
IRQ   ─────── NC
GND   ─────── GND
RST   ─────── GPIO22
VCC   ─────── 3.3V`}
            </pre>

            <h4 className="text-sm font-semibold text-white mb-2">Relais → ESP32</h4>
            <pre className="bg-gray-950 border border-gray-800 rounded-xl p-4 text-sm font-mono text-gray-300 overflow-x-auto">
{`Relais        ESP32
──────        ─────
IN    ─────── GPIO13
VCC   ─────── 5V
GND   ─────── GND
COM/NO ────── Serrure magnétique 12V`}
            </pre>
          </div>

          {/* Steps */}
          <div className="space-y-4">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 font-bold text-sm">1</div>
                <h3 className="text-lg font-semibold text-white">Câbler l'ESP32 selon le schéma</h3>
              </div>
              <p className="text-sm text-gray-400">Suivez le schéma ci-dessus. Utilisez des fils Dupont femelle-femelle. Vérifiez deux fois les connexions avant de mettre sous tension.</p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 font-bold text-sm">2</div>
                <h3 className="text-lg font-semibold text-white">Installer Arduino IDE / PlatformIO</h3>
              </div>
              <p className="text-sm text-gray-400">Téléchargez <strong className="text-white">Arduino IDE</strong> (arduino.cc) ou utilisez <strong className="text-white">PlatformIO</strong> dans VS Code. Ajoutez le support ESP32 via le gestionnaire de cartes.</p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 font-bold text-sm">3</div>
                <h3 className="text-lg font-semibold text-white">Installer les librairies</h3>
              </div>
              <p className="text-sm text-gray-400 mb-2">Librairies Arduino requises :</p>
              <ul className="space-y-1 text-sm text-gray-400">
                <li>• <code className="text-orange-400">MFRC522</code> par GithubCommunity</li>
                <li>• <code className="text-orange-400">ArduinoJson</code> par Benoit Blanchon</li>
                <li>• <code className="text-orange-400">WiFi</code> (intégré au core ESP32)</li>
              </ul>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 font-bold text-sm">4</div>
                <h3 className="text-lg font-semibold text-white">Configurer WiFi et API</h3>
              </div>
              <p className="text-sm text-gray-400 mb-3">Modifiez les constantes en haut du firmware :</p>
              <pre className="bg-gray-950 border border-gray-800 rounded-xl p-4 text-sm font-mono text-gray-300 overflow-x-auto mb-3">
{`const char* WIFI_SSID = "VOTRE_WIFI";
const char* WIFI_PASS = "VOTRE_MOT_DE_PASSE";
const char* API_URL = "https://VOTRE_SITE.vercel.app/api/rfid/check";
const char* API_KEY = "VOTRE_CLE_API";`}
              </pre>
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-xs text-yellow-300">
                <p className="font-medium mb-1">⚠ Sécurité</p>
                <p>Ne partagez jamais votre clé API. Utilisez des variables d'environnement et un fichier <code className="text-white">config.h</code> ignoré par git.</p>
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 font-bold text-sm">5</div>
                <h3 className="text-lg font-semibold text-white">Téléverser le firmware</h3>
              </div>
              <p className="text-sm text-gray-400">Connectez l'ESP32 en USB, sélectionnez le port COM et la carte "ESP32 Dev Module", puis cliquez sur <strong className="text-white">Téléverser</strong>. Ouvrez le moniteur série (115200 bauds) pour voir les logs.</p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 font-bold text-sm">6</div>
                <h3 className="text-lg font-semibold text-white">Tester avec un badge</h3>
              </div>
              <p className="text-sm text-gray-400">Présentez un badge. Le moniteur série doit afficher l'UID, le verdict (ACCÈS AUTORISÉ / REFUSÉ), et la LED/relais doit réagir.</p>
            </div>

            {/* Firmware complet */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Terminal className="w-5 h-5 text-green-400" />
                <h3 className="text-lg font-semibold text-white">Firmware ESP32 complet</h3>
              </div>
              <p className="text-sm text-gray-400 mb-3">Copiez ce code dans Arduino IDE, modifiez les paramètres WiFi/API et téléversez :</p>
              <pre className="bg-gray-950 border border-gray-800 rounded-xl p-4 text-sm font-mono text-gray-300 overflow-x-auto">
{`// Infinity Gym - ESP32 RFID Access Control
#include <WiFi.h>
#include <HTTPClient.h>
#include <MFRC522.h>
#include <SPI.h>
#include <ArduinoJson.h>

// WiFi Configuration
const char* WIFI_SSID = "VOTRE_WIFI";
const char* WIFI_PASS = "VOTRE_MOT_DE_PASSE";

// API Configuration
const char* API_URL = "https://VOTRE_SITE.vercel.app/api/rfid/check";
const char* API_KEY = "VOTRE_CLE_API";

// Pin Configuration
#define RST_PIN 22
#define SS_PIN 5
#define RELAY_PIN 13
#define BUZZER_PIN 12
#define LED_GREEN 14
#define LED_RED 27

MFRC522 rfid(SS_PIN, RST_PIN);
MFRC522::MIFARE_Key key;

void setup() {
  Serial.begin(115200);
  SPI.begin();
  rfid.PCD_Init();
  
  pinMode(RELAY_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_RED, OUTPUT);
  
  digitalWrite(RELAY_PIN, LOW);
  digitalWrite(LED_GREEN, LOW);
  digitalWrite(LED_RED, LOW);
  
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\\nWiFi Connected");
}

void loop() {
  if (!rfid.PICC_IsNewCardPresent() || !rfid.PICC_ReadCardSerial()) {
    delay(100);
    return;
  }

  String uid = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    uid += String(rfid.uid.uidByte[i], HEX);
    if (i < rfid.uid.size - 1) uid += ":";
  }
  uid.toUpperCase();

  Serial.println("Badge scanne: " + uid);
  
  // Anti-double-scan (5 secondes)
  static unsigned long lastScan = 0;
  if (millis() - lastScan < 5000) {
    Serial.println("Anti-double-scan: ignore");
    return;
  }
  lastScan = millis();

  // Appel API
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(API_URL);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("x-api-key", API_KEY);

    StaticJsonDocument<200> doc;
    doc["rfid"] = uid;
    doc["method"] = "rfid";
    String body;
    serializeJson(doc, body);

    int code = http.POST(body);
    String response = http.getString();
    http.end();

    StaticJsonDocument<300> resDoc;
    deserializeJson(resDoc, response);
    bool openDoor = resDoc["openDoor"] | false;
    String reason = resDoc["reason"] | "UNKNOWN";

    if (openDoor) {
      Serial.println("ACCES AUTORISE");
      digitalWrite(LED_GREEN, HIGH);
      digitalWrite(RELAY_PIN, HIGH);
      tone(BUZZER_PIN, 1000, 200);
      delay(2000);
      digitalWrite(RELAY_PIN, LOW);
      digitalWrite(LED_GREEN, LOW);
    } else {
      Serial.println("ACCES REFUSE: " + reason);
      digitalWrite(LED_RED, HIGH);
      for (int i = 0; i < 3; i++) {
        tone(BUZZER_PIN, 400, 150);
        delay(200);
        noTone(BUZZER_PIN);
        delay(100);
      }
      digitalWrite(LED_RED, LOW);
    }
  }

  delay(1000);
  rfid.PICC_HaltA();
}`}
              </pre>
            </div>
          </div>
        </>
      )}

      {/* API Key Setup */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Key className="w-5 h-5 text-orange-400" />
          <h3 className="text-lg font-semibold text-white">Configuration de la clé API</h3>
        </div>
        <p className="text-sm text-gray-400 mb-3">Ajoutez la variable d'environnement suivante dans votre fichier <code className="text-orange-400">.env.local</code> :</p>
        <code className="block px-4 py-2 bg-gray-800 rounded-lg text-sm text-green-300 font-mono w-fit mb-3">RFID_API_KEY=ma_cle_api_secrete</code>
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 text-xs text-orange-300">
          <Shield className="w-4 h-4 inline mr-1" />
          <span>Générez une clé forte avec : </span>
          <code className="text-white">openssl rand -hex 32</code>
        </div>
      </div>

      {/* Testing Checklist */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <h3 className="text-lg font-semibold text-white">Checklist de test</h3>
        </div>
        <div className="space-y-3 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <input type="checkbox" className="accent-orange-500 w-4 h-4 rounded" />
            <span>Badge reconnu par le lecteur (voyant / log)</span>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" className="accent-orange-500 w-4 h-4 rounded" />
            <span>LED RGB change selon le statut (vert = OK, rouge = refusé)</span>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" className="accent-orange-500 w-4 h-4 rounded" />
            <span>API répond avec <code className="text-gray-300">GRANTED</code> / <code className="text-gray-300">DENIED</code></span>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" className="accent-orange-500 w-4 h-4 rounded" />
            <span>Porte s'ouvre (relais clique)</span>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" className="accent-orange-500 w-4 h-4 rounded" />
            <span>Historique visible dans les <Link href="/turnstiles/logs" className="text-orange-400 hover:text-orange-300">journaux d'accès</Link></span>
          </div>
        </div>
      </div>
    </div>
  );
}
