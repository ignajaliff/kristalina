import jsPDF from "jspdf";

interface ActividadRow {
  item: string;
  horario_activo: string;
  horario_reposo: string;
}

interface ReportData {
  cliente: any;
  pagosJson: any[];
  montoRenting: number;
  moneda?: string;
  datosReporte: {
    efectividad: string;
    efectividad_comentario: string;
    condicion_general: string;
    funcionamiento: string;
    fecha_revision: string;
    revisado_por: string;
    requiere_mantenimiento?: boolean;
    detalle_mantenimiento?: string;
    fecha_proxima_mantenimiento?: string;
    observaciones_generales?: string;
    conclusion?: string;
  };
  numero: number;
  fecha: string;
  actividadSolucion?: ActividadRow[];
  torreEnfriamiento?: ActividadRow[];
  imagenesReporte?: string[];
  dataContrato?: any;
}

// ── helpers ──────────────────────────────────────────────────────────────────

const BLUE_DARK: [number, number, number] = [0, 51, 102];
const BLUE_LIGHT: [number, number, number] = [230, 238, 250];
const GRAY_TEXT: [number, number, number] = [80, 80, 80];

const drawSectionTitle = (doc: jsPDF, y: number, label: string, margin: number, cw: number) => {
  doc.setFillColor(...BLUE_DARK);
  doc.rect(margin, y, cw, 7, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text(label, margin + 3, y + 5);
  doc.setTextColor(0, 0, 0);
};

const drawRow = (doc: jsPDF, y: number, label: string, value: any, margin: number) => {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...GRAY_TEXT);
  doc.text(label, margin + 2, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  const valStr = String(value ?? "N/A");
  doc.text(valStr, margin + 50, y);
};

const drawCheckbox = (doc: jsPDF, x: number, y: number, label: string, checked: boolean) => {
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

// Convierte una fecha ISO "YYYY-MM-DD" al formato "DD/MM/YYYY" (día/mes/año).
// Si el valor no es una fecha ISO, lo devuelve tal cual.
const formatFechaDDMMYYYY = (value?: string | null): string => {
  if (!value) return "N/A";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : value;
};

// Lee el ancho/alto natural de una imagen remota. Solo lee naturalWidth/Height
// (no usa canvas), así que no requiere CORS ni "ensucia" la imagen.
const getImageDims = (url: string): Promise<{ w: number; h: number } | null> =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => resolve(null);
    img.src = url;
  });

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

export const generateReportePDF = async (data: ReportData): Promise<Blob> => {
  const doc = new jsPDF("p", "mm", "letter");
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const cw = pageWidth - margin * 2;

  const cliente = data.cliente || {};
  const allPagos = data.pagosJson || [];
  const pagados = allPagos.filter((p) => p.pagado === true);
  const noPagadosEmitidos = allPagos.filter((p) => !p.pagado && (p.fecha_emision || p.factura_url));
  const porPagar = allPagos.filter((p) => !p.pagado);

  // ════════════════════════════════════════════════════════════════════════════
  // PÁGINA 1
  // ════════════════════════════════════════════════════════════════════════════
  let y = 16;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...BLUE_DARK);
  doc.text("Reporte Trimestral", margin, y + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...GRAY_TEXT);
  doc.text(data.fecha || "", margin, y + 14);

  try {
    // Logo 1443x436 (~3.31:1): alto = ancho / 3.31 para no deformarlo.
    doc.addImage("/kristalina-logo.png", "PNG", pageWidth - margin - 48, y, 48, 14.5);
  } catch (_) {}

  y += 26;

  doc.setFillColor(...BLUE_LIGHT);
  doc.rect(margin, y, cw, 9, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(...BLUE_DARK);
  doc.text("MONITOREO DE RENDIMIENTO Y MÉTRICA OPERATIVA", pageWidth / 2, y + 6.2, { align: "center" });
  doc.setTextColor(0, 0, 0);

  y += 15;

  drawSectionTitle(doc, y, "Datos generales del cliente", margin, cw);
  y += 11;

  const contrato = data.dataContrato || {};
  const clienteRows: [string, any][] = [
    ["Nombre de la Comunidad:", contrato.communityname || "N/A"],
    ["RUT:", contrato.communityrut || "N/A"],
    ["Dirección:", contrato.communityaddress || "N/A"],
    ["Persona de Contacto:", cliente.adminname || "N/A"],
    ["Email:", contrato.communityemail || "N/A"],
  ];

  clienteRows.forEach(([label, value]) => {
    drawRow(doc, y, label, value, margin);
    y += 6;
  });

  y += 6;

  drawSectionTitle(doc, y, "Descripción breve del servicio", margin, cw);
  y += 11;

  const descripcion =
    "Producto de la alta concentración en algunas zonas del país de carbonatos de calcio y magnesio, se generan una serie de daños e incrustaciones en equipos, redes de cañerías, fittings y griferías producto del sarro. Nuestros dispositivos, producen un efecto permanente evitando la generación de sarro e incrustaciones además de una eliminación en corto tiempo de las incrustaciones existentes.";
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(50, 50, 50);
  const descLines = doc.splitTextToSize(descripcion, cw - 4);
  doc.text(descLines, margin + 2, y, { lineHeightFactor: 1.5 });
  y += descLines.length * 5.7;

  drawSectionTitle(doc, y, "Datos del contrato", margin, cw);
  y += 11;

  // Fee Mensual = el renting real (monto_renting), SIN ningún cálculo.
  const feeVal = Number(data.montoRenting || 0);
  const montoFee =
    data.moneda === "UF"
      ? `UF ${feeVal.toLocaleString("es-CL")}`
      : `$ ${Math.round(feeVal).toLocaleString("es-CL")}`;

  const contratoRows: [string, any][] = [
    ["Tipo de Contrato:", contrato.tipo_contrato || cliente.tipo_contrato || "Arriendo mensual"],
    ["Duración del Contrato(años):", contrato.datos_presupuesto?.anos_contrato || contrato.contractTerm || "N/A"],
    ["Fee Mensual:", montoFee],
  ];

  contratoRows.forEach(([label, value]) => {
    drawRow(doc, y, label, value, margin);
    y += 6;
  });

  y += 6;

  drawSectionTitle(doc, y, "Resumen del contrato", margin, cw);
  y += 11;

  doc.setFillColor(255, 255, 255);
  doc.rect(margin, y - 3, cw, 22, "F");
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.2);
  doc.rect(margin, y - 3, cw, 22, "S");

  const resumenItems: [string, string][] = [
    ["Facturas pagadas:", `${pagados.length}`],
    ["Facturas no pagadas:", `${noPagadosEmitidos.length}`],
    ["Facturas por pagar según contrato:", `${porPagar.length}`],
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
  try {
    doc.addImage("/kristalina-logo.png", "PNG", pageWidth - margin - 48, y - 3, 48, 14.5);
  } catch (_) {}
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...BLUE_DARK);
  doc.text("EVALUACIÓN DE EFECTIVIDAD DE LA SOLUCIÓN", margin, y + 8);
  doc.setDrawColor(...BLUE_DARK);
  doc.setLineWidth(0.4);
  doc.line(margin, y + 10, margin + cw, y + 10);
  y += 20;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(0, 0, 0);
  doc.text("Estado de la Solución:", margin, y);
  y += 8;
  const opcionesEfectividad = ["Efectiva", "En observación", "Requiere Ajustes"];
  const efectividad = (data.datosReporte?.efectividad || "").toLowerCase().trim();
  let cbX = margin + 2;
  const cbSpacing = 50;
  opcionesEfectividad.forEach((op) => {
    const checked = op.toLowerCase() === efectividad;
    drawCheckbox(doc, cbX, y, op, checked);
    cbX += cbSpacing;
  });
  y += 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(0, 0, 0);
  doc.text("Descripcion de resultados:", margin, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(50, 50, 50);
  const descResultadosLines = doc.splitTextToSize(
    data.datosReporte?.efectividad_comentario || "Sin descripción.",
    cw - 4,
  );
  doc.text(descResultadosLines, margin + 2, y, { lineHeightFactor: 1.4 });
  y += descResultadosLines.length * 5.2 + 6;
  y += 8;
  doc.setDrawColor(200, 210, 230);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(0, 0, 0);
  doc.text("Condición general:", margin, y);
  y += 8;
  const condicion = (data.datosReporte?.condicion_general || "").toLowerCase().trim();
  const opcionesCondicion = ["Óptima", "Buena", "Regular", "Deficiente"];
  cbX = margin + 2;
  opcionesCondicion.forEach((op) => {
    const checked = op.toLowerCase() === condicion;
    drawCheckbox(doc, cbX, y, op, checked);
    cbX += 40;
  });
  y += 14;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(0, 0, 0);
  doc.text("Funcionamiento:", margin, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(50, 50, 50);
  const funcLines = doc.splitTextToSize(data.datosReporte?.funcionamiento || "Sin observaciones.", cw - 4);
  doc.text(funcLines, margin + 2, y, { lineHeightFactor: 1.4 });
  y += funcLines.length * 5.2 + 14;
  doc.setFillColor(255, 255, 255);
  doc.rect(margin, y, cw, 30, "F");
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.2);
  doc.rect(margin, y, cw, 30, "S");
  y += 9;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...BLUE_DARK);
  doc.text("Fecha de revisión e inspección:", margin + 4, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  doc.text(formatFechaDDMMYYYY(data.datosReporte?.fecha_revision), margin + 70, y);
  y += 9;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BLUE_DARK);
  doc.text("Revisado por:", margin + 4, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  doc.text(data.datosReporte?.revisado_por || "N/A", margin + 70, y);
  drawFooter(doc, pageWidth, pageHeight);

  // ════════════════════════════════════════════════════════════════════════════
  // PÁGINA 3 — Actividad de Solución + Imágenes
  // ════════════════════════════════════════════════════════════════════════════
  doc.addPage();
  y = 18;

  try {
    doc.addImage("/kristalina-logo.png", "PNG", pageWidth - margin - 48, y - 3, 48, 14.5);
  } catch (_) {}

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...BLUE_DARK);
  doc.text("ACTIVIDAD DE SOLUCIÓN", margin, y + 8);

  doc.setDrawColor(...BLUE_DARK);
  doc.setLineWidth(0.4);
  doc.line(margin, y + 10, margin + cw, y + 10);

  y += 20;

  // Introductory text
  const introText =
    "Se deja constancia que la solución implementada en la recirculación de los sectores, tiene su horario de activo y reposo. En la tabla anexa se informa la hora del proceso completo.";
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(50, 50, 50);
  const introLines = doc.splitTextToSize(introText, cw - 4);
  doc.text(introLines, margin + 2, y, { lineHeightFactor: 1.5 });
  y += introLines.length * 5.2 + 6;

  // Subtitle: Sala de Bombas (debe ir sobre su tabla)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...BLUE_DARK);
  doc.text("Sala de Bombas", margin, y);
  y += 6;

  // Table header
  const colWidths = [cw * 0.4, cw * 0.3, cw * 0.3];
  const headerH = 7;

  doc.setFillColor(...BLUE_DARK);
  doc.rect(margin, y, cw, headerH, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);

  let tx = margin;
  const headers = ["Item", "Horario Activo", "Horario Reposo"];
  headers.forEach((h, i) => {
    doc.text(h, tx + 3, y + 5);
    tx += colWidths[i];
  });

  y += headerH;

  // Table rows
  const rows = data.actividadSolucion || [];
  const rowH = 6;

  rows.forEach((row, idx) => {
    const isEven = idx % 2 === 0;
    if (isEven) {
      doc.setFillColor(245, 248, 255);
      doc.rect(margin, y, cw, rowH, "F");
    }

    doc.setDrawColor(220, 225, 235);
    doc.setLineWidth(0.2);
    doc.line(margin, y + rowH, margin + cw, y + rowH);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(30, 30, 30);

    tx = margin;
    const vals = [row.item || "", row.horario_activo || "", row.horario_reposo || ""];
    vals.forEach((v, i) => {
      doc.text(v, tx + 3, y + 4.3);
      tx += colWidths[i];
    });

    // vertical lines
    let lx = margin;
    colWidths.forEach((w) => {
      doc.line(lx, y, lx, y + rowH);
      lx += w;
    });
    doc.line(lx, y, lx, y + rowH);

    y += rowH;
  });

  // If no rows, draw empty rows
  if (rows.length === 0) {
    for (let i = 0; i < 8; i++) {
      const isEven = i % 2 === 0;
      if (isEven) {
        doc.setFillColor(245, 248, 255);
        doc.rect(margin, y, cw, rowH, "F");
      }
      doc.setDrawColor(220, 225, 235);
      doc.setLineWidth(0.2);
      doc.line(margin, y + rowH, margin + cw, y + rowH);

      let lx = margin;
      colWidths.forEach((w) => {
        doc.line(lx, y, lx, y + rowH);
        lx += w;
      });
      doc.line(margin + cw, y, margin + cw, y + rowH);

      y += rowH;
    }
  }

  // outer border
  const tableStartY = y - (rows.length > 0 ? rows.length : 8) * rowH;
  doc.setDrawColor(...BLUE_DARK);
  doc.setLineWidth(0.4);
  doc.rect(margin, tableStartY, cw, (rows.length > 0 ? rows.length : 8) * rowH, "S");

  // Torre Enfriamiento table (if available)
  const torreRows = data.torreEnfriamiento || [];
  if (torreRows.length > 0 && torreRows.some((r) => r.item || r.horario_activo || r.horario_reposo)) {
    y += 10;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...BLUE_DARK);
    doc.text("Torre Enfriamiento", margin, y);
    y += 6;

    // Table header
    doc.setFillColor(...BLUE_DARK);
    doc.rect(margin, y, cw, headerH, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);

    let ttx = margin;
    headers.forEach((h, i) => {
      doc.text(h, ttx + 3, y + 5);
      ttx += colWidths[i];
    });
    y += headerH;

    torreRows.forEach((row, idx) => {
      const isEven = idx % 2 === 0;
      if (isEven) {
        doc.setFillColor(245, 248, 255);
        doc.rect(margin, y, cw, rowH, "F");
      }
      doc.setDrawColor(220, 225, 235);
      doc.setLineWidth(0.2);
      doc.line(margin, y + rowH, margin + cw, y + rowH);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(30, 30, 30);

      let tvx = margin;
      const vals = [row.item || "", row.horario_activo || "", row.horario_reposo || ""];
      vals.forEach((v, i) => {
        doc.text(v, tvx + 3, y + 4.3);
        tvx += colWidths[i];
      });

      let tlx = margin;
      colWidths.forEach((w) => {
        doc.line(tlx, y, tlx, y + rowH);
        tlx += w;
      });
      doc.line(tlx, y, tlx, y + rowH);

      y += rowH;
    });

    // outer border
    const torreTableStartY = y - torreRows.length * rowH;
    doc.setDrawColor(...BLUE_DARK);
    doc.setLineWidth(0.4);
    doc.rect(margin, torreTableStartY, cw, torreRows.length * rowH, "S");
  }

  // Imágenes debajo de la tabla — respetando la proporción real (sin estirar).
  // Cada imagen tiene un "slot" fijo y se encaja dentro (contain) y se centra,
  // así una foto vertical u horizontal nunca se deforma.
  y += 8;
  const imagenes = data.imagenesReporte || [];
  if (imagenes.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...BLUE_DARK);
    doc.text("Registro fotográfico", margin, y);
    y += 5;

    const slotW = imagenes.length === 1 ? cw : (cw - 6) / 2;
    const slotH = Math.min(55, Math.max(30, pageHeight - y - 22));

    const dimsList = await Promise.all(imagenes.slice(0, 2).map((u) => getImageDims(u)));

    imagenes.slice(0, 2).forEach((url, i) => {
      try {
        const xSlot = margin + (i === 1 ? slotW + 6 : 0);
        const dims = dimsList[i];

        // Por defecto llena el slot; si conocemos la proporción real, encajamos.
        let drawW = slotW;
        let drawH = slotH;
        if (dims && dims.w > 0 && dims.h > 0) {
          const ratio = dims.w / dims.h;
          drawW = slotW;
          drawH = slotW / ratio;
          if (drawH > slotH) {
            drawH = slotH;
            drawW = slotH * ratio;
          }
        }

        // Centrar la imagen dentro de su slot.
        const xPos = xSlot + (slotW - drawW) / 2;
        const yPos = y + (slotH - drawH) / 2;
        doc.addImage(url, "JPEG", xPos, yPos, drawW, drawH);
      } catch (_) {}
    });

    y += slotH;
  }

  drawFooter(doc, pageWidth, pageHeight);

  // ════════════════════════════════════════════════════════════════════════════
  // PÁGINA 4 — Mantenimiento, Observaciones, Conclusión, Firma
  // ════════════════════════════════════════════════════════════════════════════
  doc.addPage();
  y = 18;

  try {
    doc.addImage("/kristalina-logo.png", "PNG", pageWidth - margin - 48, y - 3, 48, 14.5);
  } catch (_) {}

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...BLUE_DARK);
  doc.text("MANTENIMIENTO Y CONCLUSIONES", margin, y + 8);

  doc.setDrawColor(...BLUE_DARK);
  doc.setLineWidth(0.4);
  doc.line(margin, y + 10, margin + cw, y + 10);

  y += 22;

  // Requiere mantenimiento
  drawSectionTitle(doc, y, "¿Requiere mantenimiento la Solución?", margin, cw);
  y += 11;

  const reqMant = data.datosReporte?.requiere_mantenimiento;
  cbX = margin + 2;
  drawCheckbox(doc, cbX, y, "Sí", reqMant === true);
  drawCheckbox(doc, cbX + 30, y, "No", reqMant === false || reqMant === undefined);
  y += 10;

  // Detalle mantenimiento
  if (data.datosReporte?.detalle_mantenimiento) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(...GRAY_TEXT);
    doc.text("Detalle de mantenimiento:", margin + 2, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    const detLines = doc.splitTextToSize(data.datosReporte.detalle_mantenimiento, cw - 4);
    doc.text(detLines, margin + 2, y, { lineHeightFactor: 1.4 });
    y += detLines.length * 5.2 + 6;
  }

  // Fecha próxima mantenimiento
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...GRAY_TEXT);
  doc.text("Fecha próxima de mantenimiento:", margin + 2, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  doc.text(formatFechaDDMMYYYY(data.datosReporte?.fecha_proxima_mantenimiento), margin + 72, y);
  y += 14;

  // Separator
  doc.setDrawColor(200, 210, 230);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // ── Paginación automática para los textos largos ──────────────────────────
  // Si el contenido no entra en la página, crea una nueva y sigue ahí.
  const BOTTOM_LIMIT = pageHeight - 22;
  const LINE_H = 5.2;

  const newPageForText = () => {
    drawFooter(doc, pageWidth, pageHeight);
    doc.addPage();
    y = 18;
    try {
      doc.addImage("/kristalina-logo.png", "PNG", pageWidth - margin - 48, y - 3, 48, 14.5);
    } catch (_) {}
    y += 16;
  };
  const ensureSpace = (needed: number) => {
    if (y + needed > BOTTOM_LIMIT) newPageForText();
  };
  // Dibuja "título de sección + párrafo", saltando de página cuando hace falta.
  const drawParrafo = (titulo: string, texto: string, gapAfter: number) => {
    ensureSpace(18); // que el título no quede huérfano al final de la hoja
    drawSectionTitle(doc, y, titulo, margin, cw);
    y += 11;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(50, 50, 50);
    const lines = doc.splitTextToSize(texto, cw - 4);
    for (const line of lines) {
      if (y + LINE_H > BOTTOM_LIMIT) newPageForText();
      doc.text(line, margin + 2, y, { lineHeightFactor: 1.4 });
      y += LINE_H;
    }
    y += gapAfter;
  };

  // Observaciones generales
  drawParrafo("Observaciones generales", data.datosReporte?.observaciones_generales || "Sin observaciones.", 10);

  // Conclusión
  drawParrafo("Conclusión", data.datosReporte?.conclusion || "Sin conclusión.", 20);

  // El bloque de firma debe quedar entero: si no entra, va a una página nueva.
  ensureSpace(85);

  // Separator
  doc.setDrawColor(200, 210, 230);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 14;

  // Signature space
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...BLUE_DARK);
  doc.text("Firma:", margin, y);

  y += 35;

  try {
    // Posición y -> encima de la linea (y)
    doc.addImage("/firmaARM.jpg", "JPEG", margin + 2, y - 35, 66, 36);
  } catch (e) {
    console.warn("Signature image not found", e);
  }

  doc.setDrawColor(100, 100, 100);
  doc.setLineWidth(0.4);
  doc.line(margin, y, margin + 70, y);

  y += 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(0, 0, 0);
  doc.text("Arturo Ramírez Mendive", margin, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...GRAY_TEXT);
  y += 5;
  doc.text("Celular +56 9 7807 1418", margin, y);
  y += 4.5;
  doc.text("www.kristalina.cl", margin, y);
  y += 4.5;
  doc.text("Santiago-Chile", margin, y);

  y += 6;
  try {
    doc.addImage("/kristalina-logo.png", "PNG", margin, y, 36, 10.9);
  } catch (_) {}
  y += 18;
  const today = new Date();
  const fechaHoy = `${today.getDate().toString().padStart(2, "0")}/${(today.getMonth() + 1).toString().padStart(2, "0")}/${today.getFullYear()}`;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...GRAY_TEXT);
  doc.text("Fecha:", margin, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  doc.text(fechaHoy, margin + 15, y);

  drawFooter(doc, pageWidth, pageHeight);

  return doc.output("blob");
};
