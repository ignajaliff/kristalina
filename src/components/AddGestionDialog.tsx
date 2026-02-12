
import { useState } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

interface AddGestionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface GestionFormData {
  mesrenting: number;
  fechapago: string;
  estadopago: string;
}

const AddGestionDialog = ({ open, onOpenChange, onSuccess }: AddGestionDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<GestionFormData>({
    defaultValues: {
      mesrenting: 1,
      fechapago: "",
      estadopago: "No en fecha"
    }
  });

  const onSubmit = async (data: GestionFormData) => {
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('gestion')
        .insert([{
          mesrenting: data.mesrenting,
          fechapago: data.fechapago,
          estadopago: data.estadopago
        }]);

      if (error) {
        console.error('Error adding gestion item:', error);
        toast({
          title: "Error",
          description: "No se pudo agregar el edificio. Inténtalo de nuevo.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Edificio agregado",
        description: "El edificio ha sido agregado exitosamente.",
        variant: "default",
      });

      reset();
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
          <DialogTitle>Agregar Nuevo Edificio</DialogTitle>
        </DialogHeader>
        
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
              {isSubmitting ? "Agregando..." : "Agregar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddGestionDialog;
