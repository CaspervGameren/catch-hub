# GitHub Pages + Render Free

De frontend wordt vanuit `deployment` gepubliceerd naar https://caspervgameren.github.io/catch-hub/ via GitHub Actions. Settings → Pages → Source moet GitHub Actions zijn. De workflow bouwt uitsluitend frontend/dist, met VITE_BASE_PATH=/catch-hub/ en VITE_SOCKET_URL=https://catch-hub-sockets.onrender.com. PHP, CSV en databasebestanden worden niet gepubliceerd. Login is binnenkort beschikbaar; spelen gebruikt een naam en sessiecode.

Render draait één Node Web Service op Free, vanuit dezelfde deploymentbranch. Root Directory blijft leeg omdat shared en frontendtypes nodig zijn. Build: `npx --yes pnpm@12.5.1 --dir socket-server install --frozen-lockfile --prod=false && npx --yes pnpm@12.5.1 --dir socket-server check`. Start: `npx --yes pnpm@12.5.1 --dir socket-server start`. Health Check Path: `/health`.

Variabelen: NODE_VERSION=24, NODE_ENV=production, ALLOWED_ORIGINS=https://caspervgameren.github.io. Lokale testadressen kunnen met komma's toegevoegd worden. Geen pad of trailing slash bij origins. PORT komt van Render.

Gebruik Free en geen betaalmethode. Render Free kan slapen, herstarten of limieten bereiken. Sessies en GPS worden tijdelijk in servergeheugen verwerkt; er is geen gebruikersdatabase. De browser bewaart naam, sessiecode en rol lokaal voor opnieuw verbinden. Hostingproviders kunnen technische logs bewaren. Dit betekent geen garantie van nul gegevensopslag bij derden.

De aangeleverde users.csv is niet gecommit. Registratie/login en blijvende opslag zijn nog niet geïmplementeerd.

Test online met twee aparte browsers: hunter maakt sessie, runner sluit aan, host tekent en bewaart zone en start. Controleer dezelfde spelers/zone op beide schermen, GPS-update, terugkeer binnen tien seconden en uitschakeling daarna. GPS en alarm op echte telefoons blijven een afzonderlijke test.

Bronnen: https://vite.dev/guide/static-deploy.html en https://render.com/docs/free
