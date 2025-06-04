
import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";

const QuotesTableHeader = () => {
  return (
    <div className="bg-white border-b border-gray-200 px-8 py-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <FileText className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Presupuestos Enviados
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Gestiona y supervisa todos los presupuestos enviados a clientes
          </p>
        </div>
      </div>
    </div>
  );
};

export default QuotesTableHeader;
