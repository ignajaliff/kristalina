
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { 
  ShoppingCart, 
  LogOut, 
  CheckSquare,
  CheckCircle,
  PlusCircle,
  Users,
  BarChart3
} from "lucide-react";

const SellerSidebar = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen w-64 bg-blue-900 text-white flex flex-col">
      <div className="p-4 border-b border-blue-700">
        <h2 className="text-xl font-bold">Panel Vendedor</h2>
        <p className="text-sm opacity-80">{user?.name}</p>
      </div>
      
      <nav className="flex-1 p-4">
        <div className="mb-4">
          <p className="text-xs uppercase tracking-wider text-blue-300 mb-2 pl-3">Dashboard</p>
          <ul className="space-y-2">
            <li>
              <Link 
                to="/seller/dashboard" 
                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <BarChart3 className="h-5 w-5" />
                Dashboard
              </Link>
            </li>
          </ul>
        </div>
        
        <div className="mb-4">
          <p className="text-xs uppercase tracking-wider text-blue-300 mb-2 pl-3">Gestión de Ventas</p>
          <ul className="space-y-2">
            <li>
              <Link 
                to="/seller/prospects" 
                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlusCircle className="h-5 w-5" />
                Captura Prospectos
              </Link>
            </li>
            <li>
              <Link 
                to="/seller/clientes" 
                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Users className="h-5 w-5" />
                Clientes
              </Link>
            </li>
            <li>
              <Link 
                to="/seller/quotes" 
                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <CheckSquare className="h-5 w-5" />
                Presupuestos
              </Link>
            </li>
            <li>
              <Link 
                to="/seller/accepted-quotes" 
                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <CheckCircle className="h-5 w-5 text-green-400" />
                Presupuestos Aceptados
              </Link>
            </li>
          </ul>
        </div>
      </nav>
      
      <div className="p-4 border-t border-blue-700">
        <Button 
          variant="ghost" 
          className="w-full flex items-center justify-start gap-2 hover:bg-blue-700 text-white"
          onClick={logout}
        >
          <LogOut className="h-5 w-5" />
          Cerrar sesión
        </Button>
      </div>
    </div>
  );
};

export default SellerSidebar;
