import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Github } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import FloatingParticles from "./FloatingParticles";

const Hero = () => {
  const [repoUrl, setRepoUrl] = useState("");
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const inputSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ticking = false;

    const updateParallax = () => {
      const scrollY = window.scrollY;
      
      if (heroRef.current) {
        heroRef.current.style.transform = `translateY(${scrollY * 0.5}px)`;
      }
      if (subtitleRef.current) {
        subtitleRef.current.style.transform = `translateY(${scrollY * 0.3}px)`;
      }
      if (inputSectionRef.current) {
        inputSectionRef.current.style.transform = `translateY(${scrollY * 0.15}px)`;
      }
      
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(updateParallax);
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleScan = () => {
    if (!repoUrl.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter a GitHub repository URL",
        variant: "destructive",
      });
      return;
    }
    
    navigate("/scanning");
  };

  return (
    <section className="flex items-center justify-center px-4 py-12 pt-24 relative overflow-hidden">
      <FloatingParticles />
      <div className="max-w-5xl w-full text-center space-y-8 animate-fade-in relative z-10">
        <div 
          ref={heroRef}
          className="space-y-6 will-change-transform"
        >
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-tight">
            <span className="text-foreground">Fix Your</span>
            <br />
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient animate-pulse-glow">
              Environment Issues
            </span>
          </h1>
          <p 
            ref={subtitleRef}
            className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto animate-fade-in will-change-transform" 
            style={{ animationDelay: '100ms' }}
          >
            Scan your GitHub repository for dependency conflicts, missing pins, and reproducibility issues.
          </p>
        </div>

        <div 
          ref={inputSectionRef}
          className="max-w-4xl mx-auto space-y-4 animate-fade-in will-change-transform" 
          style={{ animationDelay: '200ms' }}
        >
          <div className="border border-border/50 rounded-xl p-6 backdrop-blur-sm shadow-[0_0_40px_rgba(76,201,240,0.5)]">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Github className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="url"
                  placeholder="https://github.com/username/repo"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  className="h-14 pl-12 bg-codeBg border-border text-foreground placeholder:text-muted-foreground code-font text-base"
                  onKeyDown={(e) => e.key === "Enter" && handleScan()}
                />
              </div>
              <Button 
                onClick={handleScan}
                size="lg"
                className="h-14 px-8 bg-primary hover:bg-primary text-primary-foreground font-semibold gap-2 transition-all hover:shadow-[0_0_30px_rgba(76,201,240,0.6)] text-base"
              >
                <Search className="w-5 h-5" />
                Scan Repository
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            No installation required • Instant analysis • Python-only
          </p>
        </div>
      </div>
    </section>
  );
};

export default Hero;
