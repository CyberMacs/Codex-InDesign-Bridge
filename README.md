# Codex InDesign Bridge

Codex InDesign Bridge is a local Adobe InDesign UXP panel for a trusted local Codex workflow. It exchanges validated JSON commands through a folder chosen by the user. It has no network server and needs no API key. This is an independent community project, not an Adobe or OpenAI product.

## Version 0.3.1 — preview

The existing inspection, attachment/backup, document editing, image placement and export operations are retained. This preview adds the experimental `restorationBook` operation from the restoration-book project. Its build/save actions require explicit opt-in. The experimental export refuses existing output files.

The panel manifest accepts InDesign 18.5+, but the book builder targets the APIs used during an InDesign 21.3 project and has not been verified through a live panel. Earlier completed book templates required additional native repairs. This module is not a verified one-click reproduction of those templates. Use disposable documents for host testing.

## Packages and installation

See the [versioned package directory](https://github.com/CyberMacs/Codex-InDesign-Bridge/tree/main/Downloads). Choose the v0.3.1 preview ZIP appropriate to your task. This repository currently distributes these small source-based packages in Downloads; no GitHub Release entry has been created for this preview:

- `Codex-InDesign-Bridge-v0.3.1-preview.zip`: plug-in, client, English and Hungarian instructions, license and experimental-function notes.
- `Codex-InDesign-Bridge-v0.3.1-source.zip`: maintainable source, tests, package script and Codex development instructions.

Extract the user ZIP to a writable local folder. Load its `CodexInDesignBridge/manifest.json` using Adobe UXP Developer Tool, then choose a separate private session folder in the InDesign panel. This is a UXP development-load package, not a signed CCX installer.

- [Install](INSTALL.md) / [Telepítés magyarul](INSTALL.hu.md)
- [Usage](USAGE.md) / [Használat magyarul](USAGE.hu.md)
- [Experimental operation and limitations](docs/EXPERIMENTAL.md)
- [Development](docs/DEVELOPMENT.md)

## Trust and recovery

Any local process with write access to the selected session folder can submit commands. Use a private local folder, inspect before editing, attach an existing document by its exact ID and name with an INDD backup, and stop the connection when finished. A timeout may still leave a completed or partially changed document: inspect the matching response and claim instead of resending the operation.

## Validation

Protocol/client round trips, queue replay prevention, attachment guards and experimental-operation guards are tested with Node mocks. They do not prove Adobe DOM compatibility. Live loading/execution of this v0.3.1 panel and another-machine installation remain unverified. Historical v0.2 screenshots in docs/images are not v0.3.1 test evidence.

## License

The existing [MIT License](LICENSE) is preserved. No InDesign documents, fonts, user images, API keys or private session data are included in the new packages.
