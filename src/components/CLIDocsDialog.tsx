import { useState } from "react";
import { Book, Terminal, Globe, GitBranch, Copy, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface CLIDocsDialogProps {
  trigger: React.ReactNode;
}

const CLIDocsDialog = ({ trigger }: CLIDocsDialogProps) => {
  const [copiedInstall, setCopiedInstall] = useState(false);
  const [copiedScan, setCopiedScan] = useState(false);

  const handleCopy = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Book className="w-6 h-6 text-primary" />
            FixEnv Documentation
          </DialogTitle>
          <DialogDescription>
            FixEnv works locally, in CI, and via web UI — one tool, three ways to use it.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Three Ways Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center">
              <Terminal className="w-8 h-8 text-primary mx-auto mb-2" />
              <h3 className="font-semibold text-foreground">Local CLI</h3>
              <p className="text-xs text-muted-foreground mt-1">Scan from your terminal</p>
            </div>
            <div className="bg-accent/5 border border-accent/20 rounded-lg p-4 text-center">
              <GitBranch className="w-8 h-8 text-accent mx-auto mb-2" />
              <h3 className="font-semibold text-foreground">CI/CD</h3>
              <p className="text-xs text-muted-foreground mt-1">GitHub Actions integration</p>
            </div>
            <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-4 text-center">
              <Globe className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <h3 className="font-semibold text-foreground">Web UI</h3>
              <p className="text-xs text-muted-foreground mt-1">Instant browser analysis</p>
            </div>
          </div>

          {/* CLI Installation */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Terminal className="w-4 h-4 text-primary" />
              Quick Start
            </h3>
            <div className="bg-codeBg border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">Install globally</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2"
                  onClick={() => handleCopy("npm install -g fixenv-cli", setCopiedInstall)}
                >
                  {copiedInstall ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                </Button>
              </div>
              <code className="text-sm text-primary font-mono">npm install -g fixenv-cli</code>
            </div>
            <div className="bg-codeBg border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">Scan a repository</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2"
                  onClick={() => handleCopy("npx fixenv-cli scan https://github.com/user/repo", setCopiedScan)}
                >
                  {copiedScan ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                </Button>
              </div>
              <code className="text-sm text-primary font-mono">npx fixenv-cli scan https://github.com/user/repo</code>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent" />
              What FixEnv Detects
            </h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              {[
                "Dependency conflicts",
                "Missing version pins",
                "Outdated packages",
                "Python version mismatches",
                "Security vulnerabilities (CVEs)",
                "Reproducibility issues",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-muted-foreground">
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* CLI Options */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">CLI Options</h3>
            <div className="bg-codeBg border border-border rounded-lg p-4 space-y-2 text-sm font-mono">
              <p><span className="text-primary">--json</span> <span className="text-muted-foreground">Output results as JSON</span></p>
              <p><span className="text-primary">--help</span> <span className="text-muted-foreground">Show help information</span></p>
            </div>
          </div>

          {/* Supported Formats */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">Supported Dependency Formats</h3>
            <div className="flex flex-wrap gap-2">
              {["requirements.txt", "pyproject.toml", "Pipfile", "Pipfile.lock", "poetry.lock", "setup.py"].map((fmt) => (
                <span key={fmt} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded font-mono">
                  {fmt}
                </span>
              ))}
            </div>
          </div>

          {/* Links */}
          <div className="flex gap-4 pt-4 border-t border-border">
            <a
              href="https://www.npmjs.com/package/fixenv-cli"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              View on npm →
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              GitHub Repository →
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CLIDocsDialog;
