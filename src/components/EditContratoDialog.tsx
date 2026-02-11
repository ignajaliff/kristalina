
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

interface ContratoRow {
  id: string;
  estado_contrato: string;
  estado_equipos: string;
  fecha_contrato_firmado: string | null;
  fecha_instalacion_equipos: string | null;
}

interface EditContratoDialogProps {
  contrato: ContratoRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveComplete: () => void;
}

export default function EditContratoDialog({ contrato, open, onOpenChange, onSaveComplete }: EditContratoDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const handleSave = async () => {
    if (!contrato) return;
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

  return (
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
  );
}
