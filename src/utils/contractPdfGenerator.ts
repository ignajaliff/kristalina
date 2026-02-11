
import jsPDF from "jspdf";

interface ClienteContrato {
  adminname: string;
  adminemail: string;
  communityname: string;
  buildingaddress: string | null;
  buildingtype: string;
  units: number;
  vendedor: string | null;
}

export interface DatosContrato {
  legalrepresentative: string;
  legalrepresentativerut: string;
  communityrut: string;
  communityemail: string;
  legalrepresentativephone: string;
  communityformationdate: string;
}

export function generateContratoPDF(cliente: ClienteContrato, datos: DatosContrato): Blob {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("CONTRATO DE SERVICIO", 105, 25, { align: "center" });

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Kristalina", 105, 33, { align: "center" });

  // Date
  doc.setFontSize(10);
  doc.text(`Fecha: ${new Date().toLocaleDateString("es-CL")}`, 150, 45);

  // Divider
  doc.setLineWidth(0.5);
  doc.line(20, 50, 190, 50);

  // Community info
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Datos de la Comunidad", 20, 60);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  let y = 68;
  doc.text(`Comunidad: ${cliente.communityname}`, 20, y); y += 7;
  doc.text(`Dirección: ${cliente.buildingaddress || "N/A"}`, 20, y); y += 7;
  doc.text(`Tipo: ${cliente.buildingtype}`, 20, y); y += 7;
  doc.text(`Unidades: ${cliente.units}`, 20, y); y += 7;
  doc.text(`Administrador: ${cliente.adminname}`, 20, y); y += 7;
  doc.text(`Email: ${cliente.adminemail}`, 20, y); y += 7;
  if (cliente.vendedor) {
    doc.text(`Vendedor: ${cliente.vendedor}`, 20, y); y += 7;
  }

  // Divider
  y += 3;
  doc.line(20, y, 190, y);
  y += 10;

  // Legal representative info
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Representante Legal", 20, y); y += 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const items: [string, string][] = [
    ["Representante Legal", datos.legalrepresentative],
    ["RUT Representante", datos.legalrepresentativerut],
    ["RUT Comunidad", datos.communityrut],
    ["Email Comunidad", datos.communityemail],
    ["Teléfono Representante", datos.legalrepresentativephone],
    ["Fecha Constitución", datos.communityformationdate],
  ];

  items.forEach(([label, value]) => {
    doc.text(`${label}:`, 20, y);
    doc.setFont("helvetica", "bold");
    doc.text(value || "N/A", 90, y);
    doc.setFont("helvetica", "normal");
    y += 8;
  });

  // Footer
  y += 10;
  doc.line(20, y, 190, y);
  y += 10;
  doc.setFontSize(8);
  doc.setTextColor(128);
  doc.text("Documento generado automáticamente por Kristalina CRM", 105, y, { align: "center" });

  return doc.output("blob");
}
