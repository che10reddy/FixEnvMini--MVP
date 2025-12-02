# FixEnv CLI

Command-line tool for scanning Python repositories for:

	•	Dependency conflicts
	•	Missing version pins
	•	Outdated packages
	•	Python version mismatches
	•	Security vulnerabilities (OSV.dev)
	•	Reproducibility issues

Powered by FixEnv + Google Gemini 2.5 Flash.

## Installation

```bash
npm install -g fixenv-cli
```

Or use directly with npx:

```bash
npx fixenv-cli scan https://github.com/pallets/flask
```

## Usage

### Scan a repository

```bash
fixenv scan https://github.com/pallets/flask
```

### Get JSON output (for CI/CD integration)

```bash
fixenv scan https://github.com/pallets/flask --json
```

### Help

```bash
fixenv --help
```

## Features

- **Dependency Analysis**: Detect missing version pins, conflicts, and outdated packages
- **Security Scanning**: Identify known CVEs using Google's OSV database (no API key required)
- **Python Version Compatibility**: Check package compatibility with detected Python version
- **Reproducibility Scoring**: Get a 0-100 score indicating environment stability
- **Multi-format Support**: Works with requirements.txt, pyproject.toml, Pipfile, and setup.py

## Example Output

```
🔧 FixEnv - Python Environment Analysis
──────────────────────────────────────────────────
Repository: pallets/flask
Python: ^3.8
Formats: Requirements.txt, Setup.py

📊 Reproducibility Score: 87%
⚠️  Issues Found: 3
🔒 Vulnerabilities: 1 (High)

Issues:
  ● Missing version pin: werkzeug (high)
  ● Outdated package: jinja2 (medium)
  ● Missing version pin: click (medium)

Security Vulnerabilities:
  🔴 GHSA-xxxx-xxxx-xxxx: requests@2.28.0 (HIGH)
     Fix: upgrade to 2.31.0

──────────────────────────────────────────────────
💡 Run with --json for full output
🌐 View detailed results: https://fixenv.lovable.app
```

## CI/CD Integration

### GitHub Actions

```yaml
name: FixEnv Check

on: [push, pull_request]

jobs:
  fixenv-check:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install FixEnv CLI
        run: npm install -g fixenv-cli

      - name: Run FixEnv Analysis
        run: |
          fixenv-cli scan https://github.com/${{ github.repository }} --json > fixenv-results.json

      - name: Fail on High Severity Vulnerabilities
        run: |
          if jq -e '.data.vulnerabilities | map(select(.severity == "HIGH" or .severity == "CRITICAL")) | length > 0' fixenv-results.json > /dev/null; then
            echo "❌ High severity vulnerabilities detected!"
            jq '.data.vulnerabilities' fixenv-results.json
            exit 1
          fi

      - name: Upload FixEnv Results
        uses: actions/upload-artifact@v3
        with:
          name: fixenv-results
          path: fixenv-results.json
```

## License

MIT
