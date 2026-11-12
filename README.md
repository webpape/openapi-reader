# eZmax API Reference

Lecteur OpenAPI en Vue 3, Vite et PrimeVue.

## Démarrage

```bash
yarn
yarn dev
```

`yarn import` copie `internal.json` depuis le dépôt API local quand il est disponible. Sinon, le fichier déjà présent dans `specs/` est conservé.

## Build

```bash
yarn build
yarn preview
```

La sortie est le dossier `dist`. La spec interne est servie depuis `/specs/internal.json`.

## Specs

L'en-tête charge `internal.json` localement, ou une spec OpenAPI publiée dans [eZmax-API/specs](https://github.com/eZmaxinc/eZmax-API/tree/master/specs). Les collections Postman et les fichiers de plus de 8 Mo ne sont pas rendus.

## UI Language Rule
The application must be exclusively in English across all user-facing components, notifications, modals, placeholders, and tooltips. Do not introduce French or other languages in the UI.
