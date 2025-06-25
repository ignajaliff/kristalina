
export interface Quote {
  id: string;
  adminname: string;
  adminemail: string;
  managementcompany?: string;
  legalrepresentative?: string;
  additional_at: Array<{ name: string; email: string }>;
  communityname: string;
  buildingaddress?: string;
  comuna?: string;
  region?: string;
  buildingtype: string;
  units: number;
  presupuesto_aceptado: boolean;
  created_at?: string;
  monto?: number;
  por_unidad?: number;
  inversion?: number;
  fecha_aprobacion_presupuesto?: string;
  fecha_firma_contrato?: string;
  fecha_instalacion_equipos?: string;
  terminos_contrato?: string;
  legalrepresentativerut?: string;
  communityrut?: string;
  communityemail?: string;
  legalrepresentativephone?: string;
  equipos_instalados?: string;
  communityformationdate?: string;
  vendedor?: string;
  estado_contacto?: string;
  status: "Enviado" | "Aceptado";
}

export const logQuoteAcceptance = (quote: Quote) => {
  // Function to log quote acceptance for debugging
  console.log('Quote accepted:', quote);
  return quote;
};

export const sendQuoteToWebhook = async (webhookUrl: string, data: any) => {
  // Function to send data to webhook
  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      mode: "no-cors",
      body: JSON.stringify(data),
    });
    
    console.log('Webhook sent successfully');
    return response;
  } catch (error) {
    console.error('Error sending webhook:', error);
    throw error;
  }
};
