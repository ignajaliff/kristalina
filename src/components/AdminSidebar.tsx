
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  Users, 
  Settings, 
  Package, 
  LogOut, 
  FileText, 
  CheckSquare,
  Building,
  DollarSign,
  Droplet
} from "lucide-react";

const AdminSidebar = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen w-64 bg-sistema-blue text-white flex flex-col">
      <div className="p-4 border-b border-sistema-blue-dark flex items-center space-x-3">
        <Droplet className="h-6 w-6" />
        <div>
          <h2 className="text-xl font-bold">Kristalina</h2>
          <p className="text-sm opacity-80">{user?.name}</p>
        </div>
      </div>
      
      <nav className="flex-1 p-4">
        <div className="mb-4">
          <p className="text-xs uppercase tracking-wider text-blue-100 mb-2 pl-4">General</p>
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
          </ul>
        </div>

        <div className="mb-4">
          <p className="text-xs uppercase tracking-wider text-blue-100 mb-2 pl-4">Área de Ventas</p>
          <ul className="space-y-2">
            <li>
              <Link 
                to="/admin/prospects" 
                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-sistema-blue-dark transition-colors"
              >
                <FileText className="h-5 w-5" />
                Captura Prospectos
              </Link>
            </li>
            <li>
              <Link 
                to="/admin/quotes" 
                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-sistema-blue-dark transition-colors"
              >
                <CheckSquare className="h-5 w-5" />
                Presupuestos
              </Link>
            </li>
          </ul>
        </div>

        <div className="mb-4">
          <p className="text-xs uppercase tracking-wider text-blue-100 mb-2 pl-4">Administración</p>
          <ul className="space-y-2">
            <li>
              <Link 
                to="/admin/buildings" 
                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-sistema-blue-dark transition-colors"
              >
                <Building className="h-5 w-5" />
                Edificios
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
                to="/admin/billing" 
                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-sistema-blue-dark transition-colors"
              >
                <DollarSign className="h-5 w-5" />
                Facturación
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
        </div>
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
