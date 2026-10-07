# Installation — v0.3.1 preview

Requirements: licensed Adobe InDesign 18.5+ for the base panel, Adobe UXP Developer Tool, and Node.js 18+ for the local client. Book building is experimental and requires additional fonts; see docs/EXPERIMENTAL.md. This release has no third-party Node dependencies.

1. Open the project's versioned Downloads directory, choose the preview user ZIP, and extract it to a writable local folder. Keep the client next to the plug-in folder.
2. Start InDesign and Adobe UXP Developer Tool.
3. If the previous bridge is loaded, stop its connection and Unload it. This version uses the same plug-in ID.
4. Add/select `CodexInDesignBridge/manifest.json` in UXP Developer Tool, then Load. Loader labels may differ between versions.
5. Open the Codex InDesign Bridge panel in InDesign. Confirm the visible v0.3.1 preview heading.
6. Choose a separate, private, empty local folder for session data. Do not select a shared folder or the source checkout.
7. Click the connection-start button. From the extracted package folder run:

```text
node bridge-client.cjs "<session-folder>" ping
node bridge-client.cjs "<session-folder>" list
```

Confirm that ping reports version 0.3.1. A stale status.json is not proof of a live connection. Client and panel must have matching versions.

For a manifest/version change use Unload → Load. For code-only development changes Reload can be used. A dependency-free ZIP loaded with UXP Developer Tool is not a signed CCX installer. To roll back, stop/unload v0.3.1 and load your preserved previous package with its matching client.
