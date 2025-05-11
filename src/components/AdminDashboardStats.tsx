
import { Card, CardContent } from "@/components/ui/card";
import { FileText, CheckSquare, Building, DollarSign } from "lucide-react";

const AdminDashboardStats = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      <StatCard 
        title="Presupuestos Enviados"
        value="124"
        description="28 este mes"
        icon={<FileText className="h-6 w-6 text-white" />}
        className="stat-card-gradient-1"
      />
      
      <StatCard 
        title="Presupuestos Aceptados"
        value="56"
        description="45% de conversión"
        icon={<CheckSquare className="h-6 w-6 text-white" />}
        className="stat-card-gradient-2"
      />
      
      <StatCard 
        title="Unidades Instaladas"
        value="842"
        description="34 este mes"
        icon={<Building className="h-6 w-6 text-white" />}
        className="stat-card-gradient-3"
      />
      
      <StatCard 
        title="Ingresos Mensuales"
        value="$5,245,000"
        description="+12% vs. mes anterior"
        icon={<DollarSign className="h-6 w-6 text-white" />}
        className="stat-card-gradient-4"
      />
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  className?: string;
}

const StatCard = ({ title, value, description, icon, className }: StatCardProps) => (
  <Card className={`border-0 shadow overflow-hidden ${className}`}>
    <CardContent className="p-6">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium opacity-90">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          <p className="text-sm mt-2 opacity-80">{description}</p>
        </div>
        <div className="rounded-full p-2 bg-white/20">
          {icon}
        </div>
      </div>
    </CardContent>
  </Card>
);

export default AdminDashboardStats;
