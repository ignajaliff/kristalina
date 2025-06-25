
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

export const addAcceptedQuote = async (quote: Quote) => {
  // This function would typically save the accepted quote to the database
  // For now, it's a placeholder
  console.log('Adding accepted quote:', quote);
  return quote;
};

export const sendAcceptedQuoteToWebhook = async (quote: Quote) => {
  // This function would typically send the quote to a webhook
  // For now, it's a placeholder
  console.log('Sending accepted quote to webhook:', quote);
  return quote;
};
