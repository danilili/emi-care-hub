import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { resolveAuthRedirect } from "@/integrations/supabase/authRedirect";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, ArrowLeft, Loader2 } from "lucide-react";

type Mode = "login" | "signup" | "reset";

const Auth = () => {
  const location = useLocation();
  const [mode, setMode] = useState<Mode>((location.state as any)?.mode === "login" ? "login" : "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const isLogin = mode === "login";
  const isReset = mode === "reset";

  useEffect(() => {
    const handleSession = async (userId: string, userEmail: string | undefined) => {
      if (!userEmail) return;
      try {
        const dest = await resolveAuthRedirect(userId, userEmail);
        navigate(`/${dest}`);
      } catch (err: any) {
        toast({ title: "Error al cargar tu cuenta", description: err.message, variant: "destructive" });
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        handleSession(session.user.id, session.user.email);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) handleSession(session.user.id, session.user.email);
    });

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isReset) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast({
          title: "Revisa tu correo",
          description: "Si existe una cuenta con ese correo, te enviamos un enlace para restablecer tu contraseña.",
        });
        setMode("login");
      } else if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // onAuthStateChange will handle redirect
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/onboarding` },
        });
        if (error) throw error;
        // Con "Confirm email" activado, Supabase no devuelve error para un email ya
        // registrado (anti-enumeración): regresa un user con identities vacío.
        if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
          toast({
            title: "Ese correo ya tiene cuenta",
            description: "Inicia sesión o usa “¿Olvidaste tu contraseña?” para recuperarla.",
            variant: "destructive",
          });
          setMode("login");
          return;
        }
        toast({
          title: "¡Cuenta creada!",
          description: "Revisa tu correo para confirmar tu cuenta, o continúa si la confirmación está desactivada.",
        });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <button
        onClick={() => navigate("/")}
        className="absolute left-4 top-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Volver
      </button>

      <div className="mb-8 flex items-center gap-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-sm">
          <Brain className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="font-display text-xl font-bold text-foreground">Emi</span>
      </div>

      <Card className="w-full max-w-sm">
        <CardContent className="pt-6">
          <h2
            className="mb-1 font-display text-xl font-bold text-card-foreground text-center"
            style={{ lineHeight: "1.15" }}
          >
            {isReset ? "Recupera tu contraseña" : isLogin ? "Bienvenido de vuelta" : "Crea tu cuenta"}
          </h2>
          <p className="mb-6 text-center text-sm text-muted-foreground">
            {isReset
              ? "Te enviaremos un enlace para crear una nueva contraseña"
              : isLogin
                ? "Ingresa tus credenciales para continuar"
                : "Regístrate para configurar tu asistente"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            {!isReset && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Contraseña</Label>
                  {isLogin && (
                    <button
                      type="button"
                      className="text-xs font-medium text-primary hover:underline"
                      onClick={() => setMode("reset")}
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  )}
                </div>
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
            )}
            <Button type="submit" className="w-full active:scale-[0.97] transition-transform" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isReset ? "Enviar enlace" : isLogin ? "Iniciar sesión" : "Registrarme"}
            </Button>
          </form>

          {isReset ? (
            <p className="mt-5 text-center text-sm text-muted-foreground">
              <button
                type="button"
                className="font-medium text-primary hover:underline"
                onClick={() => setMode("login")}
              >
                Volver a iniciar sesión
              </button>
            </p>
          ) : (
            <p className="mt-5 text-center text-sm text-muted-foreground">
              {isLogin ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}{" "}
              <button
                type="button"
                className="font-medium text-primary hover:underline"
                onClick={() => setMode(isLogin ? "signup" : "login")}
              >
                {isLogin ? "Regístrate" : "Inicia sesión"}
              </button>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
