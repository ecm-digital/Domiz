# Domiz Homes — zasady pracy nad projektem

## Środowisko i wdrożenia
- Aktywne repozytorium: `/Volumes/Dysk zewn/Vibe coding/Domiz Homes/Domiz-Homes`
- Aktywna gałąź robocza: `lokalne-zmiany-20260817`
- Hosting produkcyjny: Firebase (`domiz-a6a6c`, adres `https://domizhomes.com`)
- Komenda weryfikacji i buildu: `npm run build` (dla zmian w `public/admin/kawalerki/*.js` również `node --check`)
- Komenda wdrożenia: `firebase deploy --only hosting --project domiz-a6a6c`
- Przed zakończeniem zadania sprawdź wdrożone zmiany na produkcji w `openbot_browser` i zrób commit z trailerem OpenBot.

## Architektura i kluczowe pliki
- Panel admina (`/admin`): [src/pages/admin/AdminDashboard.tsx](src/pages/admin/AdminDashboard.tsx)
  - Kolejka telefonów (`Dzwoń dziś`): [src/pages/admin/CallQueuePanel.tsx](src/pages/admin/CallQueuePanel.tsx)
  - Nawigacja zakładek z obsługą `?tab=...`: [src/pages/admin/AdminTabBar.tsx](src/pages/admin/AdminTabBar.tsx)
  - Formularz dodawania/edycji oferty: [src/pages/admin/AdminPropertyForm.tsx](src/pages/admin/AdminPropertyForm.tsx)
- Zestawienie „Mieszkania z ogródkiem – Warszawa” (`/admin/kawalerki/`):
  - Dane (1–4 pokoje): `public/admin/kawalerki/data.js`
  - Logika, dashboard inwestycji, koszyk klienta / PDF, transfer `+ Pozysk`: `public/admin/kawalerki/app.js`
- Integracje AI:
  - Panel admina łączy się bezpośrednio z Google AI Studio (`generativelanguage.googleapis.com`, model `gemini-2.5-flash`) za pomocą `geminiApiKey` zapisanego w Firestore (zakładka `Ustawienia`).
  - Cloud Functions (`functions/index.js`) obsługują Resend, HeyGen i Gamma.

## Reguły jakości danych
- W `public/admin/kawalerki/data.js` dopisuj wyłącznie zweryfikowane oferty z rzeczywistym adresem URL, ceną, metrażem i deweloperem — nigdy nie zmyślaj parametrów lokali ani linków.
- Podczas pracy na bazie Firestore (`acquisitionListings`, `leads`, `properties`) nie nadpisuj produkcyjnych rekordów testowymi danymi.
