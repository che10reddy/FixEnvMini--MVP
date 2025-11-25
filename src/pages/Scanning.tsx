import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScanningSkeleton from "@/components/ScanningSkeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const Scanning = () => {
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const analyzeRepo = async () => {
      const repoUrl = location.state?.repoUrl;
      
      if (!repoUrl) {
        toast({
          title: "Error",
          description: "No repository URL provided",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      // Show timeout warning after 20 seconds
      const warningTimeout = setTimeout(() => setShowTimeoutWarning(true), 20000);

      try {
        const { data, error } = await supabase.functions.invoke('analyze-repo', {
          body: { repoUrl }
        });

        clearTimeout(warningTimeout);

        if (error) throw error;

        if (!data.success) {
          throw new Error(data.error || 'Analysis failed');
        }

        // Navigate to results with the analysis data
        setTimeout(() => {
          navigate("/results", { 
            state: { 
              analysisData: data.data,
              rawRequirements: data.rawRequirements,
              detectedFormats: data.detectedFormats || [],
              foundFiles: data.foundFiles || [],
              pythonVersion: data.pythonVersion,
              pythonVersionSource: data.pythonVersionSource,
              repositoryUrl: repoUrl,
            } 
          });
        }, 500);

      } catch (error) {
        clearTimeout(warningTimeout);
        console.error('Error analyzing repo:', error);
        toast({
          title: "Analysis Failed",
          description: error instanceof Error ? error.message : "Could not analyze repository",
          variant: "destructive",
        });
        setTimeout(() => navigate("/"), 2000);
      }
    };

    analyzeRepo();
  }, [navigate, location]);

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <Header />
      <section className="flex items-center justify-center px-4 py-12 pt-24 min-h-screen flex-1">
        <div className="max-w-3xl w-full text-center space-y-8 animate-fade-in">
          {/* Hero Section */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient">
              Scanning Your Repository…
            </h1>
            <p className="text-lg text-muted-foreground">
              Fetching repo data and analyzing your environment configuration.
            </p>
          </div>

          {/* Progress Box */}
          <div className="bg-card/50 border border-border rounded-xl p-8 backdrop-blur-sm space-y-6">
            <div className="space-y-4">
              {[
                "Fetching repository",
                "Reading requirements.txt",
                "Parsing dependencies",
                "Checking for version conflicts",
                "Sending data to AI Analyzer"
              ].map((step, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 text-left"
                >
                  <div className="flex-shrink-0">
                    <div className="w-5 h-5 rounded-full border-2 border-primary animate-pulse" />
                  </div>
                  <span className="text-foreground">{step}</span>
                </div>
              ))}
            </div>

            {/* Loading Bar */}
            <div className="relative h-2 bg-muted/20 rounded-full overflow-hidden">
              <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-primary to-accent rounded-full animate-pulse" />
            </div>
          </div>

          {/* Notes */}
          <p className="text-sm text-muted-foreground">
            This may take a few seconds…
          </p>

          {/* Timeout Warning */}
          {showTimeoutWarning && (
            <p className="text-sm text-yellow-500 animate-fade-in">
              ⏳ Large repository detected. This may take up to a minute...
            </p>
          )}
        </div>
      </section>
      <Footer />
    </main>
  );
};

export default Scanning;
