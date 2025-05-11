
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "@/components/ui/use-toast";
import AdminSidebar from "@/components/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Droplet } from "lucide-react";

type ProspectFormData = {
  adminName: string;
  adminEmail: string;
  managementCompany: string;
  legalRepresentative: string;
  communityName: string;
  buildingAddress: string;
  comuna: string;
  region: string;
  buildingType: "Edificio" | "Escolar" | "Industrial";
  units: number;
};

const ProspectForm = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  
  const form = useForm<ProspectFormData>({
    defaultValues: {
      adminName: "",
      adminEmail: "",
      managementCompany: "",
      legalRepresentative: "",
      communityName: "",
      buildingAddress: "",
      comuna: "",
      region: "",
      buildingType: "Edificio",
      units: 0,
    },
  });
  
  const onSubmit = async (data: ProspectFormData) => {
    setIsSubmitting(true);
    
    try {
      // Simulación de guardado en base de datos (esto sería reemplazado por llamadas reales a la API)
      console.log("Saving to database:", data);
      
      // Envío al webhook si está configurado
      if (webhookUrl) {
        try {
          await fetch(webhookUrl, {
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
      }
      
      toast({
        title: "Prospecto guardado",
        description: "El prospecto ha sido registrado correctamente y se ha enviado para cotización.",
      });
      
      // Reiniciar formulario
      form.reset();
      
    } catch (error) {
      console.error("Error saving prospect:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al guardar el prospecto. Por favor, intente nuevamente.",
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
          Formulario de Captura de Prospectos
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
                        <FormLabel>Nombre del Administrador</FormLabel>
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
                        <FormLabel>Correo del Administrador</FormLabel>
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
                
                <div className="border-t pt-6">
                  <h3 className="font-medium text-lg mb-4">Datos del Edificio</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="communityName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre de la Comunidad (Edf.)</FormLabel>
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
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccione tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Edificio">Edificio</SelectItem>
                              <SelectItem value="Escolar">Escolar</SelectItem>
                              <SelectItem value="Industrial">Industrial</SelectItem>
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
                          <FormLabel>Cantidad de Unidades</FormLabel>
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

                <div className="border-t pt-6">
                  <h3 className="font-medium text-lg mb-4">Configuración de Webhook (Opcional)</h3>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">URL del Webhook</label>
                    <Input
                      type="text"
                      placeholder="https://hooks.zapier.com/..."
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      className="w-full"
                    />
                    <p className="text-xs text-sistema-gray mt-1">
                      URL del webhook para disparar la automatización de cotización
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    className="bg-sistema-blue hover:bg-sistema-blue-dark"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Enviando..." : "Guardar Prospecto"}
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

export default ProspectForm;
