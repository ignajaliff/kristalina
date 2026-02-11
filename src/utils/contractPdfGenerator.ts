
import jsPDF from "jspdf";

interface ClienteContrato {
  adminname: string;
  adminemail: string;
  communityname: string;
  buildingaddress: string | null;
  buildingtype: string;
  units: number;
  vendedor: string | null;
  monto: number | null;
}

export interface DatosContrato {
  legalrepresentative: string;
  legalrepresentativerut: string;
  communityrut: string;
  communityemail: string;
  legalrepresentativephone: string;
  communityformationdate: string;
  communityaddress: string;
  communityregion: string;
  deviceinstallation: string;
  legalrepresentativenationality: string;
  legalrepresentativemaritalstatus: string;
  legalrepresentativeprofession: string;
  contractTerm?: string;
  notary: string;
}

const getMonthName = (monthIndex: number) => {
  const months = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
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
  const footerText = "Andrés de Vera 5067, Oficina 601 B, Vitacura, Santiago.   Teléfono +56 97807 1418";
  doc.setFont("times", "normal");
  doc.setFontSize(9);
  doc.setTextColor(30, 144, 255); // Blue color
  doc.text(footerText, pageWidth / 2, pageHeight - 15, { align: "center" });

  doc.setTextColor(0);
  doc.setFontSize(9);
  doc.text(pageNum.toString(), pageWidth - 15, pageHeight - 15);
};

export function generateContratoPDF(cliente: ClienteContrato, datos: DatosContrato): Blob {
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
      doc.setFont("times", "normal");
      doc.setFontSize(10.5);
      currentY = 40;
    }
    return currentY;
  };

  drawHeader(doc, pageWidth);

  // Header Title
  doc.setFont("times", "bold");
  doc.setFontSize(11);
  let currentY = 45;
  const titles = [
    "CONTRATO",
    "DE",
    "ARRENDAMIENTO DE DISPOSITIVO Y PRESTACIÓN DE SERVICIOS",
    "ENTRE",
    "",
    "KRISTALINA SpA",
    "",
    "Y",
    "",
    cliente.communityname
  ];

  titles.forEach(title => {
    if (title === "") {
      currentY += 2;
    } else {
      doc.text(title, pageWidth / 2, currentY, { align: "center" });
      currentY += 4;
    }
  });

  currentY += 4;

  // Introduction text
  doc.setFont("times", "normal");
  doc.setFontSize(10.5);
  const now = new Date();

  const introText = `En Santiago de Chile, a ${now.getDate()} de ${getMonthName(now.getMonth())} del 2025, entre la sociedad KRISTALINA SpA, Rol único tributario número 77.717.316-2, representada según se acreditará por don Arturo Ramírez Mendive, chileno, casado, ingeniero comercial, cédula de identidad número 10.537.439-9, ambos domiciliados para estos efectos en Andrés de Vera número 5067, oficina 601, comuna de Vitacura, Región Metropolitana, por una parte, en adelante “El Proveedor” y, por la otra, ${cliente.communityname}, Rol único tributario número ${datos.communityrut}, representada según se acreditará por don ${datos.legalrepresentative}, ${datos.legalrepresentativenationality}, ${datos.legalrepresentativemaritalstatus}, ${datos.legalrepresentativeprofession}, cédula de identidad número ${datos.legalrepresentativerut}, ambos domiciliados para estos efectos en ${datos.communityaddress}, Región ${datos.communityregion}, en adelante “El Cliente”, se ha convenido en el siguiente contrato de arrendamiento de equipos y de prestación de servicios, en adelante “EL CONTRATO”.`;

  doc.text(introText, margin, currentY, {
    maxWidth: contentWidth,
    align: "justify",
    lineHeightFactor: 1.2
  });

  const splitIntro = doc.splitTextToSize(introText, contentWidth);
  currentY += (splitIntro.length * 5) + 4;

  // PRIMERO: ANTECEDENTES
  doc.setFont("times", "bold");
  doc.text("PRIMERO: ANTECEDENTES.", margin, currentY);
  const textWidth = doc.getTextWidth("PRIMERO: ANTECEDENTES.");
  doc.line(margin, currentY + 0.5, margin + textWidth, currentY + 0.5);
  currentY += 4;

  doc.setFont("times", "normal");
  const antecedenteText = 'La empresa Kristalina, reconocida por su experiencia en el desarrollo de soluciones innovadoras para el mantenimiento de sistemas hidráulicos, pone a disposición su dispositivo eliminador de sarro a través del sistema K-IO. Este equipo ha sido diseñado para resolver eficazmente uno de los problemas más comunes en instalaciones de agua: la acumulación de sarro en las tuberías.';
  doc.text(antecedenteText, margin, currentY, {
    maxWidth: contentWidth,
    align: "justify",
    lineHeightFactor: 1.2
  });

  const splitAntecedente = doc.splitTextToSize(antecedenteText, contentWidth);
  currentY += (splitAntecedente.length * 5) + 4;

  const beneficiosIntro = 'Este dispositivo ofrece beneficios en tres ámbitos principales: salud, mantenimiento y costos. Entre sus ventajas se destacan:';
  doc.text(beneficiosIntro, margin, currentY, {
    maxWidth: contentWidth,
    align: "justify",
    lineHeightFactor: 1.2
  });

  const splitBeneficios = doc.splitTextToSize(beneficiosIntro, contentWidth);
  currentY += (splitBeneficios.length * 5) + 4;

  // Highlights Section
  const listItems = [
    {
      idx: "1.",
      title: "Calidad del agua:",
      bullets: [
        "Mejora sustancial en la calidad del agua, ionizándola y alcalinizándola para beber y cocinar.",
        "Mejora los rendimientos de productos cosméticos.",
        "Alta calidad del agua para la fabricación de hielo.",
        "Menor uso de detergentes, suavizantes y otros productos de limpieza."
      ]
    },
    {
      idx: "2.",
      title: "Mantenimiento y ahorro:",
      bullets: [
        "Limpieza de incrustaciones históricas en cañerías, redes de agua y sus accesorios.",
        "Reducción de costos de mantenimiento en lavadoras, lavavajillas y hervidores.",
        "Previene el deterioro de artefactos, griferías y accesorios.",
        "Genera desincrustación de elementos y cañerías obstruidas por sarro.",
        "Ahorro en Mantenimiento preventivo y correctivo de bombas, tuberías, calderas, bombas de calor y estanques de agua.",
        "Ahorro en gas para calderas y calentadores de agua.",
        "Resuelve el problema de no tener incrustaciones en las verticales de impulsión, válvulas de retención"
      ]
    },
    {
      idx: "3.",
      title: "Eficiencia y sostenibilidad:",
      bullets: [
        "Reducción del deterioro de equipos en contacto constante con agua.",
        "Ahorro significativo en el consumo de agua y gas gracias a la optimización de procesos.",
        "Disminución de fallas y necesidades de mantenimiento provocadas por agua de baja calidad."
      ]
    }
  ];

  listItems.forEach((item) => {
    checkNewPage(15);
    doc.setFont("times", "normal");
    doc.text(item.idx, margin + 10, currentY);
    doc.setFont("times", "bold");
    doc.text(item.title, margin + 15, currentY);
    currentY += 6;

    doc.setFont("times", "normal");
    item.bullets.forEach(bullet => {
      checkNewPage(8);
      const bulletSymbol = "o  ";
      doc.text(bulletSymbol, margin + 18, currentY);
      doc.text(bullet, margin + 22, currentY, {
        maxWidth: contentWidth - 22,
        align: "justify",
        lineHeightFactor: 1.1
      });
      const splitBullet = doc.splitTextToSize(bullet, contentWidth - 22);
      currentY += (splitBullet.length * 5);
    });
    currentY += 4;
  });

  checkNewPage(15);
  const closingAntecedentes = "Con estas características y beneficios, el dispositivo eliminador de sarro a través del sistema K-IO, representa una solución eficiente, sostenible y rentable para los usuarios.";
  doc.text(closingAntecedentes, margin, currentY, {
    maxWidth: contentWidth,
    align: "justify",
    lineHeightFactor: 1.2
  });
  currentY += 4;

  // SEGUNDO: OBJETO
  checkNewPage(20);
  doc.setFont("times", "bold");
  doc.text("SEGUNDO:  OBJETO.", margin, currentY);
  const secondTitleWidth = doc.getTextWidth("SEGUNDO:  OBJETO.");
  doc.line(margin, currentY + 0.5, margin + secondTitleWidth, currentY + 0.5);
  currentY += 4;

  doc.setFont("times", "normal");
  const objetoText = "Por medio del presente instrumento, EL PROVEEDOR da en arriendo al CLIENTE, quien recibe y acepta, un dispositivo denominado ACELERADOR IONICO (K-IO) eliminador de sarro en tuberías, accesorios y equipos, especificado en el Anexo 1 del presente contrato, en adelante “El Dispositivo”, nuevo, sin uso y que se encuentra en perfecto estado de funcionamiento.";

  doc.text(objetoText, margin, currentY, {
    maxWidth: contentWidth,
    align: "justify",
    lineHeightFactor: 1.2
  });
  const splitObjeto = doc.splitTextToSize(objetoText, contentWidth);
  currentY += (splitObjeto.length * 5) + 4;

  // TERCERO: PROPIEDAD DEL DISPOSITIVO
  checkNewPage(20);
  doc.setFont("times", "bold");
  doc.text("TERCERO:  PROPIEDAD DEL DISPOSITIVO.", margin, currentY);
  const thirdTitleWidth = doc.getTextWidth("TERCERO:  PROPIEDAD DEL DISPOSITIVO.");
  doc.line(margin, currentY + 0.5, margin + thirdTitleWidth, currentY + 0.5);
  currentY += 4;

  doc.setFont("times", "normal");
  doc.setFontSize(10.5);
  const propiedadP1 = "El Cliente reconoce y acepta que El Dispositivo es de propiedad del Proveedor, y por tanto se obliga a restituirlo al término del presente Contrato, en el estado en que le fueran entregados, en perfecto estado de funcionamiento, sin perjuicio del deterioro propio del uso normal de los mismos.";
  doc.text(propiedadP1, margin, currentY, { maxWidth: contentWidth, align: "justify", lineHeightFactor: 1.2 });
  const splitP1 = doc.splitTextToSize(propiedadP1, contentWidth);
  currentY += (splitP1.length * 5) + 4;

  const propiedadP2 = "El Cliente deberá en todo momento durante la vigencia del presente Contrato tomar las medidas que sean necesarias para procurar la conservación y el cuidado del Dispositivo, previniendo todo riesgo que pudiere sobrevenir y que los pudiere afectar, debiendo mantener indemne e indemnizar al Proveedor de las pérdidas que dicho Dispositivo pudiere sufrir por cualquier causa salvo en casos de fuerza mayor y caso fortuito.";
  doc.text(propiedadP2, margin, currentY, { maxWidth: contentWidth, align: "justify", lineHeightFactor: 1.2 });
  const splitP2 = doc.splitTextToSize(propiedadP2, contentWidth);
  currentY += (splitP2.length * 5) + 4;

  const propiedadP3 = "Asimismo, el Cliente se abstendrá de efectuar cualquier acto que implique transferencia del Dispositivo, que pueda poner en riesgo la titularidad de aquél, no pudiendo ceder, ni transferir en forma alguna ni en ningún título dicho Dispositivo, ni el presente contrato ni sus efectos.";
  doc.text(propiedadP3, margin, currentY, { maxWidth: contentWidth, align: "justify", lineHeightFactor: 1.2 });
  const splitP3 = doc.splitTextToSize(propiedadP3, contentWidth);
  currentY += (splitP3.length * 5) + 4;

  // CUARTO: UBICACIÓN Y USO DEL DISPOSITIVO
  checkNewPage(25);
  doc.setFont("times", "bold");
  doc.text("CUARTO: UBICACIÓN Y USO DEL DISPOSITIVO.", margin, currentY);
  const fourthTitleWidth = doc.getTextWidth("CUARTO: UBICACIÓN Y USO DEL DISPOSITIVO.");
  doc.line(margin, currentY + 0.5, margin + fourthTitleWidth, currentY + 0.5);
  currentY += 4;

  doc.setFont("times", "normal");
  const ubicacionText = `El Proveedor instalará el dispositivo en ${datos.deviceinstallation}, debiendo ser usado exclusivamente en dicha dependencia, quedando vedado retirarlo y trasladarlo a otro lugar, sin el previo consentimiento escrito del PROVEEDOR. Asimismo, el CLIENTE se obliga a usar el Dispositivo de acuerdo a sus especificaciones técnicas establecidas por el fabricante, y a respetar los términos y condiciones de dicho uso en forma estricta, conforme al Manual explicativo y Preventivo del sistema K-IO, que se acompaña como anexo 1 del presente contrato, y que el Cliente declara conocer y aceptar para todos los efectos legales.`;
  doc.text(ubicacionText, margin, currentY, { maxWidth: contentWidth, align: "justify", lineHeightFactor: 1.2 });
  const splitUbicacion = doc.splitTextToSize(ubicacionText, contentWidth);
  currentY += (splitUbicacion.length * 5) + 4;

  // QUINTO: PRECIO DEL CONTRATO y FORMA DE PAGO
  checkNewPage(30);
  doc.setFont("times", "bold");
  doc.text("QUINTO:  PRECIO DEL CONTRATO y FORMA DE PAGO.", margin, currentY);
  const fifthTitleWidth = doc.getTextWidth("QUINTO:  PRECIO DEL CONTRATO y FORMA DE PAGO.");
  doc.line(margin, currentY + 0.5, margin + fifthTitleWidth, currentY + 0.5);
  currentY += 4;

  doc.setFont("times", "normal");
  const montoClp = cliente.monto ? new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(cliente.monto) : "a convenir";
  const precioText = `El precio del presente contrato es la renta mensual en pesos equivalente a ${montoClp}.`;
  doc.text(precioText, margin, currentY, { maxWidth: contentWidth, align: "justify", lineHeightFactor: 1.2 });
  currentY += 4;

  const pagoText = "El pago del precio referido se efectuará en forma mensual, dentro de los 5 días calendario siguientes a la fecha de facturación.";
  doc.text(pagoText, margin, currentY, { maxWidth: contentWidth, align: "justify", lineHeightFactor: 1.2 });
  currentY += 4;

  const moraText = "El no pago íntegro y oportuno del precio en la forma y condiciones estipuladas, hará devengar en favor del Proveedor el máximo del interés penal que la ley permita pactar para la obligación pendiente, por todo el tiempo que transcurra entre la fecha en que debió cumplirse la obligación y la fecha de su pago efectivo, sin perjuicio de los derechos que de acuerdo a la ley pudiere ejercer el Proveedor en su calidad de contratante diligente.";
  doc.text(moraText, margin, currentY, { maxWidth: contentWidth, align: "justify", lineHeightFactor: 1.2 });
  const splitMora = doc.splitTextToSize(moraText, contentWidth);
  currentY += (splitMora.length * 5) + 4;

  // SEXTO: PLAZO DEL CONTRATO
  checkNewPage(25);
  doc.setFont("times", "bold");
  doc.text("SEXTO: PLAZO DEL CONTRATO", margin, currentY);
  const sixthTitleWidth = doc.getTextWidth("SEXTO: PLAZO DEL CONTRATO");
  doc.line(margin, currentY + 0.5, margin + sixthTitleWidth, currentY + 0.5);
  currentY += 4;

  doc.setFont("times", "normal");
  const plazoNum = datos.contractTerm || "1";
  const plazoText = `El plazo del contrato será de ${plazoNum} años, a contar de la fecha del presente instrumento. Dicho plazo será renovable automática y sucesivamente por períodos de ${plazoNum} años, si ninguna de las partes pusiere término al Contrato con 60 días de anticipación a la fecha original de término o de cualesquiera de sus prórrogas, mediante carta certificada enviada al domicilio de la contraparte.`;
  doc.text(plazoText, margin, currentY, { maxWidth: contentWidth, align: "justify", lineHeightFactor: 1.2 });
  const splitPlazo = doc.splitTextToSize(plazoText, contentWidth);
  currentY += (splitPlazo.length * 5) + 4;

  // SÉPTIMO: TÉRMINO ANTICIPADO
  checkNewPage(40);
  doc.setFont("times", "bold");
  doc.text("SÉPTIMO: TÉRMINO ANTICIPADO:", margin, currentY);
  const seventhTitleWidth = doc.getTextWidth("SÉPTIMO: TÉRMINO ANTICIPADO:");
  doc.line(margin, currentY + 0.5, margin + seventhTitleWidth, currentY + 0.5);
  currentY += 4;

  doc.setFont("times", "normal");
  const terminoP1 = "El incumplimiento de cualesquiera de las obligaciones establecidas en el presente contrato por una de las partes, dará derecho a la parte diligente para poner término ipso facto al presente contrato, con indemnización de perjuicios a su favor.";
  doc.text(terminoP1, margin, currentY, { maxWidth: contentWidth, align: "justify", lineHeightFactor: 1.2 });
  const splitTerminoP1 = doc.splitTextToSize(terminoP1, contentWidth);
  currentY += (splitTerminoP1.length * 5) + 4;

  const terminoP2 = "En el caso de incumplimiento del Cliente, el Proveedor estará facultado para proceder al retiro inmediato del dispositivo de las dependencias del Cliente, quien desde ya acepta y autoriza dicha acción, liberando de todo reclamo, demanda o acción al Proveedor.";
  doc.text(terminoP2, margin, currentY, { maxWidth: contentWidth, align: "justify", lineHeightFactor: 1.2 });
  const splitTerminoP2 = doc.splitTextToSize(terminoP2, contentWidth);
  currentY += (splitTerminoP2.length * 5) + 4;

  const terminoP3 = "Asimismo, tratándose de término anticipado del contrato por culpa del Cliente, el Proveedor tendrá derecho a cobrar al Cliente todas las rentas que se encontraren pendientes y sin devengar por todo el período de vigencia del contrato, más los reajustes e intereses que fueren procedentes.";
  doc.text(terminoP3, margin, currentY, { maxWidth: contentWidth, align: "justify", lineHeightFactor: 1.2 });
  const splitTerminoP3 = doc.splitTextToSize(terminoP3, contentWidth);
  currentY += (splitTerminoP3.length * 5) + 4;

  // OCTAVO: RESPONSABILIDADES Y OBLIGACIONES DEL CLIENTE
  checkNewPage(50);
  doc.setFont("times", "bold");
  doc.text("OCTAVO: RESPONSABILIDADES Y OBLIGACIONES DEL CLIENTE", margin, currentY);
  const eighthTitleWidth = doc.getTextWidth("OCTAVO: RESPONSABILIDADES Y OBLIGACIONES DEL CLIENTE");
  doc.line(margin, currentY + 0.5, margin + eighthTitleWidth, currentY + 0.5);
  currentY += 4;

  doc.setFont("times", "normal");
  const responsabilidades = [
    "El Cliente deberá cuidar, custodiar y conservar el dispositivo arrendado y de propiedad del Proveedor, respondiendo de todo riesgo y daño que sufrieren, con excepción de caso fortuito y fuerza mayor.",
    "El Cliente deberá cumplir y hacer cumplir respecto de sus empleados, dependientes y copropietarios, las instrucciones, términos y condiciones de uso del dispositivo entregado por el Proveedor, conforme al Anexo 1.",
    "El Cliente deberá abstenerse de mover, trasladar, alterar o modificar en cualquier forma el Dispositivo y sus componentes, como asimismo deberá abstenerse de intervenir el Dispositivo en cualquier forma, debiendo asumir en caso contrario todos los gastos y perjuicios que el incumplimiento de esta obligación se causare. Se incluyen dentro de esta prohibición las reparaciones y riesgos derivados del uso de suministros e insumos no originales y de accesorios, o aditamentos que provoquen alteraciones en el Dispositivo.",
    "El Cliente será responsable de todo daño que sufriere el Dispositivo y las personas en su caso con motivo o por efecto del uso impropio de los equipos o de cualquier otra causa que diga relación o se derive del uso anormal o inadecuado del Dispositivo, excluyendo el caso fortuito o fuerza mayor. Consecuentemente los trabajos, gastos y en general los desembolsos que se tuvieren que realizar o en que se incurriere con motivo de la situación anterior, serán de cargo del Cliente.",
    "El Cliente deberá operar el Dispositivo dentro de los niveles normales de uso. En el caso de operarlos en exceso de sus niveles máximos, según lo especificado en el manual del usuario, los repuestos que se requiriere remplazar serán de cargo exclusivo del Cliente.",
    "El CLIENTE, al inicio del presente contrato y durante su ejecución se obliga a informar al Proveedor de cualquier hecho o situación que a su juicio pudiere poner en peligro el Dispositivo, con el objeto de que se tomen las medidas oportunas tendientes a evitar riesgos o daños en los mismos o de sus usuarios.",
    "El Cliente deberá dar las facilidades de ingreso a sus dependencias al personal del Proveedor y/o de terceros autorizados por el Proveedor para efectuar el servicio técnico del Dispositivo, la revisión y mantenimiento de Dispositivo, cuando fuere procedente.",
    "El Cliente deberá proveer y mantener durante la vigencia del contrato y, según las especificaciones técnicas indicadas en el manual del Dispositivo, los requisitos de operación que requiera para el debido funcionamiento del Dispositivo, debiendo asimismo adoptar todas las medidas necesarias para el seguro y normal funcionamiento de ellos."
  ];

  responsabilidades.forEach(resp => {
    checkNewPage(10);
    doc.text("•", margin + 5, currentY);
    doc.text(resp, margin + 10, currentY, { maxWidth: contentWidth - 10, align: "justify", lineHeightFactor: 1.1 });
    const splitResp = doc.splitTextToSize(resp, contentWidth - 10);
    currentY += (splitResp.length * 5) + 4;
  });
  currentY += 4;

  // NOVENO: RESPONSABILIDADES Y OBLIGACIONES DEL PROVEEDOR.
  checkNewPage(40);
  doc.setFont("times", "bold");
  doc.text("NOVENO: RESPONSABILIDADES Y OBLIGACIONES DEL PROVEEDOR.", margin, currentY);
  const ninthTitleWidth = doc.getTextWidth("NOVENO: RESPONSABILIDADES Y OBLIGACIONES DEL PROVEEDOR.");
  doc.line(margin, currentY + 0.5, margin + ninthTitleWidth, currentY + 0.5);
  currentY += 4;

  doc.setFont("times", "normal");
  const proveedorResp = "El Proveedor se obliga a efectuar las mantenciones preventivas y correctivas del Dispositivo entregado en arriendo, debiendo atender cualquier requerimiento por su mal funcionamiento a más tardar dentro del plazo de 6 horas desde la fecha en que la falla hubiere sido reclamada por el Cliente. Para tal efecto se considerará un horario de trabajo los días lunes a jueves entre las 9 y 18 horas y los viernes entre las 9 y las 17:00 horas. En el caso de mantenciones que requirieren un servicio mayor, el Cliente autorizará el traslado del Dispositivo al servicio técnico del Proveedor para su reparación o reemplazo por uno nuevo. El Dispositivo, cuenta con una Garantía de 10 años.";
  doc.text(proveedorResp, margin, currentY, { maxWidth: contentWidth, align: "justify", lineHeightFactor: 1.2 });
  const splitProveedorResp = doc.splitTextToSize(proveedorResp, contentWidth);
  currentY += (splitProveedorResp.length * 5) + 4;

  // DÉCIMO: CESIÓN.
  checkNewPage(25);
  doc.setFont("times", "bold");
  doc.text("DÉCIMO: CESIÓN.", margin, currentY);
  const tenthTitleWidth = doc.getTextWidth("DÉCIMO: CESIÓN.");
  doc.line(margin, currentY + 0.5, margin + tenthTitleWidth, currentY + 0.5);
  currentY += 4;

  doc.setFont("times", "normal");
  const cesionText = "El Proveedor estará facultado para otorgar, ceder y/o traspasar sus derechos u obligaciones originadas en este contrato a un tercero, sin consentimiento por parte del Cliente, siempre que asuma plenamente sus obligaciones en el presente contrato.";
  doc.text(cesionText, margin, currentY, { maxWidth: contentWidth, align: "justify", lineHeightFactor: 1.2 });
  const splitCesion = doc.splitTextToSize(cesionText, contentWidth);
  currentY += (splitCesion.length * 5) + 4;

  // DÉCIMO PRIMERO: DOMICILIO Y COMPETENCIA
  checkNewPage(25);
  doc.setFont("times", "bold");
  doc.text("DÉCIMO PRIMERO: DOMICILIO Y COMPETENCIA", margin, currentY);
  const eleventhTitleWidth = doc.getTextWidth("DÉCIMO PRIMERO: DOMICILIO Y COMPETENCIA");
  doc.line(margin, currentY + 0.5, margin + eleventhTitleWidth, currentY + 0.5);
  currentY += 4;

  doc.setFont("times", "normal");
  const domicilioText = "Será competente para conocer de cualquier conflicto surgido entre las Partes con ocasión del presente contrato, la justicia ordinaria. Las Partes fijan domicilio en la comuna y ciudad de Santiago de Chile.";
  doc.text(domicilioText, margin, currentY, { maxWidth: contentWidth, align: "justify", lineHeightFactor: 1.2 });
  const splitDomicilio = doc.splitTextToSize(domicilioText, contentWidth);
  currentY += (splitDomicilio.length * 5) + 4;

  // DÉCIMO SEGUNDO: DECLARACION
  checkNewPage(40);
  doc.setFont("times", "bold");
  doc.text("DÉCIMO SEGUNDO: DECLARACION", margin, currentY);
  const twelfthTitleWidth = doc.getTextWidth("DÉCIMO SEGUNDO: DECLARACION");
  doc.line(margin, currentY + 0.5, margin + twelfthTitleWidth, currentY + 0.5);
  currentY += 4;

  doc.setFont("times", "normal");
  const declaracionP1 = "Los comparecientes en este instrumento por CLIENTE, y por el PROVEEDOR, declaran y aseguran que sus respectivas representadas son empresas legalmente constituidas y vigentes; que son ellos personeros debidamente investidos por aquéllas para celebrar el presente Contrato, y que, por consiguiente, él es plenamente eficaz y válido conforme al Derecho positivo respectivo.";
  doc.text(declaracionP1, margin, currentY, { maxWidth: contentWidth, align: "justify", lineHeightFactor: 1.2 });
  const splitDeclaracionP1 = doc.splitTextToSize(declaracionP1, contentWidth);
  currentY += (splitDeclaracionP1.length * 5) + 4;

  const declaracionP2 = "La exactitud de los hechos de que da cuenta la precedente declaración, es considerada una condición esencial y determinante para Las Partes en la celebración del presente Contrato, y en caso de no ser efectiva, a petición de la parte interesada, la parte afectada deberá resolver el problema a la mayor brevedad a entera satisfacción de la parte interesada, sin perjuicio de los derechos que le confiere la legislación vigente.";
  doc.text(declaracionP2, margin, currentY, { maxWidth: contentWidth, align: "justify", lineHeightFactor: 1.2 });
  const splitDeclaracionP2 = doc.splitTextToSize(declaracionP2, contentWidth);
  currentY += (splitDeclaracionP2.length * 5) + 4;

  // DÉCIMO TERCERO: NOTIFICACIONES.
  checkNewPage(50);
  doc.setFont("times", "bold");
  doc.text("DÉCIMO TERCERO: NOTIFICACIONES.", margin, currentY);
  const thirteenthTitleWidth = doc.getTextWidth("DÉCIMO TERCERO: NOTIFICACIONES.");
  doc.line(margin, currentY + 0.5, margin + thirteenthTitleWidth, currentY + 0.5);
  currentY += 4;

  doc.setFont("times", "normal");
  const notificacionesText = "Todas las notificaciones, solicitudes y cualquier otra comunicación que sea requerida o puedan ser enviadas en virtud de este Contrato a alguna de las Partes y que no consideren una formalidad especial, serán remitidas por escrito por medio de carta con acuse de recibo o correo electrónico.";
  doc.text(notificacionesText, margin, currentY, { maxWidth: contentWidth, align: "justify", lineHeightFactor: 1.2 });
  const splitNotificaciones = doc.splitTextToSize(notificacionesText, contentWidth);
  currentY += (splitNotificaciones.length * 5) + 4;

  const notificacionesSubText = "En cada caso, la notificación deberá ser enviada a las personas y a las direcciones que se indican a continuación:";
  doc.text(notificacionesSubText, margin, currentY, { maxWidth: contentWidth, align: "justify", lineHeightFactor: 1.2 });
  const splitSubText = doc.splitTextToSize(notificacionesSubText, contentWidth);
  currentY += (splitSubText.length * 5) + 4;

  doc.text("/A/\tAl Proveedor, la notificación se dirigirá a:", margin, currentY);
  currentY += 10;

  doc.setFont("times", "bold");
  doc.text("Atención: Arturo Ramírez Mendive", margin, currentY);
  currentY += 5;
  doc.text("Fono: +56 97807 1418", margin, currentY);
  currentY += 5;
  doc.text("Email: clientes@kristalina.cl", margin, currentY);
  currentY += 12;

  doc.text("/B/\tAl Cliente, la notificación se dirigirá a:", margin, currentY);
  currentY += 10;

  doc.setFont("times", "bold");
  doc.text(`Atención: ${datos.legalrepresentative}`, margin, currentY);
  currentY += 5;
  doc.text(`Dirección: ${datos.communityaddress}`, margin, currentY);
  currentY += 5;
  doc.text(`Fono: ${datos.legalrepresentativephone}`, margin, currentY);
  currentY += 5;
  doc.text(`Email: ${datos.communityemail}`, margin, currentY);
  currentY += 15;

  // DÉCIMO CUARTO: MISCELANEOS
  checkNewPage(45);
  doc.setFont("times", "bold");
  doc.text("DÉCIMO CUARTO: MISCELANEOS", margin, currentY);
  const fourteenthTitleWidth = doc.getTextWidth("DÉCIMO CUARTO: MISCELANEOS");
  doc.line(margin, currentY + 0.5, margin + fourteenthTitleWidth, currentY + 0.5);
  currentY += 4;

  doc.setFont("times", "bold");
  doc.text("1.\tAcuerdo Completo.", margin, currentY);
  currentY += 8;
  doc.setFont("times", "normal");
  const acuerdoTotal = "El presente contrato, incluidos los Anexos que forman parte del mismo, constituye el acuerdo único y total entre las partes y reemplaza toda comunicación, representaciones o acuerdos verbales o escritos, ya sean previos o coetáneos, respecto de la materia aquí tratada.";
  doc.text(acuerdoTotal, margin, currentY, { maxWidth: contentWidth, align: "justify", lineHeightFactor: 1.2 });
  const splitAcuerdo = doc.splitTextToSize(acuerdoTotal, contentWidth);
  currentY += (splitAcuerdo.length * 5) + 4;

  doc.setFont("times", "bold");
  doc.text("2.\tLegislación Aplicable: ", margin, currentY);
  const legWidth = doc.getTextWidth("2.\tLegislación Aplicable: ");
  doc.setFont("times", "normal");
  const legText = "Para todos los efectos legales del presente contrato, éste se regirá exclusivamente por las leyes de la República de Chile.";
  doc.text(legText, margin + legWidth, currentY, { maxWidth: contentWidth - legWidth, align: "justify", lineHeightFactor: 1.2 });
  const splitLeg = doc.splitTextToSize(legText, contentWidth - legWidth);
  currentY += (splitLeg.length * 5) + 4;

  doc.setFont("times", "bold");
  doc.text("3.\tEjemplares.", margin, currentY);
  currentY += 8;
  doc.setFont("times", "normal");
  const ejemplaresText = "El presente instrumento se firma en dos ejemplares de idéntico tenor y fecha, quedando uno de ellos en poder del CLIENTE y uno en poder del PROVEEDOR.";
  doc.text(ejemplaresText, margin, currentY, { maxWidth: contentWidth, align: "justify", lineHeightFactor: 1.2 });
  const splitEjemplares = doc.splitTextToSize(ejemplaresText, contentWidth);
  currentY += (splitEjemplares.length * 5) + 4;

  // PERSONERÍAS
  checkNewPage(40);
  doc.setFont("times", "bold");
  doc.text("PERSONERÍAS:", margin, currentY);
  const perWidth = doc.getTextWidth("PERSONERÍAS:");
  doc.line(margin, currentY + 0.5, margin + perWidth, currentY + 0.5);
  currentY += 4;

  doc.setFont("times", "normal");
  const personeriaArturo = "La personería de don Arturo Ramírez Mendive para actuar en nombre y representación de la sociedad KRISTALINA SpA., consta de escritura pública otorgada con fecha 21 de febrero de 2023, mediante el sistema electrónico de Empresas y Sociedades.";
  doc.text(personeriaArturo, margin, currentY, { maxWidth: contentWidth, align: "justify", lineHeightFactor: 1.2 });
  const splitPArturo = doc.splitTextToSize(personeriaArturo, contentWidth);
  currentY += (splitPArturo.length * 5) + 6;

  const formationDate = new Date(datos.communityformationdate);
  const personeriaCliente = `La personería de don ${datos.legalrepresentative} para actuar en nombre y representación de la sociedad ${cliente.communityname} consta de escritura pública otorgada con fecha ${formationDate.getDate()} de ${getMonthName(formationDate.getMonth())} de ${formationDate.getFullYear()}, ante el Notario Público de ${datos.notary}.`;
  doc.text(personeriaCliente, margin, currentY, { maxWidth: contentWidth, align: "justify", lineHeightFactor: 1.2 });
  const splitPCliente = doc.splitTextToSize(personeriaCliente, contentWidth);
  currentY += (splitPCliente.length * 5) + 30; // Preserved exception

  // FIRMAS
  checkNewPage(40);
  const signatureWidth = 70;
  const lineY = currentY;

  // Arturo Signature
  doc.line(margin, lineY, margin + signatureWidth, lineY);
  doc.setFont("times", "normal");
  doc.text("Arturo Ramírez Mendive", margin + signatureWidth / 2, lineY + 5, { align: "center" });
  doc.text("C.I N°10.537.439-9", margin + signatureWidth / 2, lineY + 10, { align: "center" });
  doc.setFont("times", "bold");
  doc.text("pp. KRISTALINA SpA", margin + signatureWidth / 2, lineY + 15, { align: "center" });

  // Client Signature
  const clientSignX = pageWidth - margin - signatureWidth;
  doc.line(clientSignX, lineY, clientSignX + signatureWidth, lineY);
  doc.setFont("times", "normal");
  doc.text(datos.legalrepresentative, clientSignX + signatureWidth / 2, lineY + 5, { align: "center" });
  doc.text(`C.I N°${datos.legalrepresentativerut}`, clientSignX + signatureWidth / 2, lineY + 10, { align: "center" });
  doc.setFont("times", "bold");
  doc.text(`pp. ${cliente.communityname}`, clientSignX + signatureWidth / 2, lineY + 15, { align: "center" });

  currentY += 40; // Preserved exception

  // ANEXO 1
  drawFooter(doc, pageWidth, pageHeight, pageNum);
  doc.addPage();
  pageNum++;
  drawHeader(doc, pageWidth);
  currentY = 45;

  doc.setFont("times", "bold");
  doc.setFontSize(12);
  doc.setTextColor(30, 144, 255); // Blue color
  doc.text("ANEXO 1", pageWidth / 2, currentY, { align: "center" });
  currentY += 6;
  doc.text("Manual Explicativo y Preventivo de nuestro sistema K-IO", pageWidth / 2, currentY, { align: "center" });
  currentY += 15;

  doc.setTextColor(0);
  doc.setFontSize(10.5);
  doc.setFont("times", "normal");

  const anexoP1 = "Los sistemas K-IO funcionan como disociadores de fluidos, a través de una fuerza magneto motriz y un paso Venturi. Al pasar por el dispositivo, se genera Aragonita cuya principal característica es su alta solubilidad e inocuidad (no contamina). Esta aplicación tiene dos efectos fundamentales:";
  doc.text(anexoP1, margin, currentY, { maxWidth: contentWidth, align: "justify", lineHeightFactor: 1.2 });
  const splitAnexoP1 = doc.splitTextToSize(anexoP1, contentWidth);
  currentY += (splitAnexoP1.length * 5) + 4;

  doc.text("-\tPrevenir", margin + 10, currentY);
  currentY += 6;
  doc.text("-\tDesincrustar.", margin + 10, currentY);
  currentY += 4;

  const prevText = "En la función de prevención, el agua al pasar por nuestro equipo, se genera aragonita, la que evita incrustaciones nuevas.";
  const parts = prevText.split("función de prevención");
  doc.setFont("times", "normal");
  doc.text("En la ", margin, currentY);
  let currentX = margin + doc.getTextWidth("En la ");
  doc.setFont("times", "bold");
  doc.text("función de prevención", currentX, currentY);
  currentX += doc.getTextWidth("función de prevención");
  doc.setFont("times", "normal");
  doc.text(", el agua al pasar por nuestro equipo, se genera aragonita, la que evita incrustaciones nuevas.", currentX, currentY, { maxWidth: contentWidth - (currentX - margin), align: "justify" });
  currentY += 4;

  const desinText = "En la función de la desincrustación, la aragonita al ponerse en contacto con los carbonatos incrustados, los va removiendo y rompiendo (erosionando) sin generar un daño estructural como lo causa un químico. La razón por la cual se va desincrustando es porque la aragonita (inestable) al permearse (mezclarse) con agua cruda con calcita y con carbonato incrustados, la forma inestable siempre predomina sobre la estable.";
  doc.setFont("times", "normal");
  doc.text("En la ", margin, currentY);
  currentX = margin + doc.getTextWidth("En la ");
  doc.setFont("times", "bold");
  doc.text("función de la desincrustación", currentX, currentY);
  currentX += doc.getTextWidth("función de la desincrustación");
  doc.setFont("times", "normal");
  doc.text(", la aragonita al ponerse en contacto con los carbonatos incrustados, los va removiendo y rompiendo (erosionando) sin generar un daño estructural como lo causa un químico. La razón por la cual se va desincrustando es porque la aragonita (inestable) al permearse (mezclarse) con agua cruda con calcita y con carbonato incrustados, la forma inestable siempre predomina sobre la estable.", currentX, currentY, { maxWidth: contentWidth - (currentX - margin), align: "justify", lineHeightFactor: 1.2 });
  const splitDesin = doc.splitTextToSize(", la aragonita al ponerse en contacto con los carbonatos incrustados, los va removiendo y rompiendo (erosionando) sin generar un daño estructural como lo causa un químico. La razón por la cual se va desincrustando es porque la aragonita (inestable) al permearse (mezclarse) con agua cruda con calcita y con carbonato incrustados, la forma inestable siempre predomina sobre la estable.", contentWidth - (currentX - margin));
  currentY += (splitDesin.length * 5) + 4;

  const pipeSizeText = "Dado lo anterior, el cliente puede usar un dispositivo de acuerdo al flujo requerido y no al tamaño de la tubería, evitando la instalación de equipos de mayor tamaño.";
  doc.text(pipeSizeText, margin, currentY, { maxWidth: contentWidth, align: "justify", lineHeightFactor: 1.2 });
  const splitPipe = doc.splitTextToSize(pipeSizeText, contentWidth);
  currentY += (splitPipe.length * 5) + 4;

  doc.setFont("times", "bold");
  doc.text("Efectos de nuestro sistema KIO: Una vez instalado el sistema, se deben tener presentes los siguientes puntos:", margin, currentY);
  currentY += 4;

  doc.setFont("times", "normal");
  const effect1 = "- Sistemas K-IO, realizan una limpieza de las incrustaciones históricas acumuladas en el interior de las cañerías, redes de agua y en sus fittings. Por esta razón es clave indicar a la empresa de mantención de sistemas hidráulicos y redes de agua, generar una revisión de sala de bombas, aireadores, llaves y válvulas, para evitar una posible saturación generada por la desincrustación. (PREVENTIVO)";
  doc.text(effect1, margin, currentY, { maxWidth: contentWidth, align: "justify", lineHeightFactor: 1.2 });
  const splitEff1 = doc.splitTextToSize(effect1, contentWidth);
  currentY += (splitEff1.length * 5) + 4;

  const effect2 = "- A nivel domiciliario: se reducen costos de mantención de lavadoras, lavavajillas y hervidores; menos uso de detergentes y suavizantes. Hay que revisar una vez a la semana, los aireadores de las griferías o llaves, las columnas de ducha y monomandos, para evitar posibles saturaciones, generada por la desincrustación. Esto por un período de 1 o 2 meses, según sea la inspección visual. Sólo se debe sacar, limpiar y volver a instalar el aireador.";
  doc.text(effect2, margin, currentY, { maxWidth: contentWidth, align: "justify", lineHeightFactor: 1.2 });
  const splitEff2 = doc.splitTextToSize(effect2, contentWidth);
  currentY += (splitEff2.length * 5) + 4;

  doc.text("- Evita deterioro de artefactos, griferías y fittings.", margin, currentY);
  currentY += 6;

  const effect4 = "- Genera un ahorro en gasto de agua y gas producto de la optimización de los procesos y consumos de agua.";
  doc.text(effect4, margin, currentY, { maxWidth: contentWidth, align: "justify" });

  drawFooter(doc, pageWidth, pageHeight, pageNum);

  return doc.output("blob");
}
