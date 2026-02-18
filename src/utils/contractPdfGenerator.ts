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

export interface PersonaAdicional {
  nombre: string;
  direccion: string;
  telefono: string;
  email: string;
}

export interface DatosContrato {
  // Datos de la comunidad
  communityname: string; // Nombre de la comunidad
  communityrut: string; // RUT Comunidad
  communityemail: string; // Email Comunidad
  communityaddress: string; // Dirección Comunidad
  communityregion: string; // Región
  communityformationdate: string; // Fecha Constitución Comunidad
  communitynotary: string; // Notario Público Comunidad
  // Datos del representante legal
  legalrepresentative: string; // Representante Legal
  legalrepresentativerut: string; // RUT Representante
  legalrepresentativesociety: string; // Sociedad del representante legal
  societyrut: string; // RUT Sociedad
  societyformationdate: string; // Fecha de Constitución Sociedad

  societyaddress: string; // Dirección de la Sociedad
  contextoempresa: string; // Contexto Empresa (texto editable para PERSONERÍAS)
  legalrepresentativenationality: string; // Nacionalidad Rep.
  legalrepresentativemaritalstatus: string; // Estado Civil
  legalrepresentativeprofession: string; // Profesión
  societynotary: string; // Notario Público Sociedad (antes: notary)
  // Extra
  legalrepresentativephone: string; // Teléfono Representante
  deviceinstallation: string; // Detalle Instalación Dispositivos
  contractTerm?: string; // Años de Contrato
  personasadicionales?: PersonaAdicional[]; // persona2, persona3... (índice 0 = persona2)
}

const getMonthName = (monthIndex: number) => {
  const months = [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre",
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
  const footerY = pageHeight - 12.7;
  doc.setFont("times", "normal");
  doc.setFontSize(10);
  doc.setTextColor(30, 144, 255); // Blue color
  doc.text(footerText, pageWidth / 2, footerY, { align: "center" });

  doc.setTextColor(0);
  doc.setFontSize(10);
  doc.text(pageNum.toString(), pageWidth - 20, footerY);
};

export function generateContratoPDF(cliente: ClienteContrato, datos: DatosContrato): Blob {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "letter",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = 25;
  const marginRight = 20;
  const marginTop = 35;
  const marginBottom = 20;
  const contentWidth = pageWidth - marginLeft - marginRight;
  let pageNum = 1;

  const checkNewPage = (yNeeded: number): number => {
    if (currentY + yNeeded > pageHeight - marginBottom) {
      drawFooter(doc, pageWidth, pageHeight, pageNum);
      doc.addPage();
      pageNum++;
      drawHeader(doc, pageWidth);
      doc.setFont("times", "normal");
      doc.setFontSize(12);
      currentY = marginTop;
    }
    return currentY;
  };

  const drawParagraph = (
    text: string,
    options: {
      x?: number;
      width?: number;
      align?: "left" | "center" | "right" | "justify";
      lineHeight?: number;
      fontSize?: number;
      fontStyle?: "normal" | "bold" | "italic";
      spacingAfter?: number;
      xPrefix?: string;
      xPrefixX?: number;
    } = {},
  ) => {
    const {
      x = marginLeft,
      width = contentWidth,
      align = "justify",
      lineHeight = 6,
      fontSize = 12,
      fontStyle = "normal",
      spacingAfter = 4,
      xPrefix,
      xPrefixX,
    } = options;

    doc.setFont("times", fontStyle);
    doc.setFontSize(fontSize);

    const lines = doc.splitTextToSize(text, width);
    lines.forEach((line: string, index: number) => {
      checkNewPage(lineHeight);
      if (index === 0 && xPrefix && xPrefixX !== undefined) {
        doc.text(xPrefix, xPrefixX, currentY);
      }
      doc.text(line, x, currentY, { align: align === "justify" ? "justify" : align, maxWidth: width });
      currentY += lineHeight;
    });
    currentY += spacingAfter;
  };

  drawHeader(doc, pageWidth);

  // Header Title
  doc.setFont("times", "bold");
  doc.setFontSize(11);
  let currentY = marginTop + 10;
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
    "EL CLIENTE",
  ];

  titles.forEach((title) => {
    if (title === "") {
      currentY += 2;
    } else {
      doc.text(title, pageWidth / 2, currentY, { align: "center" });
      currentY += 4;
    }
  });

  currentY += 4;

  // Introduction text
  const now = new Date();
  const introText = `En Santiago de Chile, a ${now.getDate()} de ${getMonthName(now.getMonth())} del 2025, entre la sociedad KRISTALINA SpA, Rol único tributario número 77.717.316-2, representada según se acreditará por don Arturo Ramírez Mendive, chileno, casado, ingeniero comercial, cédula de identidad número 10.537.439-9, ambos domiciliados para estos efectos en Andrés de Vera número 5067, oficina 601, comuna de Vitacura, Región Metropolitana, por una parte, en adelante “El Proveedor” y, por la otra, la comunidad ${datos.communityname}, Rol único tributario número ${datos.communityrut}, representada según se acreditará por la sociedad ${datos.legalrepresentativesociety}, Rol unico tributario numero ${datos.societyrut}, representada por don ${datos.legalrepresentative}, ${datos.legalrepresentativenationality}, ${datos.legalrepresentativemaritalstatus}, ${datos.legalrepresentativeprofession}, cédula de identidad número ${datos.legalrepresentativerut}, todos domiciliados para estos efectos en ${datos.communityaddress}, Región ${datos.communityregion}, en adelante “El Cliente”, se ha convenido en el siguiente contrato de arrendamiento de equipos y de prestación de servicios, en adelante “EL CONTRATO”.`;

  drawParagraph(introText);

  // PRIMERO: ANTECEDENTES
  checkNewPage(10);
  doc.setFont("times", "bold");
  doc.text("PRIMERO: ANTECEDENTES.", marginLeft, currentY);
  const textWidth = doc.getTextWidth("PRIMERO: ANTECEDENTES.");
  doc.line(marginLeft, currentY + 0.5, marginLeft + textWidth, currentY + 0.5);
  currentY += 8;

  const antecedenteText =
    "La empresa Kristalina, reconocida por su experiencia en el desarrollo de soluciones innovadoras para el mantenimiento de sistemas hidráulicos, pone a disposición su dispositivo eliminador de sarro a través del sistema K-IO. Este equipo ha sido diseñado para resolver eficazmente uno de los problemas más comunes en instalaciones de agua: la acumulación de sarro en las tuberías.";
  drawParagraph(antecedenteText);

  const beneficiosIntro =
    "Este dispositivo ofrece beneficios en tres ámbitos principales: salud, mantenimiento y costos. Entre sus ventajas se destacan:";
  drawParagraph(beneficiosIntro);

  // Highlights Section
  const listItems = [
    {
      idx: "1.",
      title: "Calidad del agua:",
      bullets: [
        "Mejora sustancial en la calidad del agua, ionizándola y alcalinizándola para beber y cocinar.",
        "Mejora los rendimientos de productos cosméticos.",
        "Alta calidad del agua para la fabricación de hielo.",
        "Menor uso de detergentes, suavizantes y otros productos de limpieza.",
      ],
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
        "Resuelve el problema de no tener incrustaciones en las verticales de impulsión, válvulas de retención",
      ],
    },
    {
      idx: "3.",
      title: "Eficiencia y sostenibilidad:",
      bullets: [
        "Reducción del deterioro de equipos en contacto constante con agua.",
        "Ahorro significativo en el consumo de agua y gas gracias a la optimización de procesos.",
        "Disminución de fallas y necesidades de mantenimiento provocadas por agua de baja calidad.",
      ],
    },
  ];

  listItems.forEach((item) => {
    checkNewPage(12);
    doc.setFont("times", "normal");
    doc.text(item.idx, marginLeft + 10, currentY);
    doc.setFont("times", "bold");
    doc.text(item.title, marginLeft + 15, currentY);
    currentY += 6;

    item.bullets.forEach((bullet) => {
      drawParagraph(bullet, {
        x: marginLeft + 22,
        width: contentWidth - 22,
        lineHeight: 6,
        spacingAfter: 0,
        xPrefix: "o  ",
        xPrefixX: marginLeft + 18,
      } as any);
    });
    currentY += 4;
  });

  const closingAntecedentes =
    "Con estas características y beneficios, el dispositivo eliminador de sarro a través del sistema K-IO, representa una solución eficiente, sostenible y rentable para los usuarios.";
  drawParagraph(closingAntecedentes, { spacingAfter: 8 });

  // SEGUNDO: OBJETO
  checkNewPage(10);
  doc.setFont("times", "bold");
  doc.text("SEGUNDO:  OBJETO.", marginLeft, currentY);
  const secondTitleWidth = doc.getTextWidth("SEGUNDO:  OBJETO.");
  doc.line(marginLeft, currentY + 0.5, marginLeft + secondTitleWidth, currentY + 0.5);
  currentY += 8;

  const objetoText =
    "Por medio del presente instrumento, EL PROVEEDOR da en arriendo al CLIENTE, quien recibe y acepta, un dispositivo denominado ACELERADOR IONICO (K-IO) eliminador de sarro en tuberías, accesorios y equipos, especificado en el Anexo 1 del presente contrato, en adelante “El Dispositivo”, nuevo, sin uso y que se encuentra en perfecto estado de funcionamiento.";
  drawParagraph(objetoText);

  // TERCERO: PROPIEDAD DEL DISPOSITIVO
  checkNewPage(10);
  doc.setFont("times", "bold");
  doc.text("TERCERO:  PROPIEDAD DEL DISPOSITIVO.", marginLeft, currentY);
  const thirdTitleWidth = doc.getTextWidth("TERCERO:  PROPIEDAD DEL DISPOSITIVO.");
  doc.line(marginLeft, currentY + 0.5, marginLeft + thirdTitleWidth, currentY + 0.5);
  currentY += 8;

  drawParagraph(
    "El Cliente reconoce y acepta que El Dispositivo es de propiedad del Proveedor, y por tanto se obliga a restituirlo al término del presente Contrato, en el estado en que le fueran entregados, en perfecto estado de funcionamiento, sin perjuicio del deterioro propio del uso normal de los mismos.",
  );
  drawParagraph(
    "El Cliente deberá en todo momento durante la vigencia del presente Contrato tomar las medidas que sean necesarias para procurar la conservación y el cuidado del Dispositivo, previniendo todo riesgo que pudiere sobrevenir y que los pudiere afectar, debiendo mantener indemne e indemnizar al Proveedor de las pérdidas que dicho Dispositivo pudiere sufrir por cualquier causa salvo en casos de fuerza mayor y caso fortuito.",
  );
  drawParagraph(
    "Asimismo, el Cliente se abstendrá de efectuar cualquier acto que implique transferencia del Dispositivo, que pueda poner en riesgo la titularidad de aquél, no pudiendo ceder, ni transferir en forma alguna ni en ningún título dicho Dispositivo, ni el presente contrato ni sus efectos.",
  );

  // CUARTO: UBICACIÓN Y USO DEL DISPOSITIVO
  checkNewPage(10);
  doc.setFont("times", "bold");
  doc.text("CUARTO: UBICACIÓN Y USO DEL DISPOSITIVO.", marginLeft, currentY);
  const fourthTitleWidth = doc.getTextWidth("CUARTO: UBICACIÓN Y USO DEL DISPOSITIVO.");
  doc.line(marginLeft, currentY + 0.5, marginLeft + fourthTitleWidth, currentY + 0.5);
  currentY += 8;

  const ubicacionText = `El Proveedor instalará el dispositivo en ${datos.deviceinstallation}, debiendo ser usado exclusivamente en dicha dependencia, quedando vedado retirarlo y trasladarlo a otro lugar, sin el previo consentimiento escrito del PROVEEDOR. Asimismo, el CLIENTE se obliga a usar el Dispositivo de acuerdo a sus especificaciones técnicas establecidas por el fabricante, y a respetar los términos y condiciones de dicho uso en forma estricta, conforme al Manual explicativo y Preventivo del sistema K-IO, que se acompaña como anexo 1 del presente contrato, y que el Cliente declara conocer y aceptar para todos los efectos legales.`;
  drawParagraph(ubicacionText);

  // QUINTO: PRECIO DEL CONTRATO y FORMA DE PAGO
  checkNewPage(10);
  doc.setFont("times", "bold");
  doc.text("QUINTO:  PRECIO DEL CONTRATO y FORMA DE PAGO.", marginLeft, currentY);
  const fifthTitleWidth = doc.getTextWidth("QUINTO:  PRECIO DEL CONTRATO y FORMA DE PAGO.");
  doc.line(marginLeft, currentY + 0.5, marginLeft + fifthTitleWidth, currentY + 0.5);
  currentY += 8;

  const montoClp = cliente.monto
    ? new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(cliente.monto)
    : "a convenir";
  drawParagraph(`El precio del presente contrato es la renta mensual en pesos equivalente a ${montoClp}.`);
  drawParagraph(
    "El pago del precio referido se efectuará en forma mensual, dentro de los 5 días calendario siguientes a la fecha de facturación.",
  );
  drawParagraph(
    "El no pago íntegro y oportuno del precio en la forma y condiciones estipuladas, hará devengar en favor del Proveedor el máximo del interés penal que la ley permita pactar para la obligación pendiente, por todo el tiempo que transcurra entre la fecha en que debió cumplirse la obligación y la fecha de su pago efectivo, sin perjuicio de los derechos que de acuerdo a la ley pudiere ejercer el Proveedor en su calidad de contratante diligente.",
    { spacingAfter: 6 },
  );

  // SEXTO: PLAZO DEL CONTRATO
  checkNewPage(10);
  doc.setFont("times", "bold");
  doc.text("SEXTO: PLAZO DEL CONTRATO", marginLeft, currentY);
  const sixthTitleWidth = doc.getTextWidth("SEXTO: PLAZO DEL CONTRATO");
  doc.line(marginLeft, currentY + 0.5, marginLeft + sixthTitleWidth, currentY + 0.5);
  currentY += 8;

  const plazoNum = datos.contractTerm || "1";
  const plazoText = `El plazo del contrato será de ${plazoNum} años, a contar de la fecha del presente instrumento. Dicho plazo será renovable automática y sucesivamente por períodos de ${plazoNum} años, si ninguna de las partes pusiere término al Contrato con 60 días de anticipación a la fecha original de término o de cualesquiera de sus prórrogas, mediante carta certificada enviada al domicilio de la contraparte.`;
  drawParagraph(plazoText);

  // SÉPTIMO: TÉRMINO ANTICIPADO
  checkNewPage(10);
  doc.setFont("times", "bold");
  doc.text("SÉPTIMO: TÉRMINO ANTICIPADO:", marginLeft, currentY);
  const seventhTitleWidth = doc.getTextWidth("SÉPTIMO: TÉRMINO ANTICIPADO:");
  doc.line(marginLeft, currentY + 0.5, marginLeft + seventhTitleWidth, currentY + 0.5);
  currentY += 8;

  drawParagraph(
    "El incumplimiento de cualesquiera de las obligaciones establecidas en el presente contrato por una de las partes, dará derecho a la parte diligente para poner término ipso facto al presente contrato, con indemnización de perjuicios a su favor.",
  );
  drawParagraph(
    "En el caso de incumplimiento del Cliente, el Proveedor estará facultado para proceder al retiro inmediato del dispositivo de las dependencias del Cliente, quien desde ya acepta y autoriza dicha acción, liberando de todo reclamo, demanda o acción al Proveedor.",
  );
  drawParagraph(
    "Asimismo, tratándose de término anticipado del contrato por culpa del Cliente, el Proveedor tendrá derecho a cobrar al Cliente todas las rentas que se encontraren pendientes y sin devengar por todo el período de vigencia del contrato, más los reajustes e intereses que fueren procedentes.",
  );

  // OCTAVO: RESPONSABILIDADES Y OBLIGACIONES DEL CLIENTE
  checkNewPage(10);
  doc.setFont("times", "bold");
  doc.text("OCTAVO: RESPONSABILIDADES Y OBLIGACIONES DEL CLIENTE", marginLeft, currentY);
  const eighthTitleWidth = doc.getTextWidth("OCTAVO: RESPONSABILIDADES Y OBLIGACIONES DEL CLIENTE");
  doc.line(marginLeft, currentY + 0.5, marginLeft + eighthTitleWidth, currentY + 0.5);
  currentY += 8;

  const responsabilidades = [
    "El Cliente deberá cuidar, custodiar y conservar el dispositivo arrendado y de propiedad del Proveedor, respondiendo de todo riesgo y daño que sufrieren, con excepción de caso fortuito y fuerza mayor.",
    "El Cliente deberá cumplir y hacer cumplir respecto de sus empleados, dependientes y copropietarios, las instrucciones, términos y condiciones de uso del dispositivo entregado por el Proveedor, conforme al Anexo 1.",
    "El Cliente deberá abstenerse de mover, trasladar, alterar o modificar en cualquier forma el Dispositivo y sus componentes, como asimismo deberá abstenerse de intervenir el Dispositivo en cualquier forma, debiendo asumir en caso contrario todos los gastos y perjuicios que el incumplimiento de esta obligación se causare. Se incluyen dentro de esta prohibición las reparaciones y riesgos derivados del uso de suministros e insumos no originales y de accesorios, o aditamentos que provoquen alteraciones en el Dispositivo.",
    "El Cliente será responsable de todo daño que sufriere el Dispositivo y las personas en su caso con motivo o por efecto del uso impropio de los equipos o de cualquier otra causa que diga relación o se derive del uso anormal o inadecuado del Dispositivo, excluyendo el caso fortuito o fuerza mayor. Consecuentemente los trabajos, gastos y en general los desembolsos que se tuvieren que realizar o en que se incurriere con motivo de la situación anterior, serán de cargo del Cliente.",
    "El Cliente deberá operar el Dispositivo dentro de los niveles normales de uso. En el caso de operarlos en exceso de sus niveles máximos, según lo especificado en el manual del usuario, los repuestos que se requiriere remplazar serán de cargo exclusivo del Cliente.",
    "El CLIENTE, al inicio del presente contrato y durante su ejecución se obliga a informar al Proveedor de cualquier hecho o situación que a su juicio pudiere poner en peligro el Dispositivo, con el objeto de que se tomen las medidas oportunas tendientes a evitar riesgos o daños en los mismos o de sus usuarios.",
    "El Cliente deberá dar las facilidades de ingreso a sus dependencias al personal del Proveedor y/o de terceros autorizados por el Proveedor para efectuar el servicio técnico del Dispositivo, la revisión y mantenimiento de Dispositivo, cuando fuere procedente.",
    "El Cliente deberá proveer y mantener durante la vigencia del contrato y, según las especificaciones técnicas indicadas en el manual del Dispositivo, los requisitos de operación que requiera para el debido funcionamiento del Dispositivo, debiendo asimismo adoptar todas las medidas necesarias para el seguro y normal funcionamiento de ellos.",
  ];

  responsabilidades.forEach((resp) => {
    drawParagraph(resp, {
      x: marginLeft + 10,
      width: contentWidth - 10,
      lineHeight: 5,
      spacingAfter: 3,
      xPrefix: "•",
      xPrefixX: marginLeft + 5,
    });
  });
  currentY += 6;

  // NOVENO: RESPONSABILIDADES Y OBLIGACIONES DEL PROVEEDOR.
  checkNewPage(10);
  doc.setFont("times", "bold");
  doc.text("NOVENO: RESPONSABILIDADES Y OBLIGACIONES DEL PROVEEDOR.", marginLeft, currentY);
  const ninthTitleWidth = doc.getTextWidth("NOVENO: RESPONSABILIDADES Y OBLIGACIONES DEL PROVEEDOR.");
  doc.line(marginLeft, currentY + 0.5, marginLeft + ninthTitleWidth, currentY + 0.5);
  currentY += 8;

  const proveedorResp =
    "El Proveedor se obliga a efectuar las mantenciones preventivas y correctivas del Dispositivo entregado en arriendo, debiendo atender cualquier requerimiento por su mal funcionamiento a más tardar dentro del plazo de 6 horas desde la fecha en que la falla hubiere sido reclamada por el Cliente. Para tal efecto se considerará un horario de trabajo los días lunes a jueves entre las 9 y 18 horas y los viernes entre las 9 y las 17:00 horas. En el caso de mantenciones que requirieren un servicio mayor, el Cliente autorizará el traslado del Dispositivo al servicio técnico del Proveedor para su reparación o reemplazo por uno nuevo. El Dispositivo, cuenta con una Garantía de 10 años.";
  drawParagraph(proveedorResp);

  // DÉCIMO: CESIÓN.
  checkNewPage(10);
  doc.setFont("times", "bold");
  doc.text("DÉCIMO: CESIÓN.", marginLeft, currentY);
  const tenthTitleWidth = doc.getTextWidth("DÉCIMO: CESIÓN.");
  doc.line(marginLeft, currentY + 0.5, marginLeft + tenthTitleWidth, currentY + 0.5);
  currentY += 8;

  const cesionText =
    "El Proveedor estará facultado para otorgar, ceder y/o traspasar sus derechos u obligaciones originadas en este contrato a un tercero, sin consentimiento por parte del Cliente, siempre que asuma plenamente sus obligaciones en el presente contrato.";
  drawParagraph(cesionText);

  // DÉCIMO PRIMERO: DOMICILIO Y COMPETENCIA
  checkNewPage(10);
  doc.setFont("times", "bold");
  doc.text("DÉCIMO PRIMERO: DOMICILIO Y COMPETENCIA", marginLeft, currentY);
  const eleventhTitleWidth = doc.getTextWidth("DÉCIMO PRIMERO: DOMICILIO Y COMPETENCIA");
  doc.line(marginLeft, currentY + 0.5, marginLeft + eleventhTitleWidth, currentY + 0.5);
  currentY += 8;

  const domicilioText =
    "Será competente para conocer de cualquier conflicto surgido entre las Partes con ocasión del presente contrato, la justicia ordinaria. Las Partes fijan domicilio en la comuna y ciudad de Santiago de Chile.";
  drawParagraph(domicilioText);

  // DÉCIMO SEGUNDO: DECLARACION
  checkNewPage(10);
  doc.setFont("times", "bold");
  doc.text("DÉCIMO SEGUNDO: DECLARACION", marginLeft, currentY);
  const twelfthTitleWidth = doc.getTextWidth("DÉCIMO SEGUNDO: DECLARACION");
  doc.line(marginLeft, currentY + 0.5, marginLeft + twelfthTitleWidth, currentY + 0.5);
  currentY += 8;

  drawParagraph(
    "Los comparecientes en este instrumento por CLIENTE, y por el PROVEEDOR, declaran y aseguran que sus respectivas representadas son empresas legalmente constituidas y vigentes; que son ellos personeros debidamente investidos por aquéllas para celebrar el presente Contrato, y que, por consiguiente, él es plenamente eficaz y válido conforme al Derecho positivo respectivo.",
  );
  drawParagraph(
    "La exactitud de los hechos de que da cuenta la precedente declaración, es considerada una condición esencial y determinante para Las Partes en la celebración del presente Contrato, y en caso de no ser efectiva, a petición de la parte interesada, la parte afectada deberá resolver el problema a la mayor brevedad a entera satisfacción de la parte interesada, sin perjuicio de los derechos que le confiere la legislación vigente.",
  );

  // DÉCIMO TERCERO: NOTIFICACIONES.
  checkNewPage(10);
  doc.setFont("times", "bold");
  doc.text("DÉCIMO TERCERO: NOTIFICACIONES.", marginLeft, currentY);
  const thirteenthTitleWidth = doc.getTextWidth("DÉCIMO TERCERO: NOTIFICACIONES.");
  doc.line(marginLeft, currentY + 0.5, marginLeft + thirteenthTitleWidth, currentY + 0.5);
  currentY += 8;

  drawParagraph(
    "Todas las notificaciones, solicitudes y cualquier otra comunicación que sea requerida o puedan ser enviadas en virtud de este Contrato a alguna de las Partes y que no consideren una formalidad especial, serán remitidas por escrito por medio de carta con acuse de recibo o correo electrónico.",
  );
  drawParagraph(
    "En cada caso, la notificación deberá ser enviada a las personas y a las direcciones que se indican a continuación:",
  );

  checkNewPage(20);
  doc.text("/A/\tAl Proveedor, la notificación se dirigirá a:", marginLeft, currentY);
  currentY += 10;
  doc.setFont("times", "bold");
  doc.text("Atención: Arturo Ramírez Mendive", marginLeft, currentY);
  currentY += 5;
  doc.text("Fono: +56 97807 1418", marginLeft, currentY);
  currentY += 5;
  doc.text("Email: clientes@kristalina.cl", marginLeft, currentY);
  currentY += 15;

  checkNewPage(30);
  doc.setFont("times", "normal");
  doc.text("/B/\tAl Cliente, la notificación se dirigirá a:", marginLeft, currentY);
  currentY += 10;
  doc.setFont("times", "bold");
  doc.text(`Atención: ${datos.legalrepresentative}`, marginLeft, currentY);
  currentY += 5;
  doc.text(`Dirección: ${datos.societyaddress}`, marginLeft, currentY);
  currentY += 5;
  doc.text(`Fono: ${datos.legalrepresentativephone}`, marginLeft, currentY);
  currentY += 5;
  doc.text(`Email: ${datos.communityemail}`, marginLeft, currentY);
  currentY += 15;

  // Personas adicionales (persona2, persona3...)
  if (datos.personasadicionales && datos.personasadicionales.length > 0) {
    datos.personasadicionales.forEach((persona) => {
      checkNewPage(30);
      doc.setFont("times", "normal");
      doc.setFont("times", "bold");
      doc.text(`Atención: ${persona.nombre}`, marginLeft, currentY);
      currentY += 5;
      doc.text(`Dirección: ${persona.direccion}`, marginLeft, currentY);
      currentY += 5;
      doc.text(`Fono: ${persona.telefono}`, marginLeft, currentY);
      currentY += 5;
      doc.text(`Email: ${persona.email}`, marginLeft, currentY);
      currentY += 15;
    });
  }

  // DÉCIMO CUARTO: MISCELANEOS

  checkNewPage(10);
  doc.setFont("times", "bold");
  doc.text("DÉCIMO CUARTO: MISCELANEOS", marginLeft, currentY);
  const fourteenthTitleWidth = doc.getTextWidth("DÉCIMO CUARTO: MISCELANEOS");
  doc.line(marginLeft, currentY + 0.5, marginLeft + fourteenthTitleWidth, currentY + 0.5);
  currentY += 8;

  doc.text("1.\tAcuerdo Completo.", marginLeft, currentY);
  currentY += 8;
  drawParagraph(
    "El presente contrato, incluidos los Anexos que forman parte del mismo, constituye el acuerdo único y total entre las partes y reemplaza toda comunicación, representaciones o acuerdos verbales o escritos, ya sean previos o coetáneos, respecto de la materia aquí tratada.",
  );

  doc.setFont("times", "bold");
  doc.text("2.\tLegislación Aplicable: ", marginLeft, currentY);
  currentY += 8;
  const legText =
    "Para todos los efectos legales del presente contrato, éste se regirá exclusivamente por las leyes de la República de Chile.";
  drawParagraph(legText, { spacingAfter: 4 });

  doc.setFont("times", "bold");
  doc.text("3.\tEjemplares.", marginLeft, currentY);
  currentY += 8;
  drawParagraph(
    "El presente instrumento se firma en dos ejemplares de idéntico tenor y fecha, quedando uno de ellos en poder del CLIENTE y uno en poder del PROVEEDOR.",
    { spacingAfter: 10 },
  );

  // PERSONERÍAS
  checkNewPage(10);
  doc.setFont("times", "bold");
  doc.text("PERSONERÍAS:", marginLeft, currentY);
  const perWidth = doc.getTextWidth("PERSONERÍAS:");
  doc.line(marginLeft, currentY + 0.5, marginLeft + perWidth, currentY + 0.5);
  currentY += 8;

  const personeriaArturo =
    "La personería de don Arturo Ramírez Mendive para actuar en nombre y representación de la sociedad KRISTALINA SpA., consta de escritura pública otorgada con fecha 21 de febrero de 2023, mediante el sistema electrónico de Empresas y Sociedades.";
  drawParagraph(personeriaArturo);

  const formationDate = new Date(datos.societyformationdate);
  const personeriaCliente = `La personería de don ${datos.legalrepresentative} para actuar en nombre y representación de la sociedad ${datos.legalrepresentativesociety} ${datos.contextoempresa}. Consta de escritura pública otorgada con fecha ${formationDate.getDate()} de ${getMonthName(formationDate.getMonth())} de ${formationDate.getFullYear()}, ante la notaria de don ${datos.societynotary}.`;
  drawParagraph(personeriaCliente, { spacingAfter: 10 });

  const personeriaClient = new Date(datos.communityformationdate);
  const personeria2 = `La personería de ${datos.legalrepresentativesociety}, para representar a la comunidad ${datos.communityname} consta de escritura pública otorgada con fecha ${formationDate.getDate()} de ${getMonthName(formationDate.getMonth())} de ${formationDate.getFullYear()},ante el Notario Público de Santiago don ${datos.communitynotary}.`;
  drawParagraph(personeria2, { spacingAfter: 20 });

  // FIRMAS - Ensure the entire block stays together
  checkNewPage(45);
  const signatureWidth = 70;
  const lineY = currentY;

  // Arturo Signature
  doc.line(marginLeft, lineY, marginLeft + signatureWidth, lineY);
  doc.setFont("times", "normal");
  doc.text("Arturo Ramírez Mendive", marginLeft + signatureWidth / 2, lineY + 5, { align: "center" });
  doc.text("C.I N°10.537.439-9", marginLeft + signatureWidth / 2, lineY + 10, { align: "center" });
  doc.setFont("times", "bold");
  doc.text("pp. KRISTALINA SpA", marginLeft + signatureWidth / 2, lineY + 15, { align: "center" });

  // Client Signature
  const clientSignX = pageWidth - marginLeft - signatureWidth;
  doc.line(clientSignX, lineY, clientSignX + signatureWidth, lineY);
  doc.setFont("times", "normal");
  doc.text(datos.legalrepresentative, clientSignX + signatureWidth / 2, lineY + 5, { align: "center" });
  doc.text(`C.I N°${datos.legalrepresentativerut}`, clientSignX + signatureWidth / 2, lineY + 10, { align: "center" });
  doc.setFont("times", "bold");
  doc.text(`pp. ${datos.legalrepresentativesociety}`, clientSignX + signatureWidth / 2, lineY + 15, {
    align: "center",
  });
  doc.text(`pp. ${datos.communityname}`, clientSignX + signatureWidth / 2, lineY + 20, { align: "center" });

  currentY += 30;

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
  doc.setFontSize(12);
  doc.setFont("times", "normal");

  const anexoP1 =
    "Los sistemas K-IO funcionan como disociadores de fluidos, a través de una fuerza magneto motriz y un paso Venturi. Al pasar por el dispositivo, se genera Aragonita cuya principal característica es su alta solubilidad e inocuidad (no contamina). Esta aplicación tiene dos efectos fundamentales:";
  drawParagraph(anexoP1);

  drawParagraph("- Prevenir", { spacingAfter: 2, x: marginLeft + 10 });
  drawParagraph("- Desincrustar.", { spacingAfter: 12, x: marginLeft + 10 });

  // Paragraph: función de prevención
  const prevFullText =
    "En la función de prevención, el agua al pasar por nuestro equipo, se genera aragonita, la que evita incrustaciones nuevas.";
  const prevLines = doc.splitTextToSize(prevFullText, contentWidth);

  checkNewPage(6);
  doc.setFont("times", "normal");
  doc.text("En la ", marginLeft, currentY);
  let curX = marginLeft + doc.getTextWidth("En la ");

  doc.setFont("times", "bold");
  doc.text("función de prevención", curX, currentY);
  const fpWidth = doc.getTextWidth("función de prevención");
  doc.line(curX, currentY + 0.5, curX + fpWidth, currentY + 0.5); // Underline
  curX += fpWidth;

  doc.setFont("times", "normal");
  const fpMatch = "función de prevención";
  const line1Rest = prevLines[0].substring(prevLines[0].indexOf(fpMatch) + fpMatch.length);
  doc.text(line1Rest, curX, currentY);
  currentY += 6;

  for (let i = 1; i < prevLines.length; i++) {
    checkNewPage(6);
    doc.text(prevLines[i], marginLeft, currentY);
    currentY += 6;
  }
  currentY += 4;

  // Paragraph: función de la desincrustación
  const desinFullText =
    "En la función de la desincrustación, la aragonita al ponerse en contacto con los carbonatos incrustados, los va removiendo y rompiendo (erosionando) sin generar un daño estructural como lo causa un químico. La razón por la cual se va desincrustando es porque la aragonita (inestable) al permearse (mezclarse) con agua cruda con calcita y con carbonato incrustados, la forma inestable siempre predomina sobre la estable.";
  const desinLines = doc.splitTextToSize(desinFullText, contentWidth);

  checkNewPage(6);
  doc.setFont("times", "normal");
  doc.text("En la ", marginLeft, currentY);
  curX = marginLeft + doc.getTextWidth("En la ");

  doc.setFont("times", "bold");
  doc.text("función de la desincrustación", curX, currentY);
  const fdWidth = doc.getTextWidth("función de la desincrustación");
  doc.line(curX, currentY + 0.5, curX + fdWidth, currentY + 0.5); // Underline
  curX += fdWidth;

  doc.setFont("times", "normal");
  const fdMatch = "función de la desincrustación";
  const dline1Rest = desinLines[0].substring(desinLines[0].indexOf(fdMatch) + fdMatch.length);
  doc.text(dline1Rest, curX, currentY);
  currentY += 6;

  for (let i = 1; i < desinLines.length; i++) {
    checkNewPage(6);
    doc.text(desinLines[i], marginLeft, currentY);
    currentY += 6;
  }
  currentY += 6;

  drawFooter(doc, pageWidth, pageHeight, pageNum);
  doc.addPage();
  pageNum++;
  drawHeader(doc, pageWidth);
  currentY = marginTop;

  const pipeSizeText =
    "Dado lo anterior, el cliente puede usar un dispositivo de acuerdo al flujo requerido y no al tamaño de la tubería, evitando la instalación de equipos de mayor tamaño.";
  drawParagraph(pipeSizeText);

  const effectsTitle =
    "Efectos de nuestro sistema KIO: Una vez instalado el sistema, se deben tener presentes los siguientes puntos:";
  drawParagraph(effectsTitle, { fontStyle: "normal", spacingAfter: 4 });

  const effect1 =
    "- Sistemas K-IO, realizan una limpieza de las incrustaciones históricas acumuladas en el interior de las cañerías, redes de agua y en sus fittings. Por esta razón es clave indicar a la empresa de mantención de sistemas hidráulicos y redes de agua, generar una revisión de sala de bombas, aireadores, llaves y válvulas, para evitar una posible saturación generada por la desincrustación. (PREVENTIVO)";
  drawParagraph(effect1);

  const effect2 =
    "- A nivel domiciliario: se reducen costos de mantención de lavadoras, lavavajillas y hervidores; menos uso de detergentes y suavizantes. Hay que revisar una vez a la semana, los aireadores de las griferías o llaves, las columnas de ducha y monomandos, para evitar posibles saturaciones, generada por la desincrustación. Esto por un período de 1 o 2 meses, según sea la inspección visual. Sólo se debe sacar, limpiar y volver a instalar el aireador.";
  drawParagraph(effect2);

  drawParagraph("- Evita deterioro de artefactos, griferías y fittings.", { spacingAfter: 6 });

  const effect4 =
    "- Genera un ahorro en gasto de agua y gas producto de la optimización de los procesos y consumos de agua.";
  drawParagraph(effect4);

  drawFooter(doc, pageWidth, pageHeight, pageNum);

  return doc.output("blob");
}
