# Gratis deployment: InfinityFree + Render

## Kostenkeuze

Gebruik één Render Web Service op **Free**, geen betaalde database, geen extra previews en geen betaalmethode. Kies ook een gratis Render-workspace; controleer het totaal vóór aanmaken. Bij gratis limietoverschrijding zonder betaalmethode kan Render diensten/builds blokkeren. Gratis hosting garandeert geen aantal gelijktijdige spelers of beschikbaarheid. Render kan de server herstarten; onze in-memory sessies verdwijnen dan. Na 15 minuten zonder inkomend verkeer slaapt de dienst; wakker worden duurt ongeveer een minuut.

Officiële voorwaarden: https://render.com/docs/free

## Eerst zelf aanmaken

1. Maak een InfinityFree-account en hostingaccount aan. Noteer de HTTPS-website-URL, FTP-host/gebruikersnaam en het exacte `htdocs`-pad uit het paneel. Configureer SSL.
2. Maak een gratis Render-account aan. Koppel GitHub met toegang tot alleen deze repo.
3. Laat deze configuratie eerst naar `main` mergen. Werk daarna `deployment` bij vanuit die main. Beide hosts publiceren dezelfde branch.
4. Render: **New → Blueprint**, selecteer de repo en branch `deployment`; de `render.yaml` maakt één Free webservice. Vul `ALLOWED_ORIGINS` in als je exacte website-origin, bijvoorbeeld `https://catchhub.example`. Geen slash/pad erachter. Meerdere origins mogen met komma's worden gescheiden.
5. Controleer nadrukkelijk **Free** voordat je bevestigt. Maak geen Postgres/Redis-service aan. Het repo-hoofd is de buildroot: stel niet alleen `socket-server` als root in, want ook `shared` en de gedeelde types in `frontend` zijn nodig.
6. Kopieer het HTTPS-adres van de server, bijvoorbeeld `https://catch-hub-sockets.onrender.com`. Open `/health`: verwacht `{"status":"ok"}`. Render verzorgt TLS op zijn eigen domein; een eigen socketdomein is niet nodig.

## GitHub-configuratie

Maak onder Settings → Environments de omgeving `production`, eventueel met goedkeuring vóór publiceren. Vul secrets en variables daar in, of gebruik repository secrets/variables.

Secrets:
- `FTP_SERVER`
- `FTP_USERNAME`
- `FTP_PASSWORD`

Variables:
- `VITE_SOCKET_URL`: echte HTTPS Render-URL, zonder `/socket.io` erachter.
- `FTP_SERVER_DIR`: exact FTP-pad naar het website-`htdocs`, eindigend op `/`; gebruik niet zomaar de FTP-root.

De workflow bouwt Vite bij een push naar `deployment` en uploadt uitsluitend `frontend/dist` via expliciete FTPS. TLS-certificaten worden gecontroleerd. Hij stopt bij ontbrekende configuratie. Bestaande PHP/databaseconfiguratie wordt niet uit de repo meegeupload. Controleer bij de eerste deployment de FTPS-ondersteuning en het certificaat van je FTP-host; schakel certificaatcontrole niet uit om een fout te omzeilen.

`VITE_SOCKET_URL` is openbare frontendconfiguratie, geen geheim. Na wijzigen moet je opnieuw bouwen/deployen. Laat hem leeg voor de lokale Vite-proxy.

## Server

`PORT` komt van Render; de server luistert op `0.0.0.0`. `ALLOWED_ORIGINS` bepaalt welke browserwebsite verbinding mag maken, zowel voor polling als voor de WebSocket-handshake. Productie start niet zonder die instelling. Dit vervangt geen accountauthenticatie: een kwaadwillende eigen client kan headers vervalsen.

`/health` bevat alleen een algemene status. `pnpm start` voert de TypeScript-server met tsx uit; de build installeert ook die runtime-tool. Geen lokale poort 3000 invullen in het publieke socket-adres.

## Gebruikersdatabase en aangeleverde CSV

De CSV is niet in de repo gekopieerd. De kolomnamen zijn:
`id`, `username`, `age_accepted`, `email`, `games_played`, `games_played_hunter`, `avg_game_time_as_winning_hunter`, `games_played_runner`, `avg_game_time_as_winning_runner`, `password_hash`.

Een CSV bevestigt geen SQL-types, indexes, defaults of foreign keys. Vraag ook een SQL-export **van alleen de structuur** aan je team. De huidige PHP-registratie schrijft nog `age` en `password`, die niet bij deze CSV aansluiten. Registratie/login en deze mapping moeten vóór accountgebruik worden afgewerkt. Upload de CSV nooit naar de openbare `htdocs` of naar GitHub.

PHP-accounts en InfinityFree MySQL blijven een afzonderlijke backend. De Node-host kan niet direct met InfinityFree MySQL verbinden. Deze deployment voegt geen accountauthenticatie, data-import of blijvende opslag van spelsessies toe.

## Controleren na publicatie

1. Website én socketadres gebruiken HTTPS; `/health` werkt.
2. Twee telefoons kunnen dezelfde sessiecode gebruiken en spelersupdates ontvangen.
3. Host tekent/slaat de zone op en start; runner ziet dezelfde zone.
4. Test terugkeer vóór tien seconden en uitschakeling daarna, geluid en GPS-toestemming op beide telefoons.
5. Controleer ook een andere sessiecode en opnieuw verbinden.
6. Open Render Usage/Billing: bevestig Free en geen betaalmethode. Schat capaciteit met een afgesproken aantal testspelers vóór een grotere speeldag.

Voor het afmaken zijn de echte website-URL, Render-URL, FTP-instellingen en SQL-structuur nog nodig.
