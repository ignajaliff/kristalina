import { Link, useLocation } from "react-router-dom";
import {
  BarChart3,
  FileText,
  Users,
  CheckSquare,
  CheckCircle,
  Building2,
  LogOut,
  Droplet,
  ChevronRight
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const AdminSidebar = () => {
  const { userProfile, logout } = useAuth();
  const location = useLocation();

  const menuItems = [
    {
      group: "General",
      items: [
        { name: "Dashboard", path: "/admin", icon: BarChart3 }
      ]
    },
    {
      group: "Área de Ventas",
      items: [
        { name: "Captura Cliente", path: "/admin/prospects", icon: FileText },
        { name: "Clientes", path: "/admin/clientes", icon: Users },
        { name: "Presupuestos Enviados", path: "/admin/quotes", icon: CheckSquare },
        { name: "Presupuestos Aceptados", path: "/admin/accepted-quotes", icon: CheckCircle, iconColor: "text-emerald-500" }
      ]
    },
    {
      group: "Área de Gestión",
      items: [
        { name: "Gestión Edificios", path: "/admin/gestion", icon: Building2, iconColor: "text-blue-600" }
      ]
    }
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="h-screen w-[220px] bg-white border-r border-[#E2E8F0] flex flex-col font-sans shrink-0 overflow-hidden">
      {/* Sidebar Header */}
      <div className="p-6 border-b border-[#E2E8F0] flex items-center justify-center">
        <img
          src="/kristalina-logo.png"
          alt="Kristalina Logo"
          className="w-full h-auto object-contain max-h-11"
        />
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto py-6 px-2 space-y-7">
        {menuItems.map((group) => (
          <div key={group.group} className="space-y-1">
            <h4 className="px-3 text-[9px] font-bold text-[#94A3B8] uppercase tracking-[0.1em] mb-3">
              {group.group}
            </h4>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "group relative flex items-center gap-2 px-3 py-2 rounded-[6px] transition-all duration-200",
                      active
                        ? "bg-[#EFF6FF] text-[#1A367F] font-semibold"
                        : "text-[#64748B] hover:bg-slate-50 hover:text-[#1E293B]"
                    )}
                  >
                    {active && <div className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-[#1A367F] rounded-r-full" />}
                    <item.icon className={cn(
                      "h-[17px] w-[17px] transition-colors shrink-0",
                      active ? "text-[#1A367F]" : (item.iconColor || "text-[#94A3B8] group-hover:text-[#1A367F]")
                    )} strokeWidth={active ? 2.5 : 2} />
                    <span className="text-[12.5px] tracking-tight leading-tight truncate">{item.name}</span>
                    {active && <ChevronRight className="ml-auto h-3 w-3 opacity-30 shrink-0" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Botón Cerrar Sesión */}
      <div className="p-3 bg-[#F8FAFC] border-t border-[#E2E8F0]">
        <button
          onClick={logout}
          className="flex items-center gap-2 w-full px-3 py-2 text-[#64748B] hover:text-[#EF4444] hover:bg-red-50/50 rounded-lg transition-all duration-200 group"
        >
          <LogOut className="h-[17px] w-[17px] transition-colors group-hover:text-[#EF4444] shrink-0" strokeWidth={2} />
          <span className="text-[12.5px] font-semibold tracking-tight">Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;
