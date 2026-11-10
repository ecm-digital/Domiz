const functions = require("firebase-functions");
const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

admin.initializeApp();
const db = admin.firestore();
const textValue = (value) => typeof value === "string" ? value.trim() : "";
const HEYGEN_API_URL = "https://api.heygen.com/v3";
const RESEND_API_URL = "https://api.resend.com/emails";
const htmlEscape = (value) => String(value || "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
const GWIAZDY_CLIENT_PORTAL_UID = "LuB8brujHnTYLGxPMpF2JQxKtZ53";
const GWIAZDY_PROPERTY_ID = "1784754054299";
const GWIAZDY_CLIENT_EMAIL = "apartment_24floor@domizhomes.com";

const isGwiazdy24FloorListing = (listing) => {
    const title = `${textValue(listing?.title)} ${textValue(listing?.propertyDraft?.title)}`.toLowerCase();
    return String(listing?.activePropertyId || "") === GWIAZDY_PROPERTY_ID || title.includes("gwiazd");
};

const asId = (value) => {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
    return "";
};

const resolveClientPortalTargets = async (listing) => {
    const offerIds = [...new Set([
        asId(listing?.activePropertyId),
        asId(listing?.propertyDraft?.id),
        asId(listing?.propertyId),
        isGwiazdy24FloorListing(listing) ? GWIAZDY_PROPERTY_ID : "",
    ].filter(Boolean))];
    const portalIds = new Set();
    if (isGwiazdy24FloorListing(listing)) {
        portalIds.add(GWIAZDY_CLIENT_PORTAL_UID);
        try {
            const gwiazdyUser = await admin.auth().getUserByEmail(GWIAZDY_CLIENT_EMAIL);
            portalIds.add(gwiazdyUser.uid);
        } catch (error) {
            console.warn("resolveClientPortalTargets: brak konta Auth dla", GWIAZDY_CLIENT_EMAIL, error?.message || error);
        }
        const byEmail = await db.collection("clientPortals").where("email", "==", GWIAZDY_CLIENT_EMAIL).get();
        byEmail.forEach((portal) => portalIds.add(portal.id));
    }
    for (const offerId of offerIds) {
        const matched = await db.collection("clientPortals").where("offerId", "==", offerId).get();
        matched.forEach((portal) => portalIds.add(portal.id));
    }
    return { offerIds, portalIds: [...portalIds] };
};

const toGammaPresentUrl = (url) => {
    const raw = textValue(url);
    if (!raw) return "";
    try {
        const parsed = new URL(raw);
        if (!parsed.hostname.includes("gamma.app")) return raw;
        parsed.searchParams.delete("mode");
        parsed.searchParams.set("mode", "present");
        parsed.hash = "";
        return parsed.toString();
    } catch {
        return raw.includes("?") ? `${raw}&mode=present` : `${raw}?mode=present`;
    }
};

const buildProposalForClient = (proposal) => {
    // Gamma może być gotowa do wewnętrznego podglądu, ale klient zobaczy ją
    // dopiero po świadomym udostępnieniu z CRM.
    if (!proposal?.gamma?.gammaUrl || !proposal?.gamma?.publishedAt) return null;
    return {
        content: textValue(proposal.content) || "Proposal współpracy jest gotowy w Gamma.",
        updatedAt: proposal.updatedAt || new Date().toISOString(),
        gammaUrl: toGammaPresentUrl(proposal.gamma.gammaUrl),
        exportUrl: textValue(proposal.gamma.exportUrl),
        source: "gamma",
    };
};

const toGoogleDocsViewUrl = (docIdOrUrl) => {
    const raw = textValue(docIdOrUrl);
    if (!raw) return "";
    const idMatch = raw.match(/\/d\/([a-zA-Z0-9_-]+)/) || (raw.match(/^[a-zA-Z0-9_-]+$/) ? [null, raw] : null);
    const docId = idMatch?.[1] || "";
    if (docId) return `https://docs.google.com/document/d/${docId}/preview`;
    try {
        const parsed = new URL(raw);
        if (parsed.hostname.includes("docs.google.com")) {
            parsed.pathname = parsed.pathname.replace(/\/edit.*$/, "/preview").replace(/\/view.*$/, "/preview");
            if (!parsed.pathname.endsWith("/preview")) parsed.pathname = `${parsed.pathname.replace(/\/$/, "")}/preview`;
            return parsed.toString();
        }
    } catch { /* ignore */ }
    return raw;
};

const isJunkAgreementContent = (content) => {
    const text = textValue(content);
    if (!text) return false;
    return /UMOWA POŚREDNICTWA\s*[—\-]\s*TEST/i.test(text)
        || /TEST DRIVE/i.test(text)
        || /permission-probe/i.test(text);
};

const agreementFactsFromListing = (listing = {}) => {
    const proposal = listing.proposal || {};
    const packageVariant = textValue(proposal.packageVariant);
    const agreementType = textValue(proposal.agreementType);
    return {
        todayPl: new Date().toLocaleDateString("pl-PL"),
        todayEn: new Date().toLocaleDateString("en-GB"),
        todayIt: new Date().toLocaleDateString("it-IT"),
        ownerName: textValue(listing.ownerName) || "",
        title: textValue(listing.title) || "",
        location: textValue(listing.location) || "",
        area: listing.areaM2 ? `${listing.areaM2} m²` : "",
        packageLabelPl: packageVariant || "Zakres indywidualny",
        packageLabelEn: ({ start: "Start", premium: "Premium", signature: "Signature" })[packageVariant] || packageVariant || "Custom scope",
        packageLabelIt: ({ start: "Start", premium: "Premium", signature: "Signature" })[packageVariant] || packageVariant || "Ambito personalizzato",
        scopePl: textValue(proposal.scope) || textValue(listing.auditData?.actionPlan) || "Profesjonalne przygotowanie nieruchomości, sesja zdjęciowa i wideo, opracowanie treści, dystrybucja ogłoszenia, obsługa prezentacji oraz negocjacji.",
        scopeEn: textValue(proposal.scopeEn) || "Professional property preparation, photography and video, listing copy, publication, viewing management and negotiation support.",
        scopeIt: textValue(proposal.scopeIt) || "Preparazione professionale dell’immobile, sessione foto e video, redazione dei contenuti, pubblicazione dell’annuncio, gestione delle visite e supporto nelle negoziazioni.",
        commission: textValue(proposal.commission) || "",
        agreementTypePl: agreementType || "Umowa na wyłączność",
        agreementTypeEn: ({
            "Umowa na wyłączność": "Exclusive brokerage agreement",
            "Umowa otwarta": "Open brokerage agreement",
            "Do ustalenia": "To be agreed",
        })[agreementType] || agreementType || "Exclusive brokerage agreement",
        agreementTypeIt: ({
            "Umowa na wyłączność": "Contratto di intermediazione in esclusiva",
            "Umowa otwarta": "Contratto di intermediazione aperto",
            "Do ustalenia": "Da definire",
        })[agreementType] || agreementType || "Contratto di intermediazione in esclusiva",
        recommendedPrice: textValue(listing.auditData?.estimatedSalePrice)
            || textValue(listing.auditData?.estimatedSalePriceRange)
            || textValue(listing.price)
            || "",
    };
};

const buildAgreementDraftFromListing = (listing = {}) => {
    const f = agreementFactsFromListing(listing);
    return `PROJEKT UMOWY POŚREDNICTWA W SPRZEDAŻY NIERUCHOMOŚCI

sporządzony dnia ${f.todayPl}

WAŻNE: dokument roboczy — przed podpisaniem wymaga uzupełnienia danych stron, numerów identyfikacyjnych, danych nieruchomości oraz weryfikacji prawnej.

§ 1. STRONY UMOWY
1. Zamawiający: ${f.ownerName || "[imię i nazwisko / firma]"}, adres: [adres], PESEL/NIP: [numer], dokument tożsamości / KRS: [dane], dalej „Zamawiający”.
2. Pośrednik: Domiz Homes, dalej „Pośrednik”.

§ 2. PRZEDMIOT UMOWY
1. Zamawiający zleca Pośrednikowi wykonywanie czynności zmierzających do sprzedaży nieruchomości: ${f.title || "[rodzaj nieruchomości]"}, położonej: ${f.location || "[pełny adres]"}, o powierzchni ${f.area || "[powierzchnia]"}, dla której prowadzona jest księga wieczysta nr [numer KW].
2. Cena ofertowa / strategia cenowa: ${f.recommendedPrice || "do ustalenia po analizie porównawczej"}. Ostateczna cena wymaga pisemnego potwierdzenia przez Zamawiającego.

§ 3. PAKIET I ZAKRES CZYNNOŚCI POŚREDNIKA
1. Strony wybierają wariant: ${f.packageLabelPl}.
2. Uzgodniony zakres:
${f.scopePl}
Pośrednik w szczególności przygotuje materiały ofertowe, przeprowadzi promocję, obsłuży zapytania i prezentacje, wesprze negocjacje oraz koordynację dokumentów transakcyjnych.

§ 4. MODEL WSPÓŁPRACY I CZAS TRWANIA
1. Strony wybierają formę: ${f.agreementTypePl}.
2. Umowa zostaje zawarta na okres od [data] do [data] / na czas nieokreślony z okresem wypowiedzenia [liczba] dni.

§ 5. WYNAGRODZENIE
1. Wynagrodzenie Pośrednika wynosi: ${f.commission || "[do uzupełnienia]"}.
2. Moment powstania obowiązku zapłaty, podstawa naliczenia, podatek VAT oraz termin płatności: [do uzupełnienia zgodnie z zaakceptowanymi warunkami].

§ 6. OBOWIĄZKI ZAMAWIAJĄCEGO
Zamawiający zobowiązuje się przekazać prawdziwe i kompletne informacje, udostępnić dokumenty dotyczące stanu prawnego i technicznego, umożliwić przygotowanie materiałów i prezentacje oraz niezwłocznie informować o zmianach wpływających na sprzedaż.

§ 7. DANE, MARKETING I KONTAKT
Zakres zgód na publikację zdjęć, filmu, planów, adresu oraz przetwarzanie danych osobowych zostanie określony w załącznikach i klauzulach informacyjnych zgodnych z obowiązującymi przepisami.

§ 8. POSTANOWIENIA KOŃCOWE
1. Zmiany umowy wymagają formy uzgodnionej przez strony.
2. Załączniki stanowią integralną część umowy.
3. Umowę sporządzono w dwóch jednobrzmiących egzemplarzach.

______________________________          ______________________________
Zamawiający                              Pośrednik / Domiz Homes`;
};

const buildAgreementDraftFromListingEn = (listing = {}) => {
    const f = agreementFactsFromListing(listing);
    return `DRAFT REAL ESTATE BROKERAGE AGREEMENT

dated ${f.todayEn}

IMPORTANT: working draft — before signing, party details, identification numbers, property data and legal review still need to be completed.

§ 1. PARTIES
1. Client: ${f.ownerName || "[full name / company]"}, address: [address], PESEL/tax ID: [number], ID / company register: [details], hereinafter the “Client”.
2. Broker: Domiz Homes, hereinafter the “Broker”.

§ 2. SUBJECT MATTER
1. The Client engages the Broker to carry out activities aimed at selling the property: ${f.title || "[property type]"}, located at: ${f.location || "[full address]"}, with an area of ${f.area || "[area]"}, for which land and mortgage register no. [KW number] is kept.
2. Asking price / pricing strategy: ${f.recommendedPrice || "to be confirmed after comparable market analysis"}. The final price requires written confirmation by the Client.

§ 3. PACKAGE AND SCOPE OF BROKER SERVICES
1. The parties select the package: ${f.packageLabelEn}.
2. Agreed scope:
${f.scopeEn}
In particular, the Broker will prepare listing materials, promote the property, handle enquiries and viewings, support negotiations and coordinate transaction documents.

§ 4. COOPERATION MODEL AND TERM
1. The parties select the form: ${f.agreementTypeEn}.
2. The agreement is concluded for the period from [date] to [date] / for an indefinite term with a notice period of [number] days.

§ 5. REMUNERATION
1. The Broker’s fee is: ${f.commission || "[to be completed]"}.
2. When the fee becomes due, the calculation base, VAT and payment deadline: [to be completed according to the accepted terms].

§ 6. CLIENT OBLIGATIONS
The Client undertakes to provide true and complete information, make available documents concerning the legal and technical condition of the property, enable preparation of materials and viewings, and promptly notify any changes affecting the sale.

§ 7. DATA, MARKETING AND CONTACT
The scope of consents for publishing photos, video, plans and address, as well as personal data processing, will be set out in annexes and information clauses in line with applicable law.

§ 8. FINAL PROVISIONS
1. Amendments to the agreement require the form agreed by the parties.
2. Annexes form an integral part of the agreement.
3. The agreement has been drawn up in two identical counterparts.

______________________________          ______________________________
Client                                   Broker / Domiz Homes`;
};

const buildAgreementDraftFromListingIt = (listing = {}) => {
    const f = agreementFactsFromListing(listing);
    return `BOZZA DI CONTRATTO DI INTERMEDIAZIONE IMMOBILIARE

redatta in data ${f.todayIt}

IMPORTANTE: bozza di lavoro — prima della firma occorre completare i dati delle parti, i numeri identificativi, i dati dell’immobile e la verifica legale.

§ 1. PARTI DEL CONTRATTO
1. Committente: ${f.ownerName || "[nome e cognome / società]"}, indirizzo: [indirizzo], PESEL/NIP / codice fiscale: [numero], documento d’identità / registro imprese: [dati], di seguito il “Committente”.
2. Mediatore: Domiz Homes, di seguito il “Mediatore”.

§ 2. OGGETTO DEL CONTRATTO
1. Il Committente incarica il Mediatore di svolgere attività finalizzate alla vendita dell’immobile: ${f.title || "[tipologia immobile]"}, sito in: ${f.location || "[indirizzo completo]"}, di superficie ${f.area || "[superficie]"}, per il quale è tenuto il registro fondiario n. [numero KW].
2. Prezzo richiesto / strategia di prezzo: ${f.recommendedPrice || "da definire dopo l’analisi comparativa di mercato"}. Il prezzo finale richiede conferma scritta del Committente.

§ 3. PACCHETTO E AMBITO DEI SERVIZI DEL MEDIATORE
1. Le parti scelgono la variante: ${f.packageLabelIt}.
2. Ambito concordato:
${f.scopeIt}
In particolare, il Mediatore preparerà i materiali dell’offerta, promuoverà l’immobile, gestirà le richieste e le visite, supporterà le negoziazioni e coordillerà i documenti della transazione.

§ 4. MODELLO DI COLLABORAZIONE E DURATA
1. Le parti scelgono la forma: ${f.agreementTypeIt}.
2. Il contratto è concluso per il periodo dal [data] al [data] / a tempo indeterminato con un preavviso di [numero] giorni.

§ 5. COMPENSO
1. Il compenso del Mediatore ammonta a: ${f.commission || "[da completare]"}.
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

const ensureAgreementTranslations = (agreement, listing) => {
    const current = agreement && typeof agreement === "object" ? { ...agreement } : null;
    if (!current) return null;
    let changed = false;
    if (isJunkAgreementContent(current.content) || !textValue(current.content)) {
        current.content = buildAgreementDraftFromListing(listing);
        changed = true;
    }
    if (!textValue(current.contentEn) || isJunkAgreementContent(current.contentEn)) {
        current.contentEn = buildAgreementDraftFromListingEn(listing);
        changed = true;
    }
    if (!textValue(current.contentIt) || isJunkAgreementContent(current.contentIt)) {
        current.contentIt = buildAgreementDraftFromListingIt(listing);
        changed = true;
    }
    return { agreement: current, changed };
};

const buildAgreementForClient = (agreement) => {
    const content = textValue(agreement?.content);
    if (!content || isJunkAgreementContent(content)) return null;
    const docsUrl = textValue(agreement?.google?.viewUrl) || textValue(agreement?.google?.docsUrl);
    const contentEn = textValue(agreement?.contentEn);
    const contentIt = textValue(agreement?.contentIt);
    return {
        content,
        ...(contentEn ? { contentEn } : {}),
        ...(contentIt ? { contentIt } : {}),
        updatedAt: agreement.updatedAt || agreement.generatedAt || new Date().toISOString(),
        ...(docsUrl ? {
            docsUrl: toGoogleDocsViewUrl(docsUrl),
            viewUrl: toGoogleDocsViewUrl(docsUrl),
            exportUrl: textValue(agreement.google?.exportUrl),
            source: "google_docs",
        } : {
            source: "crm_draft",
        }),
    };
};

const GOOGLE_DOCS_OWNER_EMAIL = "hello@ecm-digital.com";
const GOOGLE_DOCS_SA_EMAIL = "domiz-docs@domiz-a6a6c.iam.gserviceaccount.com";
const GOOGLE_DOCS_SCOPES = [
    "https://www.googleapis.com/auth/documents",
    "https://www.googleapis.com/auth/drive",
];

const getGoogleAccessTokenFromRefresh = async () => {
    let clientId = textValue(process.env.GOOGLE_OAUTH_CLIENT_ID);
    let clientSecret = textValue(process.env.GOOGLE_OAUTH_CLIENT_SECRET);
    let refreshToken = textValue(process.env.GOOGLE_DOCS_REFRESH_TOKEN);
    if (!clientId || !clientSecret || !refreshToken) {
        const settings = await db.collection("configs").doc("seo").get();
        const data = settings.data() || {};
        clientId = clientId || textValue(data.googleOAuthClientId);
        clientSecret = clientSecret || textValue(data.googleOAuthClientSecret);
        refreshToken = refreshToken || textValue(data.googleDocsRefreshToken);
    }
    if (!clientId || !clientSecret || !refreshToken) return "";
    const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: refreshToken,
            grant_type: "refresh_token",
        }).toString(),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.access_token) {
        console.error("Google OAuth token error", response.status, payload);
        throw new functions.https.HttpsError("failed-precondition", "Nie udało się odświeżyć tokenu Google dla hello@ecm-digital.com.");
    }
    return textValue(payload.access_token);
};

const getGoogleAccessTokenFromRuntime = async () => {
    const { GoogleAuth } = require("google-auth-library");
    // Metadata token usually has cloud-platform only — Docs needs explicit scopes via IAM Credentials.
    const auth = new GoogleAuth({ scopes: ["https://www.googleapis.com/auth/cloud-platform"] });
    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();
    const bootstrapToken = textValue(tokenResponse?.token || tokenResponse);
    if (!bootstrapToken) {
        throw new functions.https.HttpsError("failed-precondition", "Brak tokenu bootstrap Cloud Functions.");
    }

    const candidates = [
        GOOGLE_DOCS_SA_EMAIL,
        textValue(process.env.GCLOUD_PROJECT) ? `${process.env.GCLOUD_PROJECT}@appspot.gserviceaccount.com` : "",
        "domiz-a6a6c@appspot.gserviceaccount.com",
    ].filter(Boolean);

    let lastError = "";
    for (const saEmail of [...new Set(candidates)]) {
        const response = await fetch(`https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${encodeURIComponent(saEmail)}:generateAccessToken`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${bootstrapToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                scope: GOOGLE_DOCS_SCOPES,
                lifetime: "3600s",
            }),
        });
        const payload = await response.json().catch(() => ({}));
        const scopedToken = textValue(payload.accessToken);
        if (response.ok && scopedToken) {
            console.log("Google Docs token via generateAccessToken for", saEmail);
            return scopedToken;
        }
        lastError = payload?.error?.message || `HTTP ${response.status}`;
        console.warn("generateAccessToken failed for", saEmail, lastError);
    }

    // Last resort: metadata token with Docs scopes (often rejected by Docs API on GCF).
    const scopedAuth = new GoogleAuth({ scopes: GOOGLE_DOCS_SCOPES });
    const scopedClient = await scopedAuth.getClient();
    const scopedResponse = await scopedClient.getAccessToken();
    const scoped = textValue(scopedResponse?.token || scopedResponse);
    if (scoped) return scoped;

    throw new functions.https.HttpsError(
        "failed-precondition",
        `Nie udało się uzyskać tokenu Google Docs (${lastError || "brak tokenu"}).`
    );
};

const getGoogleOAuthAccessToken = async () => {
    const fromRefresh = await getGoogleAccessTokenFromRefresh();
    if (fromRefresh) return fromRefresh;
    return getGoogleAccessTokenFromRuntime();
};

const googleApiRequest = async (url, { method = "GET", body, accessToken } = {}) => {
    const token = accessToken || await getGoogleOAuthAccessToken();
    const response = await fetch(url, {
        method,
        headers: {
            Authorization: `Bearer ${token}`,
            ...(body ? { "Content-Type": "application/json" } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
    });
    const raw = await response.text();
    let payload = {};
    try { payload = raw ? JSON.parse(raw) : {}; } catch { payload = { raw }; }
    if (!response.ok) {
        console.error("Google API error", url, response.status, payload);
        const message = payload?.error?.message || payload?.error_description || `Google API ${response.status}`;
        throw new Error(message);
    }
    return payload;
};

const resolveGoogleDocsTemplateId = async () => {
    const fromEnv = textValue(process.env.GOOGLE_DOCS_TEMPLATE_ID);
    if (fromEnv) return fromEnv;
    const settings = await db.collection("configs").doc("seo").get();
    return textValue((settings.data() || {}).googleDocsTemplateId);
};

const createBlankGoogleDoc = async (accessToken, title) => {
    const safeTitle = title.slice(0, 200);

    // 1) Drive create (często działa, gdy Docs documents.create jest zablokowane dla SA)
    try {
        const created = await googleApiRequest("https://www.googleapis.com/drive/v3/files?supportsAllDrives=true", {
            method: "POST",
            accessToken,
            body: {
                name: safeTitle,
                mimeType: "application/vnd.google-apps.document",
            },
        });
        const docId = textValue(created.id);
        if (docId) {
            console.log("Google Doc created via Drive files.create", docId);
            return docId;
        }
    } catch (error) {
        console.warn("Drive files.create failed:", error?.message || error);
    }

    // 2) Docs API
    try {
        const created = await googleApiRequest("https://docs.googleapis.com/v1/documents", {
            method: "POST",
            accessToken,
            body: { title: safeTitle },
        });
        const docId = textValue(created.documentId);
        if (docId) {
            console.log("Google Doc created via Docs API", docId);
            return docId;
        }
    } catch (error) {
        console.warn("Docs documents.create failed:", error?.message || error);
    }

    // 3) Copy shared/public template
    const templateId = await resolveGoogleDocsTemplateId();
    if (templateId) {
        const copied = await googleApiRequest(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(templateId)}/copy?supportsAllDrives=true`, {
            method: "POST",
            accessToken,
            body: { name: safeTitle },
        });
        const docId = textValue(copied.id);
        if (docId) {
            console.log("Google Doc created via template copy", docId, "from", templateId);
            return docId;
        }
    }

    throw new Error(
        "Google Docs zablokowane dla service account (Workspace). " +
        "Utwórz pusty Google Doc na hello@, udostępnij do edycji adresowi domiz-docs@domiz-a6a6c.iam.gserviceaccount.com " +
        "i wklej ID dokumentu jako googleDocsTemplateId w Ustawieniach admina."
    );
};

const createGoogleDocAgreement = async ({ title, content }) => {
    const accessToken = await getGoogleOAuthAccessToken();
    const docId = await createBlankGoogleDoc(accessToken, title);
    if (!docId) throw new Error("Google Docs nie zwróciło documentId.");

    const text = String(content || "").replace(/\r\n/g, "\n");
    if (text.trim()) {
        await googleApiRequest(`https://docs.googleapis.com/v1/documents/${encodeURIComponent(docId)}:batchUpdate`, {
            method: "POST",
            accessToken,
            body: {
                requests: [{
                    insertText: {
                        location: { index: 1 },
                        text,
                    },
                }],
            },
        });
    }

    await googleApiRequest(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(docId)}/permissions?supportsAllDrives=true`, {
        method: "POST",
        accessToken,
        body: { role: "reader", type: "anyone", allowFileDiscovery: false },
    });

    // Gdy dokument tworzy service account, daj hello@ pełną edycję w Drive.
    try {
        await googleApiRequest(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(docId)}/permissions?supportsAllDrives=true&sendNotificationEmail=false`, {
            method: "POST",
            accessToken,
            body: { role: "writer", type: "user", emailAddress: GOOGLE_DOCS_OWNER_EMAIL },
        });
    } catch (error) {
        console.warn("Nie udało się udostępnić umowy do", GOOGLE_DOCS_OWNER_EMAIL, error?.message || error);
    }

    const docsUrl = `https://docs.google.com/document/d/${docId}/edit`;
    const viewUrl = toGoogleDocsViewUrl(docId);
    return { docId, docsUrl, viewUrl };
};

const writePortalDocumentFields = async (portalRef, {
    offerId,
    email,
    proposalForClient,
    agreementForClient,
    clearProposal = false,
    clearAgreement = false,
    extra = {},
} = {}) => {
    const base = {
        ...(offerId ? { offerId } : {}),
        ...(email ? { email } : {}),
        generatedDocumentsUpdatedAt: new Date().toISOString(),
        ...extra,
    };
    await portalRef.set(base, { merge: true });

    // set({ "a.b": x }) tworzy literalny klucz "a.b"; update({ "a.b": x }) ustawia zagnieżdżone a.b.
    // Usuń ewentualny błędny literalny klucz z wcześniejszych deployów.
    try {
        await portalRef.update(new admin.firestore.FieldPath("generatedDocuments.proposal"), admin.firestore.FieldValue.delete());
    } catch (_) { /* pole mogło nie istnieć */ }
    try {
        await portalRef.update(new admin.firestore.FieldPath("generatedDocuments.agreement"), admin.firestore.FieldValue.delete());
    } catch (_) { /* pole mogło nie istnieć */ }

    const pathUpdates = {};
    if (proposalForClient) pathUpdates["generatedDocuments.proposal"] = proposalForClient;
    else if (clearProposal) pathUpdates["generatedDocuments.proposal"] = admin.firestore.FieldValue.delete();
    if (agreementForClient) pathUpdates["generatedDocuments.agreement"] = agreementForClient;
    else if (clearAgreement) pathUpdates["generatedDocuments.agreement"] = admin.firestore.FieldValue.delete();
    if (Object.keys(pathUpdates).length) await portalRef.update(pathUpdates);
};

const publishDocumentsToClientPortals = async (listing, {
    proposalForClient,
    agreementForClient,
    clearProposal = false,
    clearAgreement = false,
} = {}) => {
    const { offerIds, portalIds } = await resolveClientPortalTargets(listing);
    if (!portalIds.length) {
        console.log("publishDocumentsToClientPortals: brak powiązanego clientPortals", { listingTitle: textValue(listing.title), offerIds });
        return [];
    }
    if (!proposalForClient && !agreementForClient && !clearProposal && !clearAgreement) return [];
    await Promise.all(portalIds.map((portalId) => writePortalDocumentFields(db.collection("clientPortals").doc(portalId), {
        offerId: offerIds[0] || GWIAZDY_PROPERTY_ID,
        proposalForClient,
        agreementForClient,
        clearProposal,
        clearAgreement,
    })));
    console.log("publishDocumentsToClientPortals: zaktualizowano panele", portalIds);
    return portalIds;
};

exports.syncGwiazdyClientDocuments = functions.firestore.document("acquisitionListings/{listingId}").onWrite(async (change) => {
    if (!change.after.exists) return null;
    let listing = change.after.data() || {};
    const previous = change.before.exists ? change.before.data() || {} : {};
    let agreement = listing.generatedAgreement;
    const previousAgreement = previous.generatedAgreement;

    // Naprawa śmieciowej treści + dopisanie wersji EN/IT do wglądu.
    if (agreement) {
        const ensured = ensureAgreementTranslations(agreement, listing);
        if (ensured?.changed) {
            const now = new Date().toISOString();
            agreement = {
                ...ensured.agreement,
                updatedAt: now,
                generatedBy: textValue(ensured.agreement.generatedBy) || "Domiz Homes",
            };
            await change.after.ref.set({ generatedAgreement: agreement, updatedAt: now }, { merge: true });
            listing = { ...listing, generatedAgreement: agreement };
        } else {
            agreement = ensured?.agreement || agreement;
        }
    }

    const proposal = listing.generatedProposal;
    const previousProposal = previous.generatedProposal;

    // Proposal trafia do panelu klienta dopiero po gotowej wersji Gamma — sam zapis roboczy zostaje w CRM.
    const proposalForClient = buildProposalForClient(proposal);
    const previousProposalForClient = buildProposalForClient(previousProposal);
    // Umowa — do wglądu w panelu zaraz po zapisie treści w CRM (Google Docs opcjonalne).
    const agreementForClient = buildAgreementForClient(agreement);
    const previousAgreementForClient = buildAgreementForClient(previousAgreement);

    const proposalChanged = JSON.stringify(proposalForClient) !== JSON.stringify(previousProposalForClient);
    const agreementChanged = JSON.stringify(agreementForClient) !== JSON.stringify(previousAgreementForClient);
    const crmDraftProposalChanged = JSON.stringify(proposal || null) !== JSON.stringify(previousProposal || null);
    const crmDraftAgreementChanged = JSON.stringify(agreement || null) !== JSON.stringify(previousAgreement || null);
    const gammaBusy = ["generating", "pending", "processing"].includes(textValue(proposal?.gamma?.status));
    const googleDocsBusy = ["generating", "pending", "processing"].includes(textValue(agreement?.google?.status));
    // Nie czyść panelu w trakcie generowania Gamma / Google Docs.
    // Nowa, jeszcze nieopublikowana wersja nie może zdejmować klientowi
    // poprzedniego proposala z panelu.
    const shouldClearClientDraft = false;
    const shouldClearClientAgreement = Boolean(crmDraftAgreementChanged && agreement && !agreementForClient && !googleDocsBusy);
    if (!proposalChanged && !agreementChanged && !shouldClearClientDraft && !shouldClearClientAgreement) return null;

    await publishDocumentsToClientPortals(listing, {
        proposalForClient: proposalChanged ? proposalForClient : null,
        agreementForClient: agreementChanged ? agreementForClient : null,
        clearProposal: shouldClearClientDraft && !(proposalChanged && proposalForClient),
        clearAgreement: shouldClearClientAgreement && !(agreementChanged && agreementForClient),
    });
    return null;
});

exports.republishClientPortalDocuments = functions.https.onCall(async (data, context) => {
    await requireTeamMember(context);
    const listingId = textValue(data?.listingId);
    if (!listingId) throw new functions.https.HttpsError("invalid-argument", "Podaj listingId.");
    const listingSnapshot = await db.collection("acquisitionListings").doc(listingId).get();
    if (!listingSnapshot.exists) throw new functions.https.HttpsError("not-found", "Nie znaleziono pozysku.");
    const listing = listingSnapshot.data() || {};
    const proposalForClient = buildProposalForClient(listing.generatedProposal);
    if (!proposalForClient) throw new functions.https.HttpsError("failed-precondition", "Brak gotowej prezentacji Gamma przy tym pozysku.");
    const portalIds = await publishDocumentsToClientPortals(listing, { proposalForClient });
    if (!portalIds.length) throw new functions.https.HttpsError("failed-precondition", "Brak konta panelu klienta powiązanego z tą nieruchomością (offerId).");
    return { portalIds, gammaUrl: proposalForClient.gammaUrl };
});

exports.processClientDocumentSyncJob = functions.firestore.document("clientDocumentSyncJobs/{jobId}").onCreate(async (snapshot) => {
    const job = snapshot.data() || {};
    const uid = textValue(job.uid);
    const email = textValue(job.email).toLowerCase();
    const offerId = asId(job.offerId) || GWIAZDY_PROPERTY_ID;
    if (!uid) {
        await snapshot.ref.set({ status: "failed", error: "Brak uid", updatedAt: new Date().toISOString() }, { merge: true });
        return null;
    }

    try {
        const listings = await db.collection("acquisitionListings").get();
        const candidates = listings.docs
            .map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() || {}) }))
            .filter((listing) => {
                if (offerId && [asId(listing.activePropertyId), asId(listing.propertyDraft?.id), asId(listing.propertyId)].includes(offerId)) return true;
                if (email === GWIAZDY_CLIENT_EMAIL || offerId === GWIAZDY_PROPERTY_ID) return isGwiazdy24FloorListing(listing);
                return false;
            });

        const matchedProposalListing = candidates
            .filter((listing) => listing.generatedProposal?.gamma?.gammaUrl)
            .sort((a, b) => String(b.generatedProposal?.updatedAt || "").localeCompare(String(a.generatedProposal?.updatedAt || "")))[0];
        const matchedAgreementListing = candidates
            .filter((listing) => {
                const content = textValue(listing.generatedAgreement?.content);
                return content && !isJunkAgreementContent(content);
            })
            .sort((a, b) => String(b.generatedAgreement?.updatedAt || "").localeCompare(String(a.generatedAgreement?.updatedAt || "")))[0]
            || candidates
                .filter((listing) => listing.generatedAgreement)
                .sort((a, b) => String(b.generatedAgreement?.updatedAt || "").localeCompare(String(a.generatedAgreement?.updatedAt || "")))[0];

        // Napraw śmieciową treść / dopisz EN/IT przed publikacją.
        if (matchedAgreementListing?.generatedAgreement) {
            const ensured = ensureAgreementTranslations(matchedAgreementListing.generatedAgreement, matchedAgreementListing);
            if (ensured?.changed) {
                const now = new Date().toISOString();
                const repaired = {
                    ...ensured.agreement,
                    updatedAt: now,
                    generatedBy: textValue(ensured.agreement.generatedBy) || "Domiz Homes",
                };
                await db.collection("acquisitionListings").doc(matchedAgreementListing.id).set({
                    generatedAgreement: repaired,
                    updatedAt: now,
                }, { merge: true });
                matchedAgreementListing.generatedAgreement = repaired;
            } else {
                matchedAgreementListing.generatedAgreement = ensured.agreement;
            }
        }

        if (!matchedProposalListing && !matchedAgreementListing) {
            await snapshot.ref.set({ status: "failed", error: "Brak gotowego proposala Gamma / umowy dla tej oferty.", updatedAt: new Date().toISOString() }, { merge: true });
            return null;
        }

        const proposalForClient = matchedProposalListing ? buildProposalForClient(matchedProposalListing.generatedProposal) : null;
        const agreementForClient = matchedAgreementListing ? buildAgreementForClient(matchedAgreementListing.generatedAgreement) : null;
        await writePortalDocumentFields(db.collection("clientPortals").doc(uid), {
            offerId,
            email: email || undefined,
            proposalForClient,
            agreementForClient,
        });

        await snapshot.ref.set({
            status: "completed",
            listingId: matchedProposalListing?.id || matchedAgreementListing?.id || null,
            gammaUrl: proposalForClient?.gammaUrl || null,
            docsUrl: agreementForClient?.docsUrl || null,
            updatedAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
        }, { merge: true });
    } catch (error) {
        console.error("processClientDocumentSyncJob failed", error);
        await snapshot.ref.set({ status: "failed", error: error?.message || "Sync failed", updatedAt: new Date().toISOString() }, { merge: true });
    }
    return null;
});

const requireAuthenticatedUser = (context) => {
    if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Zaloguj się ponownie do panelu administratora.");
};

const requireTeamMember = async (context) => {
    requireAuthenticatedUser(context);
    const clientProfile = await db.collection("clientPortals").doc(context.auth.uid).get();
    if (clientProfile.exists) throw new functions.https.HttpsError("permission-denied", "Ta funkcja jest dostępna wyłącznie dla zespołu Domiz Homes.");
};

exports.createClientPortalAccount = functions.https.onCall(async (data, context) => {
    await requireTeamMember(context);
    const email = textValue(data?.email).toLowerCase();
    const password = String(data?.password || "");
    const ownerName = textValue(data?.ownerName);
    const propertyId = textValue(data?.propertyId);
    const propertyTitle = textValue(data?.propertyTitle);
    const propertyLocation = textValue(data?.propertyLocation);
    const caretakerName = textValue(data?.caretakerName) || "your Domiz Homes advisor";
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new functions.https.HttpsError("invalid-argument", "Podaj poprawny adres e-mail klienta.");
    if (password.length < 6) throw new functions.https.HttpsError("invalid-argument", "Hasło musi mieć co najmniej 6 znaków.");
    if (!ownerName || !propertyId || !propertyTitle) throw new functions.https.HttpsError("invalid-argument", "Uzupełnij klienta oraz nieruchomość.");
    let user;
    try {
        user = await admin.auth().createUser({ email, password, displayName: ownerName });
    } catch (error) {
        if (error?.code === "auth/email-already-exists") throw new functions.https.HttpsError("already-exists", "Konto z tym adresem e-mail już istnieje.");
        throw new functions.https.HttpsError("internal", "Nie udało się utworzyć konta klienta.");
    }
    try {
        await db.collection("clientPortals").doc(user.uid).set({ offerId: propertyId, ownerName, email, propertyTitle, propertyLocation, caretakerName, createdAt: new Date().toISOString(), createdBy: context.auth.token.email || context.auth.uid });
    } catch (error) {
        await admin.auth().deleteUser(user.uid);
        throw new functions.https.HttpsError("internal", "Nie udało się przypisać panelu do konta klienta.");
    }
    const message = `Hi ${ownerName}! Your Domiz Homes client account has been created.\n\nLogin: ${email}\nPassword: ${password}\n\nYou can access your Client Portal here:\nhttps://domizhomes.com/panel-klienta\n\nThe portal is available in Polish, English and Italian. As a first step, please select your preferred cooperation plan in the “Cooperation Setup” section. Once you confirm your choice, ${caretakerName} will receive it and contact you with the next steps.`;
    return { uid: user.uid, message };
});

exports.ensureGwiazdy24FloorClientPortal = functions.https.onCall(async (_, context) => {
    requireAuthenticatedUser(context);
    const email = textValue(context.auth.token.email).toLowerCase();
    if (email !== GWIAZDY_CLIENT_EMAIL) throw new functions.https.HttpsError("permission-denied", "To konto nie jest przypisane do tej oferty.");
    const profile = db.collection("clientPortals").doc(context.auth.uid);
    const existing = await profile.get();
    const existingSelection = existing.data()?.cooperationSelection;

    // Dociągnij gotowy proposal Gamma z pozysku Gwiazdy — sync mógł wcześniej trafić na inne UID.
    let proposalForClient = null;
    try {
        const listings = await db.collection("acquisitionListings").get();
        const gwiazdyListing = listings.docs
            .map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() || {}) }))
            .filter((listing) => isGwiazdy24FloorListing(listing) && listing.generatedProposal?.gamma?.gammaUrl)
            .sort((a, b) => String(b.generatedProposal?.updatedAt || "").localeCompare(String(a.generatedProposal?.updatedAt || "")))[0];
        if (gwiazdyListing) proposalForClient = buildProposalForClient(gwiazdyListing.generatedProposal);
    } catch (error) {
        console.warn("ensureGwiazdy24FloorClientPortal: nie udało się dociągnąć proposala", error?.message || error);
    }

    await writePortalDocumentFields(profile, {
        offerId: GWIAZDY_PROPERTY_ID,
        email,
        proposalForClient,
        extra: {
            ownerName: existing.data()?.ownerName || "Klient oferty Gwiazdy",
            propertyTitle: "Gwiazdy — mieszkanie na 24. piętrze z widokiem i balkonem",
            propertyLocation: "Katowice, ul. Roździeńskiego 90 · Osiedle Gwiazdy",
            caretakerName: "Tomasz Gnat",
            ...(existingSelection ? {} : { cooperationSelection: { confirmed: true }, cooperationSelectionUpdatedAt: new Date().toISOString() }),
        },
    });
    return { linked: true, hasProposal: Boolean(proposalForClient), gammaUrl: proposalForClient?.gammaUrl || null };
});

exports.sendCooperationSelectionEmail = functions.runWith({ secrets: ["RESEND_API_KEY"], timeoutSeconds: 30, memory: "256MB" }).firestore.document("inquiries/{inquiryId}").onCreate(async (snapshot) => {
    const inquiry = snapshot.data() || {};
    const isCooperationSelection = inquiry.type === "client_cooperation_selection";
    const isViewingRequest = inquiry.type === "viewing_request";
    if (!isCooperationSelection && !isViewingRequest) return null;

    const apiKey = textValue(process.env.RESEND_API_KEY);
    if (!apiKey) {
        console.error("RESEND_API_KEY is not configured.");
        await snapshot.ref.update({ emailNotification: { status: "failed", recipient: "hello@ecm-digital.com", error: "Missing RESEND_API_KEY", attemptedAt: new Date().toISOString() } });
        return null;
    }

    const payload = inquiry.payload || {};
    const ownerName = textValue(inquiry.name).replace(/^Wariant współpracy\s*[—-]\s*/, "") || "Klient";
    const packageName = textValue(payload.packageName) || "Nie podano";
    const services = Array.isArray(payload.services) ? payload.services.map((service) => `<li>${htmlEscape(service)}</li>`).join("") : "";
    const propertyTitle = textValue(payload.propertyTitle || payload.title) || "Nie podano";
    const location = textValue(payload.propertyLocation || payload.location);
    const clientEmail = textValue(inquiry.email);
    const appointmentDate = textValue(payload.appointmentDate);
    const appointmentTime = textValue(payload.appointmentTime);
    const emailContent = isViewingRequest
        ? {
            subject: `Prośba o prezentację — ${propertyTitle}`,
            html: `<div style="font-family:Arial,sans-serif;color:#173b2d;line-height:1.55"><h2>Nowa prośba o prezentację</h2><p><strong>Nieruchomość:</strong> ${htmlEscape(propertyTitle)}${location ? `<br>${htmlEscape(location)}` : ""}</p><p><strong>Proponowany termin:</strong> ${htmlEscape(appointmentDate || "Nie podano")} · ${htmlEscape(appointmentTime || "Nie podano")} (Europe/Warsaw)</p><p><strong>Klient:</strong> ${htmlEscape(ownerName)}<br><strong>E-mail:</strong> ${htmlEscape(clientEmail || "Nie podano")}<br><strong>Telefon:</strong> ${htmlEscape(textValue(inquiry.phone) || "Nie podano")}</p>${textValue(inquiry.message) ? `<p><strong>Wiadomość:</strong><br>${htmlEscape(textValue(inquiry.message)).replace(/\n/g, "<br>")}</p>` : ""}<p style="margin-top:24px;color:#60726a;font-size:12px">Wiadomość wysłana automatycznie z Domiz Homes.</p></div>`,
        }
        : {
            subject: `Nowy wybór wariantu współpracy — ${ownerName}`,
            html: `<div style="font-family:Arial,sans-serif;color:#173b2d;line-height:1.55"><h2>Nowy wybór wariantu współpracy</h2><p><strong>Klient:</strong> ${htmlEscape(ownerName)}${clientEmail ? ` (${htmlEscape(clientEmail)})` : ""}</p><p><strong>Nieruchomość:</strong> ${htmlEscape(propertyTitle)}${location ? `<br>${htmlEscape(location)}` : ""}</p><p><strong>Wybrany wariant:</strong> ${htmlEscape(packageName)}</p><p><strong>Wybrane działania:</strong></p><ul>${services || "<li>Brak wskazanych działań</li>"}</ul><p style="margin-top:24px;color:#60726a;font-size:12px">Wiadomość wysłana automatycznie z Panelu Klienta Domiz Homes.</p></div>`,
        };
    const response = await fetch(RESEND_API_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
            from: "Domiz Homes <onboarding@resend.dev>",
            to: ["hello@ecm-digital.com"],
            reply_to: clientEmail || undefined,
            ...emailContent,
        }),
    });
    const responseText = await response.text();
    if (!response.ok) {
        console.error("Resend email error", response.status, responseText);
        await snapshot.ref.update({ emailNotification: { status: "failed", recipient: "hello@ecm-digital.com", error: `Resend ${response.status}`, attemptedAt: new Date().toISOString() } });
        return null;
    }
    await snapshot.ref.update({ emailNotification: { status: "sent", recipient: "hello@ecm-digital.com", sentAt: new Date().toISOString() } });
    return null;
});

const heyGenRequest = async (pathName, options = {}) => {
    const apiKey = textValue(process.env.HEYGEN_API_KEY);
    if (!apiKey) throw new functions.https.HttpsError("failed-precondition", "Brak konfiguracji HeyGen API.");
    const response = await fetch(`${HEYGEN_API_URL}${pathName}`, {
        ...options,
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, ...(options.headers || {}) },
    });
    const raw = await response.text();
    let payload = {};
    try { payload = raw ? JSON.parse(raw) : {}; } catch { payload = {}; }
    if (!response.ok) {
        console.error("HeyGen API error", response.status, payload?.error?.code || payload?.code || "unknown");
        const message = response.status === 401 ? "Klucz HeyGen API jest nieprawidłowy."
            : response.status === 402 ? "Doładuj środki HeyGen API."
                : response.status === 429 ? "HeyGen przetwarza już maksymalną liczbę filmów. Spróbuj ponownie później."
                    : payload?.error?.message || payload?.message || "HeyGen nie przyjął zlecenia.";
        throw new functions.https.HttpsError("failed-precondition", message);
    }
    return payload;
};

exports.checkHeyGenConnection = functions.runWith({ secrets: ["HEYGEN_API_KEY"], timeoutSeconds: 30, memory: "256MB" }).https.onCall(async (_, context) => {
    requireAuthenticatedUser(context);
    await heyGenRequest("/users/me", { method: "GET" });
    return { connected: true };
});

exports.createHeyGenVideo = functions.runWith({ secrets: ["HEYGEN_API_KEY"], timeoutSeconds: 60, memory: "256MB" }).https.onCall(async (data, context) => {
    requireAuthenticatedUser(context);
    const propertyId = String(data?.propertyId || "").trim();
    const prompt = textValue(data?.prompt);
    const orientation = data?.orientation === "landscape" ? "landscape" : "portrait";
    if (!propertyId || !prompt) throw new functions.https.HttpsError("invalid-argument", "Wybierz ofertę i uzupełnij scenariusz.");
    if (prompt.length > 10000) throw new functions.https.HttpsError("invalid-argument", "Brief filmu jest zbyt długi.");

    const propertySnapshot = await db.collection("properties").doc(propertyId).get();
    if (!propertySnapshot.exists) throw new functions.https.HttpsError("not-found", "Nie znaleziono wybranej oferty.");
    const property = propertySnapshot.data() || {};
    const imageUrls = [property.image, ...(Array.isArray(property.images) ? property.images : [])]
        .map(textValue)
        .filter((url, index, items) => /^https:\/\//i.test(url) && items.indexOf(url) === index)
        .slice(0, 20);
    const projectRef = db.collection("videoProjects").doc();
    const createdAt = new Date().toISOString();
    const response = await heyGenRequest("/video-agents", {
        method: "POST",
        headers: { "Idempotency-Key": projectRef.id },
        body: JSON.stringify({
            prompt,
            mode: "generate",
            orientation,
            files: imageUrls.map((url) => ({ type: "url", url })),
            callback_id: projectRef.id,
            incognito_mode: true,
        }),
    });
    const sessionId = textValue(response?.data?.session_id);
    const videoId = textValue(response?.data?.video_id);
    if (!videoId) throw new functions.https.HttpsError("internal", "HeyGen nie zwrócił identyfikatora filmu.");
    await projectRef.set({ propertyId: Number(propertyId), propertyTitle: textValue(property.title), provider: "HeyGen", status: "generating", sessionId, videoId, orientation, imageCount: imageUrls.length, createdAt, createdBy: context.auth.token.email || context.auth.uid });
    return { projectId: projectRef.id, sessionId, videoId, status: "generating" };
});

exports.getHeyGenVideoStatus = functions.runWith({ secrets: ["HEYGEN_API_KEY"], timeoutSeconds: 30, memory: "256MB" }).https.onCall(async (data, context) => {
    requireAuthenticatedUser(context);
    const projectId = textValue(data?.projectId);
    const videoId = textValue(data?.videoId);
    if (!projectId || !videoId) throw new functions.https.HttpsError("invalid-argument", "Brak danych projektu filmu.");
    const projectRef = db.collection("videoProjects").doc(projectId);
    const projectSnapshot = await projectRef.get();
    if (!projectSnapshot.exists || projectSnapshot.data()?.videoId !== videoId) throw new functions.https.HttpsError("not-found", "Nie znaleziono projektu filmu.");
    const response = await heyGenRequest(`/videos/${encodeURIComponent(videoId)}`, { method: "GET" });
    const video = response?.data || {};
    const status = textValue(video.status) || (video.video_url ? "completed" : "processing");
    const updates = { status, checkedAt: new Date().toISOString() };
    if (status === "completed" && textValue(video.video_url)) {
        Object.assign(updates, { videoUrl: textValue(video.video_url), videoPageUrl: textValue(video.video_page_url), thumbnailUrl: textValue(video.thumbnail_url), duration: Number(video.duration) || null, completedAt: new Date().toISOString() });
        await db.collection("properties").doc(String(projectSnapshot.data().propertyId)).set({ promotionalVideoUrl: updates.videoUrl, promotionalVideoPageUrl: updates.videoPageUrl, promotionalVideoThumbnailUrl: updates.thumbnailUrl, promotionalVideoUpdatedAt: updates.completedAt }, { merge: true });
    }
    if (status === "failed") Object.assign(updates, { failureMessage: textValue(video.failure_message) || "Generowanie filmu nie powiodło się." });
    await projectRef.set(updates, { merge: true });
    return updates;
});

const startQueuedHeyGenProject = async (snapshot) => {
    const claimed = await db.runTransaction(async (transaction) => {
        const currentSnapshot = await transaction.get(snapshot.ref);
        if (!currentSnapshot.exists) return false;
        const current = currentSnapshot.data() || {};
        const attemptDate = current.startedAttemptAt ? new Date(current.startedAttemptAt) : null;
        const staleAttempt = current.status === "starting" && attemptDate && Date.now() - attemptDate.getTime() > 2 * 60 * 1000;
        if (current.status !== "queued" && !staleAttempt) return false;
        transaction.set(snapshot.ref, { status: "starting", startedAttemptAt: new Date().toISOString(), failureMessage: admin.firestore.FieldValue.delete() }, { merge: true });
        return true;
    });
    if (!claimed) return null;

    try {
        const refreshedSnapshot = await snapshot.ref.get();
        const project = refreshedSnapshot.data() || {};
        const propertyId = String(project.propertyId || "");
        const prompt = textValue(project.prompt);
        if (!propertyId || !prompt || prompt.length > 10000) throw new Error("Nieprawidłowe dane projektu filmu.");
        const propertySnapshot = await db.collection("properties").doc(propertyId).get();
        if (!propertySnapshot.exists) throw new Error("Nie znaleziono oferty.");
        const property = propertySnapshot.data() || {};
        const imageUrls = [property.image, ...(Array.isArray(property.images) ? property.images : [])]
            .map(textValue)
            .filter((url, index, items) => /^https:\/\//i.test(url) && items.indexOf(url) === index)
            .slice(0, 20);
        const response = await heyGenRequest("/video-agents", {
            method: "POST",
            headers: { "Idempotency-Key": snapshot.id },
            body: JSON.stringify({ prompt, mode: "generate", orientation: project.orientation === "landscape" ? "landscape" : "portrait", files: imageUrls.map((url) => ({ type: "url", url })), callback_id: snapshot.id, incognito_mode: true }),
        });
        const videoId = textValue(response?.data?.video_id);
        if (!videoId) throw new Error("HeyGen nie zwrócił identyfikatora filmu.");
        await snapshot.ref.set({ status: "generating", sessionId: textValue(response?.data?.session_id), videoId, imageCount: imageUrls.length, startedAt: new Date().toISOString() }, { merge: true });
    } catch (error) {
        console.error("HeyGen queue error:", error);
        await snapshot.ref.set({ status: "failed", failureMessage: error?.message || "Nie udało się rozpocząć generowania.", failedAt: new Date().toISOString() }, { merge: true });
    }
    return null;
};

exports.generateHeyGenVideoOnCreate = functions.runWith({ secrets: ["HEYGEN_API_KEY"], timeoutSeconds: 60, memory: "256MB" }).firestore.document("videoProjects/{projectId}").onCreate(async (snapshot) => {
    if (snapshot.data()?.status !== "queued") return null;
    return startQueuedHeyGenProject(snapshot);
});

exports.pollHeyGenVideoProjects = functions.runWith({ secrets: ["HEYGEN_API_KEY"], timeoutSeconds: 120, memory: "256MB" }).pubsub.schedule("every 1 minutes").timeZone("Europe/Warsaw").onRun(async () => {
    const jobs = await db.collection("videoProjects").where("status", "in", ["queued", "starting", "generating", "processing", "pending"]).limit(20).get();
    for (const snapshot of jobs.docs) {
        const project = snapshot.data() || {};
        if (["queued", "starting"].includes(project.status)) {
            await startQueuedHeyGenProject(snapshot);
            continue;
        }
        const videoId = textValue(project.videoId);
        if (!videoId) continue;
        try {
            const response = await heyGenRequest(`/videos/${encodeURIComponent(videoId)}`, { method: "GET" });
            const video = response?.data || {};
            const status = textValue(video.status) || (video.video_url ? "completed" : "processing");
            const updates = { status, checkedAt: new Date().toISOString() };
            if (status === "completed" && textValue(video.video_url)) {
                Object.assign(updates, { videoUrl: textValue(video.video_url), videoPageUrl: textValue(video.video_page_url), thumbnailUrl: textValue(video.thumbnail_url), duration: Number(video.duration) || null, completedAt: new Date().toISOString() });
                await db.collection("properties").doc(String(project.propertyId)).set({ promotionalVideoUrl: updates.videoUrl, promotionalVideoPageUrl: updates.videoPageUrl, promotionalVideoThumbnailUrl: updates.thumbnailUrl, promotionalVideoUpdatedAt: updates.completedAt }, { merge: true });
            }
            if (status === "failed") Object.assign(updates, { failureMessage: textValue(video.failure_message) || "Generowanie filmu nie powiodło się." });
            await snapshot.ref.set(updates, { merge: true });
        } catch (error) {
            console.error("HeyGen poll error", snapshot.id, error?.message);
        }
    }
    return null;
});

const notificationDate = (value) => {
    if (!value) return null;
    if (typeof value.toDate === "function") return value.toDate();
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const dateKey = (date) => date.toLocaleDateString("en-CA", { timeZone: "Europe/Warsaw" });

// Co 15 minut sprawdzamy zadania i terminy. Wysyłka jest deduplikowana per urządzenie.
exports.sendAcquisitionPushReminders = functions.pubsub
    .schedule("every 15 minutes")
    .timeZone("Europe/Warsaw")
    .onRun(async () => {
        const [listingsSnapshot, subscriptionsSnapshot] = await Promise.all([
            db.collection("acquisitionListings").get(),
            db.collection("pushSubscriptions").where("enabled", "==", true).get(),
        ]);
        const subscriptions = subscriptionsSnapshot.docs
            .map((snapshot) => ({ id: snapshot.id, ref: snapshot.ref, ...snapshot.data() }))
            .filter((subscription) => textValue(subscription.token) && textValue(subscription.caretaker));
        if (!subscriptions.length) return null;

        const now = new Date();
        const today = dateKey(now);
        const tomorrowDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const tomorrow = dateKey(tomorrowDate);
        const fiveDaysAgo = now.getTime() - 5 * 24 * 60 * 60 * 1000;
        const alerts = [];

        listingsSnapshot.docs.forEach((snapshot) => {
            const lead = snapshot.data() || {};
            const caretaker = textValue(lead.assignee);
            if (!caretaker) return;
            const title = textValue(lead.title) || "Potencjalna oferta";
            const url = `/admin?pozysk=${snapshot.id}`;

            (Array.isArray(lead.tasks) ? lead.tasks : [])
                .filter((task) => task?.status === "open" && textValue(task.dueDate) <= today)
                .forEach((task) => {
                    const overdue = textValue(task.dueDate) < today;
                    alerts.push({ id: `task:${snapshot.id}:${task.id || textValue(task.title)}:${today}`, caretaker, leadId: snapshot.id, title: overdue ? "Zaległe zadanie" : "Zadanie na dziś", body: `${textValue(task.title) || "Sprawdź pozysk"} — ${title}`, url });
                });

            const decisionDate = textValue(lead.proposal?.decisionDate);
            if (decisionDate && !lead.proposalDecision && decisionDate <= tomorrow) {
                const overdue = decisionDate < today;
                alerts.push({ id: `decision:${snapshot.id}:${decisionDate}:${today}`, caretaker, leadId: snapshot.id, title: overdue ? "Termin decyzji minął" : decisionDate === today ? "Decyzja właściciela dzisiaj" : "Decyzja właściciela jutro", body: title, url });
            }

            if (textValue(lead.auditSummary) && lead.stage === "audit") {
                const auditVersion = textValue(lead.auditedAt) || textValue(lead.updatedAt) || "ready";
                alerts.push({ id: `audit:${snapshot.id}:${auditVersion}`, caretaker, leadId: snapshot.id, title: "Audyt jest gotowy", body: `${title} — przygotuj kontakt z właścicielem`, url });
            }

            const activityDate = notificationDate(lead.lastContactAt || lead.updatedAt || lead.createdAt);
            if (activityDate && activityDate.getTime() < fiveDaysAgo && !["acquired", "rejected"].includes(lead.stage || "new")) {
                alerts.push({ id: `stale:${snapshot.id}:${today}`, caretaker, leadId: snapshot.id, title: "Brak aktywności od 5 dni", body: title, url });
            }
        });

        const jobs = alerts.flatMap((alert) => subscriptions
            .filter((subscription) => subscription.caretaker === alert.caretaker)
            .map((subscription) => ({ alert, subscription })));
        if (!jobs.length) return null;

        for (let offset = 0; offset < jobs.length; offset += 400) {
            const chunk = jobs.slice(offset, offset + 400);
            const deliveryRefs = chunk.map(({ alert, subscription }) => db.collection("pushNotificationDeliveries").doc(crypto.createHash("sha256").update(`${alert.id}:${subscription.id}`).digest("hex")));
            const deliverySnapshots = await db.getAll(...deliveryRefs);
            const pending = chunk.map((job, index) => ({ ...job, deliveryRef: deliveryRefs[index] })).filter((_, index) => !deliverySnapshots[index].exists);
            if (!pending.length) continue;

            const response = await admin.messaging().sendEach(pending.map(({ alert, subscription }) => ({
                token: subscription.token,
                data: { title: alert.title, body: alert.body, url: alert.url, leadId: alert.leadId, notificationId: alert.id },
                webpush: { headers: { Urgency: alert.title.includes("Zaległe") ? "high" : "normal", TTL: "86400" }, fcmOptions: { link: `https://domizhomes.com${alert.url}` } },
            })));
            const batch = db.batch();
            response.responses.forEach((result, index) => {
                const current = pending[index];
                if (result.success) {
                    batch.set(current.deliveryRef, { notificationId: current.alert.id, subscriptionId: current.subscription.id, leadId: current.alert.leadId, sentAt: admin.firestore.FieldValue.serverTimestamp() });
                    return;
                }
                const code = result.error?.code || "";
                if (code.includes("registration-token-not-registered") || code.includes("invalid-registration-token")) batch.set(current.subscription.ref, { enabled: false, disabledAt: admin.firestore.FieldValue.serverTimestamp(), errorCode: code }, { merge: true });
                console.error("Push notification delivery failed:", code, result.error?.message);
            });
            await batch.commit();
        }
        return null;
    });

// Główna funkcja renderująca podgląd
exports.app = functions.https.onRequest(async (req, res) => {
    const userAgent = (req.headers["user-agent"] || "").toLowerCase();

    // Sprawdź czy to bot (Facebook, WhatsApp, Twitter, LinkedIn, Slack, Discord itp.)
    const isBot = userAgent.includes("facebook") ||
        userAgent.includes("whatsapp") ||
        userAgent.includes("twitter") ||
        userAgent.includes("linkedin") ||
        userAgent.includes("slack") ||
        userAgent.includes("discord") ||
        userAgent.includes("bot") ||
        userAgent.includes("crawler") ||
        userAgent.includes("spider");

    // Jeśli to NIE jest bot, nic nie rób (niech Firebase Hosting obsłuży to normalnie)
    // UWAGA: Firebase Hosting "rewrites" działają tak, że zawsze przekierują do funkcji,
    // jeśli URL pasuje. Więc musimy obsłużyć też zwykłych userów.
    // Ale w przypadku rewrites hostingowych, funkcja jest wywoływana TYLKO JEŚLI plik statyczny nie istnieje.
    // Ponieważ /oferty/cos-tam nie istnieje jako plik fizyczny, 
    // Hosting przekieruje do funkcji.

    const urlPath = req.path;
    const parts = urlPath.split('/').filter(Boolean); // np. ['oferty', 'slug-123']

    // Sprawdź czy prośba dotyczy oferty (/oferty/...)
    if (parts[0] === 'oferty' && parts[1]) {
        const slug = parts[1];
        const propertyId = slug.split('-').pop(); // wyciągamy ID z końca

        if (propertyId) {
            try {
                // Pobierz ofertę z Firestore
                const docRef = db.collection('properties').doc(propertyId);
                const docSnap = await docRef.get();

                if (docSnap.exists) {
                    const property = docSnap.data();
                    const title = `${property.title} | Domiz Homes`;
                    const description = property.description ? property.description.substring(0, 150) + "..." : "Zobacz szczegóły oferty.";
                    const image = property.image || "https://domiz-a6a6c.web.app/og-image.png";

                    // Wczytaj szablon HTML (powinien być w folderze funkcji po buildzie)
                    // UWAGA: Musisz upewnić się, że index.html jest kopiowany do folderu functions przed deployem!
                    const templatePath = path.join(__dirname, 'index.html');
                    let html = fs.readFileSync(templatePath, 'utf8');

                    // Podmień meta tagi
                    html = html
                        .replace(/<title>.*?<\/title>/, `<title>${title}</title>`)
                        .replace(/<meta property="og:title" content=".*?" \/>/, `<meta property="og:title" content="${title}" />`)
                        .replace(/<meta property="og:description" content=".*?" \/>/, `<meta property="og:description" content="${description}" />`)
                        .replace(/<meta property="og:image" content=".*?" \/>/, `<meta property="og:image" content="${image}" />`)
                        .replace(/<meta property="twitter:title" content=".*?" \/>/, `<meta property="twitter:title" content="${title}" />`)
                        .replace(/<meta property="twitter:description" content=".*?" \/>/, `<meta property="twitter:description" content="${description}" />`)
                        .replace(/<meta property="twitter:image" content=".*?" \/>/, `<meta property="twitter:image" content="${image}" />`);

                    // Wyślij zmodyfikowany HTML
                    // Dodaj nagłówek Cache-Control dla botów (krótki czas życia)
                    res.set('Cache-Control', 'public, max-age=300, s-maxage=600');
                    res.status(200).send(html);
                    return;
                }
            } catch (error) {
                console.error("Error fetching property:", error);
                // W razie błędu, wyślij standardowy index.html
            }
        }
    }

    // Fallback: jeśli to nie oferta, albo błąd -> wyślij standardowy index.html
    const fallbackPath = path.join(__dirname, 'index.html');
    try {
        const html = fs.readFileSync(fallbackPath, 'utf8');
        res.status(200).send(html);
    } catch (e) {
        res.status(404).send('Not found');
    }
});

exports.syncGammaSecretToConfig = functions.runWith({ secrets: ["GAMMA_API_KEY"], timeoutSeconds: 30, memory: "256MB" }).pubsub.schedule("every 1 hours").timeZone("Europe/Warsaw").onRun(async () => {
    const key = textValue(process.env.GAMMA_API_KEY);
    if (!key) return null;
    await db.collection("configs").doc("seo").set({
        gammaApiKey: key,
        gammaApiKeySyncedAt: new Date().toISOString(),
    }, { merge: true });
    return null;
});

const GAMMA_API_URL = "https://public-api.gamma.app/v1.0";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getGammaApiKey = async () => {
    // Secret Firebase (aktualny) ma pierwszeństwo przed ewentualnym starym kluczem w Ustawieniach.
    const fromEnv = textValue(process.env.GAMMA_API_KEY);
    if (fromEnv) return fromEnv;
    const settings = await db.collection("configs").doc("seo").get();
    return textValue(settings.data()?.gammaApiKey);
};

const gammaRequest = async (pathName, options = {}) => {
    const apiKey = await getGammaApiKey();
    if (!apiKey) {
        const error = new Error("Brak klucza Gamma API. Sprawdź secret GAMMA_API_KEY.");
        error.code = "failed-precondition";
        throw error;
    }
    const response = await fetch(`${GAMMA_API_URL}${pathName}`, {
        ...options,
        headers: { "Content-Type": "application/json", "X-API-KEY": apiKey, ...(options.headers || {}) },
    });
    const raw = await response.text();
    let payload = {};
    try { payload = raw ? JSON.parse(raw) : {}; } catch { payload = {}; }
    if (!response.ok) {
        console.error("Gamma API error", response.status, payload);
        const message = response.status === 401 || response.status === 403
            ? "Klucz Gamma API jest nieprawidłowy lub konto nie ma dostępu do API."
            : response.status === 429
                ? "Gamma limituje żądania. Spróbuj ponownie za chwilę."
                : textValue(payload?.message) || textValue(payload?.error) || `Gamma nie przyjęła zlecenia (HTTP ${response.status}).`;
        const error = new Error(message);
        error.code = "failed-precondition";
        throw error;
    }
    return payload;
};

const pollGammaGeneration = async (generationId) => {
    const startedAt = Date.now();
    while (Date.now() - startedAt < 100000) {
        const statusPayload = await gammaRequest(`/generations/${encodeURIComponent(generationId)}`, { method: "GET" });
        const status = textValue(statusPayload?.status).toLowerCase();
        if (status === "completed" || statusPayload?.gammaUrl) {
            return {
                generationId,
                status: "completed",
                gammaUrl: textValue(statusPayload?.gammaUrl),
                exportUrl: textValue(statusPayload?.exportUrl),
                gammaId: textValue(statusPayload?.gammaId),
            };
        }
        if (["failed", "error", "cancelled", "canceled"].includes(status)) {
            throw new Error(textValue(statusPayload?.error) || "Gamma nie dokończyła generowania proposala.");
        }
        await sleep(2500);
    }
    throw new Error("Gamma nadal generuje prezentację. Spróbuj ponownie za chwilę.");
};

exports.processGammaProposalJob = functions.runWith({ secrets: ["GAMMA_API_KEY"], timeoutSeconds: 120, memory: "512MB" }).firestore.document("gammaJobs/{jobId}").onCreate(async (snapshot, context) => {
    const job = snapshot.data() || {};
    const jobRef = snapshot.ref;
    const listingId = textValue(job.listingId);
    const content = textValue(job.content);
    const titleHint = textValue(job.title);
    const createdBy = textValue(job.createdBy) || "Domiz Homes";
    if (!listingId || content.length < 40) {
        await jobRef.set({ status: "failed", error: "Brak listingId lub treści proposala.", updatedAt: new Date().toISOString() }, { merge: true });
        return null;
    }

    const listingRef = db.collection("acquisitionListings").doc(listingId);
    const listingSnapshot = await listingRef.get();
    if (!listingSnapshot.exists) {
        await jobRef.set({ status: "failed", error: "Nie znaleziono pozysku.", updatedAt: new Date().toISOString() }, { merge: true });
        return null;
    }

    const listing = listingSnapshot.data() || {};
    const propertyTitle = titleHint || textValue(listing.title) || "nieruchomość";
    const now = new Date().toISOString();

    try {
        await jobRef.set({ status: "processing", updatedAt: now }, { merge: true });
        await listingRef.set({
            generatedProposal: {
                ...(listing.generatedProposal || {}),
                content,
                generatedAt: listing.generatedProposal?.generatedAt || now,
                updatedAt: now,
                generatedBy: createdBy,
                gamma: {
                    ...(listing.generatedProposal?.gamma || {}),
                    status: "generating",
                    jobId: context.params.jobId,
                    updatedAt: now,
                },
            },
            updatedAt: now,
        }, { merge: true });

        const generation = await gammaRequest("/generations", {
            method: "POST",
            body: JSON.stringify({
                inputText: content,
                textMode: "preserve",
                format: "presentation",
                numCards: 8,
                cardSplit: "auto",
                exportAs: "pdf",
                title: `Proposal Domiz Homes — ${propertyTitle}`.slice(0, 500),
                additionalInstructions: "To jest profesjonalna propozycja współpracy biura nieruchomości Domiz Homes dla właściciela. Zachowaj język polski, spokojny premium ton i wszystkie kluczowe warunki, zakres usług, wynagrodzenie oraz daty.",
                textOptions: { language: "pl" },
                imageOptions: { source: "noImages" },
                sharingOptions: {
                    workspaceAccess: "edit",
                    externalAccess: "view",
                },
            }),
        });

        const generationId = textValue(generation?.generationId) || textValue(generation?.id);
        if (!generationId) throw new Error("Gamma nie zwróciła generationId.");

        await jobRef.set({ status: "generating", generationId, updatedAt: new Date().toISOString() }, { merge: true });
        const completed = await pollGammaGeneration(generationId);
        const completedAt = new Date().toISOString();
        const versionId = textValue(job.versionId) || context.params.jobId;
        const versionNumber = Number(job.versionNumber) || ((Array.isArray(listing.proposalVersions) ? listing.proposalVersions.length : 0) + 1);
        const gammaMeta = {
            generationId: completed.generationId,
            gammaId: completed.gammaId || "",
            gammaUrl: completed.gammaUrl,
            presentUrl: toGammaPresentUrl(completed.gammaUrl),
            exportUrl: completed.exportUrl,
            status: "completed",
            jobId: context.params.jobId,
            createdAt: listing.generatedProposal?.gamma?.createdAt || now,
            updatedAt: completedAt,
            createdBy,
        };
        const generatedProposal = {
            content,
            generatedAt: listing.generatedProposal?.generatedAt || now,
            updatedAt: completedAt,
            generatedBy: createdBy,
            versionId,
            versionNumber,
            gamma: gammaMeta,
        };

        const proposalVersions = [
            ...(Array.isArray(listing.proposalVersions) ? listing.proposalVersions : []),
            { ...generatedProposal, id: versionId },
        ];
        await listingRef.set({ generatedProposal, proposalVersions, updatedAt: completedAt }, { merge: true });
        await jobRef.set({
            status: "completed",
            generationId: gammaMeta.generationId,
            gammaUrl: gammaMeta.gammaUrl,
            exportUrl: gammaMeta.exportUrl,
            gammaId: gammaMeta.gammaId,
            versionId,
            versionNumber,
            updatedAt: completedAt,
            completedAt,
        }, { merge: true });
    } catch (error) {
        console.error("processGammaProposalJob failed", error);
        const message = error?.message || "Nie udało się wygenerować proposala w Gamma.";
        await jobRef.set({ status: "failed", error: message, updatedAt: new Date().toISOString() }, { merge: true });
        await listingRef.set({
            generatedProposal: {
                ...(listing.generatedProposal || {}),
                content,
                generatedAt: listing.generatedProposal?.generatedAt || now,
                updatedAt: new Date().toISOString(),
                generatedBy: createdBy,
                gamma: {
                    ...(listing.generatedProposal?.gamma || {}),
                    status: "failed",
                    error: message,
                    jobId: context.params.jobId,
                    updatedAt: new Date().toISOString(),
                },
            },
            updatedAt: new Date().toISOString(),
        }, { merge: true });
    }
    return null;
});

exports.createGammaProposal = functions.runWith({ secrets: ["GAMMA_API_KEY"], timeoutSeconds: 120, memory: "512MB" }).https.onCall(async (data, context) => {
    await requireTeamMember(context);
    const listingId = textValue(data?.listingId);
    const content = textValue(data?.content);
    const titleHint = textValue(data?.title);
    if (!listingId) throw new functions.https.HttpsError("invalid-argument", "Brak identyfikatora pozysku.");
    if (!content || content.length < 40) throw new functions.https.HttpsError("invalid-argument", "Uzupełnij treść proposala przed wysyłką do Gamma.");
    if (content.length > 90000) throw new functions.https.HttpsError("invalid-argument", "Treść proposala jest zbyt długa dla Gamma API.");

    const listingRef = db.collection("acquisitionListings").doc(listingId);
    const listingSnapshot = await listingRef.get();
    if (!listingSnapshot.exists) throw new functions.https.HttpsError("not-found", "Nie znaleziono pozysku.");
    const listing = listingSnapshot.data() || {};
    const propertyTitle = titleHint || textValue(listing.title) || "nieruchomość";
    const now = new Date().toISOString();

    await listingRef.set({
        generatedProposal: {
            ...(listing.generatedProposal || {}),
            content,
            generatedAt: listing.generatedProposal?.generatedAt || now,
            updatedAt: now,
            generatedBy: context.auth.token.email || context.auth.uid,
            gamma: {
                ...(listing.generatedProposal?.gamma || {}),
                status: "generating",
                updatedAt: now,
            },
        },
        updatedAt: now,
    }, { merge: true });

    let generation;
    try {
        generation = await gammaRequest("/generations", {
            method: "POST",
            body: JSON.stringify({
                inputText: content,
                textMode: "preserve",
                format: "presentation",
                numCards: 8,
                cardSplit: "auto",
                exportAs: "pdf",
                title: `Proposal Domiz Homes — ${propertyTitle}`.slice(0, 500),
                additionalInstructions: "To jest profesjonalna propozycja współpracy biura nieruchomości Domiz Homes dla właściciela. Zachowaj język polski, spokojny premium ton i wszystkie kluczowe warunki, zakres usług, wynagrodzenie oraz daty. Układ prezentacji ma być czytelny dla klienta końcowego.",
                textOptions: { language: "pl" },
                imageOptions: { source: "noImages" },
                sharingOptions: {
                    workspaceAccess: "edit",
                    externalAccess: "view",
                },
            }),
        });
    } catch (error) {
        await listingRef.set({
            generatedProposal: {
                ...(listing.generatedProposal || {}),
                content,
                generatedAt: listing.generatedProposal?.generatedAt || now,
                updatedAt: new Date().toISOString(),
                generatedBy: context.auth.token.email || context.auth.uid,
                gamma: {
                    ...(listing.generatedProposal?.gamma || {}),
                    status: "failed",
                    error: error.message || "Gamma API error",
                    updatedAt: new Date().toISOString(),
                },
            },
            updatedAt: new Date().toISOString(),
        }, { merge: true });
        throw error;
    }

    const generationId = textValue(generation?.generationId) || textValue(generation?.id);
    if (!generationId) throw new functions.https.HttpsError("internal", "Gamma nie zwróciła generationId.");

    const completed = await pollGammaGeneration(generationId);
    const completedAt = new Date().toISOString();
    const gammaMeta = {
        generationId: completed.generationId,
        gammaId: completed.gammaId || "",
        gammaUrl: completed.gammaUrl,
        exportUrl: completed.exportUrl,
        status: "completed",
        createdAt: listing.generatedProposal?.gamma?.createdAt || now,
        updatedAt: completedAt,
        createdBy: context.auth.token.email || context.auth.uid,
    };

    const previousProposal = listing.generatedProposal || {};
    const generatedProposal = {
        content,
        generatedAt: previousProposal.generatedAt || now,
        updatedAt: completedAt,
        generatedBy: context.auth.token.email || context.auth.uid,
        gamma: gammaMeta,
    };

    await listingRef.set({ generatedProposal, updatedAt: completedAt }, { merge: true });

    return {
        listingId,
        generationId: gammaMeta.generationId,
        gammaUrl: gammaMeta.gammaUrl,
        exportUrl: gammaMeta.exportUrl,
        status: "completed",
        generatedProposal,
    };
});

exports.getGammaProposalStatus = functions.runWith({ secrets: ["GAMMA_API_KEY"], timeoutSeconds: 60, memory: "256MB" }).https.onCall(async (data, context) => {
    await requireTeamMember(context);
    const listingId = textValue(data?.listingId);
    const generationId = textValue(data?.generationId);
    if (!listingId || !generationId) throw new functions.https.HttpsError("invalid-argument", "Brak listingId lub generationId.");

    const listingRef = db.collection("acquisitionListings").doc(listingId);
    const listingSnapshot = await listingRef.get();
    if (!listingSnapshot.exists) throw new functions.https.HttpsError("not-found", "Nie znaleziono pozysku.");
    const listing = listingSnapshot.data() || {};
    const completed = await pollGammaGeneration(generationId);
    const now = new Date().toISOString();
    const gammaMeta = {
        ...(listing.generatedProposal?.gamma || {}),
        generationId: completed.generationId,
        gammaId: completed.gammaId || listing.generatedProposal?.gamma?.gammaId || "",
        gammaUrl: completed.gammaUrl,
        exportUrl: completed.exportUrl,
        status: "completed",
        updatedAt: now,
    };
    const generatedProposal = {
        ...(listing.generatedProposal || {}),
        content: textValue(listing.generatedProposal?.content) || textValue(data?.content),
        updatedAt: now,
        gamma: gammaMeta,
    };
    await listingRef.set({ generatedProposal, updatedAt: now }, { merge: true });
    return { listingId, ...gammaMeta, generatedProposal };
});

exports.processGoogleDocAgreementJob = functions.runWith({
    timeoutSeconds: 120,
    memory: "512MB",
}).firestore.document("googleDocJobs/{jobId}").onCreate(async (snapshot, context) => {
    const job = snapshot.data() || {};
    const jobRef = snapshot.ref;
    const listingId = textValue(job.listingId);
    const content = textValue(job.content);
    const titleHint = textValue(job.title);
    const createdBy = textValue(job.createdBy) || "Domiz Homes";
    if (!listingId || content.length < 40) {
        await jobRef.set({ status: "failed", error: "Brak listingId lub treści umowy.", updatedAt: new Date().toISOString() }, { merge: true });
        return null;
    }

    const listingRef = db.collection("acquisitionListings").doc(listingId);
    const listingSnapshot = await listingRef.get();
    if (!listingSnapshot.exists) {
        await jobRef.set({ status: "failed", error: "Nie znaleziono pozysku.", updatedAt: new Date().toISOString() }, { merge: true });
        return null;
    }

    const listing = listingSnapshot.data() || {};
    const propertyTitle = titleHint || textValue(listing.title) || "nieruchomość";
    const now = new Date().toISOString();

    try {
        await jobRef.set({ status: "processing", updatedAt: now }, { merge: true });
        // Nie nadpisuj treści CRM na starcie — dopiero po udanym Google Docs.
        await listingRef.set({
            generatedAgreement: {
                ...(listing.generatedAgreement || {}),
                updatedAt: now,
                google: {
                    ...(listing.generatedAgreement?.google || {}),
                    status: "generating",
                    jobId: context.params.jobId,
                    updatedAt: now,
                },
            },
            updatedAt: now,
        }, { merge: true });

        const created = await createGoogleDocAgreement({
            title: `Umowa pośrednictwa — ${propertyTitle}`,
            content,
        });
        const completedAt = new Date().toISOString();
        const googleMeta = {
            docId: created.docId,
            docsUrl: created.docsUrl,
            viewUrl: created.viewUrl,
            status: "completed",
            jobId: context.params.jobId,
            createdAt: listing.generatedAgreement?.google?.createdAt || now,
            updatedAt: completedAt,
            createdBy,
        };
        const generatedAgreement = {
            content,
            generatedAt: listing.generatedAgreement?.generatedAt || now,
            updatedAt: completedAt,
            generatedBy: createdBy,
            google: googleMeta,
        };

        await listingRef.set({ generatedAgreement, updatedAt: completedAt }, { merge: true });
        await publishDocumentsToClientPortals({ ...listing, generatedAgreement }, {
            agreementForClient: buildAgreementForClient(generatedAgreement),
        });
        await jobRef.set({
            status: "completed",
            docId: googleMeta.docId,
            docsUrl: googleMeta.docsUrl,
            viewUrl: googleMeta.viewUrl,
            updatedAt: completedAt,
            completedAt,
        }, { merge: true });
    } catch (error) {
        console.error("processGoogleDocAgreementJob failed", error);
        const message = error?.message || "Nie udało się utworzyć umowy w Google Docs.";
        await jobRef.set({ status: "failed", error: message, updatedAt: new Date().toISOString() }, { merge: true });
        await listingRef.set({
            generatedAgreement: {
                ...(listing.generatedAgreement || {}),
                content,
                generatedAt: listing.generatedAgreement?.generatedAt || now,
                updatedAt: new Date().toISOString(),
                generatedBy: createdBy,
                google: {
                    ...(listing.generatedAgreement?.google || {}),
                    status: "failed",
                    error: message,
                    jobId: context.params.jobId,
                    updatedAt: new Date().toISOString(),
                },
            },
            updatedAt: new Date().toISOString(),
        }, { merge: true });
    }
    return null;
});
