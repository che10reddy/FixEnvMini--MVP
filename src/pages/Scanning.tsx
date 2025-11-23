import { useEffect, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import Header from "@/components/Header";

const steps = [
  "Fetching repository",
  "Reading requirements.txt",
  "Parsing dependencies",
  "Checking for version conflicts",
  "Sending data to AI Analyzer",
];

const Scanning = () => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < steps.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-background">
      <Header />
      <section className="flex items-center justify-center px-4 py-12 pt-24 min-h-screen">
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
          <p className="text-sm text-muted-foreground">
            This may take a few seconds…
          </p>
        </div>
      </section>
    </main>
  );
};

export default Scanning;
