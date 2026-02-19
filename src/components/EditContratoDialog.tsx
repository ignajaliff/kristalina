
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addMonths, format } from "date-fns";

interface ContratoRow {
  id: string;
  prospecto_id?: string;
  estado_contrato: string;
  estado_equipos: string;
  fecha_contrato_firmado: string | null;
  fecha_instalacion_equipos: string | null;
  datos_contrato?: any;
  doc_contrato?: string | null;
}

interface EditContratoDialogProps {
  contrato: ContratoRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveComplete: () => void;
}

// Step 2: Payment config dialog shown when installation is completed
interface PaymentConfigDialogProps {
  open: boolean;
  onConfirm: (config: { fechaPrimeraFactura: string; diaPago: 1 | 30 }) => void;
}

const PaymentConfigDialog = ({ open, onConfirm }: PaymentConfigDialogProps) => {
  const [fechaPrimeraFactura, setFechaPrimeraFactura] = useState("");
  const [diaPago, setDiaPago] = useState<"1" | "30">("1");

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[420px]" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Configuración de Pagos</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-[#64748B]">
          Los equipos han sido instalados. Configura el calendario de facturación para este edificio.
        </p>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-[#64748B]">¿Cuándo será la primera facturación?</Label>
            <Input
              type="date"
              value={fechaPrimeraFactura}
              onChange={e => setFechaPrimeraFactura(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-[#64748B]">¿Qué día del mes paga este edificio?</Label>
            <Select value={diaPago} onValueChange={(v) => setDiaPago(v as "1" | "30")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Día 1 de cada mes</SelectItem>
                <SelectItem value="30">Día 30 de cada mes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() => {
              if (!fechaPrimeraFactura) return;
              onConfirm({ fechaPrimeraFactura, diaPago: parseInt(diaPago) as 1 | 30 });
            }}
            disabled={!fechaPrimeraFactura}
            className="bg-[#1A367F] hover:bg-[#142a5f] w-full"
          >
            Confirmar y Generar Pagos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/** Generate all monthly payment records for the contract duration.
 * Mes 1 uses fechaPrimeraFactura as-is.
 * Months 2+ are generated using diaPago day of each subsequent month.
 */
const generatePagosJson = (
  fechaPrimeraFactura: string,
  diaPago: 1 | 30,
  montoRenting: number,
  duracionMeses: number
) => {
  const pagos = [];

  // Mes 1: use the exact first invoice date
  pagos.push({
    mes: 1,
    fecha_pago: fechaPrimeraFactura,
    monto: montoRenting,
    pagado: false,
    factura_url: null,
    fecha_pago_real: null,
  });

  // Months 2+: use diaPago of each subsequent month
  const firstDate = new Date(fechaPrimeraFactura + "T00:00:00");
  for (let i = 1; i < duracionMeses; i++) {
    const mesDate = addMonths(firstDate, i);
    const lastDayOfMonth = new Date(mesDate.getFullYear(), mesDate.getMonth() + 1, 0).getDate();
    const targetDay = Math.min(diaPago, lastDayOfMonth);
    const fechaPago = new Date(mesDate.getFullYear(), mesDate.getMonth(), targetDay);

    pagos.push({
      mes: i + 1,
      fecha_pago: format(fechaPago, "yyyy-MM-dd"),
      monto: montoRenting,
      pagado: false,
      factura_url: null,
      fecha_pago_real: null,
    });
  }
  return pagos;
};

export default function EditContratoDialog({ contrato, open, onOpenChange, onSaveComplete }: EditContratoDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPaymentConfig, setShowPaymentConfig] = useState(false);
  const [pendingForm, setPendingForm] = useState<typeof form | null>(null);
  const [form, setForm] = useState({
    estado_contrato: "",
    estado_equipos: "",
    fecha_contrato_firmado: "",
    fecha_instalacion_equipos: "",
  });

  useEffect(() => {
    if (contrato) {
      setForm({
        estado_contrato: contrato.estado_contrato,
        estado_equipos: contrato.estado_equipos,
        fecha_contrato_firmado: contrato.fecha_contrato_firmado || "",
        fecha_instalacion_equipos: contrato.fecha_instalacion_equipos || "",
      });
    }
  }, [contrato]);

  const migrateToGestion = async (
    contratoData: ContratoRow,
    paymentConfig: { fechaPrimeraFactura: string; diaPago: 1 | 30 }
  ) => {
    const prospectoId = contratoData.prospecto_id;
    if (!prospectoId) throw new Error("No se encontró prospecto_id");

    // 1. Fetch full prospecto data
    const { data: prospecto, error: pErr } = await supabase
      .from("prospectos")
      .select("*")
      .eq("id", prospectoId)
      .single();
    if (pErr) throw pErr;

    // 2. Fetch presupuesto data
    const { data: presupuestos, error: prErr } = await supabase
      .from("presupuestos")
      .select("*")
      .eq("prospecto_id", prospectoId);
    if (prErr) throw prErr;
    const presupuesto = presupuestos?.[0];

    // 3. Fetch full contrato data from DB
    const { data: contratoFull, error: cErr } = await supabase
      .from("contratos")
      .select("*")
      .eq("id", contratoData.id)
      .single();
    if (cErr) throw cErr;

    // 4. Extract monto renting from presupuesto (total minus discount)
    const datosPresupuesto = presupuesto?.datos_presupuesto as any || {};
    const totalDeptos = datosPresupuesto.presupuesto_total_deptos || 0;
    const descuentoPct = datosPresupuesto.descuento_porcentaje || 0;
    const montoRenting = totalDeptos - (totalDeptos * descuentoPct) / 100;

    // 5. Contract duration in months
    const duracionMeses = datosPresupuesto.anos_contrato
      ? parseInt(datosPresupuesto.anos_contrato) * 12
      : 60; // default 60 months

    // 6. Generate all monthly payment records
    const pagosJson = generatePagosJson(
      paymentConfig.fechaPrimeraFactura,
      paymentConfig.diaPago,
      montoRenting,
      duracionMeses
    );

    // 7. First fechapago = the first payment date
    const primeraFechaPago = pagosJson[0]?.fecha_pago || paymentConfig.fechaPrimeraFactura;

    // 8. Build gestion record
    const clienteJson = { ...prospecto };
    const dataPresupuestoJson = presupuesto
      ? { datos_presupuesto: presupuesto.datos_presupuesto }
      : null;
    const dataContratoJson = {
      datos_contrato: contratoFull.datos_contrato,
      doc_contrato: contratoFull.doc_contrato,
      fecha_contrato_firmado: form.fecha_contrato_firmado || contratoFull.fecha_contrato_firmado,
      fecha_instalacion_equipos: form.fecha_instalacion_equipos || contratoFull.fecha_instalacion_equipos,
    };

    // 9. Insert into gestion (fecha_primera_factura removed — stored as mes 1 in pagos_json)
    const { error: gErr } = await supabase
      .from("gestion")
      .insert({
        cliente: clienteJson,
        data_presupuesto: dataPresupuestoJson,
        data_contrato: dataContratoJson,
        mesrenting: 1,
        fechapago: primeraFechaPago,
        estadopago: "En fecha/No pagado",
        vendedor_id: prospecto.vendedor_id,
        dia_pago: paymentConfig.diaPago,
        monto_renting: montoRenting,
        pagos_json: pagosJson,
      });
    if (gErr) throw gErr;

    // 10. Delete contrato, presupuestos, and prospecto (in order due to FK)
    await supabase.from("contratos").delete().eq("id", contratoData.id);
    if (presupuesto) {
      await supabase.from("presupuestos").delete().eq("prospecto_id", prospectoId);
    }
    await supabase.from("prospectos").delete().eq("id", prospectoId);
  };

  const handleSave = async () => {
    if (!contrato) return;

    const isCompletingInstallation =
      form.estado_equipos === "Instalacion completada y verificada" &&
      contrato.estado_equipos !== "Instalacion completada y verificada";

    if (isCompletingInstallation) {
      // Save form state and show payment config dialog
      setPendingForm(form);
      setShowPaymentConfig(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("contratos")
        .update({
          estado_contrato: form.estado_contrato,
          estado_equipos: form.estado_equipos,
          fecha_contrato_firmado: form.fecha_contrato_firmado || null,
          fecha_instalacion_equipos: form.fecha_instalacion_equipos || null,
        })
        .eq("id", contrato.id);
      if (error) throw error;
      toast({ title: "Actualizado", description: "El contrato ha sido actualizado correctamente." });
      onOpenChange(false);
      onSaveComplete();
    } catch (error) {
      console.error("Error updating contrato:", error);
      toast({ title: "Error", description: "Error al actualizar el contrato.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentConfigConfirm = async (config: { fechaPrimeraFactura: string; diaPago: 1 | 30 }) => {
    if (!contrato) return;
    setShowPaymentConfig(false);
    setIsSubmitting(true);
    try {
      // First update the contrato
      const { error } = await supabase
        .from("contratos")
        .update({
          estado_contrato: form.estado_contrato,
          estado_equipos: form.estado_equipos,
          fecha_contrato_firmado: form.fecha_contrato_firmado || null,
          fecha_instalacion_equipos: form.fecha_instalacion_equipos || null,
        })
        .eq("id", contrato.id);
      if (error) throw error;

      // Then migrate to gestion with payment config
      await migrateToGestion(contrato, config);

      toast({
        title: "Migrado a Gestión",
        description: "El cliente ha sido trasladado a Gestión de Edificios con todos los pagos generados.",
      });
      onOpenChange(false);
      onSaveComplete();
    } catch (error) {
      console.error("Error migrating to gestion:", error);
      toast({ title: "Error", description: "Error al migrar a gestión.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Modificar Estados</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#64748B]">Estado Contrato</Label>
              <Select value={form.estado_contrato} onValueChange={v => setForm(p => ({ ...p, estado_contrato: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Contrato no firmado">Contrato no firmado</SelectItem>
                  <SelectItem value="Contrato firmado">Contrato firmado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#64748B]">Estado Equipos</Label>
              <Select value={form.estado_equipos} onValueChange={v => setForm(p => ({ ...p, estado_equipos: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Equipos sin instalar">Equipos sin instalar</SelectItem>
                  <SelectItem value="En espera de instalacion">En espera de instalación</SelectItem>
                  <SelectItem value="Instalacion completada y verificada">Instalación completada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#64748B]">Fecha Contrato Firmado</Label>
                <Input type="date" value={form.fecha_contrato_firmado} onChange={e => setForm(p => ({ ...p, fecha_contrato_firmado: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#64748B]">Fecha Instalación</Label>
                <Input type="date" value={form.fecha_instalacion_equipos} onChange={e => setForm(p => ({ ...p, fecha_instalacion_equipos: e.target.value }))} />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={isSubmitting} className="bg-[#1A367F] hover:bg-[#142a5f]">
              {isSubmitting ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PaymentConfigDialog
        open={showPaymentConfig}
        onConfirm={handlePaymentConfigConfirm}
      />
    </>
  );
}
