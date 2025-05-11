
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Users, Settings, BarChart3, Package, LogOut } from "lucide-react";

const AdminSidebar = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen w-64 bg-sistema-blue text-white flex flex-col">
      <div className="p-4 border-b border-sistema-blue-dark">
        <h2 className="text-xl font-bold">Panel Admin</h2>
        <p className="text-sm opacity-80">{user?.name}</p>
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          <li>
            <Link 
              to="/admin" 
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-sistema-blue-dark transition-colors"
            >
              <BarChart3 className="h-5 w-5" />
              Dashboard
            </Link>
          </li>
          <li>
            <Link 
              to="/admin/users" 
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-sistema-blue-dark transition-colors"
            >
              <Users className="h-5 w-5" />
              Usuarios
            </Link>
          </li>
          <li>
            <Link 
              to="/admin/products" 
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-sistema-blue-dark transition-colors"
            >
              <Package className="h-5 w-5" />
              Productos
            </Link>
          </li>
          <li>
            <Link 
              to="/admin/settings" 
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-sistema-blue-dark transition-colors"
            >
              <Settings className="h-5 w-5" />
              Configuración
            </Link>
          </li>
        </ul>
      </nav>
      
      <div className="p-4 border-t border-sistema-blue-dark">
        <Button 
          variant="ghost" 
          className="w-full flex items-center justify-start gap-2 hover:bg-sistema-blue-dark text-white"
          onClick={logout}
        >
          <LogOut className="h-5 w-5" />
          Cerrar sesión
        </Button>
      </div>
    </div>
  );
};

export default AdminSidebar;
