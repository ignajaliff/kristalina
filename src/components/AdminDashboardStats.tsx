
import { Card, CardContent } from "@/components/ui/card";
import { FileText, CheckSquare, Users, DollarSign, TrendingUp, UserPlus, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const AdminDashboardStats = () => {
  // Fetch presupuestos stats
  const { data: presupuestosData } = useQuery({
    queryKey: ['presupuestos-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('presupuestos')
        .select('estado');
      if (error) throw error;
      return data;
    },
  });

  // Fetch nuevos clientes data for current month
  const { data: nuevosClientesData } = useQuery({
    queryKey: ['nuevos-clientes-stats'],
    queryFn: async () => {
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const { data, error } = await supabase
        .from('prospectos')
        .select('estado_contacto, created_at')
        .in('estado_contacto', ['Primer Contacto', 'Segundo Contacto'])
        .gte('created_at', firstDayOfMonth.toISOString())
        .lte('created_at', lastDayOfMonth.toISOString());

      if (error) throw error;
      return data;
    },
  });

  // Fetch contratos stats
  const { data: contratosData } = useQuery({
    queryKey: ['contratos-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contratos')
        .select('estado_equipos');
      if (error) throw error;
      return data;
    },
  });

  // Fetch gestion data for monthly income
  const { data: gestionData } = useQuery({
    queryKey: ['gestion-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gestion')
        .select('mesrenting, estadopago');
      if (error) throw error;
      return data;
    },
  });

  const presupuestosEnviados = presupuestosData?.filter(p => p.estado === 'Enviado').length || 0;
  const presupuestosAceptados = presupuestosData?.filter(p => p.estado === 'Aceptado').length || 0;
  const clientesGestionandose = contratosData?.filter(c => c.estado_equipos === 'Instalacion completada y verificada').length || 0;
  const nuevosClientesAgregados = nuevosClientesData?.length || 0;

  const ingresosMensuales = gestionData?.reduce((total, item) => {
    if (item.estadopago === 'Mes pagado') return total + (item.mesrenting || 0);
    return total;
  }, 0) || 0;

  const formatCurrency = (amount: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(amount);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 font-sans">
      <StatCard title="Nuevos Clientes" value={nuevosClientesAgregados.toString()} description="vs. mes anterior" icon={UserPlus} iconColor="text-[#F59E0B]" iconBg="bg-[#FFFBEB]" trend="+18%" trendUp={true} />
      <StatCard title="Enviados" value={presupuestosEnviados.toString()} description="Presupuestos mes" icon={FileText} iconColor="text-[#3B82F6]" iconBg="bg-[#EFF6FF]" trend="+15%" trendUp={true} />
      <StatCard title="Aceptados" value={presupuestosAceptados.toString()} description="Tasa conversión" icon={CheckSquare} iconColor="text-[#10B981]" iconBg="bg-[#F0FDF4]" trend="+8%" trendUp={true} />
      <StatCard title="Gestión" value={clientesGestionandose.toString()} description="Edificios activos" icon={Users} iconColor="text-[#1A367F]" iconBg="bg-[#F1F3F9]" trend="+22%" trendUp={true} />
      <StatCard title="Ingresos Mensuales" value={formatCurrency(ingresosMensuales)} description="Rentabilidad neta" icon={DollarSign} iconColor="text-[#1A367F]" iconBg="bg-[#F1F3F9]" trend="+12%" trendUp={true} />
    </div>
  );
};

interface StatCardProps {
  title: string; value: string; description: string; icon: React.ElementType; iconColor: string; iconBg: string; trend?: string; trendUp?: boolean;
}

const StatCard = ({ title, value, description, icon: Icon, iconColor, iconBg, trend, trendUp }: StatCardProps) => (
  <Card className="border border-[#E2E8F0] shadow-sm rounded-xl bg-white overflow-hidden transition-all hover:shadow-md">
    <CardContent className="p-6">
      <div className="flex justify-between items-start mb-4">
        <div className={cn("p-2.5 rounded-lg shrink-0", iconBg)}><Icon className={cn("h-5 w-5", iconColor)} strokeWidth={2.5} /></div>
        {trend && (
          <div className={cn("flex items-center gap-0.5 px-2 py-1 rounded-full text-[10px] font-bold tracking-tight shrink-0", trendUp ? "text-[#10B981] bg-[#F0FDF4]" : "text-[#EF4444] bg-[#FEF2F2]")}>
            {trendUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}{trend}
          </div>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">{title}</p>
        <h3 className="text-[28px] font-bold text-[#1E293B] leading-tight truncate tracking-tight">{value}</h3>
        <p className="text-[11px] font-medium text-[#64748B] tracking-tight">{description}</p>
      </div>
    </CardContent>
  </Card>
);

export default AdminDashboardStats;
