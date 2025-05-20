
import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { cn } from "@/lib/utils";
import { Quote, addAcceptedQuote, sendAcceptedQuoteToWebhook } from "@/utils/quoteStorage";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

// Form validation schema
const formSchema = z.object({
  legalRepresentativeName: z.string().min(1, "Nombre del representante legal es requerido"),
  legalRepresentativeRut: z.string().min(1, "RUT del representante legal es requerido"),
  communityRut: z.string().min(1, "RUT de la comunidad es requerido"),
  communityEmail: z.string().email("Correo electrónico inválido"),
  legalRepresentativePhone: z.string().min(1, "Número del representante legal es requerido"),
  communityFormationDate: z.date({
    required_error: "La fecha de constitución de la comunidad es requerida",
  }),
});

type FormValues = z.infer<typeof formSchema>;

interface AcceptQuoteDialogProps {
  quote: Quote | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAcceptComplete: () => void;
}

export default function AcceptQuoteDialog({
  quote,
  open,
  onOpenChange,
  onAcceptComplete,
}: AcceptQuoteDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Initialize form with defaults
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      legalRepresentativeName: "",
      legalRepresentativeRut: "",
      communityRut: "",
      communityEmail: quote?.adminemail || "",
      legalRepresentativePhone: "",
    },
  });
  
  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    if (!quote) return;
    
    setIsSubmitting(true);
    
    try {
      // Store the accepted quote data
      const acceptedQuote = addAcceptedQuote({
        quoteId: quote.id,
        legalRepresentativeName: data.legalRepresentativeName,
        legalRepresentativeRut: data.legalRepresentativeRut,
        communityRut: data.communityRut,
        communityEmail: data.communityEmail,
        legalRepresentativePhone: data.legalRepresentativePhone,
        communityFormationDate: data.communityFormationDate.toISOString(),
      });
      
      // Try to send to webhook (using the constant WEBHOOK_URL from QuotesTable)
      const WEBHOOK_URL = "https://n8n-n8n.qqtfab.easypanel.host/webhook-test/66abaac8-fdce-4dde-a287-df61767ba4af";
      
      if (WEBHOOK_URL) {
        try {
          // Only send the necessary information to the webhook
          const webhookData = {
            quoteId: quote.id,
            legalRepresentativeName: data.legalRepresentativeName,
            legalRepresentativeRut: data.legalRepresentativeRut,
            communityRut: data.communityRut,
            communityEmail: data.communityEmail,
            legalRepresentativePhone: data.legalRepresentativePhone,
            communityFormationDate: data.communityFormationDate.toISOString(),
            timestamp: new Date().toISOString(),
          };
          
          await fetch(WEBHOOK_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            mode: "no-cors",
            body: JSON.stringify(webhookData),
          });
          
          console.log("Webhook triggered successfully");
        } catch (webhookError) {
          console.error("Error triggering webhook:", webhookError);
          throw webhookError;
        }
      }
      
      // Show success message
      toast({
        title: "Presupuesto aceptado",
        description: "El presupuesto ha sido aceptado y los datos enviados correctamente.",
      });
      
      // Close dialog and refresh list
      onOpenChange(false);
      onAcceptComplete(acceptedQuote);
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
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Aceptar Presupuesto</DialogTitle>
          <DialogDescription>
            Complete la información adicional para aceptar el presupuesto y generar el contrato.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="legalRepresentativeName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre Representante Legal</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre completo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="legalRepresentativeRut"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>RUT Representante Legal</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: 12345678-9" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="communityRut"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>RUT Comunidad</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: 12345678-9" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="communityEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Comunidad</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="comunidad@ejemplo.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="legalRepresentativePhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número Representante Legal</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="+56 9 1234 5678" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="communityFormationDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Fecha de Constitución Comunidad</FormLabel>
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
                            format(field.value, "PPP")
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
                        className="p-3 pointer-events-auto"
                        fromYear={1900}
                        toYear={new Date().getFullYear()}
                        captionLayout="dropdown-buttons"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Procesando..." : "Aceptar Presupuesto"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
