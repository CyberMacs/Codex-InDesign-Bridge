# Development — v0.3.1 preview

The source checkout is self-contained: plug-in, Node client, tests, package script, MIT license and AGENTS.md. No user session or book document is needed.

```text
npm test
python Tools/package.py
```

Tests use Node's standard library. Packaging uses Python's standard library. No dependency installation is required. Default ZIP output is dist/; use `python Tools/package.py --output <folder>` for another destination. Packages are generated from explicit allowlists, never a recursive copy of private runtime data.

Edit the maintained source here, align version fields, run the tests and inspect generated ZIPs. Actual Adobe loading, live ping, draft construction, exported layout/font checks and another-machine installation are separate checks; passing mocks does not establish those outcomes. v0.3.1 is a preview until the recorded host limits are resolved.
