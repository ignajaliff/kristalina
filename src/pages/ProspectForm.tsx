
import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import AdminSidebar from "@/components/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Droplet, PlusCircle, AlertCircle } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";

// Define the schema for form validation
const formSchema = z.object({
  adminName: z.string().min(1, { message: "El nombre del administrador es obligatorio" }),
  adminEmail: z.string().email({ message: "Correo electrónico inválido" }).min(1, { message: "El correo del administrador es obligatorio" }),
  managementCompany: z.string().optional(),
  legalRepresentative: z.string().optional(),
  additionalATs: z.array(
    z.object({
      name: z.string().min(1, { message: "El nombre es obligatorio" }),
      email: z.string().email({ message: "Correo electrónico inválido" }).min(1, { message: "El correo es obligatorio" }),
    })
  ).optional(),
  communityName: z.string().min(1, { message: "El nombre de la comunidad es obligatorio" }),
  buildingAddress: z.string().optional(),
  comuna: z.string().optional(),
  region: z.string().optional(),
  buildingType: z.string().default("Edificio"),
  units: z.number().min(1, { message: "La cantidad de unidades es obligatoria" }),
});

type FormValues = z.infer<typeof formSchema>;

const WEBHOOK_URL = "https://n8n-n8n.qqtfab.easypanel.host/webhook-test/66abaac8-fdce-4dde-a287-df61767ba4af";

const ProspectForm = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Initialize the form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      adminName: "",
      adminEmail: "",
      managementCompany: "",
      legalRepresentative: "",
      additionalATs: [],
      communityName: "",
      buildingAddress: "",
      comuna: "",
      region: "",
      buildingType: "Edificio",
      units: 0,
    },
  });
  
  // Use fieldArray for dynamic additional AT fields
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "additionalATs",
  });
  
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    
    try {
      console.log("Form data:", data);
      
      // Format additional ATs for storage
      const additionalATs = data.additionalATs || [];
      
      // Send to webhook
      try {
        await fetch(WEBHOOK_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          mode: "no-cors",
          body: JSON.stringify({
            ...data,
            timestamp: new Date().toISOString(),
            source: "Kristalina CRM"
          }),
        });
        
        console.log("Webhook triggered successfully");
      } catch (webhookError) {
        console.error("Error triggering webhook:", webhookError);
      }
      
      // Save to Supabase
      const { error } = await supabase
        .from('presupuestos')
        .insert({
          adminName: data.adminName,
          adminEmail: data.adminEmail,
          managementCompany: data.managementCompany || null,
          legalRepresentative: data.legalRepresentative || null,
          additional_at: additionalATs,
          communityName: data.communityName,
          buildingAddress: data.buildingAddress || null,
          comuna: data.comuna || null,
          region: data.region || null,
          buildingType: "Edificio", // Fixed as requested
          units: data.units,
        });
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Presupuesto enviado",
        description: "El presupuesto ha sido registrado correctamente y se ha enviado para cotización.",
      });
      
      // Reset form
      form.reset();
      
      // Navigate to quotes page after a short delay
      setTimeout(() => {
        navigate("/admin/quotes");
      }, 1500);
      
    } catch (error) {
      console.error("Error saving prospect:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al guardar el presupuesto. Por favor, intente nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar />
      <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
        <h1 className="text-3xl font-bold text-sistema-blue-dark mb-6 flex items-center">
          <Droplet className="mr-2 h-8 w-8 text-sistema-blue" />
          Creación presupuesto Viviendas
        </h1>

        <Card className="max-w-4xl mx-auto">
          <CardHeader className="bg-sistema-blue/10">
            <CardTitle className="text-sistema-blue-dark">
              Datos del Prospecto
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="adminName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          Nombre del Administrador
                          <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Nombre completo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="adminEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          Correo del Administrador
                          <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="correo@ejemplo.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="managementCompany"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Empresa Administradora</FormLabel>
                        <FormControl>
                          <Input placeholder="Nombre de la empresa" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="legalRepresentative"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Representante Legal</FormLabel>
                        <FormControl>
                          <Input placeholder="Nombre del representante" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Additional ATs Section */}
                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-3 pb-3 border-t border-gray-200">
                    <FormField
                      control={form.control}
                      name={`additionalATs.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre del nuevo AT</FormLabel>
                          <FormControl>
                            <Input placeholder="Nombre completo" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name={`additionalATs.${index}.email`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Correo nuevo AT</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="correo@ejemplo.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ))}
                
                <div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                    onClick={() => append({ name: "", email: "" })}
                  >
                    <PlusCircle className="h-4 w-4" />
                    Agregar otro AT
                  </Button>
                </div>
                
                <div className="border-t pt-6">
                  <h3 className="font-medium text-lg mb-4">Datos del Edificio</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="communityName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1">
                            Nombre de la Comunidad (Edf.)
                            <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="Ej: Edificio Los Alpes" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="buildingAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dirección del Edificio</FormLabel>
                          <FormControl>
                            <Input placeholder="Calle y número" {...field} />
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
                            <Input placeholder="Comuna" {...field} />
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
                            <Input placeholder="Región" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="buildingType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Edificio</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Edificio" 
                              value="Edificio" 
                              disabled 
                              className="bg-gray-100" 
                            />
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
                          <FormLabel className="flex items-center gap-1">
                            Cantidad de Unidades
                            <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="Número de departamentos" 
                              {...field} 
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    className="bg-sistema-blue hover:bg-sistema-blue-dark"
                    disabled={isSubmitting}
                    isLoading={isSubmitting}
                  >
                    {isSubmitting ? "Enviando..." : "Guardar Presupuesto"}
                  </Button>
                </div>
                
                {/* Required fields note */}
                <div className="text-sm text-gray-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Los campos marcados con <span className="text-red-500">*</span> son obligatorios
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProspectForm;
