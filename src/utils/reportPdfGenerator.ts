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
  fecha: string; // mes o fecha del reporte
}

// ── helpers ──────────────────────────────────────────────────────────────────

const BLUE_DARK: [number, number, number] = [0, 51, 102];
const BLUE_LIGHT: [number, number, number] = [230, 238, 250];
const GRAY_TEXT: [number, number, number] = [80, 80, 80];

/** Dibuja un separador con rectángulo de fondo y texto de sección */
const drawSectionTitle = (doc: jsPDF, y: number, label: string, margin: number, cw: number) => {
  doc.setFillColor(...BLUE_DARK);
  doc.rect(margin, y, cw, 7, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text(label, margin + 3, y + 5);
  doc.setTextColor(0, 0, 0);
};

/** Dibuja par clave-valor en dos columnas */
const drawRow = (doc: jsPDF, y: number, label: string, value: string, margin: number) => {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...GRAY_TEXT);
  doc.text(label, margin + 2, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  doc.text(value, margin + 50, y);
};

/** Dibuja un checkbox cuadrado con o sin tilde */
const drawCheckbox = (
  doc: jsPDF,
  x: number,
  y: number,
  label: string,
  checked: boolean
) => {
  const size = 4;
  doc.setDrawColor(60, 60, 60);
  doc.setLineWidth(0.3);
  doc.rect(x, y - size + 0.5, size, size);
  if (checked) {
    doc.setDrawColor(0, 100, 0);
    doc.setLineWidth(0.7);
    doc.line(x + 0.5, y - 1.5, x + 1.8, y - 0.5);
    doc.line(x + 1.8, y - 0.5, x + 3.8, y - size + 0.5);
  }
  doc.setDrawColor(0);
  doc.setLineWidth(0.2);
  doc.setFont("helvetica", checked ? "bold" : "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(0, 0, 0);
  doc.text(label, x + size + 2, y);
};

/** Footer con URL de la empresa */
const drawFooter = (doc: jsPDF, pw: number, ph: number) => {
  doc.setDrawColor(0, 51, 102);
  doc.setLineWidth(0.3);
  doc.line(20, ph - 15, pw - 20, ph - 15);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(0, 51, 102);
  doc.text("www.kristalina.cl", pw / 2, ph - 10, { align: "center" });
  doc.setTextColor(150, 150, 150);
};

// ── función principal ─────────────────────────────────────────────────────────

export const generateReportePDF = (data: ReportData): Blob => {
  const doc = new jsPDF("p", "mm", "letter");
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const cw = pageWidth - margin * 2;

  const cliente = data.cliente || {};
  const pagados = (data.pagosJson || []).filter((p) => p.pagado);
  const noPagados = (data.pagosJson || []).filter((p) => !p.pagado);
  const mesesContrato =
    cliente.meses_contrato ?? cliente.anos_contrato
      ? (cliente.anos_contrato || 0) * 12
      : data.pagosJson.length;
  const porPagar = Math.max(0, mesesContrato - pagados.length);

  // ════════════════════════════════════════════════════════════════════════════
  // PÁGINA 1
  // ════════════════════════════════════════════════════════════════════════════
  let y = 16;

  // ── Encabezado: título izquierda / logo derecha ───────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...BLUE_DARK);
  doc.text("Reporte Mensual", margin, y + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...GRAY_TEXT);
  doc.text(data.fecha || "", margin, y + 14);

  try {
    doc.addImage("/kristalina-logo.png", "PNG", pageWidth - margin - 48, y, 48, 17);
  } catch (_) {
    // Logo no disponible
  }

  y += 26;

  // ── Subtítulo centrado ────────────────────────────────────────────────────
  doc.setFillColor(...BLUE_LIGHT);
  doc.rect(margin, y, cw, 9, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(...BLUE_DARK);
  doc.text("MONITOREO DE RENDIMIENTO Y MÉTRICA OPERATIVA", pageWidth / 2, y + 6.2, {
    align: "center",
  });
  doc.setTextColor(0, 0, 0);

  y += 15;

  // ── Datos generales del cliente ───────────────────────────────────────────
  drawSectionTitle(doc, y, "Datos generales del cliente", margin, cw);
  y += 11;

  const clienteRows: [string, string][] = [
    ["Comunidad:", cliente.communityname || "N/A"],
    ["Administrador:", cliente.adminname || "N/A"],
    ["Email:", cliente.adminemail || "N/A"],
    [
      "Dirección:",
      [cliente.buildingaddress, cliente.comuna, cliente.region].filter(Boolean).join(", ") || "N/A",
    ],
    ["Tipo de edificio:", cliente.buildingtype || "N/A"],
    ["N° Unidades:", cliente.units?.toString() || "N/A"],
  ];

  clienteRows.forEach(([label, value]) => {
    drawRow(doc, y, label, value, margin);
    y += 6;
  });

  y += 6;

  // ── Descripción breve del servicio ────────────────────────────────────────
  drawSectionTitle(doc, y, "Descripción breve del servicio", margin, cw);
  y += 11;

  const descripcion =
    "Producto de la alta concentración en algunas zonas del país de carbonatos de calcio y magnesio, se generan una serie de daños e incrustaciones en equipos, redes de cañerías, fittings y griferías producto del sarro. Nuestros dispositivos, producen un efecto permanente evitando la generación de sarro e incrustaciones además de una eliminación en corto tiempo de las incrustaciones existentes.";
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(0, 0, 0);
  const descLines = doc.splitTextToSize(descripcion, cw - 4);
  doc.text(descLines, margin + 2, y, { lineHeightFactor: 1.4 });
  y += descLines.length * 5.3 + 7;

  // ── Datos del contrato ────────────────────────────────────────────────────
  drawSectionTitle(doc, y, "Datos del contrato", margin, cw);
  y += 11;

  const contratoRows: [string, string][] = [
    ["N° de Contrato:", cliente.numero_contrato || data.numero?.toString() || "N/A"],
    ["Duración:", cliente.duracion_contrato ? `${cliente.duracion_contrato} meses` : (cliente.anos_contrato ? `${cliente.anos_contrato} años` : "N/A")],
    ["Tipo de contrato:", cliente.tipo_contrato || "Arriendo mensual"],
    ["Renting mensual:", `$${Number(data.montoRenting || cliente.renting_mensual || 0).toLocaleString("es-CL")}`],
    ["Vendedor:", cliente.vendedor || "N/A"],
  ];

  contratoRows.forEach(([label, value]) => {
    drawRow(doc, y, label, value, margin);
    y += 6;
  });

  y += 6;

  // ── Resumen del contrato ──────────────────────────────────────────────────
  drawSectionTitle(doc, y, "Resumen del contrato", margin, cw);
  y += 11;

  doc.setFillColor(245, 248, 255);
  doc.rect(margin, y - 3, cw, 22, "F");

  const resumenItems: [string, string][] = [
    ["Facturas pagadas:", `${pagados.length}`],
    ["Facturas no pagadas:", `${noPagados.length}`],
    ["Facturas por pagar según contrato:", `${porPagar}`],
  ];

  resumenItems.forEach(([label, val]) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(...GRAY_TEXT);
    doc.text(label, margin + 3, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 51, 102);
    doc.text(val, margin + 70, y);
    doc.setTextColor(0, 0, 0);
    y += 7;
  });

  drawFooter(doc, pageWidth, pageHeight);

  // ════════════════════════════════════════════════════════════════════════════
  // PÁGINA 2
  // ════════════════════════════════════════════════════════════════════════════
  doc.addPage();
  y = 18;

  // Referenciar el encabezado con logo
  try {
    doc.addImage("/kristalina-logo.png", "PNG", pageWidth - margin - 48, y - 3, 48, 17);
  } catch (_) {}

  // ── Título principal ──────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...BLUE_DARK);
  doc.text("EVALUACIÓN DE EFECTIVIDAD DE LA SOLUCIÓN", margin, y + 8);

  doc.setDrawColor(...BLUE_DARK);
  doc.setLineWidth(0.4);
  doc.line(margin, y + 10, pageWidth - margin, y + 10);

  y += 20;

  // ── Estado de la Solución ─────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(0, 0, 0);
  doc.text("Estado de la Solución:", margin, y);
  y += 8;

  const opciones = ["Optima", "Buena", "Regular", "Deficiente"];
  const efectividad = (data.datosReporte?.efectividad || "").toLowerCase().trim();

  let cbX = margin + 2;
  const cbSpacing = 40;
  opciones.forEach((op) => {
    const checked = op.toLowerCase() === efectividad;
    drawCheckbox(doc, cbX, y, op, checked);
    cbX += cbSpacing;
  });

  y += 10;

  // Comentario de efectividad
  if (data.datosReporte?.efectividad_comentario) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(50, 50, 50);
    const efLines = doc.splitTextToSize(data.datosReporte.efectividad_comentario, cw - 4);
    doc.text(efLines, margin + 2, y, { lineHeightFactor: 1.4 });
    y += efLines.length * 5.2 + 6;
  }

  y += 8;

  // ── Separador ─────────────────────────────────────────────────────────────
  doc.setDrawColor(200, 210, 230);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // ── Condición General ─────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(0, 0, 0);
  doc.text("Condición general:", margin, y);
  y += 8;

  const condicion = (data.datosReporte?.condicion_general || "").toLowerCase().trim();
  cbX = margin + 2;
  opciones.forEach((op) => {
    const checked = op.toLowerCase() === condicion;
    drawCheckbox(doc, cbX, y, op, checked);
    cbX += cbSpacing;
  });

  y += 14;

  // ── Funcionamiento ────────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(0, 0, 0);
  doc.text("Funcionamiento:", margin, y);
  y += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(50, 50, 50);
  const funcLines = doc.splitTextToSize(
    data.datosReporte?.funcionamiento || "Sin observaciones.",
    cw - 4
  );
  doc.text(funcLines, margin + 2, y, { lineHeightFactor: 1.4 });
  y += funcLines.length * 5.2 + 14;

  // ── Caja inferior: Fecha de revisión / Revisado por ──────────────────────
  doc.setFillColor(...BLUE_LIGHT);
  doc.rect(margin, y, cw, 30, "F");
  doc.setDrawColor(...BLUE_DARK);
  doc.setLineWidth(0.4);
  doc.rect(margin, y, cw, 30, "S");

  y += 9;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...BLUE_DARK);
  doc.text("Fecha de revisión e inspección:", margin + 4, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  doc.text(data.datosReporte?.fecha_revision || "N/A", margin + 70, y);

  y += 9;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BLUE_DARK);
  doc.text("Revisado por:", margin + 4, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  doc.text(data.datosReporte?.revisado_por || "N/A", margin + 70, y);

  drawFooter(doc, pageWidth, pageHeight);

  return doc.output("blob");
};
