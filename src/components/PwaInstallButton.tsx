import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePwaInstall } from "@/hooks/usePwaInstall";

const PwaInstallButton = () => {
  const { canInstall, install } = usePwaInstall();

  if (!canInstall) return null;

  return (
    <Button
      onClick={() => install()}
      size="sm"
      className="hidden gap-2 gradient-primary text-primary-foreground shadow-sm sm:inline-flex"
    >
      <Download className="h-4 w-4" />
      Instalar App
    </Button>
  );
};

export default PwaInstallButton;
