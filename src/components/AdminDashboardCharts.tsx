
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts";
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
  { name: 'Edificio', value: 56, color: '#2563eb' },
  { name: 'Escolar', value: 24, color: '#3b82f6' },
  { name: 'Industrial', value: 20, color: '#93c5fd' },
];

const AdminDashboardCharts = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
      <Card>
        <CardHeader className="bg-sistema-blue/10 flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-sistema-blue" />
            Presupuestos por Mes
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="presupuestos" name="Presupuestos Enviados" fill="#2563eb" />
              <Bar dataKey="aceptados" name="Presupuestos Aceptados" fill="#93c5fd" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="bg-sistema-blue/10 flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Droplet className="h-5 w-5 text-sistema-blue" />
            Tipos de Instalaciones
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboardCharts;
