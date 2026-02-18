
import { useState, useCallback } from "react";
import { Quote } from "@/utils/quoteStorage";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { DatosContrato, PersonaAdicional } from "@/utils/contractPdfGenerator";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FileText, CheckCircle, Upload, Plus, Trash2 } from "lucide-react";

// ─── Sub-components defined OUTSIDE the parent to avoid remount on each render ───
const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h4 className="text-[11px] font-bold text-[#1A367F] uppercase tracking-wider bg-[#EFF6FF] px-3 py-2 rounded-lg border border-blue-100">
    {children}
  </h4>
);

const FormField = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <Label className="text-xs font-semibold text-muted-foreground">
      {label}{required && <span className="text-destructive ml-0.5">*</span>}
    </Label>
    {children}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────

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

const DEFAULT_CONTEXTO_EMPRESA =
  "consta de Certificado de Estatuto Actualizado emitido por el Registro de Empresas y Sociedades del Ministerio de Economía, Fomento y Turismo de fecha 12 de enero de 2026. Dichos instrumentos no se insertan por ser conocidos de las partes y del notario que autoriza";

const emptyPersona = (): PersonaAdicional => ({ nombre: "", direccion: "", telefono: "", email: "" });

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
  contextoempresa: DEFAULT_CONTEXTO_EMPRESA,
  legalrepresentativenationality: "",
  legalrepresentativemaritalstatus: "",
  legalrepresentativeprofession: "",
  societynotary: "",
  deviceinstallation: DEVICE_INSTALLATION_OPTIONS[0],
  legalrepresentativephone: "",
  contractTerm: "1",
  personasadicionales: [],
});

const REQUIRED_FIELDS: Array<{ key: keyof DatosContrato; label: string }> = [
  { key: "communityname", label: "Nombre de la comunidad" },
  { key: "communityrut", label: "RUT Comunidad" },
  { key: "communityemail", label: "Email Comunidad" },
  { key: "communityaddress", label: "Dirección Comunidad" },
  { key: "communityregion", label: "Región" },
  { key: "communityformationdate", label: "Fecha Constitución Comunidad" },
  { key: "communitynotary", label: "Notario Público Comunidad" },
  { key: "legalrepresentative", label: "Representante Legal" },
  { key: "legalrepresentativerut", label: "RUT Representante" },
  { key: "legalrepresentativesociety", label: "Sociedad del representante legal" },
  { key: "societyrut", label: "RUT Sociedad" },
  { key: "societyformationdate", label: "Fecha Constitución Sociedad" },
  { key: "societyaddress", label: "Dirección de la Sociedad" },
  { key: "contextoempresa", label: "Contexto Empresa" },
  { key: "legalrepresentativenationality", label: "Nacionalidad" },
  { key: "legalrepresentativemaritalstatus", label: "Estado Civil" },
  { key: "legalrepresentativeprofession", label: "Profesión" },
  { key: "societynotary", label: "Notario Público Sociedad" },
  { key: "legalrepresentativephone", label: "Teléfono Representante" },
  { key: "deviceinstallation", label: "Lugar de instalación" },
];

export default function AcceptQuoteDialog({ quote, open, onOpenChange, onAcceptComplete }: AcceptQuoteDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [manualContractFile, setManualContractFile] = useState<File | null>(null);
  const [legalData, setLegalData] = useState<DatosContrato>(emptyLegalData());

  const handleChange = useCallback((field: keyof DatosContrato, value: string) => {
    setLegalData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handlePersonaChange = useCallback((index: number, field: keyof PersonaAdicional, value: string) => {
    setLegalData(prev => {
      const personas = [...(prev.personasadicionales || [])];
      personas[index] = { ...personas[index], [field]: value };
      return { ...prev, personasadicionales: personas };
    });
  }, []);

  const addPersona = useCallback(() => {
    setLegalData(prev => ({
      ...prev,
      personasadicionales: [...(prev.personasadicionales || []), emptyPersona()],
    }));
  }, []);

  const removePersona = useCallback((index: number) => {
    setLegalData(prev => ({
      ...prev,
      personasadicionales: (prev.personasadicionales || []).filter((_, i) => i !== index),
    }));
  }, []);

  const validate = (): boolean => {
    for (const { key, label } of REQUIRED_FIELDS) {
      const val = legalData[key];
      if (!val || (typeof val === "string" && !val.trim())) {
        toast({ title: "Campo requerido", description: `El campo "${label}" es obligatorio.`, variant: "destructive" });
        return false;
      }
    }
    return true;
  };

  const handleAccept = async () => {
    if (!quote?.presupuesto_id) return;
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const { error: updateError } = await supabase
        .from("presupuestos")
        .update({
          estado: "Aceptado",
          fecha_aprobacion: new Date().toISOString().split('T')[0],
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

      const { error: contratoError } = await supabase
        .from("contratos")
        .insert([{
          prospecto_id: quote.id,
          estado_contrato: "Contrato no firmado",
          estado_equipos: "Equipos sin instalar",
          datos_contrato: legalData as any,
          doc_contrato: docUrl,
        }]);

      if (contratoError) {
        console.error("Error creating contrato:", contratoError);
        toast({ title: "Advertencia", description: "Presupuesto aceptado pero hubo un error al crear el contrato." });
      }

      await supabase
        .from("prospectos")
        .update({ estado_contacto: "Presupuesto Aceptado" })
        .eq("id", quote.id);

      toast({ title: "Presupuesto aceptado", description: "El contrato ha sido generado y almacenado correctamente." });
      resetForm();
      onOpenChange(false);
      onAcceptComplete();
    } catch (error) {
      console.error("Error al aceptar presupuesto:", error);
      toast({ title: "Error", description: "Ha ocurrido un error al procesar el presupuesto.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
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
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-emerald-600" />
            Aceptar Presupuesto
          </DialogTitle>
          <DialogDescription>
            Completa la información legal para <strong>{quote?.communityname}</strong>. Los campos marcados con <span className="text-destructive">*</span> son obligatorios.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">

          {/* ── DATOS DE LA COMUNIDAD ── */}
          <SectionTitle>Datos de la comunidad</SectionTitle>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Nombre de la comunidad" required>
              <Input placeholder="Edificio Las Flores" value={legalData.communityname} onChange={e => handleChange("communityname", e.target.value)} />
            </FormField>
            <FormField label="RUT Comunidad" required>
              <Input placeholder="12.345.678-9" value={legalData.communityrut} onChange={e => handleChange("communityrut", e.target.value)} />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Email Comunidad" required>
              <Input type="email" placeholder="comunidad@email.com" value={legalData.communityemail} onChange={e => handleChange("communityemail", e.target.value)} />
            </FormField>
            <FormField label="Dirección Comunidad" required>
              <Input placeholder="Av. Providencia 1234" value={legalData.communityaddress} onChange={e => handleChange("communityaddress", e.target.value)} />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Región" required>
              <Input placeholder="Metropolitana" value={legalData.communityregion} onChange={e => handleChange("communityregion", e.target.value)} />
            </FormField>
            <FormField label="Fecha Constitución Comunidad" required>
              <Input type="date" value={legalData.communityformationdate} onChange={e => handleChange("communityformationdate", e.target.value)} />
            </FormField>
          </div>
          <FormField label="Notario Público Comunidad" required>
            <Input placeholder="Notario Público de Santiago" value={legalData.communitynotary} onChange={e => handleChange("communitynotary", e.target.value)} />
          </FormField>

          {/* ── DATOS DEL REPRESENTANTE LEGAL ── */}
          <SectionTitle>Datos del representante legal</SectionTitle>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Representante Legal" required>
              <Input placeholder="Nombre completo" value={legalData.legalrepresentative} onChange={e => handleChange("legalrepresentative", e.target.value)} />
            </FormField>
            <FormField label="RUT Representante" required>
              <Input placeholder="12.345.678-9" value={legalData.legalrepresentativerut} onChange={e => handleChange("legalrepresentativerut", e.target.value)} />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Sociedad del representante legal" required>
              <Input placeholder="Nombre de la sociedad" value={legalData.legalrepresentativesociety} onChange={e => handleChange("legalrepresentativesociety", e.target.value)} />
            </FormField>
            <FormField label="RUT Sociedad" required>
              <Input placeholder="12.345.678-9" value={legalData.societyrut} onChange={e => handleChange("societyrut", e.target.value)} />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Fecha de Constitución Sociedad" required>
              <Input type="date" value={legalData.societyformationdate} onChange={e => handleChange("societyformationdate", e.target.value)} />
            </FormField>
            <FormField label="Dirección de la Sociedad" required>
              <Input placeholder="Av. Providencia 1234, Santiago" value={legalData.societyaddress} onChange={e => handleChange("societyaddress", e.target.value)} />
            </FormField>
          </div>
          <FormField label="Contexto Empresa" required>
            <Textarea
              placeholder="Texto del contexto empresa para el contrato..."
              value={legalData.contextoempresa}
              onChange={e => handleChange("contextoempresa", e.target.value)}
              className="min-h-[100px] text-xs"
            />
            <p className="text-[10px] text-muted-foreground mt-1">Este texto aparece en la sección PERSONERÍAS del contrato. Puedes editarlo libremente.</p>
          </FormField>
          <div className="grid grid-cols-3 gap-4">
            <FormField label="Nacionalidad Rep." required>
              <Input placeholder="Chilena" value={legalData.legalrepresentativenationality} onChange={e => handleChange("legalrepresentativenationality", e.target.value)} />
            </FormField>
            <FormField label="Estado Civil" required>
              <Input placeholder="Soltero/a" value={legalData.legalrepresentativemaritalstatus} onChange={e => handleChange("legalrepresentativemaritalstatus", e.target.value)} />
            </FormField>
            <FormField label="Profesión" required>
              <Input placeholder="Ingeniero" value={legalData.legalrepresentativeprofession} onChange={e => handleChange("legalrepresentativeprofession", e.target.value)} />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Notario Público Sociedad" required>
              <Input placeholder="Notario Público de Santiago" value={legalData.societynotary} onChange={e => handleChange("societynotary", e.target.value)} />
            </FormField>
            <FormField label="Teléfono Representante" required>
              <Input placeholder="+56 9 1234 5678" value={legalData.legalrepresentativephone} onChange={e => handleChange("legalrepresentativephone", e.target.value)} />
            </FormField>
          </div>

          {/* ── PERSONAS ADICIONALES ── */}
          {personasAdicionales.map((persona, index) => (
            <div key={index} className="border border-blue-100 rounded-lg p-4 space-y-3 bg-blue-50/30">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-bold text-[#1A367F] uppercase tracking-wider">
                  Persona {index + 2}
                </h5>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => removePersona(index)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Nombre completo">
                  <Input placeholder="Nombre completo" value={persona.nombre} onChange={e => handlePersonaChange(index, "nombre", e.target.value)} />
                </FormField>
                <FormField label="Dirección">
                  <Input placeholder="Dirección" value={persona.direccion} onChange={e => handlePersonaChange(index, "direccion", e.target.value)} />
                </FormField>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Teléfono">
                  <Input placeholder="+56 9 1234 5678" value={persona.telefono} onChange={e => handlePersonaChange(index, "telefono", e.target.value)} />
                </FormField>
                <FormField label="Email">
                  <Input type="email" placeholder="email@ejemplo.com" value={persona.email} onChange={e => handlePersonaChange(index, "email", e.target.value)} />
                </FormField>
              </div>
            </div>
          ))}

          <Button variant="outline" size="sm" onClick={addPersona} className="gap-2 border-dashed border-blue-300 text-[#1A367F] hover:bg-blue-50">
            <Plus className="h-4 w-4" />
            Agregar persona al contrato
          </Button>

          <Separator />

          {/* ── DETALLE INSTALACIÓN ── */}
          <SectionTitle>Detalle Instalación Dispositivos</SectionTitle>
          <FormField label="Lugar de instalación" required>
            <Select value={legalData.deviceinstallation} onValueChange={v => handleChange("deviceinstallation", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar lugar..." />
              </SelectTrigger>
              <SelectContent>
                {DEVICE_INSTALLATION_OPTIONS.map(opt => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          {/* Manual contract upload */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">Subir contrato manualmente (opcional)</Label>
            <div className="flex items-center gap-3">
              <Input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={e => setManualContractFile(e.target.files?.[0] || null)}
                className="text-xs"
              />
              {manualContractFile && (
                <Badge variant="secondary" className="text-[10px] whitespace-nowrap">
                  <Upload className="h-3 w-3 mr-1" />
                  {manualContractFile.name}
                </Badge>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground">Si no adjuntas un archivo, el contrato se generará desde la plantilla.</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleAccept} disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
            <CheckCircle className="h-4 w-4" />
            {isSubmitting ? "Procesando..." : "Confirmar y Generar Contrato"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
