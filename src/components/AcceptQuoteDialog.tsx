
import { useState } from "react";
import { Quote } from "@/utils/quoteStorage";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AcceptQuoteDialogProps {
  quote: Quote | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAcceptComplete: () => void;
}

export default function AcceptQuoteDialog({ quote, open, onOpenChange, onAcceptComplete }: AcceptQuoteDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [legalData, setLegalData] = useState({
    legalrepresentative: "",
    legalrepresentativerut: "",
    communityrut: "",
    communityemail: "",
    legalrepresentativephone: "",
    communityformationdate: "",
  });

  const handleChange = (field: string, value: string) => {
    setLegalData(prev => ({ ...prev, [field]: value }));
  };

  const handleAccept = async () => {
    if (!quote?.presupuesto_id) return;

    setIsSubmitting(true);
    try {
      const { error: updateError } = await supabase
        .from("presupuestos")
        .update({
          estado: "Aceptado",
          fecha_aprobacion: new Date().toISOString().split('T')[0],
        })
        .eq("id", quote.presupuesto_id);

      if (updateError) throw updateError;

      const { error: contratoError } = await supabase
        .from("contratos")
        .insert([{
          prospecto_id: quote.id,
          estado_contrato: "Contrato no firmado",
          estado_equipos: "Equipos sin instalar",
          legalrepresentative: legalData.legalrepresentative || null,
          legalrepresentativerut: legalData.legalrepresentativerut || null,
          communityrut: legalData.communityrut || null,
          communityemail: legalData.communityemail || null,
          legalrepresentativephone: legalData.legalrepresentativephone || null,
          communityformationdate: legalData.communityformationdate || null,
        }]);

      if (contratoError) {
        console.error("Error creating contrato:", contratoError);
        toast({ title: "Advertencia", description: "Presupuesto aceptado pero hubo un error al crear el contrato." });
      }

      await supabase
        .from("prospectos")
        .update({ estado_contacto: "Presupuesto Aceptado" })
        .eq("id", quote.id);

      toast({ title: "Presupuesto aceptado", description: "El presupuesto ha sido aceptado y el contrato creado." });
      setLegalData({ legalrepresentative: "", legalrepresentativerut: "", communityrut: "", communityemail: "", legalrepresentativephone: "", communityformationdate: "" });
      onOpenChange(false);
      onAcceptComplete();
    } catch (error) {
      console.error("Error al aceptar presupuesto:", error);
      toast({ title: "Error", description: "Ha ocurrido un error al procesar el presupuesto.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Aceptar Presupuesto</DialogTitle>
          <DialogDescription>
            Completa la información legal para <strong>{quote?.communityname}</strong> y se creará automáticamente un contrato.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#64748B]">Representante Legal</Label>
              <Input placeholder="Nombre completo" value={legalData.legalrepresentative} onChange={e => handleChange("legalrepresentative", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#64748B]">RUT Representante</Label>
              <Input placeholder="12.345.678-9" value={legalData.legalrepresentativerut} onChange={e => handleChange("legalrepresentativerut", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#64748B]">RUT Comunidad</Label>
              <Input placeholder="12.345.678-9" value={legalData.communityrut} onChange={e => handleChange("communityrut", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#64748B]">Email Comunidad</Label>
              <Input type="email" placeholder="comunidad@email.com" value={legalData.communityemail} onChange={e => handleChange("communityemail", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#64748B]">Teléfono Representante</Label>
              <Input placeholder="+56 9 1234 5678" value={legalData.legalrepresentativephone} onChange={e => handleChange("legalrepresentativephone", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#64748B]">Fecha Constitución</Label>
              <Input type="date" value={legalData.communityformationdate} onChange={e => handleChange("communityformationdate", e.target.value)} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleAccept} disabled={isSubmitting} className="bg-[#10B981] hover:bg-[#059669]">
            {isSubmitting ? "Procesando..." : "Aceptar Presupuesto"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
