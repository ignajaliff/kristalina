
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface EditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  record: any;
  onUpdate: () => void;
  type: "cliente" | "presupuesto";
}

const EditDialog = ({ isOpen, onClose, record, onUpdate, type }: EditDialogProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm({
    defaultValues: record || {},
  });

  useEffect(() => {
    if (record) {
      form.reset(record);
    }
  }, [record, form]);

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      // Remove the status field from data as it doesn't exist in the database
      const { status, ...updateData } = data;
      
      const { error } = await supabase
        .from('presupuestos')
        .update(updateData)
        .eq('id', record.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Registro actualizado",
        description: "Los cambios se han guardado correctamente.",
      });

      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating record:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el registro.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!record) return null;

  const isViewOnly = type === "presupuesto";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isViewOnly ? "Ver" : "Editar"} {type === "cliente" ? "Cliente" : "Presupuesto"}
          </DialogTitle>
          <DialogDescription>
            {isViewOnly ? "Información detallada del presupuesto" : "Edita la información del registro"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="communityname"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de la Comunidad</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isViewOnly} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="buildingaddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dirección</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} disabled={isViewOnly} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="adminname"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del Administrador</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isViewOnly} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="adminemail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email del Administrador</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} disabled={isViewOnly} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="units"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidades</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} value={field.value || ""} disabled={isViewOnly} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="buildingtype"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Edificio</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isViewOnly} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="comuna"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Comuna</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} disabled={isViewOnly} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="region"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Región</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} disabled={isViewOnly} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="legalrepresentative"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Representante Legal</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} disabled={isViewOnly} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="managementcompany"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Empresa Administradora</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} disabled={isViewOnly} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vendedor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vendedor</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} disabled={isViewOnly} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {type !== "cliente" && (
                <FormField
                  control={form.control}
                  name="estado_contacto"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado de Contacto</FormLabel>
                      {isViewOnly ? (
                        <div className="p-2">
                          <Badge variant="outline">
                            {field.value || "No definido"}
                          </Badge>
                        </div>
                      ) : (
                        <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar estado" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Primer Contacto">Primer Contacto</SelectItem>
                            <SelectItem value="Segundo Contacto">Segundo Contacto</SelectItem>
                            <SelectItem value="Presupuesto Enviado">Presupuesto Enviado</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {type === "presupuesto" && (
                <>
                  <FormField
                    control={form.control}
                    name="monto"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monto Total</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            value={field.value || ""} 
                            disabled={true}
                            className="bg-gray-100"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="por_unidad"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monto por Unidad</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            value={field.value || ""} 
                            disabled={true}
                            className="bg-gray-100"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="inversion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor Inversión</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            value={field.value || ""} 
                            disabled={true}
                            className="bg-gray-100"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                {isViewOnly ? "Cerrar" : "Cancelar"}
              </Button>
              {!isViewOnly && (
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Guardando..." : "Guardar Cambios"}
                </Button>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditDialog;
