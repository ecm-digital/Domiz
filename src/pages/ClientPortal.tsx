import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarDays, Check, ChevronRight, CircleAlert, Clock3, Eye, FileText, Info, LogOut, Mail, MapPin, Phone, Send, Users } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { addDoc, collection, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { COOPERATION_PACKAGES, TEST_CLIENT_OFFER, type ClientOffer } from '../data/clientOffers';
import { auth, db, functions } from '../firebase';
import { useAuth } from '../context/AuthContext';
import tomaszGnatImage from '../assets/tomaszgnat.jpeg';
import './ClientPortal.css';

type PackageId = (typeof COOPERATION_PACKAGES)[number]['id'];

type ClientLanguage = 'pl' | 'en' | 'it';
type GeneratedPortalDocument = { content?: string; contentEn?: string; contentIt?: string; updatedAt?: string; gammaUrl?: string; exportUrl?: string; docsUrl?: string; viewUrl?: string; source?: string };

const formatPortalDate = (value: string, language: ClientLanguage) => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  return parsed.toLocaleDateString(language === 'pl' ? 'pl-PL' : language === 'it' ? 'it-IT' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const buildAgreementDraftItFromOffer = (offer: ClientOffer) => {
  const today = new Date().toLocaleDateString('it-IT');
  const owner = offer.ownerName || '[nome e cognome / società]';
  const title = offer.title || '[tipologia immobile]';
  const location = offer.address || '[indirizzo completo]';
  const area = offer.area ? `${offer.area} m²` : '[superficie]';
  const price = offer.price
    ? `${offer.price.toLocaleString('it-IT')} zł`
    : 'da definire dopo l’analisi comparativa di mercato';
  return `BOZZA DI CONTRATTO DI INTERMEDIAZIONE IMMOBILIARE

redatta in data ${today}

IMPORTANTE: bozza di lavoro — prima della firma occorre completare i dati delle parti, i numeri identificativi, i dati dell’immobile e la verifica legale.

§ 1. PARTI DEL CONTRATTO
1. Committente: ${owner}, indirizzo: [indirizzo], PESEL/NIP / codice fiscale: [numero], documento d’identità / registro imprese: [dati], di seguito il “Committente”.
2. Mediatore: Domiz Homes, di seguito il “Mediatore”.

§ 2. OGGETTO DEL CONTRATTO
1. Il Committente incarica il Mediatore di svolgere attività finalizzate alla vendita dell’immobile: ${title}, sito in: ${location}, di superficie ${area}, per il quale è tenuto il registro fondiario n. [numero KW].
2. Prezzo richiesto / strategia di prezzo: ${price}. Il prezzo finale richiede conferma scritta del Committente.

§ 3. PACCHETTO E AMBITO DEI SERVIZI DEL MEDIATORE
1. Le parti scelgono la variante: da definire.
2. Ambito concordato:
Preparazione professionale dell’immobile, sessione foto e video, redazione dei contenuti, pubblicazione dell’annuncio, gestione delle visite e supporto nelle negoziazioni.
In particolare, il Mediatore preparerà i materiali dell’offerta, promuoverà l’immobile, gestirà le richieste e le visite, supporterà le negoziazioni e coordillerà i documenti della transazione.

§ 4. MODELLO DI COLLABORAZIONE E DURATA
1. Le parti scelgono la forma: Contratto di intermediazione in esclusiva.
2. Il contratto è concluso per il periodo dal [data] al [data] / a tempo indeterminato con un preavviso di [numero] giorni.

§ 5. COMPENSO
1. Il compenso del Mediatore ammonta a: [da completare].
2. Momento in cui matura l’obbligo di pagamento, base di calcolo, IVA e termine di pagamento: [da completare secondo le condizioni accettate].

§ 6. OBBLIGHI DEL COMMITTENTE
Il Committente si impegna a fornire informazioni veritiere e complete, a mettere a disposizione i documenti relativi allo stato giuridico e tecnico, a consentire la preparazione dei materiali e le visite, e a informare tempestivamente di ogni cambiamento che influisca sulla vendita.

§ 7. DATI, MARKETING E CONTATTI
L’ambito dei consensi per la pubblicazione di foto, video, planimetrie e indirizzo, nonché per il trattamento dei dati personali, sarà definito negli allegati e nelle informative conformi alla normativa vigente.

§ 8. DISPOSIZIONI FINALI
1. Le modifiche al contratto richiedono la forma concordata dalle parti.
2. Gli allegati costituiscono parte integrante del contratto.
3. Il contratto è redatto in due esemplari di uguale tenore.

______________________________          ______________________________
Committente                              Mediatore / Domiz Homes`;
};

const toGammaPresentUrl = (url: string) => {
  const raw = String(url || '').trim();
  if (!raw) return '';
  try {
    const parsed = new URL(raw);
    if (!parsed.hostname.includes('gamma.app')) return raw;
    parsed.searchParams.set('mode', 'present');
    parsed.hash = '';
    return parsed.toString();
  } catch {
    return raw.includes('mode=present') ? raw : raw.includes('?') ? `${raw}&mode=present` : `${raw}?mode=present`;
  }
};
const toGoogleDocsViewUrl = (url: string) => {
  const raw = String(url || '').trim();
  if (!raw) return '';
  const idMatch = raw.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (idMatch?.[1]) return `https://docs.google.com/document/d/${idMatch[1]}/preview`;
  try {
    const parsed = new URL(raw);
    if (parsed.hostname.includes('docs.google.com')) {
      parsed.pathname = parsed.pathname.replace(/\/(edit|view|preview).*$/, '/preview');
      if (!parsed.pathname.endsWith('/preview')) parsed.pathname = `${parsed.pathname.replace(/\/$/, '')}/preview`;
      parsed.hash = '';
      return parsed.toString();
    }
  } catch { /* ignore */ }
  return raw;
};
const PORTAL_COPY: Record<ClientLanguage, Record<string, string>> = {
  pl: { greeting: 'Dzień dobry', logout: 'Wyloguj', ownerPanel: 'PANEL WŁAŚCICIELA', hero: 'Twoja sprzedaż, zawsze pod ręką.', heroText: 'W jednym miejscu sprawdzisz postęp prac, materiały i kolejne kroki związane z Twoją nieruchomością.', agent: 'Twój opiekun', advisorRole: 'Opiekun sprzedaży', documents: 'Dokumenty', progress: 'Przebieg sprzedaży', cooperation: 'USTALENIE WSPÓŁPRACY', choosePlan: 'Wybierz wariant współpracy', planText: 'Potwierdź wariant, a Twój opiekun otrzyma informację i wróci z kolejnymi ustaleniami.', confirm: 'Potwierdź wybór wariantu', sending: 'Wysyłanie…', documentsIntro: 'NA POCZĄTEK', yourDocuments: 'Twoje dokumenty', documentsText: 'Najważniejsze ustalenia dotyczące rozpoczętej współpracy.', preparing: 'W przygotowaniu', timeline: 'HARMONOGRAM', happening: 'Co dzieje się teraz', yourSide: 'PO TWOJEJ STRONIE', checklist: 'Krótka lista', question: 'Masz pytanie?', support: 'Jesteśmy po Twojej stronie.', contactText: 'Napisz lub zadzwoń do swojego opiekuna — odpowiemy najszybciej, jak to możliwe.', call: 'Zadzwoń', write: 'Napisz', footer: 'Twój partner w sprzedaży nieruchomości', contactAgent: 'Kontakt z opiekunem', offerStage: 'Przygotowanie oferty', beforeAgreement: 'Przed podpisaniem umowy', beforeAgreementDetail: 'Ustalamy zakres współpracy i przygotowujemy dokumenty.', goToDocuments: 'Wybierz wariant współpracy', rooms: 'pokoje', viewOffer: 'Zobacz ofertę', agreementSince: 'Umowa od', current: 'w toku', draft: 'Dokument roboczy', proposal: 'Proposal współpracy', agreement: 'Umowa pośrednictwa', propertyCard: 'Karta nieruchomości', marketingConsent: 'Zgoda na działania marketingowe', awaitingData: 'oczekuje na dane', awaitingSignature: 'oczekuje na podpis', readyStatus: 'Gotowe', openGamma: 'Otwórz prezentację', readyGamma: 'Gotowa prezentacja', viewDraft: 'Podgląd', draftReviewNote: 'Wersja do wglądu — przed podpisaniem możemy jeszcze uzupełnić dane stron i szczegóły.', updatedOn: 'Aktualizacja', agreementLanguage: 'Język umowy' },
  en: { greeting: 'Good morning', logout: 'Sign out', ownerPanel: 'OWNER PORTAL', hero: 'Your sale, always at hand.', heroText: 'Check progress, materials and the next steps for your property in one place.', agent: 'Your advisor', advisorRole: 'Sales advisor', documents: 'Documents', progress: 'Sales progress', cooperation: 'COOPERATION SETUP', choosePlan: 'Choose a cooperation plan', planText: 'Confirm your choice and your advisor will receive it and get back to you with the next arrangements.', confirm: 'Confirm plan choice', sending: 'Sending…', documentsIntro: 'TO START', yourDocuments: 'Your documents', documentsText: 'The key arrangements for the start of our cooperation.', preparing: 'In preparation', timeline: 'TIMELINE', happening: 'What is happening now', yourSide: 'YOUR TO-DO', checklist: 'Short checklist', question: 'Have a question?', support: 'We are on your side.', contactText: 'Call or write to your advisor — we will get back to you as soon as possible.', call: 'Call', write: 'Write', footer: 'Your property sales partner', contactAgent: 'Contact advisor', offerStage: 'Offer preparation', beforeAgreement: 'Before signing the agreement', beforeAgreementDetail: 'We are agreeing the scope of cooperation and preparing the documents.', goToDocuments: 'Choose a cooperation plan', rooms: 'rooms', viewOffer: 'View offer', agreementSince: 'Agreement since', current: 'in progress', draft: 'Working document', proposal: 'Cooperation proposal', agreement: 'Brokerage agreement', propertyCard: 'Property card', marketingConsent: 'Marketing consent', awaitingData: 'awaiting details', awaitingSignature: 'awaiting signature', readyStatus: 'Ready', openGamma: 'Open presentation', readyGamma: 'Presentation ready', viewDraft: 'Preview', draftReviewNote: 'Review draft — party details and final terms can still be completed before signing.', updatedOn: 'Updated', agreementLanguage: 'Agreement language' },
  it: { greeting: 'Buongiorno', logout: 'Esci', ownerPanel: 'AREA PROPRIETARIO', hero: 'La tua vendita, sempre a portata di mano.', heroText: 'In un unico posto puoi seguire i progressi, i materiali e i prossimi passi della tua proprietà.', agent: 'Il tuo consulente', advisorRole: 'Consulente di vendita', documents: 'Documenti', progress: 'Andamento vendita', cooperation: 'DEFINIZIONE DELLA COLLABORAZIONE', choosePlan: 'Scegli il piano di collaborazione', planText: 'Conferma la scelta: il tuo consulente la riceverà e ti contatterà per i prossimi accordi.', confirm: 'Conferma la scelta', sending: 'Invio…', documentsIntro: 'PER INIZIARE', yourDocuments: 'I tuoi documenti', documentsText: 'Gli accordi principali per l’avvio della collaborazione.', preparing: 'In preparazione', timeline: 'CRONOLOGIA', happening: 'Cosa succede ora', yourSide: 'DA PARTE TUA', checklist: 'Lista breve', question: 'Hai domande?', support: 'Siamo dalla tua parte.', contactText: 'Chiama o scrivi al tuo consulente: ti risponderemo appena possibile.', call: 'Chiama', write: 'Scrivi', footer: 'Il tuo partner per la vendita immobiliare', contactAgent: 'Contatta il consulente', offerStage: 'Preparazione dell’offerta', beforeAgreement: 'Prima della firma del contratto', beforeAgreementDetail: 'Stiamo definendo la collaborazione e preparando i documenti.', goToDocuments: 'Scegli il piano di collaborazione', rooms: 'stanze', viewOffer: 'Vedi offerta', agreementSince: 'Accordo dal', current: 'in corso', draft: 'Documento di lavoro', proposal: 'Proposta di collaborazione', agreement: 'Contratto di intermediazione', propertyCard: 'Scheda immobile', marketingConsent: 'Consenso marketing', awaitingData: 'in attesa dei dati', awaitingSignature: 'in attesa della firma', readyStatus: 'Pronto', openGamma: 'Apri presentazione', readyGamma: 'Presentazione pronta', viewDraft: 'Anteprima', draftReviewNote: 'Bozza da visionare — i dati delle parti e i dettagli finali possono ancora essere completati prima della firma.', updatedOn: 'Aggiornato', agreementLanguage: 'Lingua del contratto' },
};
const SERVICE_COPY: Record<string, Record<ClientLanguage, string>> = {
  'Przygotowanie oferty i rekomendacja ceny': { pl: 'Przygotowanie oferty i rekomendacja ceny', en: 'Listing preparation and price recommendation', it: 'Preparazione dell’offerta e raccomandazione del prezzo' },
  'Profesjonalna sesja zdjęciowa': { pl: 'Profesjonalna sesja zdjęciowa', en: 'Professional photo shoot', it: 'Servizio fotografico professionale' },
  'Opis oraz publikacja ogłoszenia': { pl: 'Opis oraz publikacja ogłoszenia', en: 'Listing copy and publication', it: 'Testo e pubblicazione dell’annuncio' },
  'Obsługa zapytań i prezentacji': { pl: 'Obsługa zapytań i prezentacji', en: 'Enquiry handling and viewings', it: 'Gestione delle richieste e delle visite' },
  'Wsparcie w negocjacjach': { pl: 'Wsparcie w negocjacjach', en: 'Negotiation support', it: 'Supporto nella negoziazione' },
  'Wszystko z wariantu podstawowego': { pl: 'Wszystko z wariantu podstawowego', en: 'Everything in the basic plan', it: 'Tutto il piano base' },
  'Konsultacja home stagingowa': { pl: 'Konsultacja home stagingowa', en: 'Home staging consultation', it: 'Consulenza di home staging' },
  'Film promocyjny i materiały social media': { pl: 'Film promocyjny i materiały social media', en: 'Promotional video and social media assets', it: 'Video promozionale e contenuti per i social media' },
  'Kampania reklamowa i dotarcie do bazy klientów': { pl: 'Kampania reklamowa i dotarcie do bazy klientów', en: 'Advertising campaign and client database outreach', it: 'Campagna pubblicitaria e contatto con il database clienti' },
  'Cykliczne raporty oraz strategia promocji': { pl: 'Cykliczne raporty oraz strategia promocji', en: 'Regular reports and promotion strategy', it: 'Report periodici e strategia promozionale' },
  'Analiza ceny i strategii sprzedaży': { pl: 'Analiza ceny i strategii sprzedaży', en: 'Price analysis and sales strategy', it: 'Analisi del prezzo e strategia di vendita' },
  'Bieżące podsumowania zainteresowania': { pl: 'Bieżące podsumowania zainteresowania', en: 'Regular interest updates', it: 'Aggiornamenti regolari sull’interesse' },
  'Wszystko z wariantu Start': { pl: 'Wszystko z wariantu Start', en: 'Everything in the Start plan', it: 'Tutto il piano Start' },
  'Cykliczne raporty oraz rekomendacje zmian': { pl: 'Cykliczne raporty oraz rekomendacje zmian', en: 'Regular reports and change recommendations', it: 'Report periodici e raccomandazioni di modifica' },
  'Wszystko z wariantu Premium': { pl: 'Wszystko z wariantu Premium', en: 'Everything in the Premium plan', it: 'Tutto il piano Premium' },
  'Indywidualny plan premiery oferty': { pl: 'Indywidualny plan premiery oferty', en: 'Individual launch plan for the listing', it: 'Piano personalizzato per il lancio dell’offerta' },
  'Rozszerzona sesja i krótkie formaty wideo': { pl: 'Rozszerzona sesja i krótkie formaty wideo', en: 'Extended photo shoot and short-form videos', it: 'Servizio fotografico esteso e brevi video' },
  'Materiały ofertowe PL / EN / IT': { pl: 'Materiały ofertowe PL / EN / IT', en: 'Materiały ofertowe PL / EN / IT', it: 'Materiały ofertowe PL / EN / IT' },
  'Spacer 3D lub dron — gdy ma to sens': { pl: 'Spacer 3D lub dron — gdy ma to sens', en: '3D tour or drone footage — where it adds value', it: 'Tour 3D o riprese con drone, quando utili' },
};
const SERVICE_DETAILS: Record<string, Record<ClientLanguage, string>> = {
  'Analiza ceny i strategii sprzedaży': { pl: 'Analizujemy rynek, konkurencyjne ogłoszenia i potencjał mieszkania, aby zaproponować cenę oraz plan startu sprzedaży.', en: 'We analyse the market, comparable listings and the property’s potential to recommend a price and launch plan.', it: 'Analizziamo il mercato, gli annunci comparabili e il potenziale dell’immobile per proporre prezzo e piano di lancio.' },
  'Profesjonalna sesja zdjęciowa': { pl: 'Organizujemy sesję wnętrz i kluczowych atutów nieruchomości. Przed spotkaniem otrzymasz wskazówki do przygotowania mieszkania.', en: 'We arrange professional interior photography and capture the property’s key features. You receive preparation guidance beforehand.', it: 'Organizziamo un servizio fotografico professionale degli interni e dei punti di forza, con indicazioni per preparare l’immobile.' },
  'Opis oraz publikacja ogłoszenia': { pl: 'Przygotowujemy opis, dobieramy zdjęcia i publikujemy ofertę w ustalonych kanałach.', en: 'We prepare the copy, select the imagery and publish the listing through the agreed channels.', it: 'Prepariamo il testo, selezioniamo le immagini e pubblichiamo l’annuncio nei canali concordati.' },
  'Obsługa zapytań i prezentacji': { pl: 'Odbieramy zapytania, wstępnie kwalifikujemy zainteresowanych, organizujemy prezentacje i przekazujemy Ci podsumowania.', en: 'We handle enquiries, pre-qualify interested buyers, arrange viewings and share concise updates with you.', it: 'Gestiamo le richieste, qualifichiamo gli interessati, organizziamo le visite e ti inviamo aggiornamenti sintetici.' },
  'Wsparcie w negocjacjach': { pl: 'Pomagamy ocenić oferty, przygotować odpowiedzi i prowadzić rozmowy do bezpiecznych ustaleń.', en: 'We help assess offers, prepare responses and guide negotiations toward clear, secure terms.', it: 'Ti aiutiamo a valutare le offerte, preparare le risposte e gestire la trattativa verso accordi chiari e sicuri.' },
  'Bieżące podsumowania zainteresowania': { pl: 'Otrzymujesz informacje o liczbie zapytań, prezentacjach, feedbacku i rekomendowanych kolejnych krokach.', en: 'You receive updates on enquiries, viewings, feedback and recommended next steps.', it: 'Ricevi aggiornamenti su richieste, visite, feedback e prossimi passi consigliati.' },
  'Wszystko z wariantu Start': { pl: 'Zakres obejmuje wszystkie działania z pakietu Start — od przygotowania ceny do obsługi prezentacji.', en: 'This includes every Start plan activity, from pricing preparation to viewing management.', it: 'Include tutte le attività del piano Start, dalla definizione del prezzo alla gestione delle visite.' },
  'Konsultacja home stagingowa': { pl: 'Wskazujemy, co warto uporządkować, ukryć lub wyeksponować, aby mieszkanie lepiej prezentowało się na zdjęciach i wizytach.', en: 'We advise what to arrange, remove or highlight so the property performs better in photos and viewings.', it: 'Indichiamo cosa sistemare, rimuovere o valorizzare per presentare meglio l’immobile in foto e durante le visite.' },
  'Film promocyjny i materiały social media': { pl: 'Przygotowujemy krótkie materiały wideo i formaty do komunikacji w mediach społecznościowych.', en: 'We prepare short promotional videos and social-media-ready assets for the listing.', it: 'Prepariamo brevi video promozionali e contenuti pronti per i social media.' },
  'Kampania reklamowa i dotarcie do bazy klientów': { pl: 'Planujemy płatną promocję oraz kontakt z pasującymi klientami z naszej bazy, zależnie od profilu oferty.', en: 'We plan paid promotion and outreach to suitable buyers in our database, based on the listing profile.', it: 'Pianifichiamo promozione a pagamento e contatto con acquirenti adatti nel nostro database, in base al profilo dell’offerta.' },
  'Cykliczne raporty oraz rekomendacje zmian': { pl: 'Regularnie podsumowujemy efekty promocji i rekomendujemy ewentualne zmiany ceny, komunikacji lub ekspozycji.', en: 'We regularly review promotion results and recommend adjustments to price, messaging or exposure where needed.', it: 'Riepiloghiamo regolarmente i risultati e, se necessario, proponiamo modifiche a prezzo, comunicazione o visibilità.' },
  'Wszystko z wariantu Premium': { pl: 'Zakres obejmuje wszystkie działania z pakietów Start i Premium, w tym aktywną promocję.', en: 'This includes all Start and Premium activities, including active promotion.', it: 'Include tutte le attività dei piani Start e Premium, compresa la promozione attiva.' },
  'Indywidualny plan premiery oferty': { pl: 'Ustalamy kolejność publikacji, komunikację oraz moment uruchomienia promocji, aby oferta miała mocne wejście na rynek.', en: 'We plan the release sequence, messaging and promotion timing to give the listing a strong market launch.', it: 'Definiamo sequenza di pubblicazione, comunicazione e tempi della promozione per un lancio efficace sul mercato.' },
  'Rozszerzona sesja i krótkie formaty wideo': { pl: 'Tworzymy szerszy zestaw zdjęć oraz krótkie materiały wideo pokazujące przestrzeń i jej najważniejsze zalety.', en: 'We create a broader set of photos and short videos that show the space and its key advantages.', it: 'Creiamo un set più ampio di foto e brevi video che mostrano lo spazio e i suoi principali vantaggi.' },
  'Materiały ofertowe PL / EN / IT': { pl: 'Przygotowujemy komunikację oferty w trzech językach, aby dotrzeć także do klientów międzynarodowych.', en: 'We prepare listing communications in three languages to also reach international buyers.', it: 'Prepariamo la comunicazione dell’offerta in tre lingue per raggiungere anche acquirenti internazionali.' },
  'Spacer 3D lub dron — gdy ma to sens': { pl: 'Dobieramy spacer 3D albo ujęcia z drona tylko wtedy, gdy realnie lepiej pokażą nieruchomość, widok lub lokalizację.', en: 'We use a 3D tour or drone footage only when it genuinely presents the property, view or location more effectively.', it: 'Usiamo tour 3D o riprese con drone solo quando valorizzano davvero immobile, vista o posizione.' },
};
const PACKAGE_COPY: Record<PackageId, Record<ClientLanguage, { name: string; description: string }>> = {
  start: { pl: { name: 'Start — profesjonalne uruchomienie sprzedaży', description: 'Solidna podstawa: przygotowanie oferty, prezentacja i sprawna obsługa sprzedaży.' }, en: { name: 'Start — professional sales launch', description: 'A solid foundation: listing preparation, presentation and efficient sales handling.' }, it: { name: 'Start — avvio professionale della vendita', description: 'Una base solida: preparazione dell’offerta, presentazione e gestione efficiente della vendita.' } },
  premium: { pl: { name: 'Premium — aktywna sprzedaż', description: 'Najbardziej uniwersalny wariant: pełna prezentacja i aktywne dotarcie do kupujących.' }, en: { name: 'Premium — active sales', description: 'The most versatile plan: complete presentation and active buyer outreach.' }, it: { name: 'Premium — vendita attiva', description: 'Il piano più versatile: presentazione completa e contatto attivo con gli acquirenti.' } },
  signature: { pl: { name: 'Signature — maksymalna ekspozycja', description: 'Indywidualna strategia i najszersza promocja dla nieruchomości, które mają się wyróżnić.' }, en: { name: 'Signature — maximum exposure', description: 'Individual strategy and the broadest promotion for properties that need to stand out.' }, it: { name: 'Signature — massima visibilità', description: 'Strategia individuale e promozione più ampia per immobili che devono distinguersi.' } },
};
const SALE_CONTENT: Record<ClientLanguage, { title: string; address: string; metricValues: string[]; metrics: [string, string][]; milestones: [string, string, string][]; checklist: [string, string][] }> = {
  pl: { title: 'Gwiazdy — mieszkanie na 24. piętrze z widokiem i balkonem', address: 'Katowice, ul. Roździeńskiego 90 · Osiedle Gwiazdy', metricValues: ['01', '0/3', 'Twój wybór'], metrics: [['Etap współpracy', 'jesteśmy przed podpisaniem umowy'], ['Dokumenty', 'przygotujemy je po ustaleniu zakresu'], ['Następny krok', 'wybierz wariant współpracy']], milestones: [['Teraz', 'Wybór zakresu współpracy', 'Wybierz wariant i działania, które są dla Ciebie najważniejsze.'], ['Następnie', 'Uzupełnienie danych nieruchomości', 'Zbierzemy informacje i dokumenty potrzebne do przygotowania umowy.'], ['Kolejny krok', 'Przygotowanie i podpisanie umowy', 'Otrzymasz gotowe dokumenty do wglądu i podpisu.'], ['Po podpisaniu', 'Start przygotowania oferty', 'Dopiero wtedy uruchomimy sesję, materiały i publikację.']], checklist: [['Dane kontaktowe i preferowany sposób kontaktu', 'Potwierdź z opiekunem, jak najwygodniej się z Tobą kontaktować.'], ['Dokumenty nieruchomości', 'Przygotuj informacje i dokumenty — wspólnie ustalimy, czego potrzebujemy.'], ['Wybór zakresu współpracy', 'Wskaż działania, na których mamy się skupić.']] },
  en: { title: 'Gwiazdy — 24th-floor apartment with a view and balcony', address: 'Katowice, 90 Roździeńskiego Street · Gwiazdy Estate', metricValues: ['01', '0/3', 'Your choice'], metrics: [['Cooperation stage', 'we are before signing the agreement'], ['Documents', 'we will prepare them after agreeing the scope'], ['Next step', 'choose a cooperation plan']], milestones: [['Now', 'Choose the scope of cooperation', 'Select a plan and the activities that matter most to you.'], ['Next', 'Complete the property details', 'We will gather the information and documents needed to prepare the agreement.'], ['Following step', 'Prepare and sign the agreement', 'You will receive the completed documents to review and sign.'], ['After signing', 'Start listing preparation', 'Only then will we begin the photo session, materials and publication.']], checklist: [['Contact details and preferred contact method', 'Confirm with your advisor how it is most convenient to contact you.'], ['Property documents', 'Prepare the information and documents — we will agree together what is needed.'], ['Choose the scope of cooperation', 'Select the activities you would like us to focus on.']] },
  it: { title: 'Gwiazdy — appartamento al 24° piano con vista e balcone', address: 'Katowice, via Roździeńskiego 90 · Complesso Gwiazdy', metricValues: ['01', '0/3', 'La tua scelta'], metrics: [['Fase della collaborazione', 'siamo prima della firma del contratto'], ['Documenti', 'li prepareremo dopo aver definito l’ambito'], ['Prossimo passo', 'scegli un piano di collaborazione']], milestones: [['Ora', 'Scegli l’ambito della collaborazione', 'Scegli un piano e le attività più importanti per te.'], ['Successivamente', 'Completa i dati dell’immobile', 'Raccoglieremo informazioni e documenti necessari per preparare il contratto.'], ['Passo seguente', 'Preparazione e firma del contratto', 'Riceverai i documenti pronti per la revisione e la firma.'], ['Dopo la firma', 'Avvio della preparazione dell’offerta', 'Solo allora inizieremo il servizio fotografico, i materiali e la pubblicazione.']], checklist: [['Dati di contatto e modalità preferita', 'Conferma con il consulente il modo più comodo per contattarti.'], ['Documenti dell’immobile', 'Prepara informazioni e documenti: definiremo insieme ciò che serve.'], ['Scegli l’ambito della collaborazione', 'Indica le attività su cui desideri che ci concentriamo.']] },
};

export function ClientPortal() {
  const { user } = useAuth();
  const [portalOffer, setPortalOffer] = useState<Partial<ClientOffer> | null>(null);
  const [generatedDocuments, setGeneratedDocuments] = useState<Record<string, GeneratedPortalDocument>>({});
  const offer = useMemo(() => ({ ...TEST_CLIENT_OFFER, ...portalOffer, agent: { ...TEST_CLIENT_OFFER.agent, ...portalOffer?.agent } }), [portalOffer]);
  const [language, setLanguage] = useState<ClientLanguage>(() => (localStorage.getItem('domiz.client-language') as ClientLanguage) || 'pl');
  const [activeTab, setActiveTab] = useState<'overview' | 'documents'>('documents');
  const [checklist, setChecklist] = useState(offer.checklist);
  const [notice, setNotice] = useState('');
  const [openDocument, setOpenDocument] = useState<string | null>(null);
  const [agreementDocLang, setAgreementDocLang] = useState<'pl' | 'en' | 'it'>('pl');
  const [packageId, setPackageId] = useState<PackageId | null>(null);
  const [cooperationSelection, setCooperationSelection] = useState<Record<string, unknown> | null>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [openServiceInfo, setOpenServiceInfo] = useState<string | null>(null);
  const [isSavingScope, setIsSavingScope] = useState(false);
  const navigate = useNavigate();
  const c = PORTAL_COPY[language];
  const saleContent = SALE_CONTENT[language];

  useEffect(() => {
    document.title = language === 'pl' ? 'Panel właściciela | Domiz Homes' : language === 'it' ? 'Area proprietario | Domiz Homes' : 'Owner portal | Domiz Homes';
  }, [language]);
  const displayTitle = portalOffer?.title || saleContent.title;
  const displayAddress = portalOffer?.address || saleContent.address;
  const isBeforeAgreement = offer.agreementSigned !== true;
  const changeLanguage = (nextLanguage: ClientLanguage) => { setLanguage(nextLanguage); localStorage.setItem('domiz.client-language', nextLanguage); };
  const completed = useMemo(() => checklist.filter(item => item.complete).length, [checklist]);
  const hasSelectedCooperation = Boolean(cooperationSelection && Object.keys(cooperationSelection).length);
  const selectedCooperationMessage = language === 'pl' ? 'Twój wariant współpracy został wybrany. Oczekuj na kontakt od opiekuna swojej oferty.' : language === 'it' ? 'Il tuo piano di collaborazione è stato selezionato. Attendi il contatto del consulente responsabile del tuo immobile.' : 'Your cooperation plan has been selected. Please wait for contact from your property advisor.';
  const documents = useMemo(() => offer.documents.map(item => {
    const key = item.name.startsWith('Proposal') ? 'proposal' : item.name.startsWith('Umowa') ? 'agreement' : '';
    const generated = key ? generatedDocuments[key] : undefined;
    const gammaUrl = generated?.gammaUrl || '';
    const docsUrl = generated?.viewUrl || generated?.docsUrl || '';
    const exportUrl = generated?.exportUrl || '';
    const content = generated?.content || '';
    const contentEn = generated?.contentEn || '';
    const contentIt = generated?.contentIt || '';
    const source = generated?.source || '';
    // Umowa z treścią CRM: zawsze modal podglądu (nie zewnętrzny Docs), żeby właściciel od razu widział dokument.
    const preferInlinePreview = key === 'agreement' && Boolean(content || contentEn || contentIt);
    const openUrl = preferInlinePreview ? '' : (gammaUrl || docsUrl);
    const isReady = Boolean(content || contentEn || contentIt || gammaUrl || docsUrl);
    return isReady
      ? {
          ...item,
          status: 'ready' as const,
          date: formatPortalDate(generated?.updatedAt || item.date, language),
          content,
          contentEn,
          contentIt,
          gammaUrl,
          docsUrl,
          exportUrl,
          openUrl,
          source,
          preferInlinePreview,
        }
      : { ...item, gammaUrl: '', docsUrl: '', exportUrl: '', openUrl: '', content: '', contentEn: '', contentIt: '', source: '', preferInlinePreview: false };
  }), [offer.documents, generatedDocuments, language]);

  useEffect(() => {
    if (!user) return;
    if (user.email?.toLowerCase() === 'apartment_24floor@domizhomes.com') {
      void httpsCallable(functions, 'ensureGwiazdy24FloorClientPortal')().catch(() => undefined);
      void addDoc(collection(db, 'clientDocumentSyncJobs'), {
        status: 'pending',
        uid: user.uid,
        email: user.email,
        offerId: '1784754054299',
        createdAt: new Date().toISOString(),
      }).catch(() => undefined);
    }
    return onSnapshot(doc(db, 'clientPortals', user.uid), snapshot => {
      const savedOffer = snapshot.data()?.portalOffer;
      if (savedOffer && typeof savedOffer === 'object') setPortalOffer(savedOffer as Partial<ClientOffer>);
      const savedSelection = snapshot.data()?.cooperationSelection;
      if (savedSelection && typeof savedSelection === 'object') setCooperationSelection(savedSelection as Record<string, unknown>);
      else if (snapshot.data()?.cooperationSelectionUpdatedAt) setCooperationSelection({ confirmed: true });
      const savedDocuments = snapshot.data()?.generatedDocuments;
      const dottedProposal = snapshot.data()?.['generatedDocuments.proposal'];
      const dottedAgreement = snapshot.data()?.['generatedDocuments.agreement'];
      if (savedDocuments && typeof savedDocuments === 'object') {
        setGeneratedDocuments({
          ...savedDocuments,
          ...(dottedProposal && typeof dottedProposal === 'object' ? { proposal: { ...(savedDocuments.proposal || {}), ...dottedProposal } } : {}),
          ...(dottedAgreement && typeof dottedAgreement === 'object' ? { agreement: { ...(savedDocuments.agreement || {}), ...dottedAgreement } } : {}),
        } as Record<string, GeneratedPortalDocument>);
      } else if ((dottedProposal && typeof dottedProposal === 'object') || (dottedAgreement && typeof dottedAgreement === 'object')) {
        setGeneratedDocuments({
          ...(dottedProposal && typeof dottedProposal === 'object' ? { proposal: dottedProposal as GeneratedPortalDocument } : {}),
          ...(dottedAgreement && typeof dottedAgreement === 'object' ? { agreement: dottedAgreement as GeneratedPortalDocument } : {}),
        });
      }
    });
  }, [user]);

  const toggleTask = (id: string) => {
    setChecklist(items => items.map(item => item.id === id ? { ...item, complete: !item.complete } : item));
    setNotice('Dziękujemy — status został zapisany w tej wersji testowej panelu.');
  };

  const selectedPackage = COOPERATION_PACKAGES.find(item => item.id === packageId);
  const toggleService = (service: string) => setSelectedServices(items => items.includes(service) ? items.filter(item => item !== service) : [...items, service]);
  const saveScope = async () => {
    if (!user || !selectedPackage || selectedServices.length === 0) { setNotice(language === 'pl' ? 'Wybierz wariant i zaznacz przynajmniej jedno działanie.' : language === 'it' ? 'Scegli un piano e almeno un’attività.' : 'Choose a plan and at least one activity.'); return; }
    setIsSavingScope(true);
    const submittedAt = new Date().toISOString();
    try {
      await updateDoc(doc(db, 'clientPortals', user.uid), { cooperationSelection: { packageId: selectedPackage.id, packageName: selectedPackage.name, services: selectedServices }, cooperationSelectionUpdatedAt: submittedAt });
      setCooperationSelection({ packageId: selectedPackage.id });
      localStorage.setItem(`domiz.client-cooperation-selected:${user.uid}`, 'true');
      await addDoc(collection(db, 'inquiries'), { type: 'client_cooperation_selection', name: `Wariant współpracy — ${offer.ownerName}`, email: user.email || '', source: 'Panel klienta', owner: offer.agent.name, leadStatus: 'new', createdAt: submittedAt, message: `${offer.ownerName} wybrała wariant: ${selectedPackage.name}. Działania: ${selectedServices.join(', ')}.`, payload: { title: offer.title, location: offer.address, packageId: selectedPackage.id, packageName: selectedPackage.name, services: selectedServices, clientPortal: true } });
      setNotice(language === 'pl' ? 'Wybrany wariant i zakres zostały wysłane do Twojego opiekuna.' : language === 'it' ? 'Il piano e le attività selezionate sono stati inviati al tuo consulente.' : 'Your selected plan and activities have been sent to your advisor.');
    } catch { setNotice('Nie udało się wysłać wyboru. Spróbuj ponownie za chwilę.'); }
    finally { setIsSavingScope(false); }
  };

  return <div className={`client-portal ${hasSelectedCooperation ? 'client-portal--cooperation-selected' : ''}`}>
    <header className="client-portal__header">
      <div className="client-portal__brand">Domiz <span>Homes</span></div>
      <div className="client-portal__header-right"><div className="client-language-switch" aria-label="Language"><button className={language === 'pl' ? 'is-active' : ''} onClick={() => changeLanguage('pl')}>PL</button><button className={language === 'en' ? 'is-active' : ''} onClick={() => changeLanguage('en')}>EN</button><button className={language === 'it' ? 'is-active' : ''} onClick={() => changeLanguage('it')}>IT</button></div><button className="client-logout" aria-label={c.logout} onClick={() => void signOut(auth).then(() => navigate('/panel-klienta/logowanie'))}><LogOut size={15} /> {c.logout}</button></div>
    </header>

    <main className="client-portal__main">
      <section className="client-hero">
        <div className="client-hero__copy"><p className="client-eyebrow">{c.ownerPanel}</p><h1>{c.hero}</h1><p>{c.heroText}</p></div>
        <div className="client-hero__agent"><img src={tomaszGnatImage} alt={offer.agent.name} /><div><span>{c.agent}</span><strong>{offer.agent.name}</strong><small>{c.advisorRole}</small></div><a href={`tel:${offer.agent.phone.replace(/\s/g, '')}`} aria-label={c.call}><Phone size={18} /></a></div>
      </section>

      <nav className="client-tabs" aria-label={c.documents}><button className={activeTab === 'documents' ? 'is-active' : ''} onClick={() => setActiveTab('documents')}>{c.documents} <span>{documents.length}</span></button><button className={activeTab === 'overview' ? 'is-active' : ''} onClick={() => setActiveTab('overview')}>{c.progress}</button></nav>

      {activeTab === 'documents' && hasSelectedCooperation && <section className="client-scope-confirmed client-panel"><div className="client-scope-confirmed__icon"><Check size={22} /></div><div><p className="client-eyebrow">{c.cooperation}</p><p>{selectedCooperationMessage}</p></div></section>}

      {activeTab === 'overview' ? <>
        <section className="client-offer-card">
          <img className="client-offer-card__image" src="/client-portal/gwiazdy-balkon-zachod.png" alt={displayTitle} />
          <div className="client-offer-card__content"><div className="client-status"><span className="client-status__dot" /> {isBeforeAgreement ? c.beforeAgreement : c.offerStage}</div><h2>{displayTitle}</h2><p><MapPin size={16} /> {displayAddress}</p><div className="client-offer-card__facts"><span>{offer.price.toLocaleString(language === 'pl' ? 'pl-PL' : language === 'it' ? 'it-IT' : 'en-GB')} zł</span><i /> <span>{offer.area} m²</span><i /> <span>{offer.rooms} {c.rooms}</span></div></div>
          <div className="client-offer-card__action">{isBeforeAgreement ? <><span>{c.beforeAgreementDetail}</span><button type="button" onClick={() => setActiveTab('documents')}>{c.goToDocuments} <ChevronRight size={17} /></button></> : <><span>{c.agreementSince} {new Date(`${offer.signedAt}T12:00:00`).toLocaleDateString(language === 'pl' ? 'pl-PL' : language === 'it' ? 'it-IT' : 'en-GB')}</span><Link to={`/oferty/${offer.id}`}>{c.viewOffer} <ChevronRight size={17} /></Link></>}</div>
        </section>

        <section className="client-metrics">{offer.metrics.map((metric, index) => <article key={metric.label}><strong>{saleContent.metricValues[index] || metric.value}</strong><span>{saleContent.metrics[index][0]}</span><small>{saleContent.metrics[index][1]}</small></article>)}</section>

        <div className="client-grid">
          <section className="client-panel client-timeline"><div className="client-panel__heading"><div><p className="client-eyebrow">{c.timeline}</p><h2>{c.happening}</h2></div><CalendarDays size={21} /></div>{isBeforeAgreement && <div className="client-timeline__next-step"><div><strong>{hasSelectedCooperation ? selectedCooperationMessage : c.beforeAgreement}</strong>{!hasSelectedCooperation && <span>{c.beforeAgreementDetail}</span>}</div>{!hasSelectedCooperation && <button type="button" onClick={() => setActiveTab('documents')}>{c.goToDocuments} <ChevronRight size={16} /></button>}</div>}<div className="client-timeline__list">{offer.milestones.map((item, index) => <article key={item.title} className={`client-timeline__item is-${item.status}`}><div className="client-timeline__marker">{item.status === 'complete' ? <Check size={13} /> : <span />}</div><div><small>{saleContent.milestones[index][0]}</small><h3>{saleContent.milestones[index][1]}</h3><p>{saleContent.milestones[index][2]}</p></div>{item.status === 'current' && <span className="client-timeline__current">{c.current}</span>}</article>)}</div></section>

          <aside className="client-side-stack"><section className="client-panel client-checklist"><div className="client-panel__heading"><div><p className="client-eyebrow">{c.yourSide}</p><h2>{c.checklist}</h2></div><span className="client-progress">{completed}/{checklist.length}</span></div><div>{checklist.map((item, index) => <button key={item.id} className={item.complete ? 'is-complete' : ''} onClick={() => toggleTask(item.id)}><span className="client-checklist__box">{item.complete && <Check size={14} />}</span><span><strong>{saleContent.checklist[index][0]}</strong><small>{saleContent.checklist[index][1]}</small></span></button>)}</div></section>
          <section className="client-contact"><div className="client-contact__icon"><Users size={21} /></div><p>{c.question}</p><h2>{c.support}</h2><span>{c.contactText}</span><div><a href={`tel:${offer.agent.phone.replace(/\s/g, '')}`}><Phone size={16} /> {c.call}</a><a href={`mailto:${offer.agent.email}`}><Mail size={16} /> {c.write}</a></div></section></aside>
        </div>
      </> : <><section className="client-scope client-panel"><div className="client-panel__heading"><div><p className="client-eyebrow">{c.cooperation}</p><h2>{c.choosePlan}</h2><p>{c.planText}</p></div></div><div className="client-package-grid">{COOPERATION_PACKAGES.map(item => <button key={item.id} className={`client-package ${packageId === item.id ? 'is-selected' : ''}`} onClick={() => { setPackageId(item.id); setSelectedServices([]); setOpenServiceInfo(null); }}><span className="client-package__radio" /> <strong>{PACKAGE_COPY[item.id][language].name}</strong><small>{PACKAGE_COPY[item.id][language].description}</small></button>)}</div>{selectedPackage && <div className="client-scope__services"><h3>{language === 'pl' ? 'Wybierz działania, na których mamy się skupić' : language === 'it' ? 'Scegli le attività su cui concentrarci' : 'Choose the activities we should focus on'}</h3><p>{language === 'pl' ? 'Zaznacz przynajmniej jedno działanie. Ikona „i” wyjaśnia zakres każdej usługi.' : language === 'it' ? 'Seleziona almeno un’attività. L’icona “i” spiega ogni servizio.' : 'Select at least one activity. The “i” icon explains each service.'}</p>{selectedPackage.services.map(service => <label key={service} className="client-service-option"><input type="checkbox" checked={selectedServices.includes(service)} onChange={() => toggleService(service)} /><span>{SERVICE_COPY[service]?.[language] || service}</span><button type="button" className={`client-service-info ${openServiceInfo === service ? 'is-open' : ''}`} aria-label={language === 'pl' ? `Więcej informacji: ${SERVICE_COPY[service]?.[language] || service}` : language === 'it' ? `Maggiori informazioni: ${SERVICE_COPY[service]?.[language] || service}` : `More information: ${SERVICE_COPY[service]?.[language] || service}`} aria-expanded={openServiceInfo === service} onClick={event => { event.preventDefault(); event.stopPropagation(); setOpenServiceInfo(current => current === service ? null : service); }}><Info size={15} /><span className="client-service-tooltip" role="tooltip">{SERVICE_DETAILS[service]?.[language]}</span></button></label>)}<button className="client-scope__submit" onClick={() => void saveScope()} disabled={isSavingScope}>{isSavingScope ? c.sending : c.confirm}</button></div>}</section><section className="client-documents client-panel"><div className="client-panel__heading"><div><p className="client-eyebrow">{c.documentsIntro}</p><h2>{c.yourDocuments}</h2><p>{c.documentsText}</p></div></div><div className="client-documents__list">{documents.map(document => {
              const label = document.name.startsWith('Proposal') ? c.proposal : document.name.startsWith('Umowa') ? c.agreement : document.name.startsWith('Karta') ? c.propertyCard : c.marketingConsent;
              const gammaUrl = 'gammaUrl' in document ? String(document.gammaUrl || '') : '';
              const docsUrl = 'docsUrl' in document ? String(document.docsUrl || '') : '';
              const preferInlinePreview = 'preferInlinePreview' in document && Boolean(document.preferInlinePreview);
              const openPreview = () => {
                if (preferInlinePreview || (!gammaUrl && !docsUrl)) {
                  if (document.name.startsWith('Umowa')) setAgreementDocLang(language === 'it' ? 'it' : language === 'en' ? 'en' : 'pl');
                  setOpenDocument(document.name);
                }
                else if (gammaUrl) window.open(toGammaPresentUrl(gammaUrl), '_blank', 'noopener,noreferrer');
                else window.open(toGoogleDocsViewUrl(docsUrl), '_blank', 'noopener,noreferrer');
              };
              return <article key={document.name}>
                <div className={`client-document__icon ${document.status === 'ready' ? 'is-ready' : ''}`}><FileText size={21} /></div>
                <div><strong>{label}</strong><span>{document.status === 'ready' ? c.readyStatus : `${c.draft} · ${document.name.startsWith('Karta') ? c.awaitingData : document.name.startsWith('Zgoda') ? c.awaitingSignature : c.preparing}`}</span></div>
                {document.status === 'ready'
                  ? <button type="button" onClick={openPreview}><Eye size={17} /> {c.viewDraft}</button>
                  : <span className="client-document__pending"><Clock3 size={15} /> {c.preparing}</span>}
              </article>;
            })}</div></section></>}
      {notice && <div className="client-notice" role="status"><CircleAlert size={18} /> {notice}<button aria-label="Zamknij komunikat" onClick={() => setNotice('')}>×</button></div>}
      {openDocument && (() => {
        const document = documents.find(item => item.name === openDocument);
        if (!document) return null;
        const label = document.name.startsWith('Proposal') ? c.proposal : document.name.startsWith('Umowa') ? c.agreement : document.name;
        const isAgreement = document.name.startsWith('Umowa');
        const contentPl = 'content' in document ? String(document.content || '') : '';
        const contentEn = 'contentEn' in document ? String(document.contentEn || '') : '';
        const contentIt = 'contentIt' in document
          ? String(document.contentIt || '')
          : '';
        const resolvedContentIt = contentIt || (isAgreement ? buildAgreementDraftItFromOffer(offer) : '');
        const hasLanguageSwitch = Boolean(contentPl || contentEn || resolvedContentIt);
        const activeAgreementContent = isAgreement
          ? (agreementDocLang === 'en'
            ? (contentEn || contentPl || resolvedContentIt)
            : agreementDocLang === 'it'
              ? (resolvedContentIt || contentPl || contentEn)
              : (contentPl || contentEn || resolvedContentIt))
          : contentPl;
        return <div className="client-document-modal" role="dialog" aria-modal="true" aria-label={label}>
          <div className={isAgreement ? 'client-document-modal__sheet is-agreement' : 'client-document-modal__sheet'}>
            <button className="client-document-modal__close" onClick={() => setOpenDocument(null)} aria-label="Zamknij">×</button>
            <p className="client-eyebrow">{c.draft}</p>
            <h2>{label}</h2>
            {document.date ? <span>{c.updatedOn}: {document.date}</span> : null}
            {isAgreement ? <p className="client-document-modal__note">{c.draftReviewNote}</p> : null}
            {isAgreement && hasLanguageSwitch ? <div className="client-document-modal__lang" role="group" aria-label={c.agreementLanguage}>
              <button type="button" className={agreementDocLang === 'pl' ? 'is-active' : ''} onClick={() => setAgreementDocLang('pl')}>PL</button>
              <button type="button" className={agreementDocLang === 'en' ? 'is-active' : ''} onClick={() => setAgreementDocLang('en')}>EN</button>
              <button type="button" className={agreementDocLang === 'it' ? 'is-active' : ''} onClick={() => setAgreementDocLang('it')}>IT</button>
            </div> : null}
            {(() => {
              const exportUrl = 'exportUrl' in document ? String(document.exportUrl || '') : '';
              return exportUrl ? <div className="client-document-modal__actions"><a href={exportUrl} target="_blank" rel="noreferrer">PDF</a></div> : null;
            })()}
            {activeAgreementContent ? <pre>{activeAgreementContent}</pre> : <p className="client-document-modal__empty">{c.preparing}</p>}
          </div>
        </div>;
      })()}
    </main>
    <footer className="client-portal__footer"><span>Domiz Homes · {c.footer}</span><a href={`mailto:${offer.agent.email}`}><Send size={15} /> {c.contactAgent}</a></footer>
  </div>;
}
