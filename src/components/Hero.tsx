import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Github } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const Hero = () => {
  const [repoUrl, setRepoUrl] = useState("");

  const handleScan = () => {
    if (!repoUrl.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter a GitHub repository URL",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Scanning Repository",
      description: "Analyzing your Python environment...",
    });
  };

  return (
    <section className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="max-w-4xl w-full text-center space-y-12 animate-fade-in">
        <div className="space-y-6">
          <h1 className="font-display text-6xl md:text-8xl font-bold tracking-tight glow-text bg-gradient-to-br from-primary via-accent to-primary bg-clip-text text-transparent animate-fade-in">
            Fix Environment Issues in Your GitHub Repo
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '100ms' }}>
            Scan your Python project for dependency conflicts, missing pins, and reproducibility issues.
          </p>
        </div>

        <div className="max-w-2xl mx-auto space-y-3 animate-fade-in" style={{ animationDelay: '200ms' }}>
          <div className="flex flex-col sm:flex-row gap-3 p-2 bg-card border border-border rounded-lg glow-border transition-all hover:border-primary/50">
            <div className="relative flex-1">
              <Github className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="url"
                placeholder="https://github.com/username/repo"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                className="pl-10 bg-codeBg border-border text-foreground placeholder:text-muted-foreground code-font"
                onKeyDown={(e) => e.key === "Enter" && handleScan()}
              />
            </div>
            <Button 
              onClick={handleScan}
              size="lg"
              className="bg-primary hover:bg-primary text-primary-foreground font-semibold gap-2 transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(76,201,240,0.5)]"
            >
              <Search className="w-4 h-4" />
              Scan Repository
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground code-font">
            No installation required • Instant analysis • Python-only (MVP)
          </p>
        </div>
      </div>
    </section>
  );
};

export default Hero;
