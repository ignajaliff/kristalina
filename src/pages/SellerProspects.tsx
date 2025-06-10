
import SellerSidebar from "@/components/SellerSidebar";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { CalendarIcon, PlusCircle, Building2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const formSchema = z.object({
  communityname: z.string().min(2, "El nombre de la comunidad debe tener al menos 2 caracteres"),
  adminname: z.string().min(2, "El nombre del administrador debe tener al menos 2 caracteres"),
  adminemail: z.string().email("Debe ser un email válido"),
  managementcompany: z.string().optional(),
  legalrepresentative: z.string().optional(),
  legalrepresentativerut: z.string().optional(),
  legalrepresentativephone: z.string().optional(),
  buildingaddress: z.string().min(5, "La dirección debe tener al menos 5 caracteres"),
  comuna: z.string().min(2, "La comuna debe tener al menos 2 caracteres"),
  region: z.string().min(2, "La región debe tener al menos 2 caracteres"),
  buildingtype: z.string().min(1, "Debe seleccionar un tipo de edificio"),
  units: z.number().min(1, "Debe haber al menos 1 unidad"),
  communityformationdate: z.date().optional(),
  communityrut: z.string().optional(),
  communityemail: z.string().email("Debe ser un email válido").optional().or(z.literal("")),
});

type FormValues = z.infer<typeof formSchema>;

const SellerProspects = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      communityname: "",
      adminname: "",
      adminemail: "",
      managementcompany: "",
      legalrepresentative: "",
      legalrepresentativerut: "",
      legalrepresentativephone: "",
      buildingaddress: "",
      comuna: "",
      region: "",
      buildingtype: "",
      units: 1,
      communityrut: "",
      communityemail: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from("presupuestos")
        .insert({
          ...values,
          communityformationdate: values.communityformationdate?.toISOString(),
          communityemail: values.communityemail || null,
          monto: values.units * 50000,
          por_unidad: 50000,
          inversion: Math.round(values.units * 50000 * 0.8),
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Prospecto creado exitosamente",
        description: "El prospecto ha sido registrado en el sistema.",
      });

      form.reset();
    } catch (error) {
      console.error("Error al crear el prospecto:", error);
      toast({
        title: "Error",
        description: "Hubo un error al crear el prospecto. Por favor, intente nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <SellerSidebar />
      <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Captura de Prospectos
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Registra nuevos prospectos y genera presupuestos automáticamente
              </p>
            </div>
          </div>
        </div>
        
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlusCircle className="h-5 w-5" />
              Nuevo Prospecto
            </CardTitle>
            <CardDescription>
              Complete la información del prospecto para generar un presupuesto automático
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="communityname"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre de la Comunidad *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: Condominio Las Flores" {...field} />
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
                        <FormLabel>Nombre del Administrador *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: Juan Pérez" {...field} />
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
                        <FormLabel>Email del Administrador *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="admin@ejemplo.com" {...field} />
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
                          <Input placeholder="Ej: Administradora XYZ" {...field} />
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
                          <Input placeholder="Ej: María García" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="legalrepresentativerut"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>RUT Representante Legal</FormLabel>
                        <FormControl>
                          <Input placeholder="12.345.678-9" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="legalrepresentativephone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teléfono Representante Legal</FormLabel>
                        <FormControl>
                          <Input placeholder="+56 9 1234 5678" {...field} />
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
                        <FormLabel>Dirección del Edificio *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: Av. Providencia 1234" {...field} />
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
                        <FormLabel>Comuna *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: Providencia" {...field} />
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
                        <FormLabel>Región *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: Región Metropolitana" {...field} />
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
                        <FormLabel>Tipo de Edificio *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Edificio">Edificio Residencial</SelectItem>
                            <SelectItem value="Escolar">Centro Educacional</SelectItem>
                            <SelectItem value="Industrial">Edificio Industrial</SelectItem>
                            <SelectItem value="Comercial">Edificio Comercial</SelectItem>
                            <SelectItem value="Oficinas">Edificio de Oficinas</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="units"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número de Unidades *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="1"
                            placeholder="Ej: 50"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                          />
                        </FormControl>
                        <FormDescription>
                          Cantidad total de unidades habitacionales
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="communityformationdate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Fecha de Constitución</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP", { locale: es })
                                ) : (
                                  <span>Seleccionar fecha</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date > new Date() || date < new Date("1900-01-01")
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="communityrut"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>RUT de la Comunidad</FormLabel>
                        <FormControl>
                          <Input placeholder="12.345.678-9" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="communityemail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email de la Comunidad</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="comunidad@ejemplo.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end space-x-4 pt-6 border-t">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => form.reset()}
                    disabled={isSubmitting}
                  >
                    Limpiar Formulario
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Creando..." : "Crear Prospecto"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SellerProspects;
