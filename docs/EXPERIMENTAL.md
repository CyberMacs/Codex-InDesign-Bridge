# restorationBook — experimental operation in v0.3.1

This bounded, built-in UXP module was created during a restoration-book template project. It does not evaluate arbitrary scripts. It adds font inspection, draft construction, QA and export for its own newly created, labelled documents. It does not edit arbitrary existing documents through this route.

Actions:
- `fonts`: inspect Source Sans 3 Regular/Semibold/Bold/Medium/Italic, Source Serif Pro (or Source Serif) Regular/Semibold/Italic, and the Turkish dictionary.
- `build`: create a draft, requiring `experimental: true`; refuse an already open labelled template or existing main INDD output.
- `qa`: inspect a labelled document by an explicit documentId belonging to the current session folder.
- `save`: require `experimental: true`, ownership, no overset/missing fonts, and an unused complete output set before saving INDD/INDT/IDML/PDF/QA.

Read-only example:

```json
[{"op":"restorationBook","action":"fonts"}]
```

Explicit disposable draft example:

```json
[{"op":"restorationBook","action":"build","experimental":true}]
```

The book template's internal version is 1.0.0; the bridge version is 0.3.1. These are separate products. This module's live panel execution is unverified. The earlier final book files were completed through native UXP/COM work with additional repairs to backgrounds, image grouping, tables and map details. Do not claim that this module reproduces those final files. InDesign 18.5 is the base panel's manifest minimum, not a verified builder compatibility promise. Check actual layout and exports in a disposable InDesign 21.3+ session before relying on the builder. Generated drafts may require manual repair.

Partial failure can leave a labelled, open draft. Inspect it using the returned ID; do not rerun build blindly. Fonts, historical facts, real maps, images and complete publication content are not supplied in these packages.
