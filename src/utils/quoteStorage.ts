
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
