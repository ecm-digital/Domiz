const functions = require("firebase-functions");
const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

admin.initializeApp();
const db = admin.firestore();

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
