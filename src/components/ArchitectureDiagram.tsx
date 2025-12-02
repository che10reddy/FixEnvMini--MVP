import { Github, Cpu, Database, Sparkles } from "lucide-react";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";

const ArchitectureDiagram = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section ref={ref} className="px-4 py-16 relative overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div
          className={`text-center mb-12 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-4">
            <span className="bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
              How It Works
            </span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            AI-powered pipeline analyzes your repository in seconds
          </p>
        </div>

        {/* Architecture Flow */}
        <div
          className={`relative transition-all duration-700 delay-200 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
            {/* Step 1: GitHub */}
            <div className="relative group">
              <div className="bg-card/50 border border-border rounded-xl p-6 backdrop-blur-sm hover:border-primary/50 transition-all duration-300 h-full">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Github className="w-6 h-6 text-primary" />
                </div>
                <div className="text-xs font-medium text-primary mb-2">STEP 1</div>
                <h3 className="font-semibold text-foreground mb-2">Fetch Repository</h3>
                <p className="text-sm text-muted-foreground">
                  Parallel GitHub API fetching: 6 dependency formats + Python version detection
                </p>
              </div>
              {/* Arrow */}
              <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                <div className="w-6 h-6 rotate-45 border-t-2 border-r-2 border-primary/50" />
              </div>
            </div>

            {/* Step 2: Parse */}
            <div className="relative group">
              <div className="bg-card/50 border border-border rounded-xl p-6 backdrop-blur-sm hover:border-primary/50 transition-all duration-300 h-full">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                  <Cpu className="w-6 h-6 text-accent" />
                </div>
                <div className="text-xs font-medium text-accent mb-2">STEP 2</div>
                <h3 className="font-semibold text-foreground mb-2">Parse & Detect</h3>
                <p className="text-sm text-muted-foreground">
                  Multi-format parsing with caching + Python version from 5 sources
                </p>
              </div>
              {/* Arrow */}
              <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                <div className="w-6 h-6 rotate-45 border-t-2 border-r-2 border-primary/50" />
              </div>
            </div>

            {/* Step 3: AI Analysis */}
            <div className="relative group">
              <div className="bg-card/50 border border-border rounded-xl p-6 backdrop-blur-sm hover:border-primary/50 transition-all duration-300 h-full">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <div className="text-xs font-medium text-primary mb-2">STEP 3</div>
                <h3 className="font-semibold text-foreground mb-2">AI Analysis</h3>
                <p className="text-sm text-muted-foreground">
                  Gemini AI: 25+ patterns, OSV.dev CVE scan, reproducibility & security scoring
                </p>
              </div>
              {/* Arrow */}
              <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                <div className="w-6 h-6 rotate-45 border-t-2 border-r-2 border-primary/50" />
              </div>
            </div>

            {/* Step 4: Results */}
            <div className="relative group">
              <div className="bg-card/50 border border-border rounded-xl p-6 backdrop-blur-sm hover:border-primary/50 transition-all duration-300 h-full glow-border">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                  <Database className="w-6 h-6 text-accent" />
                </div>
                <div className="text-xs font-medium text-accent mb-2">STEP 4</div>
                <h3 className="font-semibold text-foreground mb-2">Generate Snapshot</h3>
                <p className="text-sm text-muted-foreground">
                  Shareable results, .zfix export, dual scores (Reproducibility + Security)
                </p>
              </div>
            </div>
          </div>

          {/* Mobile arrows */}
          <div className="md:hidden flex flex-col items-center gap-2 -my-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-0.5 h-4 bg-primary/30" />
            ))}
          </div>
        </div>

        {/* Tech Stack Pills */}
        <div
          className={`flex flex-wrap justify-center gap-3 mt-10 transition-all duration-700 delay-400 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {["React + TypeScript", "Lovable Cloud", "Google Gemini AI", "OSV.dev API"].map((tech) => (
            <span
              key={tech}
              className="px-3 py-1.5 rounded-full bg-codeBg border border-border text-xs font-medium text-muted-foreground"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ArchitectureDiagram;
