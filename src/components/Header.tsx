import { Wrench } from "lucide-react";

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-background/80 backdrop-blur-sm border-b border-border/50">
      <div className="flex items-center gap-2">
        <Wrench className="w-6 h-6 text-primary" />
        <span className="font-mono text-lg font-semibold text-foreground">
          FixEnv Mini
        </span>
      </div>
    </header>
  );
};

export default Header;
