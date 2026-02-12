
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

interface GestionItem {
  id: string;
  cliente: any;
  data_presupuesto: any;
  data_contrato: any;
  mesrenting: number;
  fechapago: string;
  estadopago: string;
}

interface EditGestionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: GestionItem | null;
  onSuccess: () => void;
}

interface GestionFormData {
  mesrenting: number;
  fechapago: string;
  estadopago: string;
}

const EditGestionDialog = ({ open, onOpenChange, item, onSuccess }: EditGestionDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<GestionFormData>();

  useEffect(() => {
    if (item && open) {
      reset({
        mesrenting: item.mesrenting,
        fechapago: item.fechapago.split('T')[0],
        estadopago: item.estadopago
      });
    }
  }, [item, open, reset]);

  const onSubmit = async (data: GestionFormData) => {
    if (!item) return;
    
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('gestion')
        .update({
          mesrenting: data.mesrenting,
          fechapago: data.fechapago,
          estadopago: data.estadopago,
          updated_at: new Date().toISOString()
        })
        .eq('id', item.id);

      if (error) {
        console.error('Error updating gestion item:', error);
        toast({
          title: "Error",
          description: "No se pudo actualizar el edificio. Inténtalo de nuevo.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Edificio actualizado",
        description: "El edificio ha sido actualizado exitosamente.",
        variant: "default",
      });

      onSuccess();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Edificio</DialogTitle>
        </DialogHeader>

        {item?.cliente && (
          <div className="bg-[#F8FAFC] rounded-lg p-3 space-y-1 text-[12px] text-[#64748B]">
            <p><strong>Comunidad:</strong> {item.cliente.communityname}</p>
            <p><strong>Administrador:</strong> {item.cliente.adminname}</p>
            <p><strong>Dirección:</strong> {item.cliente.buildingaddress || 'N/A'}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mesrenting">Mes de Renting</Label>
            <Input
              id="mesrenting"
              type="number"
              min="1"
              max="12"
              {...register("mesrenting", { 
                required: "El mes de renting es requerido",
                min: { value: 1, message: "El mes debe ser entre 1 y 12" },
                max: { value: 12, message: "El mes debe ser entre 1 y 12" }
              })}
              placeholder="Mes (1-12)"
            />
            {errors.mesrenting && (
              <p className="text-sm text-red-500">{errors.mesrenting.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="fechapago">Fecha de Pago</Label>
            <Input
              id="fechapago"
              type="date"
              {...register("fechapago", { 
                required: "La fecha de pago es requerida" 
              })}
            />
            {errors.fechapago && (
              <p className="text-sm text-red-500">{errors.fechapago.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="estadopago">Estado del Pago</Label>
            <Select
              value={watch("estadopago")}
              onValueChange={(value) => setValue("estadopago", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="No en fecha">No en fecha</SelectItem>
                <SelectItem value="En fecha/No pagado">En fecha/No pagado</SelectItem>
                <SelectItem value="Mes pagado">Mes pagado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Actualizando..." : "Actualizar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditGestionDialog;
