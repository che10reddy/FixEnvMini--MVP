import { Github, Book, Mail } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border/50 bg-background/80 backdrop-blur-sm mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Branding */}
          <div className="text-center md:text-left">
            <h3 className="font-display text-xl font-bold text-foreground mb-1">
              FixEnv Mini
            </h3>
            <p className="text-sm text-muted-foreground">
              Analyze and fix Python dependency issues
            </p>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group"
            >
              <Github className="w-5 h-5" />
              <span className="text-sm font-medium">GitHub</span>
            </a>
            <a
              href="https://docs.lovable.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group"
            >
              <Book className="w-5 h-5" />
              <span className="text-sm font-medium">Docs</span>
            </a>
            <a
              href="mailto:contact@fixenv.dev"
              className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group"
            >
              <Mail className="w-5 h-5" />
              <span className="text-sm font-medium">Contact</span>
            </a>
          </div>

          {/* Copyright */}
          <div className="text-sm text-muted-foreground text-center md:text-right">
            © 2024 FixEnv Mini
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
