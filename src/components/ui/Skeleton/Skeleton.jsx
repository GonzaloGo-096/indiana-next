"use client";

/**
 * Skeleton - Componente base reutilizable para estados de carga
 * 
 * Características:
 * - Animación shimmer suave y consistente
 * - Soporte para prefers-reduced-motion
 * - Accesibilidad integrada
 * - Variantes predefinidas (text, title, image, button)
 * - Colores estandarizados usando variables CSS
 * 
 * @author Indiana Peugeot
 * @version 1.0.0
 */

import styles from './Skeleton.module.css';

/**
 * Componente base Skeleton
 * 
 * @param {Object} props
 * @param {string} props.type - Tipo de skeleton: 'text', 'title', 'image', 'button', 'custom'
 * @param {string|number} props.width - Ancho (puede ser porcentaje como '50' o valor CSS como '200px')
 * @param {string|number} props.height - Altura (valor CSS como '20px' o '2rem')
 * @param {string} props.className - Clases CSS adicionales
 * @param {Object} props.style - Estilos inline adicionales
 * @param {boolean} props.rounded - Si es true, aplica border-radius circular
 * @param {string} props.ariaLabel - Label para accesibilidad (opcional, por defecto usa aria-hidden)
 */
export function Skeleton({ 
  type = 'text', 
  width, 
  height, 
  className = '', 
  style = {},
  rounded = false,
  ariaLabel
}) {
  const typeClass = styles[type] || styles.text;
  const widthClass = width && typeof width === 'string' && !width.includes('px') && !width.includes('%') && !width.includes('rem')
    ? styles[`w${width}`] 
    : '';
  
  const classes = [
    styles.skeleton,
    typeClass,
    widthClass,
    rounded && styles.rounded,
    className
  ].filter(Boolean).join(' ');

  const customStyle = {
    ...style,
    ...(height && { height: typeof height === 'number' ? `${height}px` : height }),
    ...(width && !widthClass && { width: typeof width === 'number' ? `${width}px` : width })
  };

  // Si hay ariaLabel, usarlo; si no, usar aria-hidden (estándar para skeletons)
  const ariaProps = ariaLabel 
    ? { 'aria-label': ariaLabel, role: 'status' }
    : { 'aria-hidden': 'true' };

  return (
    <div 
      className={classes} 
      style={customStyle}
      {...ariaProps}
    />
  );
}

/**
 * SkeletonText - Variante predefinida para texto
 */
export function SkeletonText({ width = '100', className, style, ...props }) {
  return (
    <Skeleton 
      type="text" 
      width={width} 
      className={className} 
      style={style}
      {...props}
    />
  );
}

/**
 * SkeletonTitle - Variante predefinida para títulos
 */
export function SkeletonTitle({ width = '75', className, style, ...props }) {
  return (
    <Skeleton 
      type="title" 
      width={width} 
      className={className} 
      style={style}
      {...props}
    />
  );
}

/**
 * SkeletonImage - Variante predefinida para imágenes
 */
export function SkeletonImage({ className, style, ...props }) {
  return (
    <Skeleton 
      type="image" 
      className={className} 
      style={style}
      {...props}
    />
  );
}

/**
 * SkeletonButton - Variante predefinida para botones
 */
export function SkeletonButton({ width = '100', className, style, ...props }) {
  return (
    <Skeleton 
      type="button" 
      width={width} 
      className={className} 
      style={style}
      {...props}
    />
  );
}

/**
 * SkeletonGroup - Contenedor para agrupar skeletons
 */
export function SkeletonGroup({ children, className = '', style = {}, ariaLabel }) {
  const ariaProps = ariaLabel 
    ? { 'aria-label': ariaLabel, role: 'status' }
    : { 'aria-hidden': 'true' };

  return (
    <div 
      className={`${styles.container} ${className}`} 
      style={style}
      {...ariaProps}
    >
      {children}
    </div>
  );
}

/**
 * SkeletonGrid - Grid de skeletons
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Skeletons hijos
 * @param {number} props.columns - Número de columnas (default: 3)
 * @param {string} props.className - Clases adicionales
 * @param {Object} props.style - Estilos adicionales
 * @param {string} props.ariaLabel - Label para accesibilidad
 */
export function SkeletonGrid({ 
  children, 
  columns = 3, 
  className = '', 
  style = {},
  ariaLabel
}) {
  const gridClass = styles[`grid${columns}`] || styles.grid3;
  const ariaProps = ariaLabel 
    ? { 'aria-label': ariaLabel, role: 'status' }
    : { 'aria-hidden': 'true' };

  return (
    <div 
      className={`${styles.grid} ${gridClass} ${className}`} 
      style={style}
      {...ariaProps}
    >
      {children}
    </div>
  );
}


