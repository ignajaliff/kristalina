import { supabase } from "@/integrations/supabase/client";

export type EmailTipo = "presupuesto" | "contrato" | "reporte" | "aviso_pago";

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
  const { data: inserted, error: insertError } = await supabase
    .from("emails")
    .insert({
      to_email: params.toEmail,
      to_name: params.toName ?? null,
      cc: params.cc && params.cc.length > 0 ? params.cc.join(",") : null,
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

  // 2. Disparar el envío (best-effort)
  try {
    const { data, error } = await supabase.functions.invoke("send-email", {
      body: { email_id: inserted.id },
    });
    if (error) {
      console.error("Error invocando send-email:", error);
      return { queued: true, sent: false, emailId: inserted.id, message: "El email quedó pendiente de envío." };
    }
    const ok = (data as any)?.ok === true;
    return {
      queued: true,
      sent: ok,
      emailId: inserted.id,
      message: ok ? undefined : (data as any)?.reason || "El email quedó pendiente de envío.",
    };
  } catch (e) {
    console.error("Error invocando send-email:", e);
    return { queued: true, sent: false, emailId: inserted.id, message: "El email quedó pendiente de envío." };
  }
}
