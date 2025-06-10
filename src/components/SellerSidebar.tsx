
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ShoppingCart, LogOut } from "lucide-react";

const SellerSidebar = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen w-64 bg-blue-900 text-white flex flex-col">
      <div className="p-4 border-b border-blue-700">
        <h2 className="text-xl font-bold">Panel Vendedor</h2>
        <p className="text-sm opacity-80">{user?.name}</p>
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          <li>
            <Link 
              to="/seller" 
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ShoppingCart className="h-5 w-5" />
              Área de Ventas
            </Link>
          </li>
        </ul>
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
