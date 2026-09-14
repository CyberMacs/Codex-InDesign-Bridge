# Installation

## Requirements

- Adobe InDesign 2023 version 18.5 or later
- Adobe UXP Developer Tool
- Node.js 18 or later

## Load the plug-in

1. Start Adobe InDesign.
2. Open Adobe UXP Developer Tool.
3. Choose Load and select the CodexInDesignBridge folder from the downloaded package.
4. Open Codex InDesign Bridge from the InDesign Plugins panel.
5. Select a private, empty local folder for the Bridge session.
6. Click Start connection.

If manifest.json changes, use Unload followed by Load. For HTML, CSS, or JavaScript-only changes, use Reload.

## First safe check

Run the local client against the selected Bridge folder:

    node bridge-client.cjs "<bridge-folder>" ping
    node bridge-client.cjs "<bridge-folder>" list

Do not edit an existing document before confirming its current document ID and exact name.
