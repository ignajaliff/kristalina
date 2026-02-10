import { ClipboardCheck } from "lucide-react";

const QuotesTableHeader = () => {
  return (
    <div className="max-w-[1440px] ml-0 p-8 pt-10 pb-4">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[#EFF6FF] rounded-[14px]">
            <ClipboardCheck className="h-7 w-7 text-[#1A367F]" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#1E293B]">
              Presupuestos Enviados
            </h1>
            <p className="text-[#64748B] text-sm font-medium mt-0.5 flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              CRM de Gestión Comercial - Supervisa y gestiona las propuestas activas
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuotesTableHeader;

