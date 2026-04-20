import Link from "next/link";
import { navStrings } from "./navStrings";

/**
 * Ítems de navegación compartidos entre barra desktop y panel móvil.
 * Evita duplicar JSX y desincronizar enlaces.
 */
export function NavMenuContent({
  styles,
  pathname,
  onNavigate,
  onContactClick,
  dropdownMenuId,
  dropdown,
}) {
  const { isOpen, toggle, onMouseEnter, onMouseLeave } = dropdown;

  const isActive = (path) => pathname === path;
  const active0km = isActive("/0km") || isActive("/planes");

  return (
    <>
      <Link
        className={`${styles.navLink} ${isActive("/") ? styles.active : ""}`}
        href="/"
        aria-current={isActive("/") ? "page" : undefined}
        onClick={onNavigate}
      >
        Inicio
      </Link>

      <div
        className={styles.dropdown}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        role="group"
        aria-label={navStrings.dropdownGroup}
      >
        <button
          type="button"
          className={`${styles.dropdownToggle} ${active0km || isOpen ? styles.active : ""}`}
          onClick={toggle}
          aria-expanded={isOpen}
          aria-haspopup="true"
          aria-controls={dropdownMenuId}
        >
          Peugeot <span className={styles.navDivider}>|</span> 0 KM
          <span
            className={`${styles.dropdownArrow} ${isOpen ? styles.dropdownArrowOpen : ""}`}
            aria-hidden="true"
          >
            ▼
          </span>
        </button>
        <div
          id={dropdownMenuId}
          className={`${styles.dropdownMenu} ${isOpen ? styles.dropdownMenuOpen : ""}`}
        >
          <Link
            className={`${styles.dropdownItem} ${isActive("/0km") ? styles.active : ""}`}
            href="/0km"
            onClick={onNavigate}
          >
            Peugeot <span className={styles.navDivider}>|</span> 0 KM
          </Link>
          <Link
            className={`${styles.dropdownItem} ${isActive("/planes") ? styles.active : ""}`}
            href="/planes"
            onClick={onNavigate}
          >
            Planes
          </Link>
        </div>
      </div>

      <Link
        className={`${styles.navLink} ${isActive("/usados") ? styles.active : ""}`}
        href="/usados"
        aria-current={isActive("/usados") ? "page" : undefined}
        onClick={onNavigate}
      >
        Usados <span className={styles.navDivider}>|</span> Multimarca
      </Link>
      <Link
        className={`${styles.navLink} ${isActive("/postventa") ? styles.active : ""}`}
        href="/postventa"
        aria-current={isActive("/postventa") ? "page" : undefined}
        onClick={onNavigate}
      >
        Postventa
      </Link>
      <Link
        className={`${styles.navLink} ${isActive("/trabaja-con-nosotros") ? styles.active : ""}`}
        href="/trabaja-con-nosotros"
        aria-current={isActive("/trabaja-con-nosotros") ? "page" : undefined}
        onClick={onNavigate}
      >
        Trabaja con nosotros
      </Link>
      <a className={styles.navLink} href="#contacto" onClick={onContactClick}>
        Contacto
      </a>
    </>
  );
}
