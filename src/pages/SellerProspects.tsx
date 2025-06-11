
import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PlusCircle, Building2, Building, School, Factory, AlertCircle } from "lucide-react";

import SellerSidebar from "@/components/SellerSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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
type BuildingType = "Edificio" | "Escuela" | "Industria";

const WEBHOOK_URL = "https://n8n-n8n.qqtfab.easypanel.host/webhook-test/66abaac8-fdce-4dde-a287-df61767ba4af";

const SellerProspects = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedBuildingType, setSelectedBuildingType] = useState<BuildingType | null>(null);
  const [currentSeller, setCurrentSeller] = useState<string | null>(null);

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

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "additionalATs",
  });

  useEffect(() => {
    const fetchCurrentSeller = async () => {
      if (user?.email) {
        const { data: seller, error } = await supabase
          .from('vendedores')
          .select('nombre')
          .eq('email', user.email)
          .single();
        
        if (seller && !error) {
          setCurrentSeller(seller.nombre);
        }
      }
    };

    fetchCurrentSeller();
  }, [user?.email]);

  useEffect(() => {
    if (selectedBuildingType) {
      form.setValue("buildingType", selectedBuildingType);
    }
  }, [selectedBuildingType, form]);

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    
    try {
      console.log("Form data:", data);
      
      const additionalATs = data.additionalATs || [];
      
      // Prepare webhook data with seller information
      const webhookData = {
        ...data,
        vendedor: currentSeller,
        timestamp: new Date().toISOString(),
        source: "Kristalina CRM - Seller"
      };
      
      // Send to webhook only
      try {
        await fetch(WEBHOOK_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          mode: "no-cors",
          body: JSON.stringify(webhookData),
        });
        
        console.log("Webhook triggered successfully");

        toast({
          title: "Presupuesto enviado",
          description: "El presupuesto ha sido enviado correctamente para procesamiento.",
        });

        form.reset();
        setSelectedBuildingType(null);
        
      } catch (webhookError) {
        console.error("Error triggering webhook:", webhookError);
        throw new Error("Error al enviar el presupuesto");
      }

    } catch (error) {
      console.error("Error processing prospect:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al enviar el presupuesto. Por favor, intente nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBuildingTypeSelection = (type: BuildingType) => {
    setSelectedBuildingType(type);
    form.reset({
      adminName: "",
      adminEmail: "",
      managementCompany: "",
      legalRepresentative: "",
      additionalATs: [],
      communityName: "",
      buildingAddress: "",
      comuna: "",
      region: "",
      buildingType: type,
      units: 0,
    });
  };

  const getBuildingTypeLabel = (type: BuildingType) => {
    switch (type) {
      case "Edificio":
        return "Edificio";
      case "Escuela":
        return "Escuela";
      case "Industria":
        return "Industria";
      default:
        return "Edificio";
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <SellerSidebar />
      <div className="flex-1 overflow-y-auto">
        {/* Header with proper spacing */}
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Creación presupuesto Viviendas
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Registra los datos del prospecto para generar una cotización
                {currentSeller && (
                  <span className="ml-2 text-blue-600 font-medium">
                    • Vendedor: {currentSeller}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Main content with proper spacing */}
        <div className="p-8">
          {!selectedBuildingType ? (
            // Building type selection view
            <Card className="max-w-5xl mx-auto shadow-sm border-0">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
                <CardTitle className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Selecciona el Tipo de Edificio
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Button
                    onClick={() => handleBuildingTypeSelection("Edificio")}
                    variant="outline"
                    className="h-32 flex flex-col items-center justify-center gap-4 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                  >
                    <Building className="h-12 w-12 text-blue-600" />
                    <span className="text-lg font-medium">Edificios</span>
                  </Button>

                  <Button
                    onClick={() => handleBuildingTypeSelection("Escuela")}
                    variant="outline"
                    className="h-32 flex flex-col items-center justify-center gap-4 hover:bg-green-50 hover:border-green-300 transition-colors"
                  >
                    <School className="h-12 w-12 text-green-600" />
                    <span className="text-lg font-medium">Escuelas</span>
                  </Button>

                  <Button
                    onClick={() => handleBuildingTypeSelection("Industria")}
                    variant="outline"
                    className="h-32 flex flex-col items-center justify-center gap-4 hover:bg-orange-50 hover:border-orange-300 transition-colors"
                  >
                    <Factory className="h-12 w-12 text-orange-600" />
                    <span className="text-lg font-medium">Industrias</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            // Form view
            <Card className="max-w-5xl mx-auto shadow-sm border-0">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    Datos del Prospecto - {getBuildingTypeLabel(selectedBuildingType)}
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedBuildingType(null)}
                  >
                    Cambiar Tipo
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
                    
                    <div className="border-t border-gray-200 pt-8">
                      <h3 className="font-semibold text-lg mb-6 text-gray-800 flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Datos del {getBuildingTypeLabel(selectedBuildingType)}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="communityName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-1">
                                Nombre de la Comunidad ({getBuildingTypeLabel(selectedBuildingType)})
                                <span className="text-red-500">*</span>
                              </FormLabel>
                              <FormControl>
                                <Input placeholder={`Ej: ${getBuildingTypeLabel(selectedBuildingType)} Los Alpes`} {...field} />
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
                              <FormLabel>Dirección del {getBuildingTypeLabel(selectedBuildingType)}</FormLabel>
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
                                  placeholder={getBuildingTypeLabel(selectedBuildingType)}
                                  value={getBuildingTypeLabel(selectedBuildingType)}
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
                                  placeholder={selectedBuildingType === "Escuela" ? "Número de aulas" : selectedBuildingType === "Industria" ? "Número de secciones" : "Número de departamentos"}
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
                    
                    <div className="flex justify-end pt-6 border-t border-gray-200">
                      <Button 
                        type="submit" 
                        className="bg-blue-600 hover:bg-blue-700 px-8 py-3 text-base font-medium"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Enviando..." : "Guardar Presupuesto"}
                      </Button>
                    </div>
                    
                    {/* Required fields note */}
                    <div className="text-sm text-gray-500 flex items-center gap-2 pt-4">
                      <AlertCircle className="h-4 w-4" />
                      Los campos marcados con <span className="text-red-500 font-medium">*</span> son obligatorios
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerProspects;
