
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, CheckSquare, Building, DollarSign } from "lucide-react";

const AdminDashboardStats = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard 
        title="Presupuestos Enviados"
        value="124"
        description="28 este mes"
        icon={<FileText className="h-8 w-8 text-sistema-blue" />}
      />
      
      <StatCard 
        title="Presupuestos Aceptados"
        value="56"
        description="45% de conversión"
        icon={<CheckSquare className="h-8 w-8 text-sistema-blue" />}
      />
      
      <StatCard 
        title="Unidades Instaladas"
        value="842"
        description="34 este mes"
        icon={<Building className="h-8 w-8 text-sistema-blue" />}
      />
      
      <StatCard 
        title="Ingresos Mensuales"
        value="$5,245,000"
        description="+12% vs. mes anterior"
        icon={<DollarSign className="h-8 w-8 text-sistema-blue" />}
      />
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
}

const StatCard = ({ title, value, description, icon }: StatCardProps) => (
  <Card className="border-t-4 border-t-sistema-blue">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-md font-medium text-sistema-blue-dark">{title}</CardTitle>
      <div className="bg-sistema-blue/10 rounded-full p-2">
        {icon}
      </div>
    </CardHeader>
    <CardContent>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sistema-gray text-sm mt-1">{description}</p>
    </CardContent>
  </Card>
);

export default AdminDashboardStats;
