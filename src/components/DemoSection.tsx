import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, AlertTriangle, Sparkles, Shield, CheckCircle } from "lucide-react";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";

const sampleResults = {
  repoName: "flask-app-demo",
  reproducibilityScore: 72,
  securityScore: 85,
  issues: [
    { severity: "high", package: "flask", issue: "Missing version pin", suggestion: "flask==2.3.3" },
    { severity: "medium", package: "requests", issue: "Outdated version", suggestion: "requests>=2.31.0" },
    { severity: "low", package: "numpy", issue: "Wide version range", suggestion: "numpy>=1.24.0,<2.0.0" },
  ],
  vulnerabilities: [
    { severity: "MEDIUM", package: "werkzeug", version: "2.0.0", cve: "CVE-2023-25577" },
  ],
  suggestions: [
    "Pin all dependencies to exact versions for reproducibility",
    "Update werkzeug to >=2.3.6 to fix security vulnerability",
    "Add Python version constraint (requires-python = \">=3.9\")",
  ],
};

const DemoSection = () => {
  const { ref, isVisible } = useScrollAnimation();
  const [showResults, setShowResults] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const handleRunDemo = () => {
    setIsScanning(true);
    setShowResults(false);
    setTimeout(() => {
      setIsScanning(false);
      setShowResults(true);
    }, 1500);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "high":
      case "critical":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "medium":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "low":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <section
      ref={ref}
      className={`px-4 py-20 transition-all duration-1000 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      }`}
    >
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-3">
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              See It In Action
            </span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Try an interactive demo with sample data – no repository URL needed.
          </p>
        </div>

        <Card className="bg-card/50 border-border overflow-hidden">
          <CardHeader className="border-b border-border bg-card/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <code className="text-sm text-muted-foreground code-font">
                  github.com/demo/{sampleResults.repoName}
                </code>
              </div>
              <Button
                onClick={handleRunDemo}
                disabled={isScanning}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isScanning ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Run Demo Scan
                  </>
                )}
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {!showResults && !isScanning && (
              <div className="text-center py-12 text-muted-foreground">
                <p>Click "Run Demo Scan" to see sample analysis results</p>
              </div>
            )}

            {isScanning && (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Analyzing dependencies...</p>
              </div>
            )}

            {showResults && (
              <div className="space-y-6 animate-in fade-in duration-500">
                {/* Score Summary */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-background/50 rounded-lg p-4 border border-border">
                    <div className="text-sm text-muted-foreground mb-1">Reproducibility Score</div>
                    <div className="text-3xl font-bold text-primary">{sampleResults.reproducibilityScore}%</div>
                  </div>
                  <div className="bg-background/50 rounded-lg p-4 border border-border">
                    <div className="text-sm text-muted-foreground mb-1">Security Score</div>
                    <div className="text-3xl font-bold text-accent">{sampleResults.securityScore}%</div>
                  </div>
                </div>

                {/* Issues */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-yellow-400" />
                    <h4 className="font-semibold">Issues Detected ({sampleResults.issues.length})</h4>
                  </div>
                  <div className="space-y-2">
                    {sampleResults.issues.map((issue, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between bg-background/30 rounded-lg px-4 py-3 border border-border"
                      >
                        <div className="flex items-center gap-3">
                          <Badge className={getSeverityColor(issue.severity)}>{issue.severity}</Badge>
                          <code className="text-sm code-font text-foreground">{issue.package}</code>
                          <span className="text-sm text-muted-foreground">{issue.issue}</span>
                        </div>
                        <code className="text-xs text-primary code-font">{issue.suggestion}</code>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Vulnerabilities */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="w-4 h-4 text-red-400" />
                    <h4 className="font-semibold">Vulnerabilities ({sampleResults.vulnerabilities.length})</h4>
                  </div>
                  <div className="space-y-2">
                    {sampleResults.vulnerabilities.map((vuln, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between bg-background/30 rounded-lg px-4 py-3 border border-border"
                      >
                        <div className="flex items-center gap-3">
                          <Badge className={getSeverityColor(vuln.severity)}>{vuln.severity}</Badge>
                          <code className="text-sm code-font text-foreground">{vuln.package}</code>
                          <span className="text-sm text-muted-foreground">v{vuln.version}</span>
                        </div>
                        <code className="text-xs text-red-400 code-font">{vuln.cve}</code>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Suggestions */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <h4 className="font-semibold">AI Suggestions</h4>
                  </div>
                  <div className="space-y-2">
                    {sampleResults.suggestions.map((suggestion, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 bg-background/30 rounded-lg px-4 py-3 border border-border"
                      >
                        <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                        <span className="text-sm text-foreground">{suggestion}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default DemoSection;
