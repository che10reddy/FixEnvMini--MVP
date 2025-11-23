import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Sparkles, FileText } from "lucide-react";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";

const features = [
  {
    icon: Search,
    title: "Dependency Analysis",
    description: "Detect missing or conflicting versions in your requirements.txt file with precision.",
  },
  {
    icon: Sparkles,
    title: "AI Fix Suggestions",
    description: "Get recommended version pins, upgrades, and resolutions powered by intelligent analysis.",
  },
  {
    icon: FileText,
    title: "Reproducible Snapshot",
    description: "Generate a .zfix environment file to ensure consistent builds across all environments.",
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
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-6">
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
                  <CardTitle className="font-display text-xl">{feature.title}</CardTitle>
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
      </div>
    </section>
  );
};

export default Features;
