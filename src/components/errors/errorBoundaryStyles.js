/**
 * Estilos compartidos para boundaries de error (inline: evita chunk CSS extra).
 * Usado por `app/error.jsx` y `app/admin/error.jsx`.
 */
export const errorBoundaryStyles = `
  .eb-container { min-height: 60vh; display: flex; align-items: center; justify-content: center; padding: 1.5rem; background: var(--color-surface, #fff); }
  .eb-content { max-width: 600px; width: 100%; text-align: center; padding: 2rem; background: var(--color-white, #fff); border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.1); }
  .eb-icon { font-size: 4rem; margin-bottom: 1rem; line-height: 1; }
  .eb-title { font-size: clamp(1.5rem, 4vw, 2rem); font-weight: 700; font-family: var(--font-condensed, system-ui, sans-serif); color: var(--color-text-primary, #202124); margin: 0 0 1rem 0; text-transform: uppercase; letter-spacing: 0.5px; }
  .eb-description { font-size: 1rem; line-height: 1.6; color: var(--color-neutral-700, #5f6368); margin: 0 0 1.5rem 0; }
  .eb-actions { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
  .eb-button { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.75rem 1.5rem; background: var(--color-brand-500, #061B9C); color: #fff; border: none; border-radius: 8px; font-family: var(--font-condensed, system-ui); font-weight: 600; font-size: 1rem; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; text-decoration: none; }
  .eb-button:hover { background: var(--color-brand-600, #051080); transform: translateY(-2px); box-shadow: 0 4px 8px rgba(6,27,156,0.3); }
  .eb-button:focus-visible { outline: 2px solid var(--color-brand-500, #061B9C); outline-offset: 2px; }
  .eb-link { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.75rem 1.5rem; background: transparent; color: var(--color-brand-500, #061B9C); border: 2px solid var(--color-brand-500, #061B9C); border-radius: 8px; font-weight: 600; font-size: 1rem; text-decoration: none; transition: all 0.2s; }
  .eb-link:hover { background: var(--color-brand-500); color: #fff; transform: translateY(-2px); }
  .eb-link:focus-visible { outline: 2px solid var(--color-brand-500); outline-offset: 2px; }
  .eb-details { margin-top: 1.5rem; text-align: left; border-top: 1px solid var(--color-neutral-200, #e8eaed); padding-top: 1rem; }
  .eb-summary { font-size: 0.875rem; font-weight: 600; color: var(--color-neutral-600, #80868b); cursor: pointer; user-select: none; margin-bottom: 0.5rem; }
  .eb-summary:hover { color: var(--color-text-primary, #202124); }
  .eb-stack { font-size: 0.75rem; font-family: "Courier New", monospace; color: var(--color-neutral-700, #5f6368); background: var(--color-neutral-50, #f8f9fa); padding: 1rem; border-radius: 4px; overflow-x: auto; white-space: pre-wrap; word-break: break-word; margin: 0; line-height: 1.5; }
`;
