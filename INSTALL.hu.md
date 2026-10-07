# Telepítés — InDesign–Codex Bridge v0.3.1 előzetes kiadás

Szükséges: InDesign, Adobe UXP Developer Tool és Node.js 18 vagy újabb. A normál bridge használatához nem kell API-kulcs vagy külön betűkészlet. Ez fejlesztői betöltésű UXP-csomag, nem aláírt CCX-telepítő.

1. Csomagold ki a barátoknak szánt ZIP-et egy írható helyi mappába. A bridge-client.cjs maradjon a CodexInDesignBridge mappa mellett.
2. Indítsd el az InDesignt és az Adobe UXP Developer Toolt.
3. Ha a régi bridge fut, állítsd le a kapcsolatot, majd az UXP Developer Toolban válaszd az Unload műveletet. Az új példány azonos plug-in azonosítót használ.
4. Add hozzá/válaszd ki az új CodexInDesignBridge/manifest.json fájlt, majd Load. A betöltő feliratai verziónként eltérhetnek.
5. Nyisd meg a panelt InDesignban. A fejlécben v0.3.1 / előzetes kiadás szerepeljen.
6. A panelen válassz egy külön, üres, privát helyi mappát a kapcsolathoz. A forrásmappát és megosztott/szinkronizált mappát ne használd erre.
7. Kattints a kapcsolat indítására. Codexszel futtasd a csomagban lévő kliens ping és list parancsát.

```text
node bridge-client.cjs "<kapcsolati-mappa>" ping
node bridge-client.cjs "<kapcsolati-mappa>" list
```

A ping válaszában 0.3.1 szerepeljen. A régi status.json önmagában nem igazol élő kapcsolatot. Verzióeltérésnél a panelt és a klienst együtt cseréld. Manifestváltozás után Unload → Load szükséges. Visszaállításhoz a kapcsolat leállítása és az új panel Unload után töltsd be a megőrzött régi példányt a hozzá tartozó klienssel.
