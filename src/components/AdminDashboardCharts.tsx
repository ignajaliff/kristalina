
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { Droplet, BarChart3 } from "lucide-react";

const barData = [
  { name: 'Enero', presupuestos: 65, aceptados: 28 },
  { name: 'Febrero', presupuestos: 59, aceptados: 32 },
  { name: 'Marzo', presupuestos: 80, aceptados: 41 },
  { name: 'Abril', presupuestos: 81, aceptados: 37 },
  { name: 'Mayo', presupuestos: 56, aceptados: 24 },
  { name: 'Junio', presupuestos: 55, aceptados: 29 },
];

const pieData = [
  { name: 'Edificio', value: 56, color: '#6b66ff' },
  { name: 'Escolar', value: 24, color: '#33ccff' },
  { name: 'Industrial', value: 20, color: '#ffbb33' },
];

const AdminDashboardCharts = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
      <Card className="border-0 shadow-sm overflow-hidden">
        <CardHeader className="border-b bg-white flex flex-row items-center justify-between p-5">
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <BarChart3 className="h-4 w-4 text-blue-600" />
            Presupuestos por Mes
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 h-72 bg-white">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
              <XAxis dataKey="name" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  borderRadius: '8px', 
                  boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)', 
                  border: 'none' 
                }} 
              />
              <Legend wrapperStyle={{ fontSize: '12px', marginTop: '10px' }} />
              <Bar dataKey="presupuestos" name="Presupuestos Enviados" fill="#6b66ff" radius={[4, 4, 0, 0]} />
              <Bar dataKey="aceptados" name="Presupuestos Aceptados" fill="#33ccff" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm overflow-hidden">
        <CardHeader className="border-b bg-white flex flex-row items-center justify-between p-5">
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <Droplet className="h-4 w-4 text-blue-600" />
            Tipos de Instalaciones
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 h-72 bg-white">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={90}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ 
                  backgroundColor: 'white', 
                  borderRadius: '8px', 
                  boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)', 
                  border: 'none' 
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', marginTop: '20px' }} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboardCharts;
