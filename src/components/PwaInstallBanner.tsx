import { X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import { useState } from "react";

const PwaInstallBanner = () => {
  const { canInstall, install } = usePwaInstall();
  const [dismissed, setDismissed] = useState(false);

  if (!canInstall || dismissed) return null;

  const handleInstall = async () => {
    await install();
  };

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 safe-bottom sm:hidden animate-in slide-in-from-bottom duration-300">
      <div className="mx-3 mb-3 flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-lg">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <span className="text-lg">📲</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-card-foreground">Instalar Emi App</p>
          <p className="text-xs text-muted-foreground truncate">Acceso rápido desde tu pantalla</p>
        </div>
        <Button
          size="sm"
          onClick={handleInstall}
          className="shrink-0 gap-1.5 rounded-xl gradient-primary text-primary-foreground"
        >
          <Download className="h-3.5 w-3.5" />
          Instalar
        </Button>
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 rounded-full p-1 text-muted-foreground hover:bg-muted/50"
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default PwaInstallBanner;
