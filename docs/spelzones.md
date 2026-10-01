# Spelzones, runneralarm en vaste videokaart

## Gebruiken

1. Start de socket-server vanuit `socket-server` met `pnpm dev`.
2. Start de frontend vanuit `frontend` met `pnpm dev` (in deze preview poort 5174).
3. Vul een naam en sessiecode in en kies **Join as hunter**. Bij een nieuwe code wordt een sessie gemaakt; de eerste speler is host. `CATCH123` blijft beschikbaar voor de bestaande demo.
4. De host klikt op twee tegenoverliggende hoeken in **Kies de spelzone**. De turquoise rechthoek is de gekozen zone. Kies opnieuw twee punten om de selectie te vervangen.
5. Klik **Zone opslaan**. Alle deelnemers ontvangen dezelfde zone en zien die op hun spelkaart.
6. Runners nemen met dezelfde sessiecode deel. Klik op **Alarmgeluid inschakelen** als het geluid nog niet geactiveerd is, en geef locatie toestemming wanneer de browser daarom vraagt.
7. De host klikt **Spel starten**. Daarna kan niemand de zone wijzigen, ook de host niet.
8. Een runner buiten de zone krijgt een zichtbaar aftelscherm en ongeveer één piep per seconde. Binnen tien seconden terug: de waarschuwing stopt. Nog buiten op de deadline: de server schakelt de runner uit en toont dat in de spelerslijst. GPS-tracking voor die runner stopt. Uitgeschakelde runners leveren geen nieuwe radarupdates meer.

De geluidstoestemming wordt alvast geactiveerd bij het klikken op de join-knop. De extra knop maakt opnieuw activeren mogelijk als een browser het geluid blokkeert. Een telefoon op stil of een achtergrondtab kan audio/GPS beperken; houd het spel zichtbaar en test het alarm op de gebruikte telefoon.

## Hoe het gemaakt is

### Headerkaart

`frontend/src/chaseVideos.ts` bouwt de aparte kaart met videomarkers. Slepen, touchzoom, dubbelklikzoom, scrollzoom, boxzoom en toetsenbordnavigatie zijn uitgeschakeld; er zijn geen zoomknoppen. De kaart kiest zijn beginbeeld aan de hand van de videopunten en past dit alleen bij een nieuwe schermgrootte aan. Een popup verschuift de kaart niet (`autoPan: false`). `maxBounds` en een berekende minimumzoom begrenzen het beeld rond Rotterdam. De kaart is onafhankelijk van de spelkaart en de hostkiezer: die blijven interactief.

Video's komen in `frontend/public/videos`; zet de `src` van ieder punt in `chaseVideos.ts`, bijvoorbeeld `/videos/beurs.mp4`.

### Gedeelde zonelogica

`shared/gameZone.ts` definieert de rechthoek als `south`, `west`, `north`, `east`. Coördinaten en grenzen moeten eindige getallen zijn. Grenzen mogen niet omgekeerd of gelijk zijn; zones zijn maximaal 0,2 graden breed en hoog en blijven binnen geldige kaartcoördinaten. Dit is een ontwikkelgrens, geen nauwkeurige limiet in kilometers.

`insideZone` telt de grens zelf als binnen. `nextZoneStatus` kent bij het eerste buitenbericht een deadline toe: servertijd + 10.000 ms. Buitenupdates veranderen de deadline niet. Terugkeren vóór de deadline wist hem. Een terugkeerbericht op of na de deadline kan uitschakeling niet ongedaan maken.

### Sessies en server

`socket-server/src/sessionStore.ts` bewaart afzonderlijke sessies in geheugen. De server zoekt de sessie op via de socket van de speler; locatie-updates gaan niet meer altijd naar `CATCH123`.

De frontend en server gebruiken dezelfde eventtypes uit `frontend/src/types.ts`:

| Event | Richting | Gedrag |
| --- | --- | --- |
| `setGameZone` | client → server | Alleen de host van de eigen sessie, vóór de start; valideert en bewaart de zone |
| `startGame` | client → server | Alleen de host, met opgeslagen zone; vergrendelt de zone |
| `updateLocation` | client → server | Valideert GPS; controleert actieve runners tegen hun sessiezone |
| `zoneStatus` | server → runner | Buitenstatus, deadline, servertijd en uitschakelstatus |
| `sessionUpdate` | server → sessie | De zone, startstatus, spelers en uitschakeling worden gedeeld |

Een serverinterval controleert elke 200 ms verlopen deadlines. Uitschakeling hangt daardoor niet af van nieuwe GPS-berichten of een clienttimer. Een buitenwaarschuwing wordt per spelersnaam in de sessie bewaard, zodat disconnect/reconnect de deadline niet reset. Ook offline runners worden na hun deadline geblokkeerd. De sessie onthoudt uitgeschakelde namen: dezelfde naam kan niet opnieuw deelnemen. De hostrol gaat bij vertrek naar de eerstvolgende speler, zoals in de bestaande implementatie.

### Frontend en alarm

`frontend/src/gameZone.ts` beheert de hostkiezer, zoneknoppen, waarschuwing en Web Audio-piep. Twee Leaflet-klikken leveren een rechthoek op. Opslaan en starten gebruiken servercallbacks; lokaal een knop tonen geeft geen toestemming op de server.

De aftelling gebruikt de serverdeadline en het verschil sinds ontvangst via `performance.now()`, zodat een verkeerd ingestelde telefoonklok geen extra terugkeertijd geeft. Herhaalde sessieberichten met dezelfde servertijd resetten die lokale klok niet. Binnen de zone stoppen piepen en aftellen. Na uitschakeling stopt het geluid en blijft de melding zichtbaar.

`frontend/src/map.ts` tekent de zone op de echte spelkaart. Die kaart blijft bestuurbaar, zodat spelers hun eigen locatie ook buiten de zone kunnen zien. Een vaste kaartweergave is dus geen vervanging voor de servercontrole.

`frontend/src/ui.ts` ontsnapt spelersnamen voordat ze in HTML verschijnen en toont **Buiten zone** of **Uitgeschakeld**. Dit voorkomt dat een naam HTML/scripts in de spelerslijst kan invoegen.

## Controle en testen

- Frontend: `cd frontend && pnpm build`.
- Servertypes: `cd socket-server && pnpm check`.
- Zonelogica: `cd socket-server && pnpm test`.
- Volledige socketflow: `cd socket-server && pnpm test:integration` (vereist ook de frontenddependencies). De test start een afzonderlijke server op poort 3012 en ruimt die op.

De logische tests dekken ongeldige zones, de inclusieve grens, een niet-resetbare deadline, tijdig terugkeren en te laat terugkeren. De sockettest dekt hostrechten, sessiescheiding, zonevergrendeling na start, terugkeer, uitschakeling zonder nieuwe GPS-updates en geweigerde herdeelname. De browsercontrole bevestigt dat de host kan tekenen, opslaan en starten en dat de spelkaart de zone ontvangt.

## Huidige grenzen

- Sessies, zones en uitschakelingen verdwijnen bij herstart van de server; er is nog geen databaseopslag of sessiebeëindigingsknop.
- Identiteit is nog een spelersnaam, geen geauthenticeerd account. Een andere naam of vervalste GPS kan de spelregels omzeilen. Dit is geen anti-cheatsysteem.
- Een runner zonder eerste GPS-fix krijgt geen zonebeoordeling. Tijdens een bestaande buitenwaarschuwing blijft de deadline lopen, ook als GPS of de verbinding uitvalt. Bij verbindingsverlies stopt het lokale geluid en toont de pagina dat controle tijdelijk niet beschikbaar is; de serverdeadline blijft geldig.
- Elke zone is nu rechthoekig. Polygonen kunnen later op dezelfde sessiestructuur worden aangesloten met een point-in-polygon-controle.
- GPS-onnauwkeurigheid krijgt nog geen tolerantiebuffer. Kies een ruime, praktisch herkenbare grens; echte buitenmetingen en hoorbaar geluid moeten nog op teamtelefoons worden getest.
- Bestaande CSS-waarschuwingen over fontimports zijn niet onderdeel van deze wijziging.
