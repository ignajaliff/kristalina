
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
  legalRepresentativeRut: z.string().min(1, "RUT del representante legal es requerido"),
  communityRut: z.string().min(1, "RUT de la comunidad es requerido"),
  communityEmail: z.string().email("Correo electrónico inválido"),
  legalRepresentativePhone: z.string().min(1, "Número del representante legal es requerido"),
  communityFormationDate: z.date({
    required_error: "La fecha de constitución de la comunidad es requerida",
  }),
  webhookUrl: z.string().optional(),
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
      legalRepresentativeRut: "",
      communityRut: "",
      communityEmail: quote?.adminEmail || "",
      legalRepresentativePhone: "",
      webhookUrl: "", // Optional webhook URL
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
        legalRepresentativeRut: data.legalRepresentativeRut,
        communityRut: data.communityRut,
        communityEmail: data.communityEmail,
        legalRepresentativePhone: data.legalRepresentativePhone,
        communityFormationDate: data.communityFormationDate.toISOString(),
      });
      
      // Try to send to webhook if URL is provided
      let webhookSuccess = true;
      if (data.webhookUrl) {
        webhookSuccess = await sendAcceptedQuoteToWebhook(data.webhookUrl, acceptedQuote, quote);
      }
      
      // Show success message
      toast({
        title: "Presupuesto aceptado",
        description: webhookSuccess 
          ? "El presupuesto ha sido aceptado y los datos enviados correctamente."
          : "El presupuesto ha sido aceptado, pero hubo un problema al enviar los datos al webhook.",
        variant: webhookSuccess ? "default" : "destructive",
      });
      
      // Close dialog and refresh list
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
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="webhookUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL del Webhook (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
                  </FormControl>
                  <FormDescription>
                    URL para enviar los datos del presupuesto aceptado.
                  </FormDescription>
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
