import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePwaInstall } from "@/hooks/usePwaInstall";

const PwaInstallButton = () => {
  const { canInstall, install } = usePwaInstall();

  if (!canInstall) return null;

  return (
    <Button
      onClick={install}
      size="sm"
      className="fixed bottom-6 right-6 z-50 gap-2 rounded-full shadow-lg gradient-primary text-primary-foreground px-5 py-3 h-auto animate-in fade-in slide-in-from-bottom-4"
    >
      <Download className="h-4 w-4" />
      Instalar App
    </Button>
  );
};

export default PwaInstallButton;
