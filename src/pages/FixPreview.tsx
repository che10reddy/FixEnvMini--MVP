import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Download, FileCheck, Target, Home, Package, ChevronDown, ChevronUp, CheckCircle2, AlertCircle, Shield, ExternalLink, Zap, Pin, ArrowRight, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { toast } from "@/hooks/use-toast";

const FixPreview = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [copied, setCopied] = useState(false);
  const [isFixedDepsOpen, setIsFixedDepsOpen] = useState(false);
  const [isFullZfixOpen, setIsFullZfixOpen] = useState(false);
  const [isScoreBreakdownOpen, setIsScoreBreakdownOpen] = useState(false);
  const [isVulnerabilitiesOpen, setIsVulnerabilitiesOpen] = useState(false);
  const [isPythonCompatOpen, setIsPythonCompatOpen] = useState(false);
  const [isMissingPinsOpen, setIsMissingPinsOpen] = useState(false);
  const [isChangesOpen, setIsChangesOpen] = useState(false);

  const zfixData = location.state?.zfixData;
  const fixedContent = location.state?.fixedContent || "";
  const filename = location.state?.filename || "environment.zfix";
  const format = location.state?.format || ".zfix";
  const fixesApplied = location.state?.fixesApplied || 0;
  const repositoryUrl = location.state?.repositoryUrl || "";
  const reproducibilityScore = location.state?.reproducibilityScore;
  const issues = location.state?.issues || [];
  const suggestions = location.state?.suggestions || zfixData?.analysis?.suggestions || [];
  const dependencyDiff = location.state?.dependencyDiff || [];
  const vulnerabilities = location.state?.vulnerabilities || zfixData?.analysis?.vulnerabilities || [];
  const pythonVersion = zfixData?.metadata?.python_version || location.state?.pythonVersion || "Unknown";

  const score = reproducibilityScore || zfixData?.analysis?.reproducibility_score || 0;

  // Extract Python compatibility issues
  const pythonCompatibilityIssues = issues.filter((issue: any) => {
    const text = `${issue.title} ${issue.description}`.toLowerCase();
    return text.includes("python") || text.includes("compatibility") || text.includes("incompatible") || text.includes("requires python");
  });

  // Extract missing pins from dependencyDiff
  const missingPins = dependencyDiff.filter((dep: any) => dep.before === "unversioned");

  // Generate changes with reasoning from suggestions and dependency diff
  const changesWithReasoning = dependencyDiff.map((dep: any) => {
    // Find matching suggestion for reasoning
    const matchingSuggestion = suggestions.find((sug: string) => 
      sug.toLowerCase().includes(dep.package.toLowerCase())
    );
    
    let reason = "";
    if (dep.before === "unversioned") {
      reason = "Added version pin for reproducibility";
    } else if (dep.before !== dep.after) {
      reason = matchingSuggestion || "Updated to recommended version";
    } else {
      reason = "Version verified as compatible";
    }
    
    return {
      ...dep,
      reason
    };
  });

  // Generate positive and negative points from actual data
  const generatePoints = () => {
    const positive: string[] = [];
    const negative: string[] = [];
    
    const unpinned = dependencyDiff.filter((dep: any) => dep.before === "unversioned").length;
    const pinned = dependencyDiff.filter((dep: any) => dep.before !== "unversioned").length;
    
    if (issues.length === 0) {
      positive.push("No dependency issues detected");
      positive.push("All packages properly configured");
    }
    
    if (pinned > 0) {
      if (unpinned === 0 && dependencyDiff.length > 0) {
        positive.push("All packages have version pins");
      } else {
        positive.push(`${pinned} package${pinned > 1 ? 's' : ''} properly pinned`);
      }
    }
    
    if (dependencyDiff.length > 0) {
      positive.push("Dependencies are documented");
    }
    
    const highIssues = issues.filter((i: any) => i.severity.toLowerCase() === 'high');
    const conflicts = issues.filter((i: any) => 
      i.title.toLowerCase().includes("conflict") || 
      i.description.toLowerCase().includes("conflict")
    );
    
    if (highIssues.length === 0 && issues.length > 0) {
      positive.push("No critical issues found");
    }
    
    if (conflicts.length === 0 && issues.length > 0) {
      positive.push("No conflicting dependencies");
    }
    
    if (positive.length === 0) {
      positive.push("Repository structure detected");
      positive.push("Analysis completed successfully");
    }
    
    if (unpinned > 0) {
      negative.push(`${unpinned} package${unpinned > 1 ? 's' : ''} missing version pins`);
    }
    
    const medIssues = issues.filter((i: any) => i.severity.toLowerCase() === 'medium');
    const lowIssues = issues.filter((i: any) => i.severity.toLowerCase() === 'low');
    
    if (highIssues.length > 0) {
      negative.push(`${highIssues.length} high-severity issue${highIssues.length > 1 ? 's' : ''} detected`);
    }
    if (medIssues.length > 0) {
      negative.push(`${medIssues.length} medium-severity issue${medIssues.length > 1 ? 's' : ''} found`);
    }
    if (lowIssues.length > 0) {
      negative.push(`${lowIssues.length} minor issue${lowIssues.length > 1 ? 's' : ''} present`);
    }
    
    if (negative.length === 0 && score < 100) {
      negative.push("Minor optimization opportunities detected");
    }
    
    return { positive, negative };
  };
  
  const { positive: positivePoints, negative: negativePoints } = generatePoints();

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-primary";
    if (score >= 50) return "text-yellow-500";
    return "text-red-500";
  };

  const getScoreGlowColor = (score: number) => {
    if (score >= 80) return "rgba(76, 201, 240, 0.6)";
    if (score >= 50) return "rgba(234, 179, 8, 0.6)";
    return "rgba(239, 68, 68, 0.6)";
  };

  const getStrokeColor = (score: number) => {
    if (score >= 80) return "stroke-primary";
    if (score >= 50) return "stroke-yellow-500";
    return "stroke-red-500";
  };

  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const handleDownload = () => {
    const content = JSON.stringify(zfixData, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Snapshot downloaded!",
      description: `${filename} has been downloaded successfully.`,
    });
  };

  const handleCopy = () => {
    const content = JSON.stringify(zfixData, null, 2);
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copied to clipboard!",
      description: "Snapshot data copied successfully.",
    });
  };

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <Header />
      <section className="px-4 py-12 pt-24 pb-20 flex-1">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-4 animate-fade-in">
            <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent glow-text">
                Environment Snapshot (.zfix)
              </span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A complete, portable record of your environment analysis and fixes.
            </p>
          </div>

          {/* Metadata Card */}
          <div 
            className="bg-card/50 border border-border rounded-xl p-6 backdrop-blur-sm animate-fade-in"
            style={{ animationDelay: '100ms' }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Snapshot Metadata</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Repository</p>
                <p className="text-sm text-foreground font-mono truncate">{zfixData?.metadata?.repository_url || 'Unknown'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Python Version</p>
                <p className="text-sm text-foreground font-mono">{pythonVersion}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Generated At</p>
                <p className="text-sm text-foreground font-mono">
                  {zfixData?.generated_at ? new Date(zfixData.generated_at).toLocaleString() : 'Unknown'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Detected Formats</p>
                <div className="flex gap-2 flex-wrap">
                  {(zfixData?.metadata?.detected_formats || []).map((fmt: string, idx: number) => (
                    <span key={idx} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                      {fmt}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Analysis Summary Card */}
          <div 
            className="bg-card/50 border border-border rounded-xl p-6 backdrop-blur-sm animate-fade-in"
            style={{ animationDelay: '150ms' }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-accent" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Analysis Summary</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <p className="text-2xl font-bold text-primary">{score}%</p>
                <p className="text-sm text-muted-foreground mt-1">Reproducibility Score</p>
              </div>
              <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
                <p className="text-2xl font-bold text-destructive">{zfixData?.analysis?.total_issues || 0}</p>
                <p className="text-sm text-muted-foreground mt-1">Issues Detected</p>
              </div>
              <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4">
                <p className="text-2xl font-bold text-red-400">{vulnerabilities.length}</p>
                <p className="text-sm text-muted-foreground mt-1">CVEs Found</p>
              </div>
              <div className="bg-accent/5 border border-accent/20 rounded-lg p-4">
                <p className="text-2xl font-bold text-accent">{suggestions.length}</p>
                <p className="text-sm text-muted-foreground mt-1">AI Suggestions</p>
              </div>
            </div>
          </div>

          {/* Security Vulnerabilities - Collapsible */}
          {vulnerabilities.length > 0 && (
            <Collapsible
              open={isVulnerabilitiesOpen}
              onOpenChange={setIsVulnerabilitiesOpen}
              className="bg-card/50 border border-border rounded-xl backdrop-blur-sm animate-fade-in"
              style={{ animationDelay: '175ms' }}
            >
              <CollapsibleTrigger asChild>
                <button className="w-full px-6 py-4 flex items-center justify-between hover:bg-card/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-destructive" />
                    <h2 className="text-xl font-bold text-foreground">Security Vulnerabilities</h2>
                    <span className="text-xs bg-destructive/20 text-destructive px-2 py-0.5 rounded-full">
                      {vulnerabilities.length} CVE{vulnerabilities.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {isVulnerabilitiesOpen ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-6 pb-6 space-y-3">
                  {vulnerabilities.map((vuln: any, index: number) => {
                    const severityColor = 
                      vuln.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                      vuln.severity === 'HIGH' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                      vuln.severity === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                      'bg-blue-500/20 text-blue-400 border-blue-500/30';
                    
                    return (
                      <div key={index} className="bg-card/30 border border-border rounded-lg p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-xs px-2 py-0.5 rounded border ${severityColor}`}>
                                {vuln.severity}
                              </span>
                              <span className="font-mono text-sm text-foreground">{vuln.id}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              <span className="text-foreground font-medium">{vuln.package}</span>
                              {vuln.version && <span className="text-muted-foreground"> @ {vuln.version}</span>}
                            </p>
                            {vuln.summary && (
                              <p className="text-xs text-muted-foreground line-clamp-2">{vuln.summary}</p>
                            )}
                            {vuln.fixed_versions && vuln.fixed_versions.length > 0 && (
                              <p className="text-xs text-primary">
                                Fix available: upgrade to {vuln.fixed_versions[0]}
                              </p>
                            )}
                          </div>
                          <a
                            href={`https://osv.dev/vulnerability/${vuln.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-primary transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Python Version Compatibility - Collapsible */}
          {pythonCompatibilityIssues.length > 0 && (
            <Collapsible
              open={isPythonCompatOpen}
              onOpenChange={setIsPythonCompatOpen}
              className="bg-card/50 border border-border rounded-xl backdrop-blur-sm animate-fade-in"
              style={{ animationDelay: '180ms' }}
            >
              <CollapsibleTrigger asChild>
                <button className="w-full px-6 py-4 flex items-center justify-between hover:bg-card/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-yellow-500" />
                    <h2 className="text-xl font-bold text-foreground">Python Version Compatibility</h2>
                    <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">
                      {pythonCompatibilityIssues.length} warning{pythonCompatibilityIssues.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {isPythonCompatOpen ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-6 pb-6 space-y-3">
                  <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-3 mb-4">
                    <p className="text-sm text-yellow-400">
                      Detected Python version: <span className="font-mono font-bold">{pythonVersion}</span>
                    </p>
                  </div>
                  {pythonCompatibilityIssues.map((issue: any, index: number) => {
                    const severityColor = 
                      issue.severity.toLowerCase() === 'high' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                      issue.severity.toLowerCase() === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                      'bg-blue-500/20 text-blue-400 border-blue-500/30';
                    
                    // Extract upgrade recommendation from suggestions
                    const relatedSuggestion = suggestions.find((s: string) => 
                      issue.package && s.toLowerCase().includes(issue.package.toLowerCase())
                    );
                    
                    return (
                      <div key={index} className="bg-card/30 border border-border rounded-lg p-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs px-2 py-0.5 rounded border ${severityColor}`}>
                              {issue.severity}
                            </span>
                            <span className="font-medium text-sm text-foreground">{issue.title}</span>
                          </div>
                          {issue.package && (
                            <p className="text-sm text-muted-foreground">
                              Package: <span className="font-mono text-foreground">{issue.package}</span>
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">{issue.description}</p>
                          {relatedSuggestion && (
                            <div className="flex items-center gap-2 mt-2 bg-primary/5 border border-primary/20 rounded p-2">
                              <Lightbulb className="w-4 h-4 text-primary flex-shrink-0" />
                              <p className="text-xs text-primary">{relatedSuggestion}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Missing Version Pins - Collapsible */}
          {missingPins.length > 0 && (
            <Collapsible
              open={isMissingPinsOpen}
              onOpenChange={setIsMissingPinsOpen}
              className="bg-card/50 border border-border rounded-xl backdrop-blur-sm animate-fade-in"
              style={{ animationDelay: '185ms' }}
            >
              <CollapsibleTrigger asChild>
                <button className="w-full px-6 py-4 flex items-center justify-between hover:bg-card/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <Pin className="w-5 h-5 text-orange-400" />
                    <h2 className="text-xl font-bold text-foreground">Missing Version Pins</h2>
                    <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full">
                      {missingPins.length} package{missingPins.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {isMissingPinsOpen ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-6 pb-6">
                  <div className="bg-card/30 border border-border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-card/50">
                          <th className="text-left px-4 py-3 text-muted-foreground font-medium">Package</th>
                          <th className="text-left px-4 py-3 text-muted-foreground font-medium">Status</th>
                          <th className="text-left px-4 py-3 text-muted-foreground font-medium">Recommended Version</th>
                        </tr>
                      </thead>
                      <tbody>
                        {missingPins.map((dep: any, index: number) => (
                          <tr key={index} className="border-b border-border/50 last:border-0">
                            <td className="px-4 py-3 font-mono text-foreground">{dep.package}</td>
                            <td className="px-4 py-3">
                              <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded">
                                Unpinned
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-mono text-primary">{dep.after}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    Unpinned dependencies can cause inconsistent builds across environments. Pin versions for reproducibility.
                  </p>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Changes & Reasoning - Collapsible */}
          {changesWithReasoning.length > 0 && (
            <Collapsible
              open={isChangesOpen}
              onOpenChange={setIsChangesOpen}
              className="bg-card/50 border border-border rounded-xl backdrop-blur-sm animate-fade-in"
              style={{ animationDelay: '190ms' }}
            >
              <CollapsibleTrigger asChild>
                <button className="w-full px-6 py-4 flex items-center justify-between hover:bg-card/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <ArrowRight className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-bold text-foreground">Changes & Reasoning</h2>
                    <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                      {changesWithReasoning.length} change{changesWithReasoning.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {isChangesOpen ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-6 pb-6 space-y-3">
                  {changesWithReasoning.map((change: any, index: number) => {
                    const isNewPin = change.before === "unversioned";
                    const isUpgrade = !isNewPin && change.before !== change.after;
                    
                    return (
                      <div key={index} className="bg-card/30 border border-border rounded-lg p-4">
                        <div className="flex items-start gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-medium text-foreground">{change.package}</span>
                              {isNewPin && (
                                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">
                                  New Pin
                                </span>
                              )}
                              {isUpgrade && (
                                <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">
                                  Updated
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <span className="font-mono text-muted-foreground bg-muted/20 px-2 py-0.5 rounded">
                                {change.before}
                              </span>
                              <ArrowRight className="w-4 h-4 text-primary" />
                              <span className="font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">
                                {change.after}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Lightbulb className="w-3 h-3" />
                              {change.reason}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Reproducibility Score Breakdown - Collapsible */}
          <Collapsible
            open={isScoreBreakdownOpen}
            onOpenChange={setIsScoreBreakdownOpen}
            className="bg-card/50 border border-border rounded-xl backdrop-blur-sm animate-fade-in"
            style={{ animationDelay: '175ms' }}
          >
            <CollapsibleTrigger asChild>
              <button className="w-full px-6 py-4 flex items-center justify-between hover:bg-card/30 transition-colors">
                <div className="flex items-center gap-3">
                  <Target className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-bold text-foreground">Reproducibility Score Breakdown</h2>
                </div>
                {isScoreBreakdownOpen ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                )}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-6 pb-6 space-y-6">
                {/* Score Gauge */}
                <div className="flex justify-center">
                  <div className="relative w-32 h-32">
                    <svg className="transform -rotate-90 w-32 h-32">
                      <circle
                        cx="64"
                        cy="64"
                        r="45"
                        stroke="currentColor"
                        strokeWidth="10"
                        fill="none"
                        className="text-muted/20"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="45"
                        stroke="currentColor"
                        strokeWidth="10"
                        fill="none"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        className={`${getStrokeColor(score)} transition-all duration-1000`}
                        style={{
                          filter: `drop-shadow(0 0 12px ${getScoreGlowColor(score)})`
                        }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span 
                        className={`font-display text-3xl font-bold ${getScoreColor(score)}`}
                        style={{
                          textShadow: `0 0 20px ${getScoreGlowColor(score)}`
                        }}
                      >
                        {score}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Positive Points */}
                <div className="space-y-3">
                  <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    What improved your score:
                  </h3>
                  <ul className="space-y-2 ml-6">
                    {positivePoints.map((point, index) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Negative Points */}
                {score < 100 && negativePoints.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-yellow-500" />
                      What lowered your score:
                    </h3>
                    <ul className="space-y-2 ml-6">
                      {negativePoints.map((point, index) => (
                        <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-yellow-500 mt-0.5">•</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Perfect Score Message */}
                {score === 100 && (
                  <p className="text-center text-primary font-semibold">
                    🎉 Perfect score! Your environment is fully reproducible.
                  </p>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Fixed Dependencies Preview - Collapsible */}
          <Collapsible
            open={isFixedDepsOpen}
            onOpenChange={setIsFixedDepsOpen}
            className="bg-card/50 border border-border rounded-xl backdrop-blur-sm animate-fade-in"
            style={{ animationDelay: '200ms' }}
          >
            <CollapsibleTrigger asChild>
              <button className="w-full px-6 py-4 flex items-center justify-between hover:bg-card/30 transition-colors">
                <div className="flex items-center gap-3">
                  <FileCheck className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-bold text-foreground">Fixed Dependencies</h2>
                </div>
                {isFixedDepsOpen ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                )}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-6 pb-6">
                <div className="bg-codeBg border border-border rounded-lg overflow-hidden">
                  <div className="bg-card/30 border-b border-border px-4 py-2">
                    <p className="text-xs text-muted-foreground font-mono">
                      {zfixData?.fixed_dependencies?.format || 'requirements.txt'}
                    </p>
                  </div>
                  <div className="p-4 overflow-x-auto max-h-[400px] overflow-y-auto">
                    <pre className="code-font text-sm leading-relaxed">
                      <code className="text-foreground">
                        {fixedContent.split('\n').map((line: string, index: number) => (
                          <div key={index} className="hover:bg-primary/5 transition-colors px-2 -mx-2 rounded">
                            <span className="inline-block w-10 text-muted-foreground select-none text-xs">
                              {index + 1}
                            </span>
                            <span className={
                              line.startsWith('#') ? 'text-muted-foreground' :
                              line.includes('==') ? 'text-primary' :
                              'text-foreground'
                            }>
                              {line || ' '}
                            </span>
                          </div>
                        ))}
                      </code>
                    </pre>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Full .zfix Structure - Collapsible */}
          <Collapsible
            open={isFullZfixOpen}
            onOpenChange={setIsFullZfixOpen}
            className="bg-card/50 border border-border rounded-xl backdrop-blur-sm animate-fade-in"
            style={{ animationDelay: '250ms' }}
          >
            <CollapsibleTrigger asChild>
              <button className="w-full px-6 py-4 flex items-center justify-between hover:bg-card/30 transition-colors">
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-accent" />
                  <h2 className="text-xl font-bold text-foreground">Full .zfix Structure</h2>
                </div>
                {isFullZfixOpen ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                )}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-6 pb-6">
                <div className="bg-codeBg border border-border rounded-lg overflow-hidden">
                  <div className="bg-card/30 border-b border-border px-4 py-2 flex items-center justify-between">
                    <p className="text-xs text-muted-foreground font-mono">environment.zfix (JSON)</p>
                    <Button
                      onClick={handleCopy}
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs gap-1"
                    >
                      {copied ? "Copied!" : "Copy JSON"}
                    </Button>
                  </div>
                  <div className="p-4 overflow-x-auto max-h-[500px] overflow-y-auto">
                    <pre className="code-font text-xs leading-relaxed">
                      <code className="text-foreground">
                        {JSON.stringify(zfixData, null, 2)}
                      </code>
                    </pre>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Action Buttons */}
          <div 
            className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in"
            style={{ animationDelay: '300ms' }}
          >
            <Button
              onClick={handleDownload}
              size="lg"
              className="h-14 px-8 font-semibold gap-2 text-base"
            >
              <Download className="w-5 h-5" />
              Download Snapshot (.zfix)
            </Button>
            <Button
              onClick={() => navigate("/")}
              size="lg"
              variant="outline"
              className="h-14 px-8 font-semibold gap-2 text-base"
            >
              <Home className="w-5 h-5" />
              Return Home
            </Button>
          </div>

          {/* Info Card */}
          <div 
            className="bg-accent/5 border border-accent/20 rounded-lg p-4 text-center animate-fade-in"
            style={{ animationDelay: '350ms' }}
          >
            <p className="text-sm text-muted-foreground">
              The <code className="code-font text-xs bg-codeBg px-2 py-0.5 rounded text-accent">.zfix</code> file contains your complete environment analysis and can be shared or version-controlled
            </p>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
};

export default FixPreview;
