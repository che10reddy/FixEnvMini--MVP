import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AlertTriangle, Info, AlertCircle, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ResultsSkeleton from "@/components/ResultsSkeleton";
import { toast } from "@/hooks/use-toast";

const Results = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  // Get analysis data from navigation state
  const analysisData = location.state?.analysisData;
  const rawRequirements = location.state?.rawRequirements;

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

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <Header />
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
          </div>

          {/* Issues Summary Card */}
          <div className="bg-card/50 border border-border rounded-xl p-6 md:p-8 backdrop-blur-sm animate-fade-in" style={{ animationDelay: '100ms' }}>
            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-primary" />
              Detected Issues
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

          {/* AI Suggestions Card */}
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

          {/* Dependency Diff Viewer */}
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

          {/* Continue Button */}
          <div className="flex justify-center pt-4 animate-fade-in" style={{ animationDelay: '400ms' }}>
            <Button
              onClick={() => navigate("/snapshot", { 
                state: { 
                  dependencyDiff,
                  reproducibilityScore: analysisData.reproducibilityScore,
                  issues,
                  suggestions,
                } 
              })}
              size="lg"
              className="h-14 px-8 bg-primary hover:bg-primary text-primary-foreground font-semibold gap-2 transition-all hover:shadow-[0_0_30px_rgba(76,201,240,0.6)] text-base"
            >
              <Sparkles className="w-5 h-5" />
              Generate Snapshot
            </Button>
          </div>
        </div>
        )}
      </section>
      <Footer />
    </main>
  );
};

export default Results;
