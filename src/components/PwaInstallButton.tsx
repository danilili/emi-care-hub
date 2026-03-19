import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const PwaInstallButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Hide completely if already in standalone
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches;

  useEffect(() => {
    if (isStandalone) return;

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const onInstalled = () => {
      setDismissed(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [isStandalone]);

  const handleClick = useCallback(async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      if (outcome === "accepted") setDismissed(true);
    } else {
      setShowInstructions(true);
    }
  }, [deferredPrompt]);

  if (isStandalone || dismissed) return null;

  return (
    <>
      <Button
        onClick={handleClick}
        size="sm"
        className="gap-2 gradient-primary text-primary-foreground shadow-sm"
      >
        <Download className="h-4 w-4" />
        Instalar App
      </Button>

      {showInstructions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-sm rounded-xl bg-card p-6 shadow-xl border border-border">
            <button
              onClick={() => setShowInstructions(false)}
              className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
            <h3 className="font-display text-lg font-bold text-card-foreground mb-3">
              Cómo instalar la app
            </h3>
            <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
              <li>Abre esta página en <strong className="text-card-foreground">Chrome</strong></li>
              <li>Toca el menú <strong className="text-card-foreground">⋮</strong> (tres puntos arriba a la derecha)</li>
              <li>Selecciona <strong className="text-card-foreground">"Instalar app"</strong> o <strong className="text-card-foreground">"Añadir a pantalla de inicio"</strong></li>
            </ol>
            <p className="mt-3 text-xs text-muted-foreground">
              En iPhone: usa Safari → <strong className="text-card-foreground">Compartir</strong> → <strong className="text-card-foreground">"Añadir a inicio"</strong>
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default PwaInstallButton;
