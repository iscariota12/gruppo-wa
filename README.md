# Report Gruppo Caco

Report statistico delle andate in bagno registrate nel gruppo WhatsApp con l'emoji 💩.

**Sito online:** https://iscariota12.github.io/gruppo-wa/ (dopo il deploy)

## Pubblicare su GitHub Pages

1. Su GitHub: repo **gruppo-wa** → **Settings** → **Pages** → Source: **GitHub Actions**
2. Dal terminale, nella cartella del progetto:

```powershell
cd c:\Users\david\Desktop\project\caco
git init
git remote add origin https://github.com/iscariota12/gruppo-wa.git
git add .
git commit -m "Report gruppo Caco con deploy GitHub Pages"
git branch -M main
git pull origin main --rebase
git push -u origin main
```

Se il repo remoto ha già un README, il `pull --rebase` allinea la storia prima del push.

Ad ogni push su `main`, il sito si aggiorna automaticamente.


- Python 3.10+
- Node.js 18+

## Utilizzo

### 1. Genera i dati dalla chat

```bash
python scripts/parse_chat.py
```

Legge [`Chat WhatsApp con 💩 gruppo.txt`](Chat WhatsApp con 💩 gruppo.txt) e produce `report/public/data/report.json`.

### 2. Avvia il report in locale

```bash
cd report
npm install
npm run dev
```

Apri l'URL indicato nel terminale (di solito `http://localhost:5173`).

### 3. Esporta HTML statico

```bash
cd report
npm run build
```

Il report compilato si trova in `report/dist/`. Apri `dist/index.html` nel browser o caricalo su un hosting statico.

## Contenuto del report

- Podio con grafico a barre (top 3) e classifica completa
- Grafico a torta con percentuali
- Serie storica cumulativa per partecipante
- Record speciali: giorno record, streak attiva/secca, miglior recupero
- Statistiche extra: giorno più intenso, fasce orarie, weekend warrior, primo del giorno, notturno, confronto metà/finale mese

## Aggiornare il report

Esporta di nuovo la chat da WhatsApp, sostituisci il file `.txt` nella root del progetto ed esegui:

```bash
python scripts/parse_chat.py
cd report && npm run build
```

## Struttura

```
caco/
├── Chat WhatsApp con 💩 gruppo.txt
├── scripts/
│   ├── parse_chat.py
│   ├── stats.py
│   └── config.json
└── report/
    ├── public/data/report.json
    └── src/components/
```
