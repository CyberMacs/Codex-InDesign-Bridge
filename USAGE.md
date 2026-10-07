# Usage — v0.3.1 preview

1. Start the panel in a private local session folder.
2. Run ping and list, then inspect the exact document/page before editing.
3. For existing documents send `attachDocument` with the current document ID, exact name and a new INDD backup filename. Proceed only after its backup succeeds.
4. Send a JSON array of supported operations using `node bridge-client.cjs "<session-folder>" send "<operations.json>"`. Use the current IDs returned by the panel.
5. Save/export under unused filenames, inspect the result and stop the panel connection when finished.

The client reports the correlated response path if a request times out. Check that response and the Claims record. Never blindly repeat a modifying request. A failed batch can leave partial changes. The Stop button prevents subsequent operations; it does not cancel the current native operation.

The optional `restorationBook` operation is described in docs/EXPERIMENTAL.md. Its build/save actions require `experimental: true` and must use disposable documents. Core bridge use does not require Source fonts.
