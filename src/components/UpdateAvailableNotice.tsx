import { useState } from "react";
import { RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVersionCheck } from "@/hooks/useVersionCheck";

// ═══════════════════════════════════════════════════════════════════════════
// Aviso flotante de versión nueva
// ═══════════════════════════════════════════════════════════════════════════
// Aparece abajo a la izquierda (el toaster de la app ocupa la derecha) cuando
// se detecta un deploy nuevo mientras la pestaña está abierta. El botón
// "Actualizar" recarga trayendo el index.html y los bundles nuevos, sin que el
// usuario tenga que hacer recarga dura ni abrir una ventana de incógnito.
const UpdateAvailableNotice = () => {
  const { updateAvailable, applyUpdate } = useVersionCheck();
  const [dismissed, setDismissed] = useState(false);
  const [updating, setUpdating] = useState(false);

  if (!updateAvailable || dismissed) return null;

  const handleUpdate = () => {
    setUpdating(true);
    void applyUpdate();
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed z-[100] bottom-4 left-4 right-4 sm:right-auto sm:bottom-6 sm:left-6 sm:w-[360px] animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      <div className="relative rounded-xl border border-[#E2E8F0] bg-white shadow-lg p-4">
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Cerrar aviso"
          className="absolute top-2.5 right-2.5 h-6 w-6 flex items-center justify-center rounded-md text-[#94A3B8] hover:text-[#1E293B] hover:bg-[#F1F5F9] transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>

        <div className="flex items-start gap-3 pr-6">
          <div className="p-2 rounded-lg bg-[#F1F3F9] shrink-0">
            <RefreshCw className="h-4 w-4 text-[#1A367F]" strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-[#1E293B] leading-tight">
              Hay una versión nueva
            </p>
            <p className="text-[12px] text-[#64748B] mt-1 leading-snug">
              Se publicó una actualización del sistema. Actualizá para usar la última versión.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3.5 pl-[52px]">
          <Button
            size="sm"
            onClick={handleUpdate}
            disabled={updating}
            className="h-8 px-4 bg-[#1A367F] hover:bg-[#152D6B] text-white text-[11px] font-bold rounded-lg gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${updating ? "animate-spin" : ""}`} />
            {updating ? "Actualizando..." : "Actualizar"}
          </Button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            disabled={updating}
            className="h-8 px-3 text-[11px] font-semibold text-[#64748B] hover:text-[#1E293B] rounded-lg hover:bg-[#F1F5F9] transition-colors disabled:opacity-50"
          >
            Después
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateAvailableNotice;
