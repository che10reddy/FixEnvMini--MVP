import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CheckCircle2, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScanningSkeleton from "@/components/ScanningSkeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const steps = [
  "Fetching files from GitHub",
  "Analyzing with AI (may take 30-60 seconds)",
];

const Scanning = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
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

      // Show first step immediately
      setTimeout(() => setIsLoading(false), 1000);
      
      // Move to AI analysis step after 2 seconds
      const stepTimeout = setTimeout(() => setCurrentStep(1), 2000);
      
      // Show timeout warning after 30 seconds
      const warningTimeout = setTimeout(() => setShowTimeoutWarning(true), 30000);

      try {
        const { data, error } = await supabase.functions.invoke('analyze-repo', {
          body: { repoUrl }
        });

        clearTimeout(stepTimeout);
        clearTimeout(warningTimeout);
        setCurrentStep(steps.length);

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
        clearTimeout(stepTimeout);
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
        {isLoading ? (
          <ScanningSkeleton />
        ) : (
          <div className="max-w-3xl w-full text-center space-y-8 animate-fade-in">
          {/* Hero Title */}
          <div className="space-y-4">
            <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent glow-text">
                Scanning Your Repository…
              </span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Fetching repo data and analyzing your environment configuration.
            </p>
          </div>

          {/* Progress Box */}
          <div className="bg-card/50 border border-border rounded-xl p-8 backdrop-blur-sm space-y-6">
            <div className="space-y-4">
              {steps.map((step, index) => {
                const isCompleted = index < currentStep;
                const isActive = index === currentStep;
                const isUpcoming = index > currentStep;

                return (
                  <div
                    key={step}
                    className={`flex items-center gap-4 transition-all duration-300 ${
                      isCompleted
                        ? "opacity-50"
                        : isActive
                        ? "opacity-100"
                        : "opacity-30"
                    }`}
                  >
                    <div className="flex-shrink-0">
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      ) : isActive ? (
                        <Loader2 className="w-5 h-5 text-primary animate-spin" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30" />
                      )}
                    </div>
                    <p
                      className={`text-left code-font text-base ${
                        isActive
                          ? "text-foreground font-medium"
                          : "text-muted-foreground"
                      }`}
                    >
                      {step}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Loading Bar */}
            <div className="relative h-2 bg-muted/20 rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500 ease-out glow-border"
                style={{
                  width: `${((currentStep + 1) / steps.length) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Note */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Larger repos may take 30-60 seconds to analyze
            </p>
            {showTimeoutWarning && (
              <p className="text-sm text-yellow-500 animate-fade-in">
                ⏳ Large repository detected. Analysis may take up to 2 minutes...
              </p>
            )}
          </div>
          </div>
        )}
      </section>
      <Footer />
    </main>
  );
};

export default Scanning;
