# Használat — v0.3.1 előzetes kiadás

1. Indítsd a kapcsolatot, majd kérj ping és dokumentumlistát.
2. Mondd meg Codexnek a kívánt dokumentumot és feladatot. A pontos, friss dokumentumazonosítóval és névvel dolgozzon.
3. Meglévő dokumentum módosítása előtt az attachDocument készítsen új INDD biztonsági másolatot. Sikertelen mentés után nem indulhat szerkesztés.
4. Először kis, ellenőrizhető változtatásokat kérj; utána nézd meg az eredményt az InDesignban.
5. Új néven ments/exportálj, ellenőrizd a szövegtúlcsordulást, betűket és képlinkeket.
6. A munka végén állítsd le a kapcsolatot.

Várakozó vagy időtúllépő kérésnél Codex ellenőrizze a kapott válaszfájl és Claims rekord állapotát. A módosító kérés vak ismétlése duplikálhatja a változtatást. A Leállítás nem szakítja meg az éppen futó natív műveletet.

Az új restorationBook könyvépítő kísérleti funkció. A korábbi kész könyvsablonokhoz kézi/natív javítások is kellettek; az új panel automatikus építése nem ellenőrzött reprodukció. Build és save csak explicit experimental: true értékkel, külön tesztdokumentumon használható. A normál bridge működéséhez ez nem szükséges.

Fejlesztéshez a külön Source ZIP-et vagy a Development mappát add Codexnek. A kiadási másolat helyett a forrást módosítsa, futtassa a teszteket, majd építse újra a csomagot. Az élő InDesign-tesztek állapotát külön dokumentálja.
