import { Button } from "@/components/ui/button";
import { Download, FileCode } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const Snapshot = () => {
  const snapshotData = {
    python_version: "3.10",
    dependencies: {
      numpy: "1.26.2",
      pandas: "2.1.0",
      requests: "2.31.0",
      flask: "3.0.0",
      pytest: "7.4.3"
    },
    checksum: "sha256:98ab23cd1f4e9a2b..."
  };

  const handleDownload = () => {
    const dataStr = JSON.stringify(snapshotData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "capsule.zfix";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Download Started",
      description: "Your .zfix snapshot file is downloading",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-4 animate-fade-in">
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
                Environment Snapshot Generated
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Here is your reproducible .zfix environment file.
            </p>
          </div>

          {/* Snapshot Card */}
          <div 
            className="bg-card/50 border border-border rounded-xl overflow-hidden backdrop-blur-sm shadow-[0_0_30px_rgba(76,201,240,0.2)] animate-fade-in"
            style={{ animationDelay: '100ms' }}
          >
            {/* Header Bar */}
            <div className="bg-muted/30 border-b border-border px-6 py-4 flex items-center gap-3">
              <FileCode className="w-5 h-5 text-primary" />
              <span className="code-font text-foreground font-semibold">capsule.zfix</span>
            </div>

            {/* JSON Preview */}
            <div className="p-6 max-h-96 overflow-y-auto">
              <pre className="code-font text-sm text-foreground">
                <code>
                  {`{`}
                  {'\n  '}<span className="text-accent">"python_version"</span>: <span className="text-primary">"{snapshotData.python_version}"</span>,
                  {'\n  '}<span className="text-accent">"dependencies"</span>: {'{'}
                  {Object.entries(snapshotData.dependencies).map(([key, value], index, array) => (
                    <span key={key}>
                      {'\n    '}<span className="text-accent">"{key}"</span>: <span className="text-primary">"{value}"</span>{index < array.length - 1 ? ',' : ''}
                    </span>
                  ))}
                  {'\n  '}{'}'}, 
                  {'\n  '}<span className="text-accent">"checksum"</span>: <span className="text-primary">"{snapshotData.checksum}"</span>
                  {'\n'}{`}`}
                </code>
              </pre>
            </div>
          </div>

          {/* Download Button */}
          <div className="flex justify-center animate-fade-in" style={{ animationDelay: '200ms' }}>
            <Button 
              onClick={handleDownload}
              size="lg"
              className="h-14 px-8 bg-primary hover:bg-primary text-primary-foreground font-semibold gap-2 transition-all hover:shadow-[0_0_30px_rgba(76,201,240,0.6)] text-base"
            >
              <Download className="w-5 h-5" />
              Download Snapshot (.zfix)
            </Button>
          </div>

          {/* Notes */}
          <p className="text-sm text-muted-foreground text-center animate-fade-in" style={{ animationDelay: '300ms' }}>
            This snapshot can be used to reproduce the same environment consistently across systems.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Snapshot;
