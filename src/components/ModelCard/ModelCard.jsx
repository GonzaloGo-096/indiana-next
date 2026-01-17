/**
 * ModelCard - Card de modelo 0km con imagen y título
 * 
 * Diseño: Card con imagen del modelo, hover sutil
 * Mobile-first, fondo blanco, borde sutil
 * 
 * @author Indiana Usados
 * @version 2.1.0 - Optimizado con React.memo para mejor performance
 */

import { memo } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./ModelCard.module.css";

/**
 * Componente ModelCard
 * Optimizado con React.memo para evitar re-renders innecesarios en listas
 * 
 * @param {Object} props - Propiedades del componente
 * @param {string} props.src - URL de la imagen
 * @param {string} props.alt - Texto alternativo
 * @param {string} props.titulo - Nombre del modelo
 * @param {string} props.slug - Slug para la URL (ej: "208", "2008")
 */
function ModelCard({ src, alt, titulo, slug }) {
  return (
    <Link href={`/0km/${slug}`} className={styles.card}>
      <div className={styles.imageContainer}>
        <Image
          src={src}
          alt={alt}
          width={400}
          height={300}
          className={styles.image}
          sizes="(max-width: 768px) 100vw, 300px"
          quality={80}
          loading="lazy"
        />
      </div>

      <div className={styles.content}>
        <h3 className={styles.title}>{titulo}</h3>
      </div>
    </Link>
  );
}

// Memoizar componente para evitar re-renders innecesarios en listas
export default memo(ModelCard);

