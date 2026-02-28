
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

import AdminDashboardStats from "@/components/AdminDashboardStats";
import AdminDashboardCharts from "@/components/AdminDashboardCharts";
import MobileDrawer from "@/components/MobileDrawer";
import { Bell, Filter, Download, Droplet, Calendar, Plus, ExternalLink, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const AdminDashboard = () => {
  const isMobile = useIsMobile();

  const { data: recentActivity } = useQuery({
    queryKey: ['recent-activity'],
    queryFn: async () => {
      // Get recent prospectos
      const { data: prospectos, error: prospectosError } = await supabase
        .from('prospectos')
        .select('id, communityname, estado_contacto, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      if (prospectosError) console.error('Error fetching prospectos activity:', prospectosError);

      // Get recent presupuestos
      const { data: presupuestos, error: presupuestosError } = await supabase
        .from('presupuestos')
        .select('id, estado, created_at, prospectos(communityname)')
        .order('created_at', { ascending: false })
        .limit(5);

      if (presupuestosError) console.error('Error fetching presupuestos activity:', presupuestosError);

      // Get recent gestion updates
      const { data: gestion, error: gestionError } = await supabase
        .from('gestion')
        .select('id, cliente, estadopago, created_at, updated_at')
        .order('updated_at', { ascending: false })
        .limit(5);

      if (gestionError) console.error('Error fetching gestion activity:', gestionError);

      const allActivities = [
        ...(prospectos || []).map(p => ({
          id: p.id,
          type: 'prospecto' as const,
          title: 'Nuevo prospecto',
          detail: p.communityname,
          timestamp: p.created_at,
          color: 'blue'
        })),
        ...(presupuestos || []).map((p: any) => ({
          id: p.id,
          type: 'presupuesto' as const,
          title: p.estado === 'Aceptado' ? 'Presupuesto aceptado' : 'Presupuesto enviado',
          detail: p.prospectos?.communityname || 'Sin nombre',
          timestamp: p.created_at,
          color: p.estado === 'Aceptado' ? 'green' : 'blue'
        })),
        ...(gestion || []).map((g: any) => ({
          id: g.id,
          type: 'gestion' as const,
          title: g.estadopago === 'Mes pagado' ? 'Pago confirmado' : 'Registro actualizado',
          detail: (g.cliente as any)?.communityname || 'Sin nombre',
          timestamp: g.updated_at || g.created_at,
          color: g.estadopago === 'Mes pagado' ? 'green' : 'purple'
        }))
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 6);

      return allActivities;
    },
  });

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const date = parseISO(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    if (diffInMinutes < 60) return `Hace ${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `Hace ${Math.floor(diffInMinutes / 60)}h`;
    return `Hace ${Math.floor(diffInMinutes / 1440)}d`;
  };

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden">
      <div className="max-w-[1440px] mx-auto p-4 md:p-8 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
            <div className="flex items-center gap-4">
              {isMobile && <MobileDrawer />}
              <div>
                <h1 className="text-2xl md:text-[26px] font-bold text-[#1E293B] tracking-tight leading-none mb-2">Panel de Control Kristalina</h1>
                <p className="text-sm font-medium text-[#64748B] flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                  Monitoreo de rendimiento y métricas operativas
                </p>
              </div>
            </div>
          </div>

          <AdminDashboardStats />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8"><AdminDashboardCharts /></div>
            <div className="space-y-8">
              <Card className="border border-[#E2E8F0] shadow-sm bg-white rounded-xl overflow-hidden flex flex-col h-full">
                <CardHeader className="border-b border-[#F1F5F9] p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-[#F8FAFC] rounded-md border border-[#E2E8F0]"><History className="h-4 w-4 text-[#1A367F]" strokeWidth={2.5} /></div>
                      <CardTitle className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">Actividad Reciente</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0 flex-1 flex flex-col">
                  {recentActivity?.length ? (
                    <div className="divide-y divide-[#F1F5F9] flex-1">
                      {recentActivity.map((activity) => (
                        <ActivityItem key={`${activity.type}-${activity.id}`} title={activity.title} detail={activity.detail} time={formatTimeAgo(activity.timestamp)} color={activity.color as any} />
                      ))}
                    </div>
                  ) : (
                    <div className="p-12 text-center text-slate-500 flex-1 flex flex-col items-center justify-center gap-2">
                      <p className="text-xs font-bold text-[#64748B] uppercase tracking-widest">Sin actividad registrada</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
      </div>
    </div>
  );
};

const ActivityItem = ({ title, detail, time, color }: { title: string; detail: string; time: string; color: "blue" | "green" | "purple" | "orange" }) => {
  const colorMap = {
    blue: { bg: "bg-[#EFF6FF]", text: "text-[#1A367F]", indicator: "bg-[#3B82F6]" },
    green: { bg: "bg-[#F0FDF4]", text: "text-[#10B981]", indicator: "bg-[#10B981]" },
    purple: { bg: "bg-[#F5F3FF]", text: "text-[#7C3AED]", indicator: "bg-[#7C3AED]" },
    orange: { bg: "bg-[#FFFBEB]", text: "text-[#F59E0B]", indicator: "bg-[#F59E0B]" },
  };
  const styles = colorMap[color] || colorMap.blue;

  return (
    <div className="px-5 py-4 transition-colors hover:bg-slate-50 group border-l-2 border-transparent hover:border-l-[#1A367F]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider whitespace-nowrap", styles.bg, styles.text)}>{title}</span>
            <span className="text-[10px] font-bold text-[#94A3B8] tracking-widest uppercase shrink-0">• {time}</span>
          </div>
          <p className="text-[13px] font-semibold text-[#1E293B] truncate tracking-tight">{detail}</p>
        </div>
        <div className={cn("w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 opacity-40 group-hover:opacity-100 transition-opacity", styles.indicator)}></div>
      </div>
    </div>
  );
};

export default AdminDashboard;
