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
        <div className="relative">
          <ScanningSkeleton />
          {showTimeoutWarning && (
            <p className="text-sm text-yellow-500 animate-fade-in text-center mt-6">
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
