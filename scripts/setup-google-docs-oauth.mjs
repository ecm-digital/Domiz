#!/usr/bin/env node
/**
 * Jednorazowy setup OAuth dla umów Google Docs (konto hello@ecm-digital.com).
 *
 * 1. W Google Cloud Console (projekt z Docs/Drive API):
 *    - włącz Google Docs API + Google Drive API
 *    - utwórz OAuth Client ID typu "Desktop" lub "Web"
 *    - dodaj redirect URI: http://localhost:8765/oauth2callback
 * 2. Uruchom:
 *    GOOGLE_OAUTH_CLIENT_ID=... GOOGLE_OAUTH_CLIENT_SECRET=... node scripts/setup-google-docs-oauth.mjs
 * 3. Zaloguj się jako hello@ecm-digital.com i zaakceptuj uprawnienia.
 * 4. Skopiuj refresh_token i ustaw sekrety:
 *    firebase functions:secrets:set GOOGLE_OAUTH_CLIENT_ID
 *    firebase functions:secrets:set GOOGLE_OAUTH_CLIENT_SECRET
 *    firebase functions:secrets:set GOOGLE_DOCS_REFRESH_TOKEN
 * 5. Deploy:
 *    firebase deploy --only functions:processGoogleDocAgreementJob,firestore:rules,hosting
 */

import http from 'node:http';
import { URL } from 'node:url';

const CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID || '';
const CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET || '';
const REDIRECT_URI = 'http://localhost:8765/oauth2callback';
const SCOPES = [
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/drive.file',
].join(' ');

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Ustaw GOOGLE_OAUTH_CLIENT_ID i GOOGLE_OAUTH_CLIENT_SECRET w env.');
  process.exit(1);
}

const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
authUrl.searchParams.set('client_id', CLIENT_ID);
authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
authUrl.searchParams.set('response_type', 'code');
authUrl.searchParams.set('scope', SCOPES);
authUrl.searchParams.set('access_type', 'offline');
authUrl.searchParams.set('prompt', 'consent');
authUrl.searchParams.set('login_hint', 'hello@ecm-digital.com');

const server = http.createServer(async (req, res) => {
  try {
    const reqUrl = new URL(req.url || '/', 'http://localhost:8765');
    if (reqUrl.pathname !== '/oauth2callback') {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    const code = reqUrl.searchParams.get('code');
    const error = reqUrl.searchParams.get('error');
    if (error || !code) {
      res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(`Błąd OAuth: ${error || 'brak code'}`);
      server.close();
      process.exit(1);
    }

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }).toString(),
    });
    const payload = await tokenResponse.json();
    if (!tokenResponse.ok || !payload.refresh_token) {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(payload, null, 2));
      console.error('Token exchange failed:', payload);
      server.close();
      process.exit(1);
    }

    console.log('\n=== SUKCES ===');
    console.log('refresh_token=', payload.refresh_token);
    console.log('\nUstaw sekrety Firebase i zdeployuj processGoogleDocAgreementJob.\n');

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<h1>OK</h1><p>Refresh token wypisany w terminalu. Możesz zamknąć tę kartę.</p>');
    server.close();
    process.exit(0);
  } catch (error) {
    console.error(error);
    res.writeHead(500);
    res.end('Internal error');
    server.close();
    process.exit(1);
  }
});

server.listen(8765, () => {
  console.log('Otwórz w przeglądarce (konto hello@ecm-digital.com):');
  console.log(authUrl.toString());
});
