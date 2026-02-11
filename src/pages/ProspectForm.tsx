
import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Droplet, PlusCircle, AlertCircle, Building, School, Factory, UserPlus, ArrowRight, Plus } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  adminName: z.string().min(1, { message: "El nombre del administrador es obligatorio" }),
  adminEmail: z.string().email({ message: "Correo electrónico inválido" }).min(1, { message: "El correo del administrador es obligatorio" }),
  managementCompany: z.string().optional(),
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
  nombrePortero: z.string().optional(),
  notas: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;
type BuildingType = "Edificio" | "Escuela" | "Industria";

const SelectionCard = ({ onClick, icon: Icon, label, iconColor }: { onClick: () => void; icon: any; label: string; iconColor: string }) => (
  <button
    onClick={onClick}
    className={cn(
      "group relative p-8 rounded-xl border-2 border-[#E2E8F0] bg-white",
      "hover:border-[#3B82F6] hover:shadow-lg transition-all duration-200",
      "flex flex-col items-center justify-center gap-4 cursor-pointer"
    )}
  >
    <div className="p-4 bg-[#F8FAFC] rounded-xl group-hover:bg-[#EFF6FF] transition-colors">
      <Icon className={cn("h-10 w-10", iconColor)} strokeWidth={1.5} />
    </div>
    <span className="text-[13px] font-bold text-[#1E293B] uppercase tracking-widest">{label}</span>
  </button>
);

const ProspectForm = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedBuildingType, setSelectedBuildingType] = useState<BuildingType | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      adminName: "",
      adminEmail: "",
      managementCompany: "",
      additionalATs: [],
      communityName: "",
      buildingAddress: "",
      comuna: "",
      region: "",
      buildingType: "Edificio",
      units: 0,
      nombrePortero: "",
      notas: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "additionalATs",
  });

  useEffect(() => {
    if (selectedBuildingType) {
      form.setValue("buildingType", selectedBuildingType);
    }
  }, [selectedBuildingType, form]);

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);

    try {
      const additionalATs = data.additionalATs || [];

      const supabaseData = {
        adminname: data.adminName,
        adminemail: data.adminEmail,
        managementcompany: data.managementCompany || null,
        additional_at: additionalATs,
        communityname: data.communityName,
        buildingaddress: data.buildingAddress || null,
        comuna: data.comuna || null,
        region: data.region || null,
        buildingtype: data.buildingType,
        units: data.units,
        vendedor_id: userProfile?.id || null,
        vendedor: userProfile?.nombre || null,
        estado_contacto: "Primer Contacto",
        nombre_portero: data.nombrePortero || null,
        notas: data.notas || null,
      };

      const { data: insertedData, error: supabaseError } = await supabase
        .from('prospectos')
        .insert([supabaseData])
        .select()
        .single();

      if (supabaseError) {
        console.error("Error saving to Supabase:", supabaseError);
        throw new Error("Error al guardar en la base de datos");
      }

      toast({
        title: "Cliente guardado",
        description: "Los datos del cliente han sido guardados correctamente.",
      });

      form.reset();
      setSelectedBuildingType(null);

      setTimeout(() => {
        navigate("/admin/clientes");
      }, 1500);

    } catch (error) {
      console.error("Error processing prospect:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al guardar los datos del cliente. Por favor, intente nuevamente.",
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
      additionalATs: [],
      communityName: "",
      buildingAddress: "",
      comuna: "",
      region: "",
      buildingType: type,
      units: 0,
      nombrePortero: "",
      notas: "",
    });
  };

  const getBuildingTypeLabel = (type: BuildingType) => {
    switch (type) {
      case "Edificio": return "Edificio";
      case "Escuela": return "Escuela";
      case "Industria": return "Industria";
      default: return "Edificio";
    }
  };

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden">
      <div className="max-w-5xl mx-auto p-8 pt-10 pb-4">
        <div className="flex items-center gap-4 mb-2">
          <div className="p-3 bg-[#EFF6FF] rounded-[14px]">
            <UserPlus className="h-7 w-7 text-[#1A367F]" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#1E293B]">Captura Cliente</h1>
            <p className="text-[#64748B] text-sm font-medium mt-0.5">
              Registra los datos del cliente para generar una cotización
              {userProfile?.nombre && (
                <span className="text-[#3B82F6] font-semibold">
                  {" "}<span className="text-[#E2E8F0] px-1">•</span> Vendedor: {userProfile.nombre}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 pb-12">
          {!selectedBuildingType ? (
            <Card className="border border-[#E2E8F0] shadow-sm bg-white overflow-hidden rounded-xl">
              <CardHeader className="border-b border-[#F1F5F9] p-6 py-5 bg-[#F8FAFC]/50">
                <CardTitle className="text-[13px] font-bold text-[#1A367F] uppercase tracking-widest flex items-center gap-2.5">
                  <div className="w-1.5 h-1.5 bg-[#3B82F6] rounded-full"></div>
                  Selecciona el Tipo de Edificio
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <SelectionCard onClick={() => handleBuildingTypeSelection("Edificio")} icon={Building} label="Edificios" iconColor="text-[#1A367F]" />
                  <SelectionCard onClick={() => handleBuildingTypeSelection("Escuela")} icon={School} label="Escuelas" iconColor="text-[#10B981]" />
                  <SelectionCard onClick={() => handleBuildingTypeSelection("Industria")} icon={Factory} label="Industrias" iconColor="text-[#F59E0B]" />
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border border-[#E2E8F0] shadow-sm bg-white overflow-hidden rounded-xl">
              <CardHeader className="border-b border-[#F1F5F9] p-6 py-5 bg-[#F8FAFC]/50">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-[13px] font-bold text-[#1A367F] uppercase tracking-widest flex items-center gap-2.5">
                    <div className="w-1.5 h-1.5 bg-[#3B82F6] rounded-full"></div>
                    Datos del Cliente - {getBuildingTypeLabel(selectedBuildingType)}
                  </CardTitle>
                  <Button variant="outline" size="sm" className="h-8 border-[#E2E8F0] text-[10px] font-bold uppercase tracking-wider text-[#64748B] hover:text-[#1A367F] hover:bg-[#EFF6FF] rounded-md" onClick={() => setSelectedBuildingType(null)}>
                    Cambiar Tipo
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                      <FormField control={form.control} name="adminName" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[11px] font-bold text-[#1E293B] uppercase tracking-[0.05em] mb-2.5 block">Nombre del Administrador</FormLabel>
                          <FormControl><Input placeholder="Nombre completo" {...field} className="h-11 border-[#E2E8F0] font-medium text-[#1E293B] placeholder:text-[#94A3B8] focus-visible:ring-[#3B82F6] rounded-lg" /></FormControl>
                          <FormMessage className="text-[11px] font-bold text-[#EF4444] mt-1.5" />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="adminEmail" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[11px] font-bold text-[#1E293B] uppercase tracking-[0.05em] mb-2.5 block">Correo del Administrador</FormLabel>
                          <FormControl><Input type="email" placeholder="correo@ejemplo.com" {...field} className="h-11 border-[#E2E8F0] font-medium text-[#1E293B] placeholder:text-[#94A3B8] focus-visible:ring-[#3B82F6] rounded-lg" /></FormControl>
                          <FormMessage className="text-[11px] font-bold text-[#EF4444] mt-1.5" />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="managementCompany" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[11px] font-bold text-[#1E293B] uppercase tracking-[0.05em] mb-2.5 block">Empresa Administradora</FormLabel>
                          <FormControl><Input placeholder="Nombre de la empresa" {...field} className="h-11 border-[#E2E8F0] font-medium text-[#1E293B] placeholder:text-[#94A3B8] focus-visible:ring-[#3B82F6] rounded-lg" /></FormControl>
                          <FormMessage className="text-[11px] font-bold text-[#EF4444] mt-1.5" />
                        </FormItem>
                      )} />
                    </div>

                    {fields.length > 0 && (
                      <div className="space-y-6 pt-2">
                        {fields.map((field, index) => (
                          <div key={field.id} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 pt-6 border-t border-[#F1F5F9]">
                            <FormField control={form.control} name={`additionalATs.${index}.name`} render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-[11px] font-bold text-[#1E293B] uppercase tracking-[0.05em] mb-2.5 block">Nombre del nuevo AT</FormLabel>
                                <FormControl><Input placeholder="Nombre completo" {...field} className="h-11 border-[#E2E8F0] font-medium text-[#1E293B] placeholder:text-[#94A3B8] focus-visible:ring-[#3B82F6] rounded-lg" /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />
                            <FormField control={form.control} name={`additionalATs.${index}.email`} render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-[11px] font-bold text-[#1E293B] uppercase tracking-[0.05em] mb-2.5 block">Correo nuevo AT</FormLabel>
                                <FormControl><Input type="email" placeholder="correo@ejemplo.com" {...field} className="h-11 border-[#E2E8F0] font-medium text-[#1E293B] placeholder:text-[#94A3B8] focus-visible:ring-[#3B82F6] rounded-lg" /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />
                          </div>
                        ))}
                      </div>
                    )}

                    <div>
                      <Button type="button" variant="outline" size="sm" className="h-10 px-5 border-[#E2E8F0] bg-white text-[#1A367F] font-bold text-[10px] uppercase tracking-wider flex items-center gap-2 rounded-lg shadow-sm hover:bg-[#EFF6FF] hover:border-[#3B82F6] transition-all" onClick={() => append({ name: "", email: "" })}>
                        <Plus className="h-4 w-4" strokeWidth={3} />
                        Agregar otro AT
                      </Button>
                    </div>

                    <div className="pt-4 space-y-8">
                      <h3 className="text-[13px] font-bold text-[#1E293B] uppercase tracking-widest flex items-center gap-2.5 pt-4">
                        <div className="w-1.5 h-1.5 bg-[#10B981] rounded-full"></div>
                        Datos del {getBuildingTypeLabel(selectedBuildingType)}
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        <FormField control={form.control} name="communityName" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[11px] font-bold text-[#1E293B] uppercase tracking-[0.05em] mb-2.5 block">Nombre de la Comunidad</FormLabel>
                            <FormControl><Input placeholder={`Ej: ${getBuildingTypeLabel(selectedBuildingType)} Los Alpes`} {...field} className="h-11 border-[#E2E8F0] font-medium text-[#1E293B] placeholder:text-[#94A3B8] focus-visible:ring-[#3B82F6] rounded-lg" /></FormControl>
                            <FormMessage className="text-[11px] font-bold text-[#EF4444] mt-1.5" />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="buildingAddress" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[11px] font-bold text-[#1E293B] uppercase tracking-[0.05em] mb-2.5 block">Dirección del {getBuildingTypeLabel(selectedBuildingType)}</FormLabel>
                            <FormControl><Input placeholder="Calle y número" {...field} className="h-11 border-[#E2E8F0] font-medium text-[#1E293B] placeholder:text-[#94A3B8] focus-visible:ring-[#3B82F6] rounded-lg" /></FormControl>
                            <FormMessage className="text-[11px] font-bold text-[#EF4444] mt-1.5" />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="comuna" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[11px] font-bold text-[#1E293B] uppercase tracking-[0.05em] mb-2.5 block">Comuna</FormLabel>
                            <FormControl><Input placeholder="Comuna" {...field} className="h-11 border-[#E2E8F0] font-medium text-[#1E293B] placeholder:text-[#94A3B8] focus-visible:ring-[#3B82F6] rounded-lg" /></FormControl>
                            <FormMessage className="text-[11px] font-bold text-[#EF4444] mt-1.5" />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="region" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[11px] font-bold text-[#1E293B] uppercase tracking-[0.05em] mb-2.5 block">Región</FormLabel>
                            <FormControl><Input placeholder="Región" {...field} className="h-11 border-[#E2E8F0] font-medium text-[#1E293B] placeholder:text-[#94A3B8] focus-visible:ring-[#3B82F6] rounded-lg" /></FormControl>
                            <FormMessage className="text-[11px] font-bold text-[#EF4444] mt-1.5" />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="units" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[11px] font-bold text-[#1E293B] uppercase tracking-[0.05em] mb-2.5 block">Cantidad de Unidades</FormLabel>
                            <FormControl><Input type="number" placeholder="0" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} className="h-11 border-[#E2E8F0] font-medium text-[#1E293B] placeholder:text-[#94A3B8] focus-visible:ring-[#3B82F6] rounded-lg" /></FormControl>
                            <FormMessage className="text-[11px] font-bold text-[#EF4444] mt-1.5" />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="nombrePortero" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[11px] font-bold text-[#1E293B] uppercase tracking-[0.05em] mb-2.5 block">Nombre del Portero</FormLabel>
                            <FormControl><Input placeholder="Nombre del portero" {...field} className="h-11 border-[#E2E8F0] font-medium text-[#1E293B] placeholder:text-[#94A3B8] focus-visible:ring-[#3B82F6] rounded-lg" /></FormControl>
                            <FormMessage className="text-[11px] font-bold text-[#EF4444] mt-1.5" />
                          </FormItem>
                        )} />
                      </div>

                      <FormField control={form.control} name="notas" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[11px] font-bold text-[#1E293B] uppercase tracking-[0.05em] mb-2.5 block">Notas Adicionales</FormLabel>
                          <FormControl><Textarea placeholder="Observaciones o notas adicionales..." {...field} className="min-h-[100px] border-[#E2E8F0] font-medium text-[#1E293B] placeholder:text-[#94A3B8] focus-visible:ring-[#3B82F6] rounded-lg resize-none" /></FormControl>
                          <FormMessage className="text-[11px] font-bold text-[#EF4444] mt-1.5" />
                        </FormItem>
                      )} />
                    </div>

                    <div className="pt-6 flex justify-end gap-4">
                      <Button type="button" variant="outline" onClick={() => setSelectedBuildingType(null)} className="h-12 px-6 border-[#E2E8F0] text-[#64748B] font-bold text-[11px] uppercase tracking-wider rounded-xl">
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={isSubmitting} className="h-12 px-8 bg-[#1A367F] hover:bg-[#12285e] text-white font-bold text-[11px] uppercase tracking-wider rounded-xl gap-2 shadow-sm transition-all active:scale-[0.98]">
                        {isSubmitting ? "Guardando..." : "Guardar Cliente"}
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
        )}
      </div>
    </div>
  );
};

export default ProspectForm;
