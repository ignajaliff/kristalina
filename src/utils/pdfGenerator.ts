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
  presupuesto_total_deptos: number;
  descuento_porcentaje: number;
  precio_instalacion: number;
  anos_contrato: number;
  matriz_principal: number;
  recirculacion: number;
}

const getMonthName = (monthIndex: number) => {
  const months = [
    "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
    "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"
  ];
  return months[monthIndex];
};

const drawHeader = (doc: jsPDF, pageWidth: number) => {
  try {
    doc.addImage("/kristalina-logo.png", "PNG", (pageWidth - 50) / 2, 10, 50, 18);
  } catch (e) {
    console.error("Logo not found", e);
  }
};

const drawFooter = (doc: jsPDF, pageWidth: number, pageHeight: number, pageNum: number) => {
  const footerText = "www.kristalina.cl";
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(30, 144, 255); // Blue color
  doc.text(footerText, pageWidth / 2, pageHeight - 15, { align: "center" });

  doc.setTextColor(0);
  doc.setFontSize(9);
  doc.text(pageNum.toString(), pageWidth - 15, pageHeight - 15);
};

export function generatePresupuestoPDF(cliente: Cliente, datos: DatosPresupuesto): Blob {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  let pageNum = 1;

  const checkNewPage = (yNeeded: number): number => {
    if (currentY + yNeeded > pageHeight - 25) {
      drawFooter(doc, pageWidth, pageHeight, pageNum);
      doc.addPage();
      pageNum++;
      drawHeader(doc, pageWidth);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10.5);
      currentY = 40;
    }
    return currentY;
  };

  drawHeader(doc, pageWidth);

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  let currentY = 45;
  doc.text("COTIZACION", pageWidth / 2, currentY, { align: "center" });
  const titleWidth = doc.getTextWidth("COTIZACION");
  doc.setLineWidth(0.5);
  doc.line((pageWidth - titleWidth) / 2, currentY + 1, (pageWidth + titleWidth) / 2, currentY + 1);
  currentY += 12;

  // Metadata Section
  doc.setFontSize(10.5);
  doc.setFont("helvetica", "normal");

  doc.text("Descripción:", margin, currentY);
  doc.setFont("helvetica", "bold");
  doc.text("SISTEMA CENTRAL PARA LA ELIMINAR SARRO", margin + 25, currentY);
  currentY += 4;

  doc.setFont("helvetica", "normal");
  doc.text("Ubicación:", margin, currentY);
  doc.setFont("helvetica", "bold");
  const locText = `Comunidad- ${cliente.communityname} ${cliente.buildingaddress || ""}`;
  doc.text(locText, margin + 25, currentY);
  currentY += 8;

  const now = new Date();
  doc.setFont("helvetica", "normal");
  doc.text("Fecha:", margin, currentY);
  doc.setFont("helvetica", "bold");
  doc.text(`${now.getDate()} de ${getMonthName(now.getMonth())} de ${now.getFullYear()}`, margin + 25, currentY);
  currentY += 4;

  doc.setFont("helvetica", "normal");
  doc.text("AT:", margin, currentY);
  doc.setFont("helvetica", "bold");
  doc.text(cliente.adminname.toUpperCase(), margin + 25, currentY);
  currentY += 8;

  doc.setLineWidth(0.2);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 8;

  // Situación a tratar
  doc.setFont("helvetica", "normal");
  doc.text("Situación a tratar:", margin, currentY);
  currentY += 8;

  const situacionText = "Producto de la alta concentración en algunas zonas del país de carbonatos de calcio y magnesio en el agua utilizada para consumo de personas y procesos industriales, se generan una serie de daños e incrustaciones en equipos, redes de cañerías, fittings y griferías producto del sarro.";
  doc.text(situacionText, margin, currentY, { maxWidth: contentWidth, align: "justify", lineHeightFactor: 1.2 });
  const splitSituacion = doc.splitTextToSize(situacionText, contentWidth);
  currentY += (splitSituacion.length * 5) + 10;

  const techText = "Nuestros dispositivos fabricados en acero inoxidable 304, producen un efecto permanente evitando la generación de sarro e incrustaciones además de una eliminación en corto tiempo de las incrustaciones existentes. También una serie de beneficios para la piel y salud producto de la calidad del agua resultante para los Residentes.";
  doc.text(techText, margin, currentY, { maxWidth: contentWidth, align: "justify", lineHeightFactor: 1.2 });
  const splitTech = doc.splitTextToSize(techText, contentWidth);
  currentY += (splitTech.length * 5) + 10;

  const propuestaText = `En base a la visita realizada al edificio, proponemos el suministro e instalación de un sistema Ionizador Central para el edificio, en la recirculación entre ambos estanques acumuladores de agua potable, generando por la cinética una inestabilidad constante de la dureza contenida en el agua.`;
  doc.text(propuestaText, margin, currentY, { maxWidth: contentWidth, align: "justify", lineHeightFactor: 1.2 });
  const splitPropuesta = doc.splitTextToSize(propuestaText, contentWidth);
  currentY += (splitPropuesta.length * 5) + 12;

  // Equipment List - DYNAMIC based on matriz_principal and recirculacion
  checkNewPage(40);
  doc.text("Los equipos a utilizar en este tratamiento son los siguientes:", margin, currentY);
  currentY += 8;

  const mp = datos.matriz_principal;
  const eq1 = mp > 1
    ? `${mp} aceleradores de sistemas K-IO - Iónico de 2" en acero inoxidable en la alimentación principal a los estanques. Colocamos ${mp} ionizadores en el ingreso de la alimentación del agua ya que el volumen de los estanques es muy grande y permitirá tener un mejor desempeño.`
    : '1 acelerador sistemas K-IO - Iónico de 2" en acero inoxidable en la alimentación principal a los estanques. Colocamos 1 ionizador en el ingreso de la alimentación del agua ya que el volumen de los estanques es muy grande y permitirá tener un mejor desempeño.';

  doc.text("•", margin + 5, currentY);
  doc.text(eq1, margin + 10, currentY, { maxWidth: contentWidth - 10, align: "justify", lineHeightFactor: 1.1 });
  const splitEq1 = doc.splitTextToSize(eq1, contentWidth - 10);
  currentY += (splitEq1.length * 5) + 8;

  doc.setFont("helvetica", "normal");
  doc.text("KIT Entre los estanques de agua.", margin, currentY);
  currentY += 8;

  const rc = datos.recirculacion;
  const kitItems = rc > 1
    ? [
        `${rc} aceleradores de sistemas K-IO - Iónico de 1" en acero inoxidable en recirculación entre ambos estanques.`,
        `${rc} filtros para sedimentos de 1" con malla metálica para 100 micras con despiche automático.`,
        `${rc} bombas recirculadoras monofásicas para un caudal de 8m3/h.`,
        `${rc} controladores digitales.`
      ]
    : [
        '1 acelerador sistemas K-IO - Iónico de 1" en acero inoxidable en recirculación entre ambos estanques.',
        '1 filtro para sedimentos de 1" con malla metálica para 100 micras con despiche automático.',
        '1 bomba recirculadora monofásica para un caudal de 8m3/h.',
        '1 Timer controlador digital.'
      ];

  kitItems.forEach(item => {
    checkNewPage(10);
    doc.text("•", margin + 5, currentY);
    doc.text(item, margin + 10, currentY, { maxWidth: contentWidth - 10, align: "justify", lineHeightFactor: 1.1 });
    const splitItem = doc.splitTextToSize(item, contentWidth - 10);
    currentY += (splitItem.length * 5) + 2;
  });

  currentY += 8;
  const closingText = 'Esta propuesta considera todos los materiales, elementos y accesorios para la óptima instalación y funcionamiento del sistema, bajo modalidad “Llave en mano”.';
  doc.text(closingText, margin, currentY, { maxWidth: contentWidth, align: "justify", lineHeightFactor: 1.2 });
  const splitClosing = doc.splitTextToSize(closingText, contentWidth);
  currentY += (splitClosing.length * 5) + 12;

  // Propuesta Económica
  checkNewPage(60);
  doc.setFont("helvetica", "bold");
  doc.text("Propuesta Económica:", margin, currentY);
  currentY += 8;
  doc.setFont("helvetica", "normal");

  const formatCurrency = (val: number) => {
    if (datos.moneda === "UF") return `${val.toFixed(2)} UF`;
    return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", minimumFractionDigits: 0 }).format(val);
  };

  const valorMensualArriendo = cliente.units > 0 ? datos.presupuesto_total_deptos / cliente.units : 0;
  const costoTotalMensualEquipos = (datos.presupuesto_total_deptos * datos.descuento_porcentaje) / 100;

  doc.text("Valor mensual de arriendo por Depto.: ", margin, currentY);
  const labelWidth = doc.getTextWidth("Valor mensual de arriendo por Depto.: ");
  doc.setFont("helvetica", "bold");
  doc.text(`${formatCurrency(valorMensualArriendo)} más IVA mensual.`, margin + labelWidth, currentY);
  currentY += 8;

  const valueX = 100;
  doc.setFont("helvetica", "normal");
  doc.text(`Presupuesto total sobre un total de ${cliente.units} deptos. `, margin, currentY);
  doc.text(`,${formatCurrency(datos.presupuesto_total_deptos)}.- más IVA mensual.`, valueX, currentY);
  currentY += 4;

  const discountVal = costoTotalMensualEquipos;
  doc.text("Descuento promoción ", margin, currentY);
  const promoLabelWidth = doc.getTextWidth("Descuento promoción ");
  doc.setFont("helvetica", "bold");
  doc.text(`MENSUAL ${datos.descuento_porcentaje}%`, margin + promoLabelWidth, currentY);
  doc.setFont("helvetica", "normal");
  doc.text("", margin + promoLabelWidth + doc.getTextWidth(`MENSUAL ${datos.descuento_porcentaje}%`), currentY);
  doc.text(`,${formatCurrency(discountVal)}.-`, valueX, currentY);
  currentY += 4;

  doc.setFont("helvetica", "bold");
  doc.text("Costo total mensual equipos", margin, currentY);
  doc.setFont("helvetica", "normal");
  doc.text(`,${formatCurrency(costoTotalMensualEquipos)}.- más IVA mensual.`, valueX, currentY);
  currentY += 8;

  doc.setFont("helvetica", "normal");
  const visitsText = "Se incluyen 3 visitas anuales de seguimiento y control de la solución, incluidas en el servicio.";
  doc.text("•", margin + 5, currentY);
  doc.text(visitsText, margin + 10, currentY, { maxWidth: contentWidth - 10, align: "justify" });
  currentY += 6;

  doc.text("•", margin + 5, currentY);
  doc.text("Tiempo de Ejecución: 2 días", margin + 10, currentY);
  currentY += 12;

  // Forma de Pago y Contrato
  checkNewPage(50);
  doc.setFont("helvetica", "bold");
  doc.text("Forma de Pago y Contrato:", margin, currentY);
  currentY += 8;
  doc.setFont("helvetica", "normal");

  const pagoItems = [
    "Formato de contrato arriendo mensual.",
    `Duración de Contrato de ${datos.anos_contrato} años.`,
    `Precio de la instalación: ${formatCurrency(datos.precio_instalacion)} + IVA, única vez en dos pagos.`,
    "Firma de contrato 50%",
    "Contra entrega 50%"
  ];

  pagoItems.forEach((item, idx) => {
    if (idx < 3) {
      doc.text("•", margin + 5, currentY);
      doc.text(item, margin + 10, currentY);
      currentY += 5;
    } else {
      doc.text(item, margin + 12, currentY);
      currentY += 5;
    }
  });

  currentY += 8;
  doc.text("Quedamos atentos a sus comentarios.", margin, currentY);
  currentY += 12;

  doc.text("Atte.", margin, currentY);
  currentY += 8;

  // Arturo Signature Block
  checkNewPage(40);
  try {
    doc.addImage("/kristalina-logo.png", "PNG", margin, currentY, 40, 14);
  } catch (e) {
    console.error("Logo not found", e);
  }
  currentY += 20;

  doc.setFont("helvetica", "bold");
  doc.text("Arturo Ramírez Mendive", margin, currentY);
  currentY += 4;
  doc.setFont("helvetica", "normal");
  doc.text("Celular +56 9 7807 1418", margin, currentY);
  currentY += 4;
  doc.text("www.kristalina.cl", margin, currentY);
  currentY += 4;
  doc.text("Santiago-Chile", margin, currentY);

  drawFooter(doc, pageWidth, pageHeight, pageNum);

  return doc.output("blob");
}
