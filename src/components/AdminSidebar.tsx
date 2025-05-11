
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  LogOut, 
  FileText, 
  CheckSquare,
  Droplet
} from "lucide-react";

const AdminSidebar = () => {
  const { user, logout } = useAuth();

  return (
    <div className="h-screen bg-white border-r border-gray-100 shadow-sm w-64 flex flex-col">
      <div className="p-6 border-b border-gray-100 flex items-center space-x-3">
        <Droplet className="h-6 w-6 text-blue-600" />
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Kristalina</h2>
          <p className="text-sm text-slate-500">{user?.name}</p>
        </div>
      </div>
      
      <nav className="flex-1 p-4">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-wider text-slate-400 mb-3 pl-4">General</p>
          <ul className="space-y-1">
            <li>
              <Link 
                to="/admin" 
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-blue-50 transition-colors text-slate-700 font-medium"
              >
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Dashboard
              </Link>
            </li>
          </ul>
        </div>

        <div className="mb-6">
          <p className="text-xs uppercase tracking-wider text-slate-400 mb-3 pl-4">Área de Ventas</p>
          <ul className="space-y-1">
            <li>
              <Link 
                to="/admin/prospects" 
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-blue-50 transition-colors text-slate-700 font-medium"
              >
                <FileText className="h-5 w-5 text-blue-600" />
                Captura Prospectos
              </Link>
            </li>
            <li>
              <Link 
                to="/admin/quotes" 
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-blue-50 transition-colors text-slate-700 font-medium"
              >
                <CheckSquare className="h-5 w-5 text-blue-600" />
                Presupuestos
              </Link>
            </li>
          </ul>
        </div>
      </nav>
      
      <div className="p-4 border-t border-gray-100">
        <Button 
          variant="outline" 
          className="w-full flex items-center justify-center gap-2 text-slate-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all"
          onClick={logout}
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </Button>
      </div>
    </div>
  );
};

export default AdminSidebar;
