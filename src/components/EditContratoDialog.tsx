
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

interface PaymentConfigDialogProps {
  open: boolean;
  onConfirm: (config: { fechaPrimeraFactura: string; metodoCobro: "Inmediato" | "Emisión de Factura"; diaPago?: number }) => void;
}

const PaymentConfigDialog = ({ open, onConfirm }: PaymentConfigDialogProps) => {
  const [fechaPrimeraFactura, setFechaPrimeraFactura] = useState("");
  const [metodoCobro, setMetodoCobro] = useState<"Inmediato" | "Emisión de Factura">("Inmediato");
  const [diaPago, setDiaPago] = useState("");

  const diaPagoNum = parseInt(diaPago);
  const diaPagoValido = diaPagoNum >= 1 && diaPagoNum <= 31;
  const puedeConfirmar = !!fechaPrimeraFactura && (metodoCobro !== "Inmediato" || diaPagoValido);

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
            <Label className="text-xs font-semibold text-[#64748B]">Método de cobro</Label>
            <Select value={metodoCobro} onValueChange={(v) => setMetodoCobro(v as "Inmediato" | "Emisión de Factura")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Inmediato">Inmediato</SelectItem>
                <SelectItem value="Emisión de Factura">Emisión de Factura</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[11px] text-[#94A3B8] mt-1">
              {metodoCobro === "Inmediato"
                ? "Se notificará cuando el pago esté en fecha. Cada mes el pago se habilitará el día elegido."
                : "Se deberá emitir factura cada 1ro de mes antes de confirmar el pago. La primera facturación funciona como pago inmediato."}
            </p>
          </div>

          {metodoCobro === "Inmediato" && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#64748B]">Día de pago</Label>
              <Input
                type="number"
                min={1}
                max={31}
                placeholder="Ej: 15"
                value={diaPago}
                onChange={e => setDiaPago(e.target.value)}
              />
              <p className="text-[11px] text-[#94A3B8] mt-1">
                Día del mes en que cada pago se habilita para marcar como pagado (1 a 31). Si el mes no tiene ese día, se usa el último día del mes.
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            onClick={() => {
              if (!puedeConfirmar) return;
              onConfirm({
                fechaPrimeraFactura,
                metodoCobro,
                ...(metodoCobro === "Inmediato" ? { diaPago: diaPagoNum } : {}),
              });
            }}
            disabled={!puedeConfirmar}
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
 * Mes 1 uses fechaPrimeraFactura as-is (always treated as "Inmediato" logic).
 * Months 2+:
 *   - "Inmediato": fall on the chosen `diaPago` of each month (clamped to the last
 *     day of the month). Defaults to the 1st if no day was provided.
 *   - "Emisión de Factura": always the 1st of each subsequent month.
 * For "Emisión de Factura" method, months 2+ get additional tracking fields.
 */
const generatePagosJson = (
  fechaPrimeraFactura: string,
  metodoCobro: "Inmediato" | "Emisión de Factura",
  montoRenting: number,
  duracionMeses: number,
  diaPago?: number
) => {
  const pagos = [];

  // Mes 1: use the exact first invoice date - always "Inmediato" logic
  pagos.push({
    mes: 1,
    fecha_pago: fechaPrimeraFactura,
    monto: montoRenting,
    pagado: false,
    factura_url: null,
    fecha_pago_real: null,
    // For Emisión de Factura, mes 1 is still Inmediato, no emission tracking
    ...(metodoCobro === "Emisión de Factura" ? { fecha_emision: null, fecha_confirmacion: null, es_inmediato: true } : {}),
  });

  // Months 2+: always 1st of each subsequent month
  const firstDate = new Date(fechaPrimeraFactura + "T00:00:00");
  for (let i = 1; i < duracionMeses; i++) {
    const mesDate = addMonths(firstDate, i);
    // "Inmediato" with a chosen day uses that day (clamped to the month's last day);
    // otherwise fall back to the 1st of the month.
    let diaDelMes = 1;
    if (metodoCobro === "Inmediato" && diaPago && diaPago >= 1) {
      const ultimoDiaMes = new Date(mesDate.getFullYear(), mesDate.getMonth() + 1, 0).getDate();
      diaDelMes = Math.min(diaPago, ultimoDiaMes);
    }
    const fechaPago = new Date(mesDate.getFullYear(), mesDate.getMonth(), diaDelMes);

    pagos.push({
      mes: i + 1,
      fecha_pago: format(fechaPago, "yyyy-MM-dd"),
      monto: montoRenting,
      pagado: false,
      factura_url: null,
      fecha_pago_real: null,
      ...(metodoCobro === "Emisión de Factura" ? { fecha_emision: null, fecha_confirmacion: null, es_inmediato: false } : {}),
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
    paymentConfig: { fechaPrimeraFactura: string; metodoCobro: "Inmediato" | "Emisión de Factura"; diaPago?: number }
  ) => {
    const prospectoId = contratoData.prospecto_id;
    if (!prospectoId) throw new Error("No se encontró prospecto_id");

    const { data: prospecto, error: pErr } = await supabase
      .from("prospectos").select("*").eq("id", prospectoId).single();
    if (pErr) throw pErr;

    const { data: presupuestos, error: prErr } = await supabase
      .from("presupuestos").select("*").eq("prospecto_id", prospectoId);
    if (prErr) throw prErr;
    const presupuesto = presupuestos?.[0];

    const { data: contratoFull, error: cErr } = await supabase
      .from("contratos").select("*").eq("id", contratoData.id).single();
    if (cErr) throw cErr;

    const datosPresupuesto = presupuesto?.datos_presupuesto as any || {};
    const totalDeptos = datosPresupuesto.presupuesto_total_deptos || 0;
    const descuentoPct = datosPresupuesto.descuento_porcentaje || 0;
    const montoRenting = totalDeptos - (totalDeptos * descuentoPct) / 100;

    const duracionMeses = datosPresupuesto.anos_contrato
      ? parseInt(datosPresupuesto.anos_contrato) * 12
      : 60;

    const pagosJson = generatePagosJson(
      paymentConfig.fechaPrimeraFactura,
      paymentConfig.metodoCobro,
      montoRenting,
      duracionMeses,
      paymentConfig.diaPago
    );

    const primeraFechaPago = pagosJson[0]?.fecha_pago || paymentConfig.fechaPrimeraFactura;

    const dataPresupuestoJson = presupuesto
      ? { datos_presupuesto: presupuesto.datos_presupuesto }
      : null;
    const dataContratoJson = {
      datos_contrato: contratoFull.datos_contrato,
      doc_contrato: contratoFull.doc_contrato,
      fecha_contrato_firmado: form.fecha_contrato_firmado || contratoFull.fecha_contrato_firmado,
      fecha_instalacion_equipos: form.fecha_instalacion_equipos || contratoFull.fecha_instalacion_equipos,
    };

    const { data: nuevaGestion, error: gErr } = await supabase
      .from("gestion")
      .insert({
        // Datos del cliente desglosados en columnas (para filtrar/consultar/JOIN)
        communityname: prospecto.communityname,
        adminname: prospecto.adminname,
        adminemail: prospecto.adminemail,
        managementcompany: prospecto.managementcompany,
        buildingaddress: prospecto.buildingaddress,
        comuna: prospecto.comuna,
        region: prospecto.region,
        buildingtype: prospecto.buildingtype,
        units: prospecto.units,
        nombre_portero: prospecto.nombre_portero,
        notas: prospecto.notas,
        additional_at: (prospecto.additional_at ?? []) as any,
        data_presupuesto: dataPresupuestoJson,
        data_contrato: dataContratoJson,
        mesrenting: 1,
        fechapago: primeraFechaPago,
        estadopago: "En fecha/No pagado",
        vendedor_id: prospecto.vendedor_id,
        metodo_cobro: paymentConfig.metodoCobro,
        monto_renting: montoRenting,
      })
      .select("id")
      .single();
    if (gErr) throw gErr;

    // Crear los registros de pago en la tabla `pagos` (fuente de verdad)
    const pagosRows = pagosJson.map((p: any) => ({
      gestion_id: nuevaGestion.id,
      mes: p.mes,
      fecha_pago: p.fecha_pago,
      monto: p.monto,
      pagado: p.pagado ?? false,
      fecha_pago_real: p.fecha_pago_real ?? null,
      factura_url: p.factura_url ?? null,
      fecha_emision: p.fecha_emision ?? null,
      fecha_confirmacion: p.fecha_confirmacion ?? null,
      es_inmediato: p.es_inmediato ?? false,
    }));
    const { error: pagosErr } = await supabase.from("pagos").insert(pagosRows);
    if (pagosErr) throw pagosErr;

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

  const handlePaymentConfigConfirm = async (config: { fechaPrimeraFactura: string; metodoCobro: "Inmediato" | "Emisión de Factura"; diaPago?: number }) => {
    if (!contrato) return;
    setShowPaymentConfig(false);
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
