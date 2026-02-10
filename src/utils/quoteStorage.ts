
export interface Prospecto {
  id: string;
  adminname: string;
  adminemail: string;
  managementcompany?: string;
  additional_at: Array<{ name: string; email: string }>;
  communityname: string;
  buildingaddress?: string;
  comuna?: string;
  region?: string;
  buildingtype: string;
  units: number;
  created_at?: string;
  vendedor?: string;
  vendedor_id?: string;
  estado_contacto?: string;
  nombre_portero?: string;
  notas?: string;
}

export interface Presupuesto {
  id: string;
  prospecto_id: string;
  estado: "Enviado" | "Aceptado";
  fecha_aprobacion?: string;
  doc_presupuesto?: string;
  monto?: number;
  por_unidad?: number;
  inversion?: number;
  created_at?: string;
  // Joined data
  prospectos?: Prospecto;
}

export interface Contrato {
  id: string;
  prospecto_id: string;
  estado_contrato: string;
  estado_equipos: string;
  fecha_instalacion_equipos?: string;
  fecha_contrato_firmado?: string;
  doc_contrato?: string;
  legalrepresentative?: string;
  legalrepresentativerut?: string;
  communityrut?: string;
  communityemail?: string;
  legalrepresentativephone?: string;
  communityformationdate?: string;
  created_at?: string;
  // Joined data
  prospectos?: Prospecto;
}

// Legacy type alias for backward compatibility during migration
export interface Quote {
  id: string;
  adminname: string;
  adminemail: string;
  managementcompany?: string;
  additional_at: Array<{ name: string; email: string }>;
  communityname: string;
  buildingaddress?: string;
  comuna?: string;
  region?: string;
  buildingtype: string;
  units: number;
  created_at?: string;
  vendedor?: string;
  vendedor_id?: string;
  estado_contacto?: string;
  nombre_portero?: string;
  notas?: string;
  // Presupuesto fields (from join)
  presupuesto_id?: string;
  monto?: number;
  por_unidad?: number;
  inversion?: number;
  estado?: "Enviado" | "Aceptado";
  fecha_aprobacion?: string;
  status: "Enviado" | "Aceptado";
}

export const sendQuoteToWebhook = async (webhookUrl: string, data: any) => {
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
