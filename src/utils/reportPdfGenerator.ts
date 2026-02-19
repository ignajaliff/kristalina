import jsPDF from "jspdf";

interface ReportData {
  cliente: any;
  pagosJson: any[];
  montoRenting: number;
  datosReporte: {
    efectividad: string;
    efectividad_comentario: string;
    condicion_general: string;
    funcionamiento: string;
    fecha_revision: string;
    revisado_por: string;
  };
  numero: number;
  fecha: string;
}

export const generateReportePDF = (data: ReportData): Blob => {
  const doc = new jsPDF("p", "mm", "letter");
  const pageWidth = 216;
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;

  const addText = (text: string, x: number, yPos: number, options?: any) => {
    doc.text(text, x, yPos, options);
  };

  // === PAGE 1: Building Info & Payment Status ===
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  addText("REPORTE DE EDIFICIO", pageWidth / 2, y, { align: "center" });
  y += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  addText(`Reporte #${data.numero} — ${data.fecha}`, pageWidth / 2, y, { align: "center" });
  y += 12;

  // Building info
  doc.setDrawColor(200);
  doc.setFillColor(245, 247, 250);
  doc.rect(margin, y, contentWidth, 8, "F");
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  addText("INFORMACIÓN DEL EDIFICIO", margin + 4, y + 5.5);
  y += 14;

  const cliente = data.cliente || {};
  const infoRows = [
    ["Comunidad", cliente.communityname || "N/A"],
    ["Administrador", cliente.adminname || "N/A"],
    ["Email", cliente.adminemail || "N/A"],
    ["Dirección", cliente.buildingaddress || "N/A"],
    ["Comuna", cliente.comuna || "N/A"],
    ["Región", cliente.region || "N/A"],
    ["Tipo", cliente.buildingtype || "N/A"],
    ["Unidades", cliente.units?.toString() || "N/A"],
    ["Renting Mensual", `$${Number(data.montoRenting).toLocaleString()}`],
  ];

  doc.setFontSize(9);
  infoRows.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold");
    addText(label + ":", margin + 4, y);
    doc.setFont("helvetica", "normal");
    addText(value, margin + 50, y);
    y += 6;
  });

  y += 8;

  // Payment summary
  doc.setFillColor(245, 247, 250);
  doc.rect(margin, y, contentWidth, 8, "F");
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  addText("ESTADO DE PAGOS", margin + 4, y + 5.5);
  y += 14;

  const pagados = data.pagosJson.filter(p => p.pagado);
  const pendientes = data.pagosJson.filter(p => !p.pagado);

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  addText(`Total de meses: ${data.pagosJson.length}`, margin + 4, y);
  y += 6;
  addText(`Meses pagados: ${pagados.length}`, margin + 4, y);
  y += 6;
  addText(`Meses pendientes: ${pendientes.length}`, margin + 4, y);
  y += 10;

  // Payment table
  if (data.pagosJson.length > 0) {
    const colWidths = [25, 55, 40, 40];
    const headers = ["Mes", "Fecha Pago", "Monto", "Estado"];

    doc.setFillColor(230, 235, 245);
    doc.rect(margin, y, contentWidth, 7, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    let xPos = margin + 2;
    headers.forEach((h, i) => {
      addText(h, xPos, y + 5);
      xPos += colWidths[i];
    });
    y += 9;

    doc.setFont("helvetica", "normal");
    data.pagosJson.forEach((p) => {
      if (y > 250) {
        doc.addPage();
        y = 20;
      }
      xPos = margin + 2;
      addText(`${p.mes}`, xPos, y);
      xPos += colWidths[0];
      addText(p.fecha_pago || "", xPos, y);
      xPos += colWidths[1];
      addText(`$${Number(p.monto).toLocaleString()}`, xPos, y);
      xPos += colWidths[2];
      addText(p.pagado ? "Pagado" : "Pendiente", xPos, y);
      y += 6;
    });
  }

  // === PAGE 2: Report info ===
  doc.addPage();
  y = 20;

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  addText("EVALUACIÓN Y CONDICIÓN", pageWidth / 2, y, { align: "center" });
  y += 12;

  // Effectiveness
  doc.setFillColor(245, 247, 250);
  doc.rect(margin, y, contentWidth, 8, "F");
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  addText("EVALUACIÓN DE EFECTIVIDAD DE LA SOLUCIÓN", margin + 4, y + 5.5);
  y += 14;

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  addText("Resultado:", margin + 4, y);
  doc.setFont("helvetica", "normal");
  addText(data.datosReporte.efectividad, margin + 35, y);
  y += 8;

  if (data.datosReporte.efectividad_comentario) {
    doc.setFont("helvetica", "bold");
    addText("Comentario:", margin + 4, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(data.datosReporte.efectividad_comentario, contentWidth - 8);
    lines.forEach((line: string) => {
      addText(line, margin + 4, y);
      y += 5;
    });
  }

  y += 10;

  // General condition
  doc.setFillColor(245, 247, 250);
  doc.rect(margin, y, contentWidth, 8, "F");
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  addText("CONDICIÓN GENERAL", margin + 4, y + 5.5);
  y += 14;

  doc.setFontSize(10);
  const conditionRows = [
    ["Condición:", data.datosReporte.condicion_general],
    ["Funcionamiento:", data.datosReporte.funcionamiento || "N/A"],
    ["Fecha de Revisión:", data.datosReporte.fecha_revision || "N/A"],
    ["Revisado por:", data.datosReporte.revisado_por || "N/A"],
  ];

  conditionRows.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold");
    addText(label, margin + 4, y);
    doc.setFont("helvetica", "normal");
    addText(value, margin + 50, y);
    y += 8;
  });

  return doc.output("blob");
};
