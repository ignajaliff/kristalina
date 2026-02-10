import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Key, Loader2, Lock, ShieldCheck, Mail } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex flex-col bg-[#F8FAFC] font-sans overflow-hidden">
      {/* Header Corporativo Discreto */}
      <header className="w-full h-20 border-b border-[#E2E8F0] bg-white flex items-center justify-between px-6 shrink-0 z-10">
        <img
          src="/kristalina-logo.png"
          alt="Kristalina Logo"
          className="w-full h-auto object-contain max-h-12"
        />
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-[380px]">
          <Card className="border border-[#E2E8F0] shadow-sm bg-white overflow-hidden rounded-md">
            <CardHeader className="pt-8 pb-4">
              <div className="flex justify-center mb-4">
                <div className="p-2.5 bg-[#F8FAFC] rounded-full border border-[#E2E8F0]">
                  <Lock className="w-5 h-5 text-[#1A367F]" />
                </div>
              </div>
              <CardTitle className="text-lg font-bold text-center text-[#1E293B]">ACCESO AL PORTAL</CardTitle>
              <CardDescription className="text-center text-xs mt-1 text-[#64748B]">
                Ingresa tus credenciales autorizadas
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4 px-8">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center px-0.5">
                    <Label
                      htmlFor="email"
                      className="text-[10px] font-semibold text-[#1E293B] uppercase tracking-[0.1em]"
                    >
                      Usuario / Email
                    </Label>
                  </div>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B] group-focus-within:text-[#1A367F] transition-colors" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="nombre.apellido@empresa.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                      className="pl-10 h-11 border-[#E2E8F0] focus-visible:ring-[#1A367F] focus-visible:border-[#1A367F] rounded-[4px] bg-white transition-all placeholder:text-[#94A3B8] text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center px-0.5">
                    <Label
                      htmlFor="password"
                      className="text-[10px] font-semibold text-[#1E293B] uppercase tracking-[0.1em]"
                    >
                      Contraseña
                    </Label>

                  </div>
                  <div className="relative group">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B] group-focus-within:text-[#1A367F] transition-colors" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      className="pl-10 h-11 border-[#E2E8F0] focus-visible:ring-[#1A367F] focus-visible:border-[#1A367F] rounded-[4px] bg-white transition-all text-sm"
                    />
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-4 pt-4 pb-8 px-8">
                <Button
                  type="submit"
                  className="w-full bg-[#1A367F] hover:bg-[#12285e] text-white font-semibold h-11 rounded-[5px] transition-all shadow-none shadow-sm active:scale-[0.98] text-sm"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      AUTENTICANDO...
                    </>
                  ) : (
                    "INGRESAR AL SISTEMA"
                  )}
                </Button>

                {/* Indicador de Seguridad */}
                <div className="flex items-center justify-center gap-2 pt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-[9px] font-bold text-[#64748B] uppercase tracking-[0.15em]">
                    Acceso Seguro SSL
                  </span>
                </div>
              </CardFooter>
            </form>
          </Card>
        </div>
      </main>

      {/* Pie de Página */}
      <footer className="w-full py-4 border-t border-[#E2E8F0] bg-white shrink-0">
        <div className="container mx-auto px-6 flex flex-col items-center gap-1">
          <p className="text-[10px] text-[#64748B] font-medium">
            © 2026 Kristalina S.A. | Todos los derechos reservados
          </p>
          <div className="flex items-center gap-2">
            <span className="inline-block w-1 h-1 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              v4.2.0-Enterprise
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Login;
