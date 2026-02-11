
import jsPDF from "jspdf";

interface Cliente {
  adminname: string;
  adminemail: string;
  communityname: string;
  buildingaddress: string | null;
  buildingtype: string;
  units: number;
  vendedor: string | null;
}

interface DatosPresupuesto {
  moneda: "Pesos" | "UF";
  valor_mensual_arriendo: number;
  presupuesto_total_deptos: number;
  descuento_porcentaje: number;
  costo_total_mensual_equipos: number;
  precio_instalacion: number;
  anos_contrato: number;
}

export function generatePresupuestoPDF(cliente: Cliente, datos: DatosPresupuesto): Blob {
  const doc = new jsPDF();
  const monedaLabel = datos.moneda === "UF" ? "UF" : "CLP";

  // Header
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("PRESUPUESTO", 105, 25, { align: "center" });

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Kristalina", 105, 33, { align: "center" });

  // Date
  doc.setFontSize(10);
  doc.text(`Fecha: ${new Date().toLocaleDateString("es-CL")}`, 150, 45);

  // Divider
  doc.setLineWidth(0.5);
  doc.line(20, 50, 190, 50);

  // Client info
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Datos del Cliente", 20, 60);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  let y = 68;
  doc.text(`Comunidad: ${cliente.communityname}`, 20, y); y += 7;
  doc.text(`Administrador: ${cliente.adminname}`, 20, y); y += 7;
  doc.text(`Email: ${cliente.adminemail}`, 20, y); y += 7;
  doc.text(`Dirección: ${cliente.buildingaddress || "N/A"}`, 20, y); y += 7;
  doc.text(`Tipo: ${cliente.buildingtype}`, 20, y); y += 7;
  doc.text(`Unidades: ${cliente.units}`, 20, y); y += 7;
  if (cliente.vendedor) {
    doc.text(`Vendedor: ${cliente.vendedor}`, 20, y); y += 7;
  }

  // Divider
  y += 3;
  doc.line(20, y, 190, y);
  y += 10;

  // Budget details
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Detalle del Presupuesto", 20, y); y += 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Moneda: ${datos.moneda}`, 20, y); y += 8;

  const formatValue = (val: number) => {
    if (datos.moneda === "UF") return `${val.toFixed(2)} UF`;
    return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", minimumFractionDigits: 0 }).format(val);
  };

  const items = [
    ["Valor mensual de arriendo", formatValue(datos.valor_mensual_arriendo)],
    ["Presupuesto total departamentos", formatValue(datos.presupuesto_total_deptos)],
    ["Descuento", `${datos.descuento_porcentaje}%`],
    ["Costo total mensual equipos", formatValue(datos.costo_total_mensual_equipos)],
    ["Precio instalación", formatValue(datos.precio_instalacion)],
    ["Años de contrato", `${datos.anos_contrato} años`],
  ];

  items.forEach(([label, value]) => {
    doc.text(`${label}:`, 20, y);
    doc.setFont("helvetica", "bold");
    doc.text(value, 130, y);
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
