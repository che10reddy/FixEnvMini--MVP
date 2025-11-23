import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
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
      <div className="max-w-4xl w-full text-center space-y-8 animate-fade-in">
        <div className="space-y-4">
          <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight glow-text">
            Fix Environment Issues in Your GitHub Repo
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            Scan your Python project for dependency conflicts, missing pins, and reproducibility issues.
          </p>
        </div>

        <div className="max-w-2xl mx-auto space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 p-2 bg-card border border-border rounded-lg glow-border">
            <Input
              type="url"
              placeholder="https://github.com/username/repo"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              className="flex-1 bg-codeBg border-border text-foreground placeholder:text-muted-foreground code-font"
              onKeyDown={(e) => e.key === "Enter" && handleScan()}
            />
            <Button 
              onClick={handleScan}
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2 transition-all hover:scale-105 hover:glow-border"
            >
              <Search className="w-4 h-4" />
              Scan Repository
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground code-font">
            No installation required • Free analysis • Instant results
          </p>
        </div>
      </div>
    </section>
  );
};

export default Hero;
