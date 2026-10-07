# Codex InDesign Bridge v0.3.1 — preview

This is the maintained source checkout. Edit CodexInDesignBridge and bridge-client.cjs here, not in generated distribution copies. Read INSTALL.md, USAGE.md and docs/EXPERIMENTAL.md before host work.

- Use Node 18+; npm test installs no dependencies. Run python Tools/package.py to rebuild curated user and source ZIPs; no InDesign session files belong in an archive.
- Keep manifest.json, protocol VERSION, panel heading, package.json and client comment aligned. The book template has its own independent version 1.0.0.
- v0.3.1 is a preview. The restorationBook module was not verified through a live panel. Final templates from the earlier book project required native repairs; do not claim that this builder reproduces them.
- Requests must use validated JSON, not arbitrary code. Preserve session/expiry checks, durable claims, document-ID/name attachment and backup-before-edit protections.
- Ping/list before host writes. Use exact current IDs. Never blindly repeat a modifying timeout or partial batch. Inspect response and claim records first.
- The experimental build/save operations require experimental: true. Save refuses an existing output set. Test these guards before releases.
- Use a disposable document/session for Adobe tests. Report mock/protocol tests separately from actual host and visual checks. Do not kill InDesign or close user documents.
- Keep runtime data, private audits, local paths and credentials out of Git and ZIPs. Preserve MIT. Public docs link to the Releases overview.
