import fs from 'node:fs';

const projectId = 'domiz-a6a6c';
const credentialsPath = `${process.env.HOME}/.config/configstore/firebase-tools.json`;

const descriptions = {
  '104750017': `Dom wolnostojący o powierzchni 130 m² na działce 851 m² w Orzeszu, przy ul. Rybnickiej. To propozycja dla osób, które chcą stworzyć własną przestrzeń w domu z dużym potencjałem i wygodnym dojazdem.

ATUTY NIERUCHOMOŚCI
• 130 m² powierzchni domu i działka 851 m²
• 6 pokoi, 2 kondygnacje i 2 garaże
• budynek gospodarczy na posesji

UKŁAD I STANDARD
• dom z 1939 roku, przeznaczony do remontu
• ogrzewanie elektryczne
• dostęp do wodociągu i kanalizacji miejskiej
• okna PCV oraz dojazd drogą asfaltową

LOKALIZACJA
Orzesze, ul. Rybnicka. W pobliżu dostępne są przystanki autobusowe i kolejowe, co ułatwia codzienne dojazdy.

DLA KOGO
Dla rodziny lub inwestora, który szuka domu z działką i możliwością aranżacji według własnego planu.

ZAPRASZAMY NA PREZENTACJĘ
Skontaktuj się z nami, aby poznać szczegóły oferty i umówić dogodny termin spotkania.`,
  '104750018': `Nowy dom szeregowy o powierzchni 153 m² w Będzinie, w dzielnicy Grodziec przy ul. Leśnej. Przemyślany metraż i kameralna zabudowa tworzą solidną bazę dla rodzinnego życia blisko głównych tras.

ATUTY NIERUCHOMOŚCI
• 153 m² powierzchni i 4 pokoje
• działka o powierzchni 376 m²
• garaż w bryle budynku

UKŁAD I STANDARD
• dom w zabudowie szeregowej, w stanie deweloperskim
• planowane zakończenie realizacji: IV kwartał 2026 roku
• trzyszybowe okna oraz media miejskie: woda, kanalizacja i energia elektryczna

LOKALIZACJA
Będzin, Grodziec, ul. Leśna. Lokalizacja zapewnia sprawny dojazd do drogi DK86.

DLA KOGO
Dla osób, które chcą wykończyć nowy dom według własnej koncepcji i cenią dobry dostęp do aglomeracji.

ZAPRASZAMY NA PREZENTACJĘ
Skontaktuj się z nami, aby poznać harmonogram realizacji i szczegóły oferty.`,
  '104750164': `Czteropokojowe mieszkanie o powierzchni 68,3 m² w Katowicach, na Nikiszowcu przy ul. Zofii Nałkowskiej. Lokal z 2023 roku łączy funkcjonalny układ dla rodziny z mieszkaniem na kameralnym, ogrodzonym osiedlu.

ATUTY NIERUCHOMOŚCI
• 68,3 m² oraz salon z aneksem kuchennym i 3 sypialnie
• 2. piętro w 3-piętrowym budynku
• ogrodzone osiedle z miejscami parkingowymi

UKŁAD I STANDARD
• budynek z 2023 roku
• ogrzewanie i woda z sieci miejskiej
• możliwość zakupu dwóch miejsc parkingowych oraz komórki lokatorskiej

LOKALIZACJA
Katowice, Nikiszowiec, ul. Zofii Nałkowskiej — w części miasta cenionej za charakter zabudowy i wygodę codziennego życia.

DLA KOGO
Dla rodziny potrzebującej trzech sypialni albo dla kupującego, który szuka nowego mieszkania w Katowicach.

ZAPRASZAMY NA PREZENTACJĘ
Skontaktuj się z nami, aby poznać szczegóły wyposażenia i warunki zakupu miejsc parkingowych.`,
  '104750200': `Mieszkanie o powierzchni 30,3 m² w Katowicach, w Kostuchnie przy ul. Jana Kściuczyka. Położenie na 7. piętrze z windą i bliskość terenów leśnych tworzą dobrą propozycję dla jednej osoby lub jako pierwsze mieszkanie.

ATUTY NIERUCHOMOŚCI
• 30,3 m² funkcjonalnej przestrzeni
• 7. piętro w 8-piętrowym budynku z windą
• las w odległości około 5 minut

UKŁAD I STANDARD
• salon, kuchnia, sypialnia i łazienka
• budynek z 1985 roku
• ogrzewanie i ciepła woda z sieci miejskiej

LOKALIZACJA
Katowice, Kostuchna, ul. Jana Kściuczyka. Lokalizacja łączy miejską infrastrukturę z dostępem do zieleni.

DLA KOGO
Dla singla, pary albo inwestora szukającego kompaktowego mieszkania w Katowicach.

ZAPRASZAMY NA PREZENTACJĘ
Skontaktuj się z nami, aby poznać szczegóły oferty i umówić prezentację.`,
  '104750212': `Kompaktowe mieszkanie o powierzchni 24,73 m² w Chorzowie II, przy ul. Chałupki. Lokal na 7. piętrze z windą to propozycja dla osoby, która szuka dobrze skomunikowanego miejsca w mieście.

ATUTY NIERUCHOMOŚCI
• 24,73 m² powierzchni
• 7. piętro w 10-piętrowym budynku z windą
• budynek po termomodernizacji i odświeżona klatka schodowa

UKŁAD I STANDARD
• budynek z 1980 roku
• ogrzewanie miejskie, ciepła woda z piecyka gazowego
• czynsz około 360 zł

LOKALIZACJA
Chorzów II, ul. Chałupki. W pobliżu są sklepy, placówki edukacyjne i przystanki, a dojazd do DTŚ zajmuje około 6 minut.

DLA KOGO
Dla singla, studenta lub inwestora szukającego niewielkiego mieszkania w Chorzowie.

ZAPRASZAMY NA PREZENTACJĘ
Skontaktuj się z nami, aby poznać szczegóły oferty i umówić prezentację.`,
  '104750216': `Mieszkanie o powierzchni 27,04 m² w centrum Świętochłowic, przy ul. Polnej. Lokal po remoncie, z wyposażoną kuchnią i parterowym położeniem, pozwala wygodnie rozpocząć nowy etap bez organizowania podstawowych prac.

ATUTY NIERUCHOMOŚCI
• 27,04 m² na parterze 4-piętrowego budynku
• mieszkanie po remoncie instalacji
• piwnica o powierzchni około 5 m²

UKŁAD I STANDARD
• nowe instalacje: wodna, kanalizacyjna, elektryczna i gazowa
• kuchnia z zabudową i sprzętem AGD
• wyremontowana łazienka, okna PCV oraz pralka z suszarką
• ogrzewanie miejskie, ciepła woda z piecyka gazowego

LOKALIZACJA
Świętochłowice, Centrum, ul. Polna — miejska lokalizacja z łatwym dostępem do usług i komunikacji.

DLA KOGO
Dla singla, pary albo inwestora, który szuka gotowego mieszkania w centrum miasta.

ZAPRASZAMY NA PREZENTACJĘ
Skontaktuj się z nami, aby poznać szczegóły wyposażenia i umówić spotkanie.`,
  '104750223': `Trzypokojowe mieszkanie o powierzchni 50,89 m² w Czeladzi, przy ul. Ludwika Waryńskiego. Funkcjonalny układ z dwoma sypialniami i pomieszczeniem gospodarczym daje wygodną przestrzeń do codziennego życia.

ATUTY NIERUCHOMOŚCI
• 50,89 m²: salon, 2 sypialnie, kuchnia i łazienka z WC
• parter w 3-piętrowym budynku
• piwnica o powierzchni około 10 m²

UKŁAD I STANDARD
• dodatkowe pomieszczenie gospodarcze
• ogrzewanie elektryczne — piec firmy Kospel
• możliwość montażu ogrzewania gazowego
• czynsz około 430 zł

LOKALIZACJA
Czeladź, ul. Ludwika Waryńskiego. W otoczeniu znajdują się przystanki autobusowe, sklepy, placówki edukacyjne, przychodnie i restauracje.

DLA KOGO
Dla rodziny potrzebującej trzech pokoi lub inwestora szukającego mieszkania z funkcjonalnym rozkładem.

ZAPRASZAMY NA PREZENTACJĘ
Skontaktuj się z nami, aby poznać szczegóły oferty i umówić prezentację.`,
  '104750225': `Dwupokojowe mieszkanie o powierzchni 61,02 m² w Chorzowie Batorym, przy ul. ks. bp. Adriana Włodarskiego. Lokal po generalnym remoncie, z dużą piwnicą i ogrzewaniem podłogowym, oferuje wygodę w kameralnym budynku.

ATUTY NIERUCHOMOŚCI
• 61,02 m² na 1. piętrze 2-piętrowego budynku
• mieszkanie po generalnym remoncie
• piwnica o powierzchni 6,23 m²

UKŁAD I STANDARD
• 2 pokoje, kuchnia, spiżarnia i łazienka
• nowe instalacje wodno-kanalizacyjne i elektryczne
• ogrzewanie elektryczne podłogowe sterowane aplikacją
• ogrodzony teren oraz możliwość parkowania

LOKALIZACJA
Chorzów Batory, ul. ks. bp. Adriana Włodarskiego — lokalizacja z dostępem do miejskiej infrastruktury.

DLA KOGO
Dla osoby szukającej większego mieszkania po remoncie albo jako lokal na cele mieszkaniowe lub inwestycyjne.

ZAPRASZAMY NA PREZENTACJĘ
Skontaktuj się z nami, aby poznać szczegóły remontu i umówić spotkanie.`,
  '104750226': `Dwupokojowe mieszkanie o powierzchni 37,55 m² w Katowicach, w Piotrowicach przy ul. Jankego. Praktyczny układ z garderobą i piwnicą sprawdzi się dla osób, które chcą mieszkać w spokojniejszej części miasta.

ATUTY NIERUCHOMOŚCI
• 37,55 m²: salon z aneksem, sypialnia, garderoba i łazienka
• 3. piętro w 4-piętrowym budynku
• piwnica przynależna do lokalu

UKŁAD I STANDARD
• ogrzewanie miejskie, ciepła woda z piecyka gazowego
• czynsz około 360 zł
• ogrodzone osiedle

LOKALIZACJA
Katowice, Piotrowice, ul. Jankego — część miasta zapewniająca dostęp do lokalnych usług i komunikacji.

DLA KOGO
Dla singla, pary lub inwestora, który szuka dwupokojowego mieszkania w Katowicach.

ZAPRASZAMY NA PREZENTACJĘ
Skontaktuj się z nami, aby poznać szczegóły oferty i umówić prezentację.`,
  '104750228': `Dwupokojowe mieszkanie o powierzchni 51,06 m² w Chorzowie Batorym, przy ul. Karpackiej. Przestronny metraż, garderoba i duża piwnica tworzą funkcjonalną ofertę dla osób, które potrzebują wygodnej przestrzeni.

ATUTY NIERUCHOMOŚCI
• 51,06 m² na 1. piętrze 2-piętrowego budynku
• salon z aneksem kuchennym, sypialnia i garderoba
• piwnica o powierzchni 13,6 m²

UKŁAD I STANDARD
• mieszkanie po generalnym remoncie
• ogrzewanie i ciepła woda z pieca gazowego dwufunkcyjnego
• czynsz około 493 zł

LOKALIZACJA
Chorzów Batory, ul. Karpacka — miejska lokalizacja z dostępem do infrastruktury dzielnicy.

DLA KOGO
Dla pary, małej rodziny lub inwestora poszukującego mieszkania z dodatkową przestrzenią do przechowywania.

ZAPRASZAMY NA PREZENTACJĘ
Skontaktuj się z nami, aby poznać szczegóły oferty i umówić prezentację.`,
  '104750234': `Trzypokojowe mieszkanie o powierzchni 47,12 m² w centrum Sosnowca, przy ul. Ostrogórskiej. Balkon, dwie sypialnie i winda w budynku sprawiają, że to praktyczna propozycja dla rodziny lub na wynajem.

ATUTY NIERUCHOMOŚCI
• 47,12 m²: salon, 2 sypialnie, kuchnia i łazienka
• 8. piętro w 10-piętrowym budynku z windą
• balkon oraz piwnica

UKŁAD I STANDARD
• ogrzewanie miejskie, ciepła woda z piecyka gazowego
• budynek po termomodernizacji
• dostępne miejsca parkingowe przy budynku

LOKALIZACJA
Sosnowiec, Centrum, ul. Ostrogórska. W pobliżu znajdują się Park Harcerski, kino Helios i centrum handlowe Plaza.

DLA KOGO
Dla rodziny potrzebującej trzech pokoi lub inwestora szukającego mieszkania blisko centrum Sosnowca.

ZAPRASZAMY NA PREZENTACJĘ
Skontaktuj się z nami, aby poznać szczegóły oferty i umówić prezentację.`,
  '104750235': `Dwupokojowe mieszkanie o powierzchni 52,63 m² w Katowicach, w Śródmieściu przy ul. Rochowiaka. Balkon, piwnica i możliwość parkowania za szlabanem tworzą wygodną ofertę blisko centrum oraz uczelni.

ATUTY NIERUCHOMOŚCI
• 52,63 m²: 2 pokoje, kuchnia i łazienka
• 3. piętro w 4-piętrowym budynku
• balkon, piwnica oraz parking za szlabanem

UKŁAD I STANDARD
• budynek z 1961 roku
• ogrzewanie miejskie, ciepła woda z piecyka gazowego
• czynsz około 560 zł

LOKALIZACJA
Katowice, Śródmieście, ul. Rochowiaka. Do centrum i dworca można dojść w około 10 minut, a Park Kościuszki jest w odległości około 5 minut.

DLA KOGO
Dla osoby pracującej lub studiującej w Katowicach, pary albo inwestora szukającego mieszkania w centralnej lokalizacji.

ZAPRASZAMY NA PREZENTACJĘ
Skontaktuj się z nami, aby poznać szczegóły oferty i umówić prezentację.`,
  '104750236': `Trzypokojowe mieszkanie o powierzchni 56,5 m² w Chorzowie, na Klimzowcu przy ul. Gałeczki. Układ z dwiema sypialniami, balkonem oraz osobnym WC daje wygodną przestrzeń dla rodziny.

ATUTY NIERUCHOMOŚCI
• 56,5 m²: salon z aneksem, 2 sypialnie, łazienka i osobne WC
• 2. piętro w 4-piętrowym budynku
• balkon oraz piwnica

UKŁAD I STANDARD
• budynek po termomodernizacji, z odnowioną klatką schodową
• ogrzewanie miejskie, ciepła woda z piecyka gazowego
• czynsz około 770 zł

LOKALIZACJA
Chorzów, Klimzowiec, ul. Gałeczki. W okolicy są przystanki tramwajowe i autobusowe, Park Śląski, Park Róż oraz sklepy.

DLA KOGO
Dla rodziny, która potrzebuje trzech pokoi i łatwego dostępu do zieleni oraz komunikacji.

ZAPRASZAMY NA PREZENTACJĘ
Skontaktuj się z nami, aby poznać szczegóły oferty i umówić prezentację.`,
  '104750237': `Trzypokojowe mieszkanie o powierzchni 55,78 m² w Katowicach, na osiedlu Zadole przy ul. Zadole. Parter, balkon i funkcjonalny układ z garderobą to wygodne rozwiązanie dla rodziny lub osób ceniących bliskość terenów rekreacyjnych.

ATUTY NIERUCHOMOŚCI
• 55,78 m²: 3 pokoje, kuchnia, łazienka i osobne WC
• parter w 10-piętrowym budynku z windą
• balkon, garderoba i piwnica

UKŁAD I STANDARD
• ekspozycja zachodnia
• ogrzewanie miejskie, ciepła woda z piecyka gazowego
• spółdzielcze własnościowe prawo do lokalu z księgą wieczystą
• czynsz około 1 200 zł

LOKALIZACJA
Katowice, Zadole, ul. Zadole. W pobliżu znajdują się Park Zadole, punkty usługowe i przystanki autobusowe.

DLA KOGO
Dla rodziny szukającej trzech pokoi w Katowicach lub kupującego, dla którego ważny jest dostęp do zieleni.

ZAPRASZAMY NA PREZENTACJĘ
Skontaktuj się z nami, aby poznać szczegóły oferty i umówić prezentację.`,
};

const savedCredentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
const accessToken = savedCredentials.tokens?.access_token;

if (!accessToken) {
  throw new Error('Nie znaleziono aktywnej sesji Firebase. Zaloguj się ponownie przed uruchomieniem aktualizacji.');
}

for (const [id, description] of Object.entries(descriptions)) {
  const url = new URL(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/properties/${id}`);
  url.searchParams.append('updateMask.fieldPaths', 'description');

  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fields: {
        description: { stringValue: description },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Nie udało się zaktualizować oferty ${id}: ${response.status} ${await response.text()}`);
  }

  console.log(`Zaktualizowano opis oferty ${id}`);
}

console.log(`Gotowe: zaktualizowano ${Object.keys(descriptions).length} opisów.`);
