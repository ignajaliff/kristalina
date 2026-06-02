
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Upload, Mail } from "lucide-react";
import { generatePresupuestoPDF } from "@/utils/pdfGenerator";
import { queueAndSendEmail } from "@/utils/email";


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
  presupuesto_total_deptos: number;
  descuento_porcentaje: number;
  precio_instalacion: number;
  anos_contrato: number;
  matriz_principal: number;
  recirculacion: number;
  torre_enfriamiento: boolean;
}

export default function EnviarPresupuestoDialog({ cliente, open, onOpenChange, onComplete }: EnviarPresupuestoDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [manualPresupuestoFile, setManualPresupuestoFile] = useState<File | null>(null);
  const [enviarEmail, setEnviarEmail] = useState(false);
  const [datos, setDatos] = useState<DatosPresupuesto>({
    moneda: "Pesos",
    presupuesto_total_deptos: 0,
    descuento_porcentaje: 0,
    precio_instalacion: 0,
    anos_contrato: 0,
    matriz_principal: 1,
    recirculacion: 1,
    torre_enfriamiento: false,
  });

  const handleChange = (field: keyof DatosPresupuesto, value: string | number | boolean) => {
    setDatos(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!cliente) return;

    // Validate required fields — esta información es obligatoria porque alimenta
    // el contrato y la sección de gestión del edificio (independiente del documento adjunto).
    const missingFields: string[] = [];
    if (!datos.presupuesto_total_deptos || datos.presupuesto_total_deptos <= 0) missingFields.push("Presupuesto total deptos");
    if (!datos.precio_instalacion || datos.precio_instalacion <= 0) missingFields.push("Precio instalación");
    if (!datos.anos_contrato || datos.anos_contrato <= 0) missingFields.push("Años contrato");
    if (!datos.matriz_principal || datos.matriz_principal < 1) missingFields.push("Matriz principal");
    if (!datos.recirculacion || datos.recirculacion < 1) missingFields.push("Recirculación");

    if (missingFields.length > 0) {
      toast({
        title: "Información incompleta",
        description: `Completa los siguientes campos obligatorios: ${missingFields.join(", ")}.`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Update prospecto estado
      const { error: updateError } = await supabase
        .from("prospectos")
        .update({ estado_contacto: "Presupuesto Enviado" })
        .eq("id", cliente.id);

      if (updateError) throw updateError;

      // 2. Upload manual presupuesto document if provided
      let docUrl: string | null = null;
      if (manualPresupuestoFile) {
        const fileName = `presupuesto_${cliente.id}_${Date.now()}_${manualPresupuestoFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from("presupuestos-pdf")
          .upload(fileName, manualPresupuestoFile, { contentType: manualPresupuestoFile.type, upsert: true });

        if (uploadError) {
          console.error("Error uploading presupuesto file:", uploadError);
        } else {
          const { data: urlData } = supabase.storage.from("presupuestos-pdf").getPublicUrl(fileName);
          docUrl = urlData.publicUrl;
        }
      }

      // 3. Create presupuesto record (manual doc if uploaded, else templated download)
      const { data: presupuestoRow, error: presupuestoError } = await supabase
        .from("presupuestos")
        .insert([{
          prospecto_id: cliente.id,
          estado: "Enviado",
          datos_presupuesto: datos as any,
          doc_presupuesto: docUrl,
        }])
        .select("id")
        .single();

      if (presupuestoError) {
        console.error("Error creating presupuesto:", presupuestoError);
        toast({ title: "Advertencia", description: "Estado actualizado pero hubo un error al crear el presupuesto.", variant: "destructive" });
      }

      // 4. Enviar por email al cliente (si el toggle está activado)
      if (enviarEmail) {
        try {
          // Determinar el documento a adjuntar: manual subido o plantillado generado.
          let attachmentUrl = docUrl ?? undefined;
          let attachmentFilename = manualPresupuestoFile?.name;
          if (!attachmentUrl) {
            // Generar el PDF de plantilla y subirlo a Storage para adjuntarlo
            const blob = generatePresupuestoPDF(
              {
                adminname: cliente.adminname,
                adminemail: cliente.adminemail,
                communityname: cliente.communityname,
                buildingaddress: cliente.buildingaddress,
                buildingtype: cliente.buildingtype,
                units: cliente.units,
                vendedor: cliente.vendedor,
              },
              datos as any,
            );
            const genPath = `presupuestos-generados/${cliente.id}/${Date.now()}.pdf`;
            const { error: genErr } = await supabase.storage
              .from("presupuestos-pdf")
              .upload(genPath, blob, { contentType: "application/pdf", upsert: true });
            if (!genErr) {
              attachmentUrl = supabase.storage.from("presupuestos-pdf").getPublicUrl(genPath).data.publicUrl;
              attachmentFilename = `presupuesto_${cliente.communityname}.pdf`;
            }
          }

          const result = await queueAndSendEmail({
            toEmail: cliente.adminemail,
            toName: cliente.adminname,
            subject: `Presupuesto - ${cliente.communityname}`,
            bodyHtml: `<p>Estimado/a ${cliente.adminname},</p>
<p>Adjuntamos el presupuesto para <strong>${cliente.communityname}</strong>.</p>
<p>Quedamos atentos a cualquier consulta.</p>
<p>Saludos,<br/>Equipo Kristalina</p>`,
            attachmentUrl,
            attachmentFilename,
            tipo: "presupuesto",
            relatedId: presupuestoRow?.id,
          });

          if (result.sent) {
            toast({ title: "Email enviado", description: `Presupuesto enviado a ${cliente.adminemail}.` });
          } else if (result.queued) {
            toast({ title: "Email pendiente", description: result.message || "El email quedó registrado y se enviará al configurar el correo." });
          }
        } catch (e) {
          console.error("Error al enviar email del presupuesto:", e);
        }
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
      setDatos({ moneda: "Pesos", presupuesto_total_deptos: 0, descuento_porcentaje: 0, precio_instalacion: 0, anos_contrato: 0, matriz_principal: 1, recirculacion: 1, torre_enfriamiento: false });
      setManualPresupuestoFile(null);
      setEnviarEmail(false);
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
              <Label className="text-xs font-semibold text-[#64748B]">Presupuesto total deptos *</Label>
              <Input type="number" placeholder="0" value={datos.presupuesto_total_deptos || ""} onChange={e => handleChange("presupuesto_total_deptos", parseFloat(e.target.value) || 0)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#64748B]">Descuento %</Label>
              <Input type="number" placeholder="0" value={datos.descuento_porcentaje || ""} onChange={e => handleChange("descuento_porcentaje", parseFloat(e.target.value) || 0)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#64748B]">Precio instalación *</Label>
              <Input type="number" placeholder="0" value={datos.precio_instalacion || ""} onChange={e => handleChange("precio_instalacion", parseFloat(e.target.value) || 0)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#64748B]">Años contrato *</Label>
              <Input type="number" placeholder="0" value={datos.anos_contrato || ""} onChange={e => handleChange("anos_contrato", parseInt(e.target.value) || 0)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#64748B]">Matriz principal *</Label>
              <Input type="number" min="1" placeholder="1" value={datos.matriz_principal || ""} onChange={e => handleChange("matriz_principal", parseInt(e.target.value) || 1)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#64748B]">Recirculación *</Label>
              <Input type="number" min="1" placeholder="1" value={datos.recirculacion || ""} onChange={e => handleChange("recirculacion", parseInt(e.target.value) || 1)} />
            </div>
          </div>

          {/* Torre de enfriamiento toggle */}
          <div className="flex items-center justify-between p-3 border border-[#E2E8F0] rounded-lg bg-[#F8FAFC]">
            <Label className="text-xs font-semibold text-[#64748B]">Torre de Enfriamiento</Label>
            <Switch
              checked={datos.torre_enfriamiento}
              onCheckedChange={(checked) => handleChange("torre_enfriamiento", checked)}
            />
          </div>

          {/* Manual presupuesto upload */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-[#64748B]">
              Subir presupuesto manualmente (opcional)
            </Label>
            <div className="flex items-center gap-3">
              <Input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setManualPresupuestoFile(e.target.files?.[0] || null)}
                className="text-xs"
              />
              {manualPresupuestoFile && (
                <Badge variant="secondary" className="text-[10px] whitespace-nowrap">
                  <Upload className="h-3 w-3 mr-1" />
                  {manualPresupuestoFile.name}
                </Badge>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground">
              Si no adjuntas un archivo, el presupuesto se generará desde la plantilla del sistema.
            </p>
          </div>

          {/* Enviar por email al cliente */}
          <div className="flex items-center justify-between p-3 border border-[#E2E8F0] rounded-lg bg-[#F8FAFC]">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-white rounded-md border border-[#E2E8F0]">
                <Mail className="h-4 w-4 text-[#1A367F]" strokeWidth={2.5} />
              </div>
              <div>
                <Label className="text-xs font-semibold text-[#1E293B]">Enviar por email al cliente</Label>
                <p className="text-[10px] text-muted-foreground">
                  Se enviará el documento (manual o plantillado) a {cliente?.adminemail || "el administrador"}.
                </p>
              </div>
            </div>
            <Switch checked={enviarEmail} onCheckedChange={setEnviarEmail} />
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
