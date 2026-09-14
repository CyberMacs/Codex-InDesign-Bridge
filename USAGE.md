# Usage

1. In InDesign, open the Codex InDesign Bridge panel.
2. Select a private Bridge folder and start the connection.
3. Send ping and list first.
4. Use inspect before changing document content.
5. For an existing document, use attachDocument with the exact document ID, exact name, and a new INDD backup file name.
6. Make focused edits only after attachment succeeds.
7. Use saveCopy and exportPDF or exportIDML for handoff.
8. Inspect the saved result and stop the connection.

## Recovery rule

A client timeout does not prove that an operation failed. The request may be executing or may already have completed. Check the response file named by the client and never send the same modifying request again blindly.

## Safe handling

Do not select a shared, synchronised, or public Bridge folder. Do not leave the connection active when it is not needed. Treat write access to the selected folder as permission to issue InDesign commands.
