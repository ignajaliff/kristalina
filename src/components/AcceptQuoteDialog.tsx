
import { useState } from "react";
import { Quote } from "@/utils/quoteStorage";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { DatosContrato } from "@/utils/contractPdfGenerator";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { FileText, Eye, ArrowLeft, CheckCircle, Upload } from "lucide-react";

interface AcceptQuoteDialogProps {
  quote: Quote | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAcceptComplete: () => void;
}

type Step = "form" | "preview";

export default function AcceptQuoteDialog({ quote, open, onOpenChange, onAcceptComplete }: AcceptQuoteDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<Step>("form");
  const [manualContractFile, setManualContractFile] = useState<File | null>(null);
  const [legalData, setLegalData] = useState<DatosContrato>({
    legalrepresentative: "",
    legalrepresentativerut: "",
    communityrut: "",
    communityemail: "",
    legalrepresentativephone: "",
    communityformationdate: "",
    communityaddress: "",
    communityregion: "",
    deviceinstallation: "",
    legalrepresentativenationality: "",
    legalrepresentativemaritalstatus: "",
    legalrepresentativeprofession: "",
    contractTerm: "1",
    notary: "Santiago",
  });

  const handleChange = (field: keyof DatosContrato, value: string) => {
    setLegalData(prev => ({ ...prev, [field]: value }));
  };

  const handlePreview = () => {
    if (!legalData.legalrepresentative.trim()) {
      toast({ title: "Campo requerido", description: "Ingresa el nombre del representante legal.", variant: "destructive" });
      return;
    }
    setStep("preview");
  };

  const handleAccept = async () => {
    if (!quote?.presupuesto_id) return;

    setIsSubmitting(true);
    try {
      // 1. Update presupuesto status
      const { error: updateError } = await supabase
        .from("presupuestos")
        .update({
          estado: "Aceptado",
          fecha_aprobacion: new Date().toISOString().split('T')[0],
        })
        .eq("id", quote.presupuesto_id);

      if (updateError) throw updateError;

      // 2. Upload manual contract file if provided
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

      // 3. Create contrato with datos_contrato JSON
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

      // 5. Update prospecto status
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
    setStep("form");
    setManualContractFile(null);
    setLegalData({
      legalrepresentative: "",
      legalrepresentativerut: "",
      communityrut: "",
      communityemail: "",
      legalrepresentativephone: "",
      communityformationdate: "",
      communityaddress: "",
      communityregion: "",
      deviceinstallation: "",
      legalrepresentativenationality: "",
      legalrepresentativemaritalstatus: "",
      legalrepresentativeprofession: "",
      contractTerm: "",
      notary: "",
    });
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) resetForm();
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
        {step === "form" ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-600" />
                Aceptar Presupuesto
              </DialogTitle>
              <DialogDescription>
                Completa la información legal para <strong>{quote?.communityname}</strong>. Podrás revisar el contrato antes de confirmarlo.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Representante Legal *</Label>
                  <Input placeholder="Nombre completo" value={legalData.legalrepresentative} onChange={e => handleChange("legalrepresentative", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">RUT Representante</Label>
                  <Input placeholder="12.345.678-9" value={legalData.legalrepresentativerut} onChange={e => handleChange("legalrepresentativerut", e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">RUT Comunidad</Label>
                  <Input placeholder="12.345.678-9" value={legalData.communityrut} onChange={e => handleChange("communityrut", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Email Comunidad</Label>
                  <Input type="email" placeholder="comunidad@email.com" value={legalData.communityemail} onChange={e => handleChange("communityemail", e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Teléfono Representante</Label>
                  <Input placeholder="+56 9 1234 5678" value={legalData.legalrepresentativephone} onChange={e => handleChange("legalrepresentativephone", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Fecha Constitución</Label>
                  <Input type="date" value={legalData.communityformationdate} onChange={e => handleChange("communityformationdate", e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Dirección Comunidad</Label>
                  <Input placeholder="Ej: Av. Providencia 1234" value={legalData.communityaddress} onChange={e => handleChange("communityaddress", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Región</Label>
                  <Input placeholder="Metropolitana" value={legalData.communityregion} onChange={e => handleChange("communityregion", e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Nacionalidad Rep.</Label>
                  <Input placeholder="Chilena" value={legalData.legalrepresentativenationality} onChange={e => handleChange("legalrepresentativenationality", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Estado Civil</Label>
                  <Input placeholder="Soltero/a" value={legalData.legalrepresentativemaritalstatus} onChange={e => handleChange("legalrepresentativemaritalstatus", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Profesión</Label>
                  <Input placeholder="Ingeniero" value={legalData.legalrepresentativeprofession} onChange={e => handleChange("legalrepresentativeprofession", e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Años de Contrato *</Label>
                  <Input type="number" placeholder="1" value={legalData.contractTerm || "1"} onChange={e => handleChange("contractTerm", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Notario Público</Label>
                  <Input placeholder="Notario Público de Santiago" value={legalData.notary} onChange={e => handleChange("notary", e.target.value)} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">Detalle Instalación Dispositivos</Label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Describe el proceso de instalación..."
                  value={legalData.deviceinstallation}
                  onChange={e => handleChange("deviceinstallation", e.target.value)}
                />
              </div>

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

            <div className="space-y-4 py-2">
              {/* Community Info (read-only) */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Datos de la Comunidad</h4>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                  <p><span className="font-medium text-muted-foreground">Comunidad:</span> {quote?.communityname}</p>
                  <p><span className="font-medium text-muted-foreground">Dirección:</span> {quote?.buildingaddress || "N/A"}</p>
                  <p><span className="font-medium text-muted-foreground">Tipo:</span> {quote?.buildingtype}</p>
                  <p><span className="font-medium text-muted-foreground">Unidades:</span> {quote?.units}</p>
                  <p><span className="font-medium text-muted-foreground">Administrador:</span> {quote?.adminname}</p>
                  <p><span className="font-medium text-muted-foreground">Email:</span> {quote?.adminemail}</p>
                </div>
              </div>

              <Separator />

              {/* Editable legal data */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Datos Legales (Editables)</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground">Representante Legal</Label>
                    <Input value={legalData.legalrepresentative} onChange={e => handleChange("legalrepresentative", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground">RUT Representante</Label>
                    <Input value={legalData.legalrepresentativerut} onChange={e => handleChange("legalrepresentativerut", e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground">RUT Comunidad</Label>
                    <Input value={legalData.communityrut} onChange={e => handleChange("communityrut", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground">Email Comunidad</Label>
                    <Input value={legalData.communityemail} onChange={e => handleChange("communityemail", e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground">Teléfono Representante</Label>
                    <Input value={legalData.legalrepresentativephone} onChange={e => handleChange("legalrepresentativephone", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground">Fecha Constitución</Label>
                    <Input type="date" value={legalData.communityformationdate} onChange={e => handleChange("communityformationdate", e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground">Dirección Comunidad</Label>
                    <Input value={legalData.communityaddress} onChange={e => handleChange("communityaddress", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground">Región</Label>
                    <Input value={legalData.communityregion} onChange={e => handleChange("communityregion", e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground">Nacionalidad</Label>
                    <Input value={legalData.legalrepresentativenationality} onChange={e => handleChange("legalrepresentativenationality", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground">Estado Civil</Label>
                    <Input value={legalData.legalrepresentativemaritalstatus} onChange={e => handleChange("legalrepresentativemaritalstatus", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground">Profesión</Label>
                    <Input value={legalData.legalrepresentativeprofession} onChange={e => handleChange("legalrepresentativeprofession", e.target.value)} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Detalle Instalación</Label>
                  <textarea
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={legalData.deviceinstallation}
                    onChange={e => handleChange("deviceinstallation", e.target.value)}
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setStep("form")} className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Volver a Editar
              </Button>
              <Button onClick={handleAccept} disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
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
