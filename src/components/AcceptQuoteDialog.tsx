
import { useState } from "react";
import { Quote } from "@/utils/quoteStorage";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface AcceptQuoteDialogProps {
  quote: Quote | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAcceptComplete: () => void;
}

export default function AcceptQuoteDialog({ quote, open, onOpenChange, onAcceptComplete }: AcceptQuoteDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAccept = async () => {
    if (!quote?.presupuesto_id) return;

    setIsSubmitting(true);
    try {
      // 1. Update presupuesto estado to "Aceptado" and set fecha_aprobacion
      const { error: updateError } = await supabase
        .from("presupuestos")
        .update({
          estado: "Aceptado",
          fecha_aprobacion: new Date().toISOString().split('T')[0],
        })
        .eq("id", quote.presupuesto_id);

      if (updateError) throw updateError;

      // 2. Auto-create contrato record
      const { error: contratoError } = await supabase
        .from("contratos")
        .insert([{
          prospecto_id: quote.id,
          estado_contrato: "Contrato no firmado",
          estado_equipos: "Equipos sin instalar",
        }]);

      if (contratoError) {
        console.error("Error creating contrato:", contratoError);
        toast({ title: "Advertencia", description: "Presupuesto aceptado pero hubo un error al crear el contrato." });
      }

      // 3. Update prospecto estado_contacto
      await supabase
        .from("prospectos")
        .update({ estado_contacto: "Presupuesto Aceptado" })
        .eq("id", quote.id);

      toast({ title: "Presupuesto aceptado", description: "El presupuesto ha sido aceptado y el contrato creado." });
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
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Aceptar Presupuesto</DialogTitle>
          <DialogDescription>
            ¿Estás seguro de aceptar el presupuesto para <strong>{quote?.communityname}</strong>?
            Esto cambiará el estado a "Aceptado" y creará automáticamente un registro de contrato.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-2 text-sm text-muted-foreground">
          <p><strong>Comunidad:</strong> {quote?.communityname}</p>
          <p><strong>Administrador:</strong> {quote?.adminname}</p>
          <p><strong>Unidades:</strong> {quote?.units}</p>
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
