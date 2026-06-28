import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { resolveAuthRedirect } from "@/integrations/supabase/authRedirect";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, Loader2 } from "lucide-react";

// Página de aterrizaje del enlace de recuperación. Supabase procesa el token de la URL
// (detectSessionInUrl) y establece una sesión de recovery; aquí el usuario fija su nueva
// contraseña con updateUser, y luego se le enruta según su estado de onboarding.
const ResetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [ready, setReady] = useState(false);   // hay sesión de recovery válida
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        setReady(true);
        setChecking(false);
      }
    });

    // Por si el token ya se procesó antes de montar el listener.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
      setChecking(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast({ title: "Las contraseñas no coinciden", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast({ title: "Contraseña actualizada", description: "Ya puedes continuar." });
      const { data: { user } } = await supabase.auth.getUser();
      const dest = user ? await resolveAuthRedirect(user.id, user.email ?? "") : "dashboard";
      navigate(`/${dest}`);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="mb-8 flex items-center gap-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-sm">
          <Brain className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="font-display text-xl font-bold text-foreground">Emi</span>
      </div>

      <Card className="w-full max-w-sm">
        <CardContent className="pt-6">
          {checking ? (
            <div className="flex items-center justify-center py-6 text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Validando enlace…
            </div>
          ) : !ready ? (
            <div className="space-y-4 text-center">
              <h2 className="font-display text-xl font-bold text-card-foreground">Enlace inválido o expirado</h2>
              <p className="text-sm text-muted-foreground">
                Solicita un nuevo enlace de recuperación desde la pantalla de inicio de sesión.
              </p>
              <Button className="w-full" onClick={() => navigate("/auth", { state: { mode: "login" } })}>
                Volver a iniciar sesión
              </Button>
            </div>
          ) : (
            <>
              <h2
                className="mb-1 font-display text-xl font-bold text-card-foreground text-center"
                style={{ lineHeight: "1.15" }}
              >
                Crea una nueva contraseña
              </h2>
              <p className="mb-6 text-center text-sm text-muted-foreground">
                Elige una contraseña para tu cuenta
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="password">Nueva contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirm">Confirmar contraseña</Label>
                  <Input
                    id="confirm"
                    type="password"
                    placeholder="Repite tu contraseña"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="w-full active:scale-[0.97] transition-transform" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Guardar contraseña
                </Button>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
