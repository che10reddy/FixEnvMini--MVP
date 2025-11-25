import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

interface SnapshotProgressDialogProps {
  isOpen: boolean;
}

export const SnapshotProgressDialog = ({ isOpen }: SnapshotProgressDialogProps) => {
  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md [&>button]:hidden">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl gradient-text">
            Generating Snapshot
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-6 text-center">
          {/* Simple Spinner */}
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
          
          {/* Simple Message */}
          <p className="text-sm text-muted-foreground">
            This may take up to 30 seconds...
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
