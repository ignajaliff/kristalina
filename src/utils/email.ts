import { supabase } from "@/integrations/supabase/client";

export type EmailTipo = "presupuesto" | "contrato" | "reporte" | "aviso_pago";

/**
 * Correos internos de Kristalina que deben recibir copia (CC) de TODOS los
 * emails que envía el sistema (presupuestos, facturas, reportes, etc.).
 */
const CC_INTERNOS = ["eporro@kristalina.cl", "aramirez@kristalina.cl"];

/**
 * Arma la lista final de CC: agrega los internos de Kristalina, deduplica y
 * excluye cualquiera que ya sea el destinatario principal (evita to + cc
 * repetido). Comparación sin distinción de mayúsculas/espacios.
 */
function buildCcList(cc: string[] | undefined, toEmail: string): string[] {
  const to = toEmail.trim().toLowerCase();
  const vistos = new Set<string>();
  const resultado: string[] = [];
  for (const raw of [...(cc ?? []), ...CC_INTERNOS]) {
    const email = (raw ?? "").trim();
    const key = email.toLowerCase();
    if (!email || key === to || vistos.has(key)) continue;
    vistos.add(key);
    resultado.push(email);
  }
  return resultado;
}

export interface QueueEmailParams {
  toEmail: string;
  toName?: string;
  /** Destinatarios en copia (CC). */
  cc?: string[];
  subject: string;
  bodyHtml: string;
  attachmentUrl?: string;
  attachmentFilename?: string;
  tipo: EmailTipo;
  relatedId?: string;
}

export interface QueueEmailResult {
  /** El email quedó registrado en la cola (tabla `emails`). */
  queued: boolean;
  /** El proveedor confirmó el envío. */
  sent: boolean;
  /** Mensaje informativo (ej: credenciales no configuradas). */
  message?: string;
  emailId?: string;
}

/**
 * Registra un email en la tabla `emails` y dispara la Edge Function `send-email`.
 *
 * - Si el envío funciona, el email queda `sent`.
 * - Si todavía no hay credenciales de correo configuradas, queda `pending`
 *   (se podrá reenviar luego sin perder el registro).
 *
 * Nunca lanza por un fallo de envío: el registro en la cola es lo importante.
 */
export async function queueAndSendEmail(params: QueueEmailParams): Promise<QueueEmailResult> {
  // 1. Registrar en la cola/log
  const ccFinal = buildCcList(params.cc, params.toEmail);
  const { data: inserted, error: insertError } = await supabase
    .from("emails")
    .insert({
      to_email: params.toEmail,
      to_name: params.toName ?? null,
      cc: ccFinal.length > 0 ? ccFinal.join(",") : null,
      subject: params.subject,
      body_html: params.bodyHtml,
      attachment_url: params.attachmentUrl ?? null,
      attachment_filename: params.attachmentFilename ?? null,
      tipo: params.tipo,
      related_id: params.relatedId ?? null,
    })
    .select("id")
    .single();

  if (insertError || !inserted) {
    console.error("Error registrando email:", insertError);
    return { queued: false, sent: false, message: "No se pudo registrar el email." };
  }

  // La Edge Function a veces devuelve 503 por cold-start (el worker no alcanza a
  // levantar) aunque al reintentar el envío funcione. Por eso reintentamos la
  // invocación varias veces; antes de cada reintento chequeamos si el correo ya
  // quedó `sent` (un intento previo pudo salir pese al error de red).
  const isSent = async (): Promise<boolean> => {
    const { data } = await supabase.from("emails").select("status").eq("id", inserted.id).single();
    return (data as any)?.status === "sent";
  };

  // 2. Disparar el envío con reintentos (best-effort)
  const MAX_INTENTOS = 4;
  let lastReason: string | undefined;
  for (let intento = 0; intento < MAX_INTENTOS; intento++) {
    if (intento > 0) {
      // Esperar a que el worker se "caliente" antes de reintentar.
      await new Promise((r) => setTimeout(r, 3500));
      if (await isSent()) return { queued: true, sent: true, emailId: inserted.id };
    }
    try {
      const { data, error } = await supabase.functions.invoke("send-email", {
        body: { email_id: inserted.id },
      });
      if (!error && (data as any)?.ok === true) {
        return { queued: true, sent: true, emailId: inserted.id };
      }
      lastReason = (data as any)?.reason || (error ? String((error as any).message || error) : undefined);
      if (error) console.error(`Error invocando send-email (intento ${intento + 1}):`, error);
    } catch (e) {
      console.error(`Error invocando send-email (intento ${intento + 1}):`, e);
    }
  }

  // Último chequeo: pudo haber salido en el último intento aunque la red cortó.
  const sent = await isSent();
  return {
    queued: true,
    sent,
    emailId: inserted.id,
    message: sent ? undefined : lastReason || "El email quedó pendiente de envío.",
  };
}
