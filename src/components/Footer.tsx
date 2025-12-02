import { useState } from "react";
import { Github, GitBranch, Mail, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const ciYamlCode = `name: FixEnv Security Check
on: [push, pull_request]

jobs:
  fixenv-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Run FixEnv Analysis
        run: |
          REPO_URL="https://github.com/\${{ github.repository }}"
          npx fixenv-cli scan $REPO_URL --json > fixenv-report.json
          
      - name: Check for Critical Vulnerabilities
        run: |
          CRITICAL=$(cat fixenv-report.json | jq '.vulnerabilities | map(select(.severity == "CRITICAL" or .severity == "HIGH")) | length')
          if [ "$CRITICAL" -gt 0 ]; then
            echo "❌ Found $CRITICAL critical/high severity vulnerabilities"
            exit 1
          fi
          echo "✅ No critical vulnerabilities found"
          
      - name: Upload Report
        uses: actions/upload-artifact@v4
        with:
          name: fixenv-report
          path: fixenv-report.json`;

const Footer = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(ciYamlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <footer className="border-t border-border/50 bg-background/80 backdrop-blur-sm mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Branding */}
          <div className="text-center md:text-left">
            <h3 className="font-display text-xl font-bold text-foreground mb-1">
              FixEnv Mini
            </h3>
            <p className="text-sm text-muted-foreground">
              Analyze and fix Python dependency issues
            </p>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group"
            >
              <Github className="w-5 h-5" />
              <span className="text-sm font-medium">GitHub</span>
            </a>
            
            <Dialog>
              <DialogTrigger asChild>
                <button className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group">
                  <GitBranch className="w-5 h-5" />
                  <span className="text-sm font-medium">CI/CD Integration</span>
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 font-display text-xl">
                    <GitBranch className="w-5 h-5 text-primary" />
                    GitHub Actions Integration
                  </DialogTitle>
                  <DialogDescription>
                    Add FixEnv to your CI pipeline in less than 30 seconds
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 mt-4">
                  <div className="relative">
                    <div className="bg-codeBg border border-border rounded-lg p-4 overflow-x-auto">
                      <pre className="text-xs code-font text-foreground/90 whitespace-pre-wrap">
                        {ciYamlCode}
                      </pre>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute top-2 right-2"
                      onClick={handleCopy}
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 mr-1" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-1" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                  
                  <div className="bg-card/50 border border-border rounded-lg p-4">
                    <h4 className="font-semibold text-sm mb-2">Best Practices</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Run on every PR to catch issues early</li>
                      <li>• Block merges on CRITICAL/HIGH CVEs</li>
                      <li>• Export JSON for detailed reporting</li>
                      <li>• Use with .zfix snapshots for reproducibility</li>
                    </ul>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            <a
              href="mailto:che10guduru@gmail.com"
              className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group"
            >
              <Mail className="w-5 h-5" />
              <span className="text-sm font-medium">Contact</span>
            </a>
          </div>

          {/* Copyright */}
          <div className="text-sm text-muted-foreground text-center md:text-right">
            © 2025 FixEnv Mini
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
