# FixEnv CLI

Command-line tool for analyzing Python project dependencies for reproducibility issues and security vulnerabilities.

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
      
      - name: Run FixEnv Analysis
        run: npx fixenv-cli scan ${{ github.server_url }}/${{ github.repository }} --json > fixenv-results.json
      
      - name: Check for critical issues
        run: |
          if jq -e '.data.vulnerabilities | length > 0' fixenv-results.json > /dev/null; then
            echo "⚠️ Security vulnerabilities detected!"
            jq '.data.vulnerabilities' fixenv-results.json
            exit 1
          fi
```

## License

MIT
