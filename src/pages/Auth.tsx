import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, ArrowLeft, Loader2 } from "lucide-react";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // If already logged in, redirect
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        navigate("/onboarding");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/onboarding");
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // onAuthStateChange will handle redirect
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/onboarding` },
        });
        if (error) throw error;
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
            {isLogin ? "Bienvenido de vuelta" : "Crea tu cuenta"}
          </h2>
          <p className="mb-6 text-center text-sm text-muted-foreground">
            {isLogin ? "Ingresa tus credenciales para continuar" : "Regístrate para configurar tu asistente"}
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
            <div className="space-y-1.5">
              <Label htmlFor="password">Contraseña</Label>
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
            <Button type="submit" className="w-full active:scale-[0.97] transition-transform" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLogin ? "Iniciar sesión" : "Registrarme"}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            {isLogin ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}{" "}
            <button
              type="button"
              className="font-medium text-primary hover:underline"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? "Regístrate" : "Inicia sesión"}
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
