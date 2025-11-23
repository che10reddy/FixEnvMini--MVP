import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Sparkles, FileText } from "lucide-react";

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
  return (
    <section className="px-4 py-20">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index}
                className="bg-card border-border hover:border-primary/50 transition-all duration-300 group hover:shadow-lg hover:shadow-primary/10 animate-fade-in hover:-translate-y-1"
                style={{ animationDelay: `${300 + index * 100}ms` }}
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
