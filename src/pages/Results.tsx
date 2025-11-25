import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AlertTriangle, Info, AlertCircle, Sparkles, ArrowRight, Package, Download, Loader2, Share2, BookOpen, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ResultsSkeleton from "@/components/ResultsSkeleton";
import { SnapshotProgressDialog } from "@/components/SnapshotProgressDialog";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Results = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingSnapshot, setIsGeneratingSnapshot] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  // Get analysis data from navigation state
  const analysisData = location.state?.analysisData;
  const rawRequirements = location.state?.rawRequirements;
  const detectedFormats = location.state?.detectedFormats || [];
  const foundFiles = location.state?.foundFiles || [];
  const pythonVersion = location.state?.pythonVersion;
  const pythonVersionSource = location.state?.pythonVersionSource;
  const repositoryUrl = location.state?.repositoryUrl || "";

  // Redirect if no data
  useEffect(() => {
    if (!isLoading && !analysisData) {
      toast({
        title: "No analysis data",
        description: "Please scan a repository first",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [isLoading, analysisData, navigate]);

  if (!analysisData) {
    return null;
  }

  const issues = analysisData.issues || [];
  const suggestions = analysisData.suggestions || [];
  const dependencyDiff = analysisData.dependencyDiff || [];

  const getSeverityIcon = (severity: string) => {
    const severityLower = severity.toLowerCase();
    switch (severityLower) {
      case "high":
        return <AlertTriangle className="w-5 h-5 text-destructive" />;
      case "medium":
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case "low":
        return <Info className="w-5 h-5 text-blue-500" />;
      default:
        return <Info className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    const severityLower = severity.toLowerCase();
    switch (severityLower) {
      case "high":
        return "bg-destructive/10 text-destructive border-destructive/20";
      case "medium":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "low":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      default:
        return "bg-muted/10 text-muted-foreground border-muted/20";
    }
  };

  const handleGenerateSnapshot = async () => {
    setIsGeneratingSnapshot(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-snapshot', {
        body: {
          issues,
          suggestions,
          dependencyDiff,
          detectedFormats,
          primaryFormat: location.state?.primaryFormat,
          pythonVersion,
          rawRequirements,
          repositoryUrl,
          reproducibilityScore: analysisData.reproducibilityScore,
        }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate snapshot');
      }

      // Navigate to preview page with .zfix data
      navigate("/fix-preview", {
        state: {
          zfixData: data.zfixData,
          fixedContent: data.fixedContent,
          filename: data.filename,
          format: data.format,
          fixesApplied: issues.length + suggestions.length,
          repositoryUrl,
          reproducibilityScore: analysisData.reproducibilityScore,
          issues,
          dependencyDiff,
        }
      });

      toast({
        title: "Snapshot generated!",
        description: "Review your environment snapshot.",
      });
    } catch (error) {
      console.error('Error generating snapshot:', error);
      toast({
        title: "Failed to generate snapshot",
        description: error instanceof Error ? error.message : "Could not generate snapshot file",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingSnapshot(false);
    }
  };

  const handleShare = async () => {
    setIsSharing(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-share', {
        body: {
          analysisData: {
            issues,
            suggestions,
            dependencyDiff,
            detectedFormats,
            foundFiles,
            pythonVersion,
            reproducibilityScore: analysisData.reproducibilityScore,
          },
          repositoryUrl,
        }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error('Failed to create share link');
      }

      setShareUrl(data.shareUrl);
      toast({
        title: "Share link created!",
        description: "Your results are now shareable.",
      });
    } catch (error) {
      console.error('Error creating share:', error);
      toast({
        title: "Failed to create share link",
        description: error instanceof Error ? error.message : "Could not create share link",
        variant: "destructive",
      });
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Link copied!",
      description: "Share link copied to clipboard.",
    });
  };

  const handleViewScore = () => {
    navigate("/reproducibility", {
      state: {
        reproducibilityScore: analysisData.reproducibilityScore,
        issues: issues,
        dependencyDiff: dependencyDiff,
      }
    });
  };


  return (
    <main className="min-h-screen bg-background flex flex-col">
      <Header />
      <SnapshotProgressDialog isOpen={isGeneratingSnapshot} />
      <section className="px-4 py-12 pt-24 pb-20 flex-1">
        {isLoading ? (
          <ResultsSkeleton />
        ) : (
          <div className="max-w-6xl mx-auto space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-4 animate-fade-in">
            <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent glow-text">
                Environment Analysis Results
              </span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Here's what we found in your Python project's environment.
            </p>
            
            {/* Detected Formats Badges */}
            {foundFiles.length > 0 && (
              <div className="flex items-center justify-center gap-2 flex-wrap pt-2">
                <span className="text-sm text-muted-foreground">Detected:</span>
                {foundFiles.map((file: any, index: number) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    {file.format}
                  </span>
                ))}
                {pythonVersion && pythonVersion !== 'unknown' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                    Python {pythonVersion}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Python Version Info Card - Only show if detected */}
          {pythonVersion && pythonVersion !== 'unknown' && (
            <div className="bg-accent/5 border border-accent/20 rounded-lg p-4 animate-fade-in" style={{ animationDelay: '50ms' }}>
              <div className="flex items-center gap-3">
                <Info className="w-5 h-5 text-accent flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-foreground">
                    <span className="font-semibold">Python {pythonVersion}</span> detected from{' '}
                    <code className="code-font text-xs bg-codeBg px-2 py-0.5 rounded text-accent">{pythonVersionSource}</code>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    All dependency compatibility checks are performed against this Python version.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Success State - No Issues Found */}
          {issues.length === 0 && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-8 md:p-12 backdrop-blur-sm animate-fade-in text-center" style={{ animationDelay: '100ms' }}>
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Check className="w-8 h-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold text-foreground">
                    No Issues Found!
                  </h2>
                  <p className="text-lg text-muted-foreground max-w-xl">
                    This repository has excellent dependency hygiene.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 w-full max-w-2xl">
                  <div className="bg-card/30 border border-border/50 rounded-lg p-4">
                    <Check className="w-5 h-5 text-primary mb-2" />
                    <p className="text-sm font-medium text-foreground">All packages pinned</p>
                  </div>
                  <div className="bg-card/30 border border-border/50 rounded-lg p-4">
                    <Check className="w-5 h-5 text-primary mb-2" />
                    <p className="text-sm font-medium text-foreground">No conflicts detected</p>
                  </div>
                  <div className="bg-card/30 border border-border/50 rounded-lg p-4">
                    <Check className="w-5 h-5 text-primary mb-2" />
                    <p className="text-sm font-medium text-foreground">Reproducible environment</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 mt-6">
                  <Button
                    onClick={handleViewScore}
                    size="lg"
                    className="h-14 px-8 font-semibold gap-2 text-base"
                  >
                    View Reproducibility Score
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                  <Button
                    onClick={() => navigate("/")}
                    size="lg"
                    variant="outline"
                    className="h-14 px-8 font-semibold gap-2 text-base"
                  >
                    Return Home
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Issues Summary Card - Only show if there are issues */}
          {issues.length > 0 && (
            <div className="bg-card/50 border border-border rounded-xl p-6 md:p-8 backdrop-blur-sm animate-fade-in" style={{ animationDelay: '100ms' }}>
              <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-primary" />
                Detected Issues ({issues.length})
              </h2>
              <div className="space-y-4">
                {issues.map((issue, index) => (
                  <div
                    key={index}
                    className="bg-codeBg border border-border rounded-lg p-4 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      {getSeverityIcon(issue.severity)}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="font-semibold text-foreground">{issue.title}</h3>
                          <code className="code-font text-sm text-primary bg-primary/10 px-2 py-1 rounded">
                            {issue.package}
                          </code>
                          <span
                            className={`text-xs px-2 py-1 rounded border font-medium ${getSeverityColor(
                              issue.severity
                            )}`}
                          >
                            {issue.severity}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{issue.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Suggestions Card - Only show if there are suggestions */}
          {suggestions.length > 0 && (
            <div className="bg-card/50 border border-border rounded-xl p-6 md:p-8 backdrop-blur-sm animate-fade-in" style={{ animationDelay: '200ms' }}>
              <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-primary" />
                AI Fix Suggestions
              </h2>
              <ul className="space-y-3">
                {suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start gap-3 text-muted-foreground">
                    <ArrowRight className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Dependency Diff Viewer - Only show if there are changes */}
          {dependencyDiff.length > 0 && (
            <div className="bg-card/50 border border-border rounded-xl p-6 md:p-8 backdrop-blur-sm animate-fade-in" style={{ animationDelay: '300ms' }}>
              <h2 className="text-2xl font-bold text-foreground mb-6">Before → After</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Before */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                    Detected Versions
                  </h3>
                    <div className="bg-codeBg border border-border rounded-lg p-4 space-y-2">
                    {dependencyDiff.map((dep: any, index: number) => (
                      <div key={index} className="code-font text-sm">
                        <span className="text-foreground">{dep.package}</span>
                        <span className="text-muted-foreground"> == </span>
                        <span className={dep.before === "unversioned" ? "text-destructive" : "text-muted-foreground"}>
                          {dep.before}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* After */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                    Suggested Versions
                  </h3>
                  <div className="bg-codeBg border border-primary/20 rounded-lg p-4 space-y-2 glow-border">
                    {dependencyDiff.map((dep: any, index: number) => (
                      <div key={index} className="code-font text-sm">
                        <span className="text-foreground">{dep.package}</span>
                        <span className="text-muted-foreground"> == </span>
                        <span className="text-primary font-medium">{dep.after}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-center gap-4 pt-4 animate-fade-in flex-wrap" style={{ animationDelay: '400ms' }}>
            {/* Only show Generate Snapshot button if there are fixes to apply */}
            {(issues.length > 0 || suggestions.length > 0 || dependencyDiff.length > 0) && (
              <Button
                onClick={handleGenerateSnapshot}
                disabled={isGeneratingSnapshot}
                size="lg"
                className="h-14 px-8 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold gap-2 transition-all hover:shadow-[0_0_30px_rgba(255,200,87,0.6)] text-base"
              >
                {isGeneratingSnapshot ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating Snapshot...
                  </>
                ) : (
                  <>
                    <Package className="w-5 h-5" />
                    Generate Snapshot
                  </>
                )}
              </Button>
            )}

            <Dialog>
              <DialogTrigger asChild>
                <Button
                  onClick={shareUrl ? undefined : handleShare}
                  disabled={isSharing}
                  size="lg"
                  variant="outline"
                  className="h-14 px-8 font-semibold gap-2 text-base"
                >
                  {isSharing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creating Link...
                    </>
                  ) : (
                    <>
                      <Share2 className="w-5 h-5" />
                      Share Results
                    </>
                  )}
                </Button>
              </DialogTrigger>
              {shareUrl && (
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Share Your Analysis</DialogTitle>
                    <DialogDescription>
                      Anyone with this link can view your analysis results.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex items-center gap-2 mt-4">
                    <input
                      type="text"
                      value={shareUrl}
                      readOnly
                      className="flex-1 px-3 py-2 bg-codeBg border border-border rounded text-sm code-font"
                    />
                    <Button onClick={handleCopyLink} size="sm">
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </DialogContent>
              )}
            </Dialog>

          </div>

          {/* CI Integration Guide */}
          <div className="bg-card/50 border border-border rounded-xl p-6 md:p-8 backdrop-blur-sm animate-fade-in mt-8" style={{ animationDelay: '500ms' }}>
            <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-primary" />
              Using FixEnv in CI/CD
            </h2>
            <p className="text-muted-foreground mb-4">
              Integrate FixEnv into your continuous integration workflow to automatically check dependency health on every push.
            </p>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-foreground mb-2">GitHub Actions Example</h3>
                <pre className="bg-codeBg border border-border rounded-lg p-4 overflow-x-auto text-sm code-font">
{`name: FixEnv Check

on: [push, pull_request]

jobs:
  fixenv-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run FixEnv Analysis
        run: |
          curl -X POST https://ncafkcmxumkklboonfhs.supabase.co/functions/v1/analyze-repo \\
            -H "Content-Type: application/json" \\
            -d '{"repoUrl": "https://github.com/your-org/your-repo"}'
      
      - name: Check Results
        run: echo "Analysis complete. Review results at FixEnv."`}
                </pre>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-2">Best Practices</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <ArrowRight className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>Run FixEnv checks on every pull request to catch dependency issues early</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>Set up notifications for high-severity issues to your team's Slack/Discord</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>Use the auto-fix feature to generate corrected dependency files automatically</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>Export results as JSON for integration with other monitoring tools</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        )}
      </section>
      <Footer />
    </main>
  );
};

export default Results;
