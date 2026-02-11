
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { generatePresupuestoPDF } from "@/utils/pdfGenerator";

interface Cliente {
  id: string;
  adminname: string;
  adminemail: string;
  communityname: string;
  buildingaddress: string | null;
  buildingtype: string;
  units: number;
  vendedor: string | null;
}

interface EnviarPresupuestoDialogProps {
  cliente: Cliente | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

interface DatosPresupuesto {
  moneda: "Pesos" | "UF";
  valor_mensual_arriendo: number;
  presupuesto_total_deptos: number;
  descuento_porcentaje: number;
  costo_total_mensual_equipos: number;
  precio_instalacion: number;
  anos_contrato: number;
}

export default function EnviarPresupuestoDialog({ cliente, open, onOpenChange, onComplete }: EnviarPresupuestoDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [datos, setDatos] = useState<DatosPresupuesto>({
    moneda: "Pesos",
    valor_mensual_arriendo: 0,
    presupuesto_total_deptos: 0,
    descuento_porcentaje: 0,
    costo_total_mensual_equipos: 0,
    precio_instalacion: 0,
    anos_contrato: 0,
  });

  const handleChange = (field: keyof DatosPresupuesto, value: string | number) => {
    setDatos(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!cliente) return;

    setIsSubmitting(true);
    try {
      // 1. Update prospecto estado
      const { error: updateError } = await supabase
        .from("prospectos")
        .update({ estado_contacto: "Presupuesto Enviado" })
        .eq("id", cliente.id);

      if (updateError) throw updateError;

      // 2. Generate PDF
      const pdfBlob = generatePresupuestoPDF(cliente, datos);

      // 3. Upload PDF to storage
      const fileName = `presupuesto_${cliente.id}_${Date.now()}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from("presupuestos-pdf")
        .upload(fileName, pdfBlob, { contentType: "application/pdf" });

      if (uploadError) {
        console.error("Error uploading PDF:", uploadError);
      }

      // 4. Get public URL
      const { data: urlData } = supabase.storage
        .from("presupuestos-pdf")
        .getPublicUrl(fileName);

      const docUrl = urlData?.publicUrl || null;

      // 5. Create presupuesto record
      const { error: presupuestoError } = await supabase
        .from("presupuestos")
        .insert([{
          prospecto_id: cliente.id,
          estado: "Enviado",
          datos_presupuesto: datos as any,
          doc_presupuesto: docUrl,
        }]);

      if (presupuestoError) {
        console.error("Error creating presupuesto:", presupuestoError);
        toast({ title: "Advertencia", description: "Estado actualizado pero hubo un error al crear el presupuesto.", variant: "destructive" });
      }

      // 6. Trigger webhook
      try {
        await fetch("https://n8n-n8n.qqtfab.easypanel.host/webhook-test/66abaac8-fdce-4dde-a287-df61767ba4af", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          mode: "no-cors",
          body: JSON.stringify({ ...cliente, estado_contacto: "Presupuesto Enviado", datos_presupuesto: datos, timestamp: new Date().toISOString(), source: "Kristalina CRM" }),
        });
      } catch (e) {
        console.error("Webhook error:", e);
      }

      toast({ title: "Presupuesto enviado", description: `El presupuesto para ${cliente.communityname} ha sido creado y enviado.` });

      // Reset form
      setDatos({ moneda: "Pesos", valor_mensual_arriendo: 0, presupuesto_total_deptos: 0, descuento_porcentaje: 0, costo_total_mensual_equipos: 0, precio_instalacion: 0, anos_contrato: 0 });
      onOpenChange(false);
      onComplete();
    } catch (error) {
      console.error("Error:", error);
      toast({ title: "Error", description: "Ha ocurrido un error al procesar el presupuesto.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Enviar Presupuesto</DialogTitle>
          <DialogDescription>
            Completa los datos del presupuesto para <strong>{cliente?.communityname}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Currency selection */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-[#64748B]">Moneda</Label>
            <RadioGroup
              value={datos.moneda}
              onValueChange={(v) => handleChange("moneda", v)}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Pesos" id="pesos" />
                <Label htmlFor="pesos" className="cursor-pointer">Pesos (CLP)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="UF" id="uf" />
                <Label htmlFor="uf" className="cursor-pointer">UF</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#64748B]">Valor mensual de arriendo</Label>
              <Input type="number" placeholder="0" value={datos.valor_mensual_arriendo || ""} onChange={e => handleChange("valor_mensual_arriendo", parseFloat(e.target.value) || 0)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#64748B]">Presupuesto total deptos</Label>
              <Input type="number" placeholder="0" value={datos.presupuesto_total_deptos || ""} onChange={e => handleChange("presupuesto_total_deptos", parseFloat(e.target.value) || 0)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#64748B]">Descuento %</Label>
              <Input type="number" placeholder="0" value={datos.descuento_porcentaje || ""} onChange={e => handleChange("descuento_porcentaje", parseFloat(e.target.value) || 0)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#64748B]">Costo total mensual equipos</Label>
              <Input type="number" placeholder="0" value={datos.costo_total_mensual_equipos || ""} onChange={e => handleChange("costo_total_mensual_equipos", parseFloat(e.target.value) || 0)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#64748B]">Precio instalación</Label>
              <Input type="number" placeholder="0" value={datos.precio_instalacion || ""} onChange={e => handleChange("precio_instalacion", parseFloat(e.target.value) || 0)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#64748B]">Años contrato</Label>
              <Input type="number" placeholder="0" value={datos.anos_contrato || ""} onChange={e => handleChange("anos_contrato", parseInt(e.target.value) || 0)} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-[#10B981] hover:bg-[#059669]">
            {isSubmitting ? "Procesando..." : "Crear y Enviar Presupuesto"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
