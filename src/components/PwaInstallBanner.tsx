import { X, Download, Share, SquarePlus, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import { useState } from "react";

// v2: la clave vieja ("emi-pwa-dismissed") se ignora a propósito — el banner
// anterior en iOS no hacía nada al tocarlo y muchos lo cerraron sin instalar.
const DISMISS_KEY = "emi-pwa-dismissed-v2";

/** Navegador embebido (WhatsApp/Instagram/FB): ahí no existe "Añadir a inicio". */
function isInAppBrowser() {
  const ua = navigator.userAgent;
  return /wv|FBAN|FBAV|Instagram|Line\/|WhatsApp/i.test(ua);
}

const IosStep = ({
  n,
  icon,
  children,
}: {
  n: number;
  icon: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-3">
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full gradient-primary text-xs font-bold text-primary-foreground">
      {n}
    </span>
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
      {icon}
    </span>
    <p className="text-sm text-card-foreground">{children}</p>
  </div>
);

const PwaInstallBanner = () => {
  const { canInstall, isIos, install } = usePwaInstall();
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISS_KEY) === "1"
  );
  const [guideOpen, setGuideOpen] = useState(false);

  const showBanner = !dismissed && (canInstall || isIos);

  if (!showBanner) return null;

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(DISMISS_KEY, "1");
  };

  const handleTap = async () => {
    if (canInstall) {
      await install();
    } else {
      // iOS: no existe instalación programática — abrimos la guía paso a paso
      setGuideOpen(true);
    }
  };

  const embebido = isInAppBrowser();

  return (
    <>
      <div className="fixed bottom-0 inset-x-0 z-50 safe-bottom sm:hidden animate-in slide-in-from-bottom duration-300">
        <div className="mx-3 mb-3 flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-lg">
          <button
            onClick={handleTap}
            className="flex min-w-0 flex-1 items-center gap-3 text-left"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <span className="text-lg">📲</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-card-foreground">
                Instalar Emi App
              </p>
              <p className="text-xs text-muted-foreground leading-snug">
                {isIos ? "Toca aquí para ver cómo (30 seg)" : "Acceso rápido desde tu pantalla"}
              </p>
            </div>
          </button>
          <Button
            size="sm"
            onClick={handleTap}
            className="shrink-0 gap-1.5 rounded-xl gradient-primary text-primary-foreground"
          >
            <Download className="h-3.5 w-3.5" />
            {canInstall ? "Instalar" : "Cómo"}
          </Button>
          <button
            onClick={handleDismiss}
            className="shrink-0 rounded-full p-1 text-muted-foreground hover:bg-muted/50"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Guía iOS: no hay API de instalación, se hace a mano desde Safari */}
      <Drawer open={guideOpen} onOpenChange={setGuideOpen}>
        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle>Instalar Emi en tu iPhone</DrawerTitle>
            <DrawerDescription>
              En iPhone la instalación se hace desde Safari — Apple no permite un
              botón directo.
            </DrawerDescription>
          </DrawerHeader>
          <div className="space-y-2.5 px-4 pb-8">
            {embebido && (
              <div className="rounded-xl border border-yellow-500/40 bg-yellow-500/10 p-3 text-sm text-yellow-600 dark:text-yellow-400">
                Estás dentro del navegador de otra app (WhatsApp, Instagram…).
                Primero toca <b>⋯</b> o <Compass className="inline h-4 w-4 -mt-0.5" /> y
                elige <b>"Abrir en Safari"</b>.
              </div>
            )}
            <IosStep n={1} icon={<Compass className="h-5 w-5" />}>
              Abre esta página en <b>Safari</b>
            </IosStep>
            <IosStep n={2} icon={<Share className="h-5 w-5" />}>
              Toca el botón <b>Compartir</b> (abajo al centro)
            </IosStep>
            <IosStep n={3} icon={<SquarePlus className="h-5 w-5" />}>
              Elige <b>"Añadir a pantalla de inicio"</b> y confirma
            </IosStep>
            <p className="pt-1 text-center text-xs text-muted-foreground">
              El ícono de Emi quedará junto a tus demás apps.
            </p>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default PwaInstallBanner;
