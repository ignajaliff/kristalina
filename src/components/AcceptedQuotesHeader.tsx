
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

const AcceptedQuotesHeader = () => {
  return (
    <div className="bg-white border-b border-gray-200 px-8 py-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-green-100 rounded-lg">
          <CheckCircle className="h-6 w-6 text-green-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Presupuestos Aceptados
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Revisa los presupuestos que han sido aprobados por los clientes
          </p>
        </div>
      </div>
    </div>
  );
};

export default AcceptedQuotesHeader;
