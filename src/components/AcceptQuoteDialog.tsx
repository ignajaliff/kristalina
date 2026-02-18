import { useState, useCallback } from "react";
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
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Eye, ArrowLeft, CheckCircle, Upload, Plus, Trash2 } from "lucide-react";

interface AcceptQuoteDialogProps {
  quote: Quote | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAcceptComplete: () => void;
}

type Step = "form" | "preview";

const DEVICE_INSTALLATION_OPTIONS = [
  "la sala de bombas y estanques de agua del edificio",
  "la sala de bombas, estanques de agua y torres de enfriamiento del edificio",
];

const DEFAULT_CONTEXTO_EMPRESA = (codigoVerificacion: string) =>
  `consta de Certificado de Estatuto Actualizado emitido por el Registro de Empresas y Sociedades del Ministerio de Economía, Fomento y Turismo de fecha 12 de enero de 2026, código de verificación: CRhHZW7rBhPL. Dichos instrumentos no se insertan por ser conocidos de las partes y del notario que autoriza`;

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
  contextoempresa: DEFAULT_CONTEXTO_EMPRESA(""),
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
  const [step, setStep] = useState<Step>("form");
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

  const handlePreview = () => {
    if (!legalData.legalrepresentative.trim()) {
      toast({
        title: "Campo requerido",
        description: "Ingresa el nombre del representante legal.",
        variant: "destructive",
      });
      return;
    }
    setStep("preview");
  };

  const handleAccept = async () => {
    if (!quote?.presupuesto_id) return;

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
          datos_contrato: legalData as any,
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
    }
  };

  const resetForm = () => {
    setStep("form");
    setManualContractFile(null);
    setLegalData(emptyLegalData());
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) resetForm();
    onOpenChange(open);
  };

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

  const personasAdicionales = legalData.personasadicionales || [];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[680px] max-h-[90vh] overflow-y-auto">
        {step === "form" ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-600" />
                Aceptar Presupuesto
              </DialogTitle>
              <DialogDescription>
                Completa la información legal para <strong>{quote?.communityname}</strong>. Podrás revisar el contrato
                antes de confirmarlo.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 py-2">
              {/* ── DATOS DE LA COMUNIDAD ── */}
              <SectionTitle>Datos de la comunidad</SectionTitle>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Nombre de la comunidad">
                  <Input
                    placeholder="Edificio Las Flores"
                    value={legalData.communityname}
                    onChange={(e) => handleChange("communityname", e.target.value)}
                  />
                </FormField>
                <FormField label="RUT Comunidad">
                  <Input
                    placeholder="12.345.678-9"
                    value={legalData.communityrut}
                    onChange={(e) => handleChange("communityrut", e.target.value)}
                  />
                </FormField>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Email Comunidad">
                  <Input
                    type="email"
                    placeholder="comunidad@email.com"
                    value={legalData.communityemail}
                    onChange={(e) => handleChange("communityemail", e.target.value)}
                  />
                </FormField>
                <FormField label="Dirección Comunidad">
                  <Input
                    placeholder="Av. Providencia 1234"
                    value={legalData.communityaddress}
                    onChange={(e) => handleChange("communityaddress", e.target.value)}
                  />
                </FormField>
              </div>
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
              <div className="grid grid-cols-1 gap-4">
                <FormField label="Notario Público Comunidad">
                  <Input
                    placeholder="Notario Público de Santiago"
                    value={legalData.communitynotary}
                    onChange={(e) => handleChange("communitynotary", e.target.value)}
                  />
                </FormField>
              </div>

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

              {/* Manual contract upload */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">
                  Subir contrato manualmente (opcional)
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
                  Si no adjuntas un archivo, el contrato se generará desde la plantilla.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={handlePreview} className="bg-[#1A367F] hover:bg-[#12285e] gap-2">
                <Eye className="h-4 w-4" /> Vista Previa del Contrato
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-[#1A367F]" />
                Vista Previa del Contrato
              </DialogTitle>
              <DialogDescription>
                Revisa y edita los datos antes de confirmar. Se generará un PDF con esta información.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 py-2">
              {/* Community Info (read-only from quote) */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Datos del Prospecto
                </h4>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                  <p>
                    <span className="font-medium text-muted-foreground">Comunidad:</span> {quote?.communityname}
                  </p>
                  <p>
                    <span className="font-medium text-muted-foreground">Dirección:</span>{" "}
                    {quote?.buildingaddress || "N/A"}
                  </p>
                  <p>
                    <span className="font-medium text-muted-foreground">Tipo:</span> {quote?.buildingtype}
                  </p>
                  <p>
                    <span className="font-medium text-muted-foreground">Unidades:</span> {quote?.units}
                  </p>
                  <p>
                    <span className="font-medium text-muted-foreground">Administrador:</span> {quote?.adminname}
                  </p>
                  <p>
                    <span className="font-medium text-muted-foreground">Email:</span> {quote?.adminemail}
                  </p>
                </div>
              </div>

              <Separator />

              {/* ── DATOS DE LA COMUNIDAD (editable) ── */}
              <h4 className="text-[11px] font-bold text-[#1A367F] uppercase tracking-wider">Datos de la comunidad</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Nombre comunidad</Label>
                  <Input
                    value={legalData.communityname}
                    onChange={(e) => handleChange("communityname", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">RUT Comunidad</Label>
                  <Input
                    value={legalData.communityrut}
                    onChange={(e) => handleChange("communityrut", e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Email Comunidad</Label>
                  <Input
                    value={legalData.communityemail}
                    onChange={(e) => handleChange("communityemail", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Dirección</Label>
                  <Input
                    value={legalData.communityaddress}
                    onChange={(e) => handleChange("communityaddress", e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Región</Label>
                  <Input
                    value={legalData.communityregion}
                    onChange={(e) => handleChange("communityregion", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Fecha Constitución</Label>
                  <Input
                    type="date"
                    value={legalData.communityformationdate}
                    onChange={(e) => handleChange("communityformationdate", e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Notario Público Comunidad</Label>
                  <Input
                    value={legalData.communitynotary}
                    onChange={(e) => handleChange("communitynotary", e.target.value)}
                  />
                </div>
              </div>

              <Separator />

              {/* ── DATOS DEL REPRESENTANTE LEGAL (editable) ── */}
              <h4 className="text-[11px] font-bold text-[#1A367F] uppercase tracking-wider">
                Datos del representante legal
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Representante Legal</Label>
                  <Input
                    value={legalData.legalrepresentative}
                    onChange={(e) => handleChange("legalrepresentative", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">RUT Representante</Label>
                  <Input
                    value={legalData.legalrepresentativerut}
                    onChange={(e) => handleChange("legalrepresentativerut", e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Sociedad Rep. Legal</Label>
                  <Input
                    value={legalData.legalrepresentativesociety}
                    onChange={(e) => handleChange("legalrepresentativesociety", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">RUT Sociedad</Label>
                  <Input value={legalData.societyrut} onChange={(e) => handleChange("societyrut", e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Fecha Constitución Sociedad</Label>
                  <Input
                    type="date"
                    value={legalData.societyformationdate}
                    onChange={(e) => handleChange("societyformationdate", e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Dirección de la Sociedad</Label>
                  <Input
                    value={legalData.societyaddress}
                    onChange={(e) => handleChange("societyaddress", e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Contexto Empresa</Label>
                  <Textarea
                    value={legalData.contextoempresa}
                    onChange={(e) => handleChange("contextoempresa", e.target.value)}
                    className="min-h-[100px] text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Nacionalidad</Label>
                  <Input
                    value={legalData.legalrepresentativenationality}
                    onChange={(e) => handleChange("legalrepresentativenationality", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Estado Civil</Label>
                  <Input
                    value={legalData.legalrepresentativemaritalstatus}
                    onChange={(e) => handleChange("legalrepresentativemaritalstatus", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Profesión</Label>
                  <Input
                    value={legalData.legalrepresentativeprofession}
                    onChange={(e) => handleChange("legalrepresentativeprofession", e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Notario Público Sociedad</Label>
                  <Input
                    value={legalData.societynotary}
                    onChange={(e) => handleChange("societynotary", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Teléfono</Label>
                  <Input
                    value={legalData.legalrepresentativephone}
                    onChange={(e) => handleChange("legalrepresentativephone", e.target.value)}
                  />
                </div>
              </div>

              {/* Personas adicionales en preview */}
              {personasAdicionales.length > 0 && (
                <>
                  <Separator />
                  <h4 className="text-[11px] font-bold text-[#1A367F] uppercase tracking-wider">
                    Personas adicionales
                  </h4>
                  {personasAdicionales.map((persona, index) => (
                    <div key={index} className="border border-blue-100 rounded-lg p-3 space-y-3 bg-blue-50/30">
                      <h5 className="text-xs font-bold text-[#1A367F]">Persona {index + 2}</h5>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold text-muted-foreground">Nombre</Label>
                          <Input
                            value={persona.nombre}
                            onChange={(e) => handlePersonaChange(index, "nombre", e.target.value)}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold text-muted-foreground">Dirección</Label>
                          <Input
                            value={persona.direccion}
                            onChange={(e) => handlePersonaChange(index, "direccion", e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold text-muted-foreground">Teléfono</Label>
                          <Input
                            value={persona.telefono}
                            onChange={(e) => handlePersonaChange(index, "telefono", e.target.value)}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold text-muted-foreground">Email</Label>
                          <Input
                            value={persona.email}
                            onChange={(e) => handlePersonaChange(index, "email", e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}

              <Separator />

              {/* ── DETALLE INSTALACIÓN (editable) ── */}
              <h4 className="text-[11px] font-bold text-[#1A367F] uppercase tracking-wider">
                Detalle Instalación Dispositivos
              </h4>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">Lugar de instalación</Label>
                <Select
                  value={legalData.deviceinstallation}
                  onValueChange={(v) => handleChange("deviceinstallation", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEVICE_INSTALLATION_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setStep("form")} className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Volver a Editar
              </Button>
              <Button
                onClick={handleAccept}
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700 gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                {isSubmitting ? "Procesando..." : "Confirmar y Generar Contrato"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
