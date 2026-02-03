import { useState } from "react";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { PlanorLogo } from "@/components/ui/planor-logo";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { signIn, isSigningIn, signInError } = useSupabaseAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    signIn({ email, password }, {
      onSuccess: () => {
        setLocation("/app");
      },
    });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md shadow-xl border-border/50">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <PlanorLogo size={48} />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Bem-vindo ao Planor</CardTitle>
          <CardDescription>Entre com suas credenciais para continuar</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="eugabrieldpv@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSigningIn}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isSigningIn}
                className="h-11"
              />
            </div>

            {signInError && (
              <Alert variant="destructive">
                <AlertDescription>
                  {signInError instanceof Error ? signInError.message : "Erro ao fazer login"}
                </AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full h-11 font-semibold shadow-md shadow-primary/20"
              disabled={isSigningIn}
            >
              {isSigningIn ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>

          <div className="mt-6 p-4 rounded-lg bg-muted/50 border border-border/50">
            <p className="text-sm font-medium text-muted-foreground mb-2">
              Credenciais de desenvolvimento:
            </p>
            <p className="text-xs text-muted-foreground">
              Email: <span className="font-mono font-semibold text-foreground">eugabrieldpv@gmail.com</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Senha: <span className="font-mono font-semibold text-foreground">@gab123654</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
