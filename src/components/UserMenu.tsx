import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Brain, ChevronDown, LogOut, Settings, UserCircle, XCircle } from "lucide-react";
import type { UserConfig } from "@/hooks/useUserConfig";
import PwaInstallButton from "./PwaInstallButton";

interface UserMenuProps {
  config: UserConfig | null;
}

const UserMenu = ({ config }: UserMenuProps) => {
  const navigate = useNavigate();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);

  const doctorName = config?.nombre_doctor || "Mi cuenta";
  const plan = config?.plan_contratado || "Básico";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <>
      <div className="flex items-center gap-3">
        <PwaInstallButton />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 px-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <UserCircle className="h-5 w-5 text-primary" />
              </div>
              <div className="hidden text-left sm:block">
                <p className="text-sm font-medium leading-none text-card-foreground">{doctorName}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Plan {plan}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <p className="text-sm font-medium">{doctorName}</p>
              <p className="text-xs text-muted-foreground">{config?.nombre_comercial}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setTimeout(() => setAccountDialogOpen(true), 0)}>
              <Settings className="mr-2 h-4 w-4" />
              Configuración de cuenta
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => setTimeout(() => setCancelDialogOpen(true), 0)}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Cancelar suscripción
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Account details dialog */}
      <Dialog open={accountDialogOpen} onOpenChange={setAccountDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Configuración de cuenta</DialogTitle>
            <DialogDescription>Detalles de tu suscripción y clínica.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Doctor</span>
              <span className="text-sm font-medium">{config?.nombre_doctor || "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Clínica</span>
              <span className="text-sm font-medium">{config?.nombre_comercial || "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Plan</span>
              <Badge variant="secondary">{plan}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Formato de cita</span>
              <span className="text-sm font-medium">{config?.formato_cita || "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Teléfono</span>
              <span className="text-sm font-medium">{config?.telefono_consultorio || "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Google Calendar</span>
              <span className="text-sm font-medium">{config?.google_calendar_id || "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Emi activa</span>
              <Badge variant={config?.emi_active ? "default" : "outline"}>
                {config?.emi_active ? "Sí" : "No"}
              </Badge>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAccountDialogOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel subscription dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancelar suscripción</DialogTitle>
            <DialogDescription>
              Esta función estará disponible próximamente. Si necesitas cancelar tu plan, por favor contáctanos por WhatsApp.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>Entendido</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UserMenu;
