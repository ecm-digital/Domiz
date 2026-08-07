# Domiz Homes

Strona biura nieruchomości Domiz Homes (React + TypeScript + Vite, Firebase Hosting + Firestore).

## Uruchomienie lokalne

```bash
npm install
npm run dev
```

## Wdrożenie na produkcję

Produkcja to Firebase Hosting, projekt `domiz-a6a6c` (konfiguracja w `firebase.json` i `.firebaserc`).

**Automatycznie:** push do `main` uruchamia workflow `.github/workflows/deploy.yml`, który buduje projekt
i publikuje **kanał podglądowy** `main-preview` (tymczasowy URL, produkcja nietknięta). Publikacja na
produkcję jest świadomą decyzją: Actions → *Deploy to Firebase Hosting* → Run workflow → `target: live`.

Workflow wymaga sekretu z kluczem konta serwisowego (rola *Firebase Hosting Admin*) w Settings → Secrets
and variables → Actions. Akceptuje obie nazwy: `FIREBASE_SERVICE_ACCOUNT_DOMIZ_A6A6C` (tworzy ją
`firebase init hosting:github`) lub `FIREBASE_SERVICE_ACCOUNT` (założoną ręcznie).

**Ręcznie z lokalnej maszyny:**

```bash
npm ci
npx firebase-tools login    # jednorazowo
npm run deploy:preview      # build + publikacja na tymczasowy URL podglądowy (7 dni)
npm run deploy              # build + publikacja na produkcję (kanał live)
```

Najprościej skonfigurować wdrożenia jedną komendą: `npx firebase-tools init hosting:github` zakłada konto
serwisowe i sam zapisuje sekret w repozytorium na GitHubie.

`npm run deploy` uwierzytelnia się pierwszym dostępnym sposobem: zmienną `FIREBASE_SERVICE_ACCOUNT`
(zawartość JSON konta serwisowego), zmienną `FIREBASE_TOKEN` (`firebase login:ci`) albo zalogowanym
kontem CLI. Dzięki temu tej samej komendy używa się lokalnie i w środowiskach bez przeglądarki.

Reguły Firestore i Storage wdraża się osobno: `npx firebase-tools deploy --only firestore,storage`.

---

## React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
