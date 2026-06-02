import { useState, useCallback, useRef } from "react";
import { Quote } from "@/utils/quoteStorage";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { DatosContrato } from "@/utils/contractPdfGenerator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FileText, CheckCircle, Upload, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AcceptQuoteDialogProps {
  quote: Quote | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAcceptComplete: () => void;
}

const DEVICE_INSTALLATION_OPTIONS = [
  "la sala de bombas y estanques de agua del edificio",
  "la sala de bombas, estanques de agua y torres de enfriamiento del edificio",
];

const DEFAULT_CONTEXTO_EMPRESA = () =>
  `consta de Certificado de Estatuto Actualizado emitido por el Registro de Empresas y Sociedades del Ministerio de Economía, Fomento y Turismo de fecha 12 de enero de 2026, código de verificación: CRhHZW7rBhPL. Dichos instrumentos no se insertan por ser conocidos de las partes y del notario que autoriza`;

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h4 className="text-[11px] font-bold text-[#1A367F] uppercase tracking-wider bg-[#EFF6FF] px-3 py-2 rounded-lg border border-blue-100">
    {children}
  </h4>
);

const FormField = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <Label className="text-xs font-semibold text-muted-foreground">{label}</Label>
    {children}
  </div>
);

export interface PersonaAdicional {
  nombre: string;
  direccion: string;
  telefono: string;
  email: string;
}

const emptyPersona = (): PersonaAdicional => ({
  nombre: "",
  direccion: "",
  telefono: "",
  email: "",
});

const emptyLegalData = (): DatosContrato => ({
  communityname: "",
  communityrut: "",
  communityemail: "",
  communityaddress: "",
  communityregion: "",
  communityformationdate: "",
  communitynotary: "",
  legalrepresentative: "",
  legalrepresentativerut: "",
  legalrepresentativesociety: "",
  societyrut: "",
  societyformationdate: "",
  societyaddress: "",
  contextoempresa: DEFAULT_CONTEXTO_EMPRESA(),
  legalrepresentativenationality: "",
  legalrepresentativemaritalstatus: "",
  legalrepresentativeprofession: "",
  societynotary: "",
  deviceinstallation: DEVICE_INSTALLATION_OPTIONS[0],
  legalrepresentativephone: "",
  contractTerm: "1",
  personasadicionales: [],
});

export default function AcceptQuoteDialog({ quote, open, onOpenChange, onAcceptComplete }: AcceptQuoteDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Synchronous re-entry guard: prevents a double-click from creating two
  // contratos while the async submit (file upload + inserts) is in flight.
  const isProcessingRef = useRef(false);
  const [contractMode, setContractMode] = useState<"auto" | "manual">("auto");
  const [manualContractFile, setManualContractFile] = useState<File | null>(null);
  const [legalData, setLegalData] = useState<DatosContrato>(emptyLegalData());

  const handleChange = useCallback((field: keyof DatosContrato, value: string) => {
    setLegalData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handlePersonaChange = useCallback((index: number, field: keyof PersonaAdicional, value: string) => {
    setLegalData((prev) => {
      const personas = [...(prev.personasadicionales || [])];
      personas[index] = { ...personas[index], [field]: value };
      return { ...prev, personasadicionales: personas };
    });
  }, []);

  const addPersona = useCallback(() => {
    setLegalData((prev) => ({
      ...prev,
      personasadicionales: [...(prev.personasadicionales || []), emptyPersona()],
    }));
  }, []);

  const removePersona = useCallback((index: number) => {
    setLegalData((prev) => ({
      ...prev,
      personasadicionales: (prev.personasadicionales || []).filter((_, i) => i !== index),
    }));
  }, []);

  const handleSubmit = () => {
    // Manual mode: file + community data are all required.
    if (contractMode === "manual") {
      const missing: string[] = [];
      if (!manualContractFile) missing.push("Documento del contrato");
      if (!legalData.communityname.trim()) missing.push("Nombre de la comunidad");
      if (!legalData.communityrut.trim()) missing.push("RUT Comunidad");
      if (!legalData.communityemail.trim()) missing.push("Email Comunidad");
      if (!legalData.communityaddress.trim()) missing.push("Dirección Comunidad");
      if (missing.length > 0) {
        toast({
          title: "Información incompleta",
          description: `Completa los campos obligatorios: ${missing.join(", ")}.`,
          variant: "destructive",
        });
        return;
      }
      handleAccept();
      return;
    }
    // Auto mode: create the contract directly (no preview step).
    if (!legalData.legalrepresentative.trim()) {
      toast({
        title: "Campo requerido",
        description: "Ingresa el nombre del representante legal.",
        variant: "destructive",
      });
      return;
    }
    handleAccept();
  };

  const handleAccept = async () => {
    if (!quote?.presupuesto_id) return;
    if (isProcessingRef.current) return; // evita doble ejecución por doble clic
    isProcessingRef.current = true;

    setIsSubmitting(true);
    try {
      const { error: updateError } = await supabase
        .from("presupuestos")
        .update({
          estado: "Aceptado",
          fecha_aprobacion: new Date().toISOString().split("T")[0],
        })
        .eq("id", quote.presupuesto_id);

      if (updateError) throw updateError;

      let docUrl: string | null = null;
      if (manualContractFile) {
        const fileName = `contrato_${quote.id}_${Date.now()}.pdf`;
        const { error: uploadError } = await supabase.storage
          .from("presupuestos-pdf")
          .upload(fileName, manualContractFile, { contentType: manualContractFile.type });

        if (uploadError) {
          console.error("Error uploading contract file:", uploadError);
        } else {
          const { data: urlData } = supabase.storage.from("presupuestos-pdf").getPublicUrl(fileName);
          docUrl = urlData.publicUrl;
        }
      }

      const { error: contratoError } = await supabase.from("contratos").insert([
        {
          prospecto_id: quote.id,
          estado_contrato: "Contrato no firmado",
          estado_equipos: "Equipos sin instalar",
          datos_contrato: { ...legalData, datos_presupuesto: quote.datos_presupuesto } as any,
          doc_contrato: docUrl,
        },
      ]);

      if (contratoError) {
        console.error("Error creating contrato:", contratoError);
        toast({ title: "Advertencia", description: "Presupuesto aceptado pero hubo un error al crear el contrato." });
      }

      await supabase.from("prospectos").update({ estado_contacto: "Presupuesto Aceptado" }).eq("id", quote.id);

      toast({ title: "Presupuesto aceptado", description: "El contrato ha sido generado y almacenado correctamente." });
      resetForm();
      onOpenChange(false);
      onAcceptComplete();
    } catch (error) {
      console.error("Error al aceptar presupuesto:", error);
      toast({
        title: "Error",
        description: "Ha ocurrido un error al procesar el presupuesto.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      isProcessingRef.current = false;
    }
  };

  const resetForm = () => {
    setContractMode("auto");
    setManualContractFile(null);
    setLegalData(emptyLegalData());
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) resetForm();
    onOpenChange(open);
  };

  const personasAdicionales = legalData.personasadicionales || [];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[680px] max-h-[90vh] overflow-y-auto">
        <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-600" />
                Aceptar Presupuesto
              </DialogTitle>
              <DialogDescription>
                {contractMode === "auto"
                  ? <>Completa la información legal para <strong>{quote?.communityname}</strong>. Podrás revisar el contrato antes de confirmarlo.</>
                  : <>Sube el contrato de <strong>{quote?.communityname}</strong> y completa los datos básicos de la comunidad.</>}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 py-2">
              {/* ── SELECTOR DE MODO ── */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-[#F1F5F9] rounded-lg">
                <button
                  type="button"
                  onClick={() => setContractMode("auto")}
                  className={cn(
                    "py-2 px-3 rounded-md text-xs font-bold uppercase tracking-wider transition-all",
                    contractMode === "auto" ? "bg-white text-[#1A367F] shadow-sm" : "text-[#64748B] hover:text-[#1A367F]"
                  )}
                >
                  Contrato automático
                </button>
                <button
                  type="button"
                  onClick={() => setContractMode("manual")}
                  className={cn(
                    "py-2 px-3 rounded-md text-xs font-bold uppercase tracking-wider transition-all",
                    contractMode === "manual" ? "bg-white text-[#1A367F] shadow-sm" : "text-[#64748B] hover:text-[#1A367F]"
                  )}
                >
                  Cargar manual
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground -mt-2">
                {contractMode === "auto"
                  ? "Se generará el contrato desde la plantilla con los datos que completes."
                  : "Adjuntarás tu propio documento. Solo se piden los datos de comunidad que aparecen en el reporte."}
              </p>

              {/* ── DATOS DE LA COMUNIDAD ── */}
              <SectionTitle>Datos de la comunidad</SectionTitle>
              <div className="grid grid-cols-2 gap-4">
                <FormField label={`Nombre de la comunidad${contractMode === "manual" ? " *" : ""}`}>
                  <Input
                    placeholder="Edificio Las Flores"
                    value={legalData.communityname}
                    onChange={(e) => handleChange("communityname", e.target.value)}
                  />
                </FormField>
                <FormField label={`RUT Comunidad${contractMode === "manual" ? " *" : ""}`}>
                  <Input
                    placeholder="12.345.678-9"
                    value={legalData.communityrut}
                    onChange={(e) => handleChange("communityrut", e.target.value)}
                  />
                </FormField>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField label={`Email Comunidad${contractMode === "manual" ? " *" : ""}`}>
                  <Input
                    type="email"
                    placeholder="comunidad@email.com"
                    value={legalData.communityemail}
                    onChange={(e) => handleChange("communityemail", e.target.value)}
                  />
                </FormField>
                <FormField label={`Dirección Comunidad${contractMode === "manual" ? " *" : ""}`}>
                  <Input
                    placeholder="Av. Providencia 1234"
                    value={legalData.communityaddress}
                    onChange={(e) => handleChange("communityaddress", e.target.value)}
                  />
                </FormField>
              </div>
              {contractMode === "auto" && (
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Región">
                  <Input
                    placeholder="Metropolitana"
                    value={legalData.communityregion}
                    onChange={(e) => handleChange("communityregion", e.target.value)}
                  />
                </FormField>
                <FormField label="Fecha Constitución">
                  <Input
                    type="date"
                    value={legalData.communityformationdate}
                    onChange={(e) => handleChange("communityformationdate", e.target.value)}
                  />
                </FormField>
              </div>
              )}
              {contractMode === "auto" && (
              <div className="grid grid-cols-1 gap-4">
                <FormField label="Notario Público Comunidad">
                  <Input
                    placeholder="Notario Público de Santiago"
                    value={legalData.communitynotary}
                    onChange={(e) => handleChange("communitynotary", e.target.value)}
                  />
                </FormField>
              </div>
              )}

              {/* ── DOCUMENTO MANUAL (solo modo manual) ── */}
              {contractMode === "manual" && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">
                    Documento del contrato *
                  </Label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => setManualContractFile(e.target.files?.[0] || null)}
                      className="text-xs"
                    />
                    {manualContractFile && (
                      <Badge variant="secondary" className="text-[10px] whitespace-nowrap">
                        <Upload className="h-3 w-3 mr-1" />
                        {manualContractFile.name}
                      </Badge>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Formatos aceptados: PDF, DOC, DOCX.
                  </p>
                </div>
              )}

              {/* ── SECCIÓN LEGAL (solo modo automático) ── */}
              {contractMode === "auto" && (
              <>
              {/* ── DATOS DEL REPRESENTANTE LEGAL ── */}
              <SectionTitle>Datos del representante legal</SectionTitle>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Representante Legal *">
                  <Input
                    placeholder="Nombre completo"
                    value={legalData.legalrepresentative}
                    onChange={(e) => handleChange("legalrepresentative", e.target.value)}
                  />
                </FormField>
                <FormField label="RUT Representante">
                  <Input
                    placeholder="12.345.678-9"
                    value={legalData.legalrepresentativerut}
                    onChange={(e) => handleChange("legalrepresentativerut", e.target.value)}
                  />
                </FormField>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Sociedad del representante legal">
                  <Input
                    placeholder="Nombre de la sociedad"
                    value={legalData.legalrepresentativesociety}
                    onChange={(e) => handleChange("legalrepresentativesociety", e.target.value)}
                  />
                </FormField>
                <FormField label="RUT Sociedad">
                  <Input
                    placeholder="12.345.678-9"
                    value={legalData.societyrut}
                    onChange={(e) => handleChange("societyrut", e.target.value)}
                  />
                </FormField>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Fecha de Constitución Sociedad">
                  <Input
                    type="date"
                    value={legalData.societyformationdate}
                    onChange={(e) => handleChange("societyformationdate", e.target.value)}
                  />
                </FormField>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <FormField label="Dirección de la Sociedad">
                  <Input
                    placeholder="Av. Providencia 1234, Santiago"
                    value={legalData.societyaddress}
                    onChange={(e) => handleChange("societyaddress", e.target.value)}
                  />
                </FormField>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <FormField label="Contexto Empresa">
                  <Textarea
                    placeholder="Texto del contexto empresa para el contrato..."
                    value={legalData.contextoempresa}
                    onChange={(e) => handleChange("contextoempresa", e.target.value)}
                    className="min-h-[100px] text-xs"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Se autocompleta con el código de verificación. Puedes editarlo libremente.
                  </p>
                </FormField>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <FormField label="Nacionalidad Rep.">
                  <Input
                    placeholder="Chilena"
                    value={legalData.legalrepresentativenationality}
                    onChange={(e) => handleChange("legalrepresentativenationality", e.target.value)}
                  />
                </FormField>
                <FormField label="Estado Civil">
                  <Input
                    placeholder="Soltero/a"
                    value={legalData.legalrepresentativemaritalstatus}
                    onChange={(e) => handleChange("legalrepresentativemaritalstatus", e.target.value)}
                  />
                </FormField>
                <FormField label="Profesión">
                  <Input
                    placeholder="Ingeniero"
                    value={legalData.legalrepresentativeprofession}
                    onChange={(e) => handleChange("legalrepresentativeprofession", e.target.value)}
                  />
                </FormField>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Notario Público Sociedad">
                  <Input
                    placeholder="Notario Público de Santiago"
                    value={legalData.societynotary}
                    onChange={(e) => handleChange("societynotary", e.target.value)}
                  />
                </FormField>
                <FormField label="Teléfono Representante">
                  <Input
                    placeholder="+56 9 1234 5678"
                    value={legalData.legalrepresentativephone}
                    onChange={(e) => handleChange("legalrepresentativephone", e.target.value)}
                  />
                </FormField>
              </div>

              {/* ── PERSONAS ADICIONALES ── */}
              {personasAdicionales.map((persona, index) => (
                <div key={index} className="border border-blue-100 rounded-lg p-4 space-y-3 bg-blue-50/30">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-[#1A367F] uppercase tracking-wider">Persona {index + 2}</h5>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive hover:text-destructive"
                      onClick={() => removePersona(index)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="Nombre completo">
                      <Input
                        placeholder="Nombre completo"
                        value={persona.nombre}
                        onChange={(e) => handlePersonaChange(index, "nombre", e.target.value)}
                      />
                    </FormField>
                    <FormField label="Dirección">
                      <Input
                        placeholder="Dirección"
                        value={persona.direccion}
                        onChange={(e) => handlePersonaChange(index, "direccion", e.target.value)}
                      />
                    </FormField>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="Teléfono">
                      <Input
                        placeholder="+56 9 1234 5678"
                        value={persona.telefono}
                        onChange={(e) => handlePersonaChange(index, "telefono", e.target.value)}
                      />
                    </FormField>
                    <FormField label="Email">
                      <Input
                        type="email"
                        placeholder="email@ejemplo.com"
                        value={persona.email}
                        onChange={(e) => handlePersonaChange(index, "email", e.target.value)}
                      />
                    </FormField>
                  </div>
                </div>
              ))}

              <Button
                variant="outline"
                size="sm"
                onClick={addPersona}
                className="gap-2 border-dashed border-blue-300 text-[#1A367F] hover:bg-blue-50"
              >
                <Plus className="h-4 w-4" />
                Agregar persona al contrato
              </Button>

              {/* ── DETALLE INSTALACIÓN ── */}
              <SectionTitle>Detalle Instalación Dispositivos</SectionTitle>
              <FormField label="Lugar de instalación">
                <Select
                  value={legalData.deviceinstallation}
                  onValueChange={(v) => handleChange("deviceinstallation", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar lugar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {DEVICE_INSTALLATION_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              </>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-[#1A367F] hover:bg-[#12285e] gap-2">
                {isSubmitting ? (
                  <>Procesando...</>
                ) : (
                  <><CheckCircle className="h-4 w-4" /> {contractMode === "manual" ? "Confirmar y Subir Contrato" : "Crear Contrato"}</>
                )}
              </Button>
            </DialogFooter>
          </>
      </DialogContent>
    </Dialog>
  );
}
