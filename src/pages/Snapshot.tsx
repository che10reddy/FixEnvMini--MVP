import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, FileCode, ArrowRight } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useNavigate, useLocation } from "react-router-dom";
import Footer from "@/components/Footer";
import SnapshotSkeleton from "@/components/SnapshotSkeleton";
import { supabase } from "@/integrations/supabase/client";

const Snapshot = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [snapshotData, setSnapshotData] = useState<any>(null);

  useEffect(() => {
    const generateSnapshot = async () => {
      const dependencyDiff = location.state?.dependencyDiff;
      const reproducibilityScore = location.state?.reproducibilityScore;

      if (!dependencyDiff) {
        toast({
          title: "No dependency data",
          description: "Please complete the analysis first",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      try {
        // Convert dependency diff to dependencies object
        const dependencies: Record<string, string> = {};
        dependencyDiff.forEach((dep: any) => {
          dependencies[dep.package] = dep.after;
        });

        const { data, error } = await supabase.functions.invoke('generate-snapshot', {
          body: { dependencies }
        });

        if (error) throw error;

        if (!data.success) {
          throw new Error(data.error || 'Snapshot generation failed');
        }

        setSnapshotData(data.snapshot);
        setIsLoading(false);

      } catch (error) {
        console.error('Error generating snapshot:', error);
        toast({
          title: "Generation Failed",
          description: error instanceof Error ? error.message : "Could not generate snapshot",
          variant: "destructive",
        });
        setTimeout(() => navigate("/"), 2000);
      }
    };

    generateSnapshot();
  }, [navigate, location]);

  const handleDownload = () => {
    const dataStr = JSON.stringify(snapshotData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "capsule.zfix";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Download Started",
      description: "Your .zfix snapshot file is downloading",
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="container mx-auto px-4 py-12 flex-1">
        {isLoading ? (
          <SnapshotSkeleton />
        ) : (
          <div className="max-w-4xl mx-auto space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-4 animate-fade-in">
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
                Environment Snapshot Generated
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Here is your reproducible .zfix environment file.
            </p>
          </div>

          {/* Snapshot Card */}
          <div 
            className="bg-card/50 border border-border rounded-xl overflow-hidden backdrop-blur-sm shadow-[0_0_30px_rgba(76,201,240,0.2)] animate-fade-in"
            style={{ animationDelay: '100ms' }}
          >
            {/* Header Bar */}
            <div className="bg-muted/30 border-b border-border px-6 py-4 flex items-center gap-3">
              <FileCode className="w-5 h-5 text-primary" />
              <span className="code-font text-foreground font-semibold">capsule.zfix</span>
            </div>

            {/* JSON Preview */}
            <div className="p-6 max-h-96 overflow-y-auto">
              <pre className="code-font text-sm text-foreground">
                <code>
                  {`{`}
                  {'\n  '}<span className="text-accent">"python_version"</span>: <span className="text-primary">"{snapshotData.python_version}"</span>,
                  {'\n  '}<span className="text-accent">"dependencies"</span>: {'{'}
                  {Object.entries(snapshotData.dependencies).map(([key, value], index, array) => (
                    <span key={key}>
                      {'\n    '}<span className="text-accent">"{key}"</span>: <span className="text-primary">"{String(value)}"</span>{index < array.length - 1 ? ',' : ''}
                    </span>
                  ))}
                  {'\n  '}{'}'}, 
                  {'\n  '}<span className="text-accent">"checksum"</span>: <span className="text-primary">"{snapshotData?.checksum || ''}"</span>
                  {'\n'}{`}`}
                </code>
              </pre>
            </div>
          </div>

          {/* Download Button */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: '200ms' }}>
            <Button 
              onClick={handleDownload}
              size="lg"
              variant="outline"
              className="h-14 px-8 font-semibold gap-2 transition-all text-base"
            >
              <Download className="w-5 h-5" />
              Download Snapshot (.zfix)
            </Button>
            <Button 
              onClick={() => navigate("/reproducibility", {
                state: { reproducibilityScore: location.state?.reproducibilityScore }
              })}
              size="lg"
              className="h-14 px-8 bg-primary hover:bg-primary text-primary-foreground font-semibold gap-2 transition-all hover:shadow-[0_0_30px_rgba(76,201,240,0.6)] text-base"
            >
              View Reproducibility Score
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Notes */}
          <p className="text-sm text-muted-foreground text-center animate-fade-in" style={{ animationDelay: '300ms' }}>
            This snapshot can be used to reproduce the same environment consistently across systems.
          </p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Snapshot;
