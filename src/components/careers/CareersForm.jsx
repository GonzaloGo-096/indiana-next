/**
 * CareersForm - Formulario de postulación laboral
 *
 * Usa react-hook-form + zod. Envía FormData a /api/careers.
 *
 * @author Indiana Peugeot
 */

"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { careersSchema } from "@/schemas/careersSchema";
import { jobPositions } from "@/lib/careers.data";
import { useAnalytics } from "@/hooks/useAnalytics";
import { LOCATIONS, SOURCES, LEAD_SOURCES } from "@/lib/analytics/events";
import styles from "./CareersForm.module.css";

// Identificador único del formulario para reportes en GA4.
const FORM_ID = "careers";

// IMPORTANTE: nunca mandar PII al dataLayer (nombre, email, teléfono, mensaje, CV).
// Solo metadatos no identificables. Ver src/lib/analytics/README.md.

const FORM_STATE = {
  idle: "idle",
  sending: "sending",
  success: "success",
  error: "error",
};

const CareersForm = () => {
  const [formState, setFormState] = useState(FORM_STATE.idle);
  const [errorMessage, setErrorMessage] = useState("");
  const startedRef = useRef(false);
  const { trackFormStart, trackFormSubmit, trackLead } = useAnalytics();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(careersSchema),
    defaultValues: {
      puesto: "",
      nombreApellido: "",
      email: "",
      telefono: "",
      mensaje: "",
    },
  });

  const handleFirstInteraction = () => {
    if (startedRef.current) return;
    startedRef.current = true;
    trackFormStart(FORM_ID, { location: LOCATIONS.CAREERS });
  };

  const onSubmit = async (data) => {
    setFormState(FORM_STATE.sending);
    setErrorMessage("");

    try {
      const formData = new FormData();
      formData.append("puesto", data.puesto);
      formData.append("nombreApellido", data.nombreApellido);
      formData.append("email", data.email);
      if (data.telefono) formData.append("telefono", data.telefono);
      if (data.mensaje) formData.append("mensaje", data.mensaje);
      if (data.cv?.[0]) formData.append("cv", data.cv[0]);

      const res = await fetch("/api/careers", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Error al enviar. Intentá de nuevo.");
      }

      // Tracking: solo metadatos no PII (puesto + flags booleanos).
      trackFormSubmit(FORM_ID, {
        location: LOCATIONS.CAREERS,
        success: true,
        puesto: data.puesto,
        has_cv: !!data.cv?.[0],
        has_phone: !!data.telefono,
        has_message: !!data.mensaje,
      });
      trackLead({
        leadSource: LEAD_SOURCES.FORM,
        source: SOURCES.FORM,
        location: LOCATIONS.CAREERS,
        componentId: "form-careers",
      });

      setFormState(FORM_STATE.success);
      reset();
    } catch (err) {
      setFormState(FORM_STATE.error);
      setErrorMessage(err.message || "Error al enviar. Intentá de nuevo.");
    }
  };

  if (formState === FORM_STATE.success) {
    return (
      <div className={styles.successMessage} role="alert">
        <p>¡Gracias! Tu postulación fue enviada correctamente.</p>
        <p className={styles.successSub}>
          Nos pondremos en contacto si tu perfil se ajusta a lo que buscamos.
        </p>
      </div>
    );
  }

  return (
    <section
      className={styles.section}
      aria-labelledby="form-heading"
    >
      <div className="container">
        <h2 id="form-heading" className={styles.heading}>
          Postulate
        </h2>
        <form
          onSubmit={handleSubmit(onSubmit)}
          onFocusCapture={handleFirstInteraction}
          onChangeCapture={handleFirstInteraction}
          className={styles.form}
          noValidate
          encType="multipart/form-data"
        >
          {formState === FORM_STATE.error && (
            <div className={styles.errorBanner} role="alert">
              {errorMessage}
            </div>
          )}

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="puesto" className={styles.label}>
                Puesto <span className={styles.required}>*</span>
              </label>
              <select
                id="puesto"
                {...register("puesto")}
                className={styles.select}
                disabled={formState === FORM_STATE.sending}
                aria-invalid={!!errors.puesto}
              >
                <option value="" disabled hidden>Seleccioná un puesto</option>
                {jobPositions.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
                <option value="otro">Otro</option>
              </select>
              {errors.puesto && (
                <span className={styles.error}>{errors.puesto.message}</span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="nombreApellido" className={styles.label}>
                Nombre y Apellido <span className={styles.required}>*</span>
              </label>
              <input
                id="nombreApellido"
                type="text"
                {...register("nombreApellido")}
                className={styles.input}
                placeholder="Tu nombre completo"
                disabled={formState === FORM_STATE.sending}
                aria-invalid={!!errors.nombreApellido}
              />
              {errors.nombreApellido && (
                <span className={styles.error}>
                  {errors.nombreApellido.message}
                </span>
              )}
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.label}>
                Email <span className={styles.required}>*</span>
              </label>
              <input
                id="email"
                type="email"
                {...register("email")}
                className={styles.input}
                placeholder="tu@email.com"
                disabled={formState === FORM_STATE.sending}
                aria-invalid={!!errors.email}
              />
              {errors.email && (
                <span className={styles.error}>{errors.email.message}</span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="telefono" className={styles.label}>
                Teléfono
              </label>
              <input
                id="telefono"
                type="tel"
                {...register("telefono")}
                className={styles.input}
                placeholder="(0381) 123-4567"
                disabled={formState === FORM_STATE.sending}
                aria-invalid={!!errors.telefono}
              />
              {errors.telefono && (
                <span className={styles.error}>{errors.telefono.message}</span>
              )}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="mensaje" className={styles.label}>
              Mensaje
            </label>
            <textarea
              id="mensaje"
              {...register("mensaje")}
              className={styles.textarea}
              rows={4}
              placeholder="Contanos brevemente sobre vos (opcional)"
              disabled={formState === FORM_STATE.sending}
              aria-invalid={!!errors.mensaje}
            />
            {errors.mensaje && (
              <span className={styles.error}>{errors.mensaje.message}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="cv" className={styles.label}>
              Adjuntar CV <span className={styles.required}>*</span>
            </label>
            <input
              id="cv"
              type="file"
              accept=".pdf,.jpg,.jpeg,application/pdf,image/jpeg,image/jpg"
              {...register("cv")}
              className={styles.fileInput}
              disabled={formState === FORM_STATE.sending}
              aria-invalid={!!errors.cv}
            />
            <span className={styles.hint}>PDF o JPG, máximo 5 MB</span>
            {errors.cv && (
              <span className={styles.error}>{errors.cv.message}</span>
            )}
          </div>

          <button
            type="submit"
            className={styles.submitButton}
            disabled={formState === FORM_STATE.sending}
          >
            {formState === FORM_STATE.sending ? "Enviando…" : "Enviar solicitud"}
          </button>
        </form>
      </div>
    </section>
  );
};

export default CareersForm;
