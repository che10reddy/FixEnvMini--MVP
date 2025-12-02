import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Search, Sparkles, FileText, ShieldAlert, Terminal, GitBranch, Globe } from "lucide-react";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";

const features = [
  {
    icon: Search,
    title: "Dependency Analysis",
    description: "Scan 6 formats: requirements.txt, pyproject.toml, Pipfile, Poetry, setup.py & more.",
  },
  {
    icon: Sparkles,
    title: "AI Fix Suggestions",
    description: "25+ conflict patterns analyzed by Google Gemini for version pins, upgrades & fixes.",
  },
  {
    icon: FileText,
    title: "Reproducible Snapshot",
    description: "Export portable .zfix artifacts with fixed dependencies and dual scores.",
  },
  {
    icon: ShieldAlert,
    title: "Security Scanning",
    description: "Real-time CVE detection via Google OSV with CRITICAL/HIGH/MEDIUM/LOW ratings.",
  },
];

const usageOptions = [
  {
    icon: Terminal,
    title: "Terminal",
    description: "Local CLI scanning",
    command: "npx fixenv-cli scan $REPO",
  },
  {
    icon: GitBranch,
    title: "CI/CD",
    description: "GitHub Actions ready",
    command: "Check footer ↓",
  },
  {
    icon: Globe,
    title: "Web UI",
    description: "Instant browser analysis",
    command: "No install required",
  },
];

const Features = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section 
      ref={ref}
      className={`px-4 py-20 transition-all duration-1000 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      }`}
    >
      <div className="max-w-6xl mx-auto space-y-16">
        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index}
                className={`bg-card border-border hover:border-primary/50 transition-all duration-500 group hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1 animate-float ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                }`}
                style={{ 
                  transitionDelay: isVisible ? `${index * 150}ms` : "0ms",
                  animationDelay: `${index * 0.5}s`
                }}
              >
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-all group-hover:scale-110">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold tracking-tight font-display text-xl">{feature.title}</h3>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-muted-foreground">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* CLI Showcase Section */}
        <div 
          className={`transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
          style={{ transitionDelay: isVisible ? "600ms" : "0ms" }}
        >
          <div className="text-center mb-8">
            <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-3">
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                One Tool, Three Ways
              </span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              FixEnv works locally, in CI, and via web UI – choose what fits your workflow.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {usageOptions.map((option, index) => {
              const Icon = option.icon;
              return (
                <Card 
                  key={index}
                  className={`bg-card/50 border-border hover:border-accent/50 transition-all duration-500 group hover:shadow-lg hover:shadow-accent/10 ${
                    isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                  }`}
                  style={{ 
                    transitionDelay: isVisible ? `${700 + index * 100}ms` : "0ms"
                  }}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-all">
                        <Icon className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <h3 className="font-semibold tracking-tight font-display text-lg">{option.title}</h3>
                        <p className="text-sm text-muted-foreground">{option.description}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <code className="block bg-codeBg border border-border rounded-lg px-4 py-3 text-sm code-font text-primary">
                      {option.command}
                    </code>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
