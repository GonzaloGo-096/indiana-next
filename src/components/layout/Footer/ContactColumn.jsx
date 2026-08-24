import { AREAS_DE_CONTACTO } from "@/config/contacto";
import FooterColumn from "./FooterColumn";
import ContactAccordion from "./ContactAccordion";
import ContactLinks from "./ContactLinks";

/**
 * La columna de contacto: un acordeón por área.
 *
 * Componente de servidor. Le pasa a cada acordeón su contenido ya armado, así
 * lo único que corre en el navegador es abrir y cerrar.
 *
 * Un área con varias sedes lleva un segundo nivel de acordeón; una con una sola
 * muestra sus íconos directo. La condición es sobre cuántas sedes hay, no sobre
 * de qué forma vino el dato: todas las áreas traen `sedes`.
 */
export default function ContactColumn() {
  return (
    <FooterColumn titulo="Contacto" variante="contacto">
      {AREAS_DE_CONTACTO.map((area) => (
        <ContactAccordion key={area.id} titulo={area.titulo} id={area.id}>
          {area.sedes.length === 1 ? (
            <ContactLinks sede={area.sedes[0]} />
          ) : (
            area.sedes.map((sede) => (
              <ContactAccordion
                key={sede.id}
                titulo={sede.nombre}
                id={sede.id}
                nivel="sede"
              >
                <ContactLinks sede={sede} />
              </ContactAccordion>
            ))
          )}
        </ContactAccordion>
      ))}
    </FooterColumn>
  );
}
