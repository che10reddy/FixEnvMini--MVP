import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface SnapshotProgressDialogProps {
  isOpen: boolean;
}

export const SnapshotProgressDialog = ({ isOpen }: SnapshotProgressDialogProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showExtendedMessage, setShowExtendedMessage] = useState(false);

  const steps = [
    "Analyzing dependency changes...",
    "Generating fixed requirements...",
    "Creating .zfix snapshot...",
    "Finalizing artifact...",
  ];

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setShowExtendedMessage(false);

      // Auto-progress through steps
      const stepInterval = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev < steps.length - 1) return prev + 1;
          return prev;
        });
      }, 8000); // 8 seconds per step

      // Show extended message after 20 seconds
      const extendedTimeout = setTimeout(() => {
        setShowExtendedMessage(true);
      }, 20000);

      return () => {
        clearInterval(stepInterval);
        clearTimeout(extendedTimeout);
      };
    }
  }, [isOpen]);

  const progressPercentage = ((currentStep + 1) / steps.length) * 100;

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md [&>button]:hidden">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl gradient-text">
            Generating Snapshot
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Progress Steps */}
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center gap-3">
                {index < currentStep ? (
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                ) : index === currentStep ? (
                  <Loader2 className="w-5 h-5 text-primary animate-spin shrink-0" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-muted shrink-0" />
                )}
                <span
                  className={`text-sm ${
                    index <= currentStep ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {step}
                </span>
              </div>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={progressPercentage} className="h-2" />
            <p className="text-xs text-center text-muted-foreground">
              {Math.round(progressPercentage)}% complete
            </p>
          </div>

          {/* Time Estimate Message */}
          <div className="text-center">
            {!showExtendedMessage ? (
              <p className="text-sm text-muted-foreground">
                This usually takes 20-40 seconds...
              </p>
            ) : (
              <p className="text-sm text-yellow-500">
                Complex analysis detected. This may take up to a minute...
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
