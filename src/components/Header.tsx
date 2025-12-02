import { Wrench, Book } from "lucide-react";
import CLIDocsDialog from "./CLIDocsDialog";

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-background/80 backdrop-blur-sm border-b border-border/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wrench className="w-6 h-6 text-primary" />
          <span className="font-mono text-lg font-semibold text-foreground">
            FixEnv Mini
          </span>
        </div>
        <nav className="flex items-center gap-4">
          <CLIDocsDialog
            trigger={
              <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                <Book className="w-4 h-4" />
                <span>Docs</span>
              </button>
            }
          />
        </nav>
      </div>
    </header>
  );
};

export default Header;
