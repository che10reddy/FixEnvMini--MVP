import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Download, ArrowLeft, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { toast } from "@/hooks/use-toast";

const FixPreview = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [copied, setCopied] = useState(false);

  const fixedContent = location.state?.fixedContent || "";
  const filename = location.state?.filename || "requirements.txt";
  const format = location.state?.format || "requirements.txt";
  const fixesApplied = location.state?.fixesApplied || 0;
  const repositoryUrl = location.state?.repositoryUrl || "";

  const handleDownload = () => {
    const blob = new Blob([fixedContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "File downloaded!",
      description: `${filename} has been downloaded successfully.`,
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(fixedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copied to clipboard!",
      description: "Fixed content copied successfully.",
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
                Auto-Fixed Dependencies
              </span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Review your corrected dependency file before downloading.
            </p>
          </div>

          {/* Metadata Card */}
          <div 
            className="bg-card/50 border border-border rounded-xl p-6 backdrop-blur-sm animate-fade-in flex items-center justify-between flex-wrap gap-4"
            style={{ animationDelay: '100ms' }}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileCheck className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-lg">
                  {filename}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {fixesApplied} fix{fixesApplied !== 1 ? 'es' : ''} applied • {format}
                </p>
              </div>
            </div>
            <Button
              onClick={handleCopy}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              {copied ? "Copied!" : "Copy to Clipboard"}
            </Button>
          </div>

          {/* Code Preview Card */}
          <div 
            className="bg-codeBg border border-border rounded-xl overflow-hidden animate-fade-in"
            style={{ animationDelay: '200ms' }}
          >
            <div className="bg-card/30 border-b border-border px-6 py-3">
              <p className="text-sm text-muted-foreground font-mono">
                {filename}
              </p>
            </div>
            <div className="p-6 overflow-x-auto max-h-[500px] overflow-y-auto">
              <pre className="code-font text-sm leading-relaxed">
                <code className="text-foreground">
                  {fixedContent.split('\n').map((line, index) => (
                    <div key={index} className="hover:bg-primary/5 transition-colors px-2 -mx-2 rounded">
                      <span className="inline-block w-12 text-muted-foreground select-none">
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
              Download Fixed File
            </Button>
            <Button
              onClick={() => navigate(-1)}
              size="lg"
              variant="outline"
              className="h-14 px-8 font-semibold gap-2 text-base"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Results
            </Button>
          </div>

          {/* Info Card */}
          {repositoryUrl && (
            <div 
              className="bg-accent/5 border border-accent/20 rounded-lg p-4 text-center animate-fade-in"
              style={{ animationDelay: '400ms' }}
            >
              <p className="text-sm text-muted-foreground">
                Replace your existing <code className="code-font text-xs bg-codeBg px-2 py-0.5 rounded text-accent">{filename}</code> with this corrected version
              </p>
            </div>
          )}
        </div>
      </section>
      <Footer />
    </main>
  );
};

export default FixPreview;
