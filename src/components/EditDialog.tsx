
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
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserRound, Building, MapPin, CreditCard, Users as UsersIcon, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

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
      <DialogContent className="max-w-[800px] p-0 overflow-hidden border-[#E2E8F0] shadow-2xl rounded-xl">
        <DialogHeader className="bg-[#F8FAFC] border-b border-[#E2E8F0] p-6 text-left">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 bg-[#EFF6FF] rounded-xl">
              <UserRound className="h-6 w-6 text-[#1A367F]" strokeWidth={2.5} />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold tracking-tight text-[#1E293B]">
                {isViewOnly ? "Detalles del" : "Editar"} {type === "cliente" ? "Cliente" : "Presupuesto"}
              </DialogTitle>
              <DialogDescription className="text-xs font-medium text-[#64748B] mt-0.5">
                {isViewOnly ? "Información detallada del presupuesto registrado" : "Actualiza la información técnica y de contacto"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col">
            <div className="p-8 max-h-[65vh] overflow-y-auto space-y-8">
              {/* Información de Comunidad */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Building className="h-4 w-4 text-[#1A367F]" strokeWidth={2} />
                  <h3 className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-[0.1em]">Información del Edificio</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  <FormField
                    control={form.control}
                    name="communityname"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Nombre Comunidad</FormLabel>
                        <FormControl>
                          <Input {...field} className="bg-[#F8FAFC]/50 border-[#E2E8F0] text-[13px] font-medium" disabled={isViewOnly} />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="buildingaddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Dirección</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} className="bg-[#F8FAFC]/50 border-[#E2E8F0] text-[13px] font-medium" disabled={isViewOnly} />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="comuna"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Comuna</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ""} className="bg-[#F8FAFC]/50 border-[#E2E8F0] text-[13px] font-medium" disabled={isViewOnly} />
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="region"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Región</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ""} className="bg-[#F8FAFC]/50 border-[#E2E8F0] text-[13px] font-medium" disabled={isViewOnly} />
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="units"
                      render={({ field }) => (
                        <FormItem className="col-span-1">
                          <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Unidades</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} value={field.value || ""} className="bg-[#F8FAFC]/50 border-[#E2E8F0] text-[13px] font-medium" disabled={isViewOnly} />
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="buildingtype"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Tipo Propiedad</FormLabel>
                          <FormControl>
                            <Input {...field} className="bg-[#F8FAFC]/50 border-[#E2E8F0] text-[13px] font-medium" disabled={isViewOnly} />
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </section>

              {/* Información de Contacto */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 mb-2 pt-2 border-t border-slate-100">
                  <UsersIcon className="h-4 w-4 text-[#1A367F]" strokeWidth={2} />
                  <h3 className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-[0.1em]">Contacto y Administración</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  <FormField
                    control={form.control}
                    name="adminname"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Nombre Administrador</FormLabel>
                        <FormControl>
                          <Input {...field} className="bg-[#F8FAFC]/50 border-[#E2E8F0] text-[13px] font-medium" disabled={isViewOnly} />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="adminemail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Email Contacto</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} className="bg-[#F8FAFC]/50 border-[#E2E8F0] text-[13px] font-medium" disabled={isViewOnly} />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="legalrepresentative"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Representante Legal</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} className="bg-[#F8FAFC]/50 border-[#E2E8F0] text-[13px] font-medium" disabled={isViewOnly} />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="managementcompany"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Administradora</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} className="bg-[#F8FAFC]/50 border-[#E2E8F0] text-[13px] font-medium" disabled={isViewOnly} />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="vendedor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Vendedor Asignado</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} className="bg-[#F8FAFC]/50 border-[#E2E8F0] text-[13px] font-medium" disabled={isViewOnly} />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />

                  {type !== "cliente" && (
                    <FormField
                      control={form.control}
                      name="estado_contacto"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Estado de Avance</FormLabel>
                          {isViewOnly ? (
                            <div className="pt-1.5 flex items-center">
                              <Badge className="px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider bg-[#EFF6FF] text-[#1A367F] border-0">
                                {field.value || "No definido"}
                              </Badge>
                            </div>
                          ) : (
                            <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                              <FormControl>
                                <SelectTrigger className="bg-[#F8FAFC]/50 border-[#E2E8F0] text-[13px] font-medium h-10">
                                  <SelectValue placeholder="Seleccionar estado" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Primer Contacto" className="text-[13px] font-medium">Primer Contacto</SelectItem>
                                <SelectItem value="Segundo Contacto" className="text-[13px] font-medium">Segundo Contacto</SelectItem>
                                <SelectItem value="Presupuesto Enviado" className="text-[13px] font-medium">Presupuesto Enviado</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </section>

              {type === "presupuesto" && (
                <section className="space-y-4">
                  <div className="flex items-center gap-2 mb-2 pt-2 border-t border-slate-100">
                    <CreditCard className="h-4 w-4 text-[#1A367F]" strokeWidth={2} />
                    <h3 className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-[0.1em]">Detalle Comercial</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="monto"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Monto Total</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              value={field.value || ""}
                              disabled={true}
                              className="bg-slate-50 border-slate-200 text-[13px] font-bold text-[#1A367F]"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="por_unidad"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Mto. por Unidad</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              value={field.value || ""}
                              disabled={true}
                              className="bg-slate-50 border-slate-200 text-[13px] font-semibold"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="inversion"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Valor Inversión</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              value={field.value || ""}
                              disabled={true}
                              className="bg-slate-50 border-slate-200 text-[13px] font-semibold"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </section>
              )}
            </div>

            <DialogFooter className="bg-[#F8FAFC] border-t border-[#E2E8F0] p-6 !justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="text-[12px] font-bold uppercase tracking-wider border-[#E2E8F0] text-[#64748B] hover:bg-slate-50"
              >
                {isViewOnly ? "Cerrar" : "Cancelar"}
              </Button>
              {!isViewOnly && (
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-[#1A367F] hover:bg-[#12285e] text-white font-bold text-[12px] uppercase tracking-wider px-6 transition-all active:scale-[0.98]"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                      <span>Guardando</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span>Guardar Cambios</span>
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  )}
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
