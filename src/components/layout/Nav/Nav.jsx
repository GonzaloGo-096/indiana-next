"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Nav.module.css";

const Nav = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [is0kmDropdownOpen, setIs0kmDropdownOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (path) => pathname === path;

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
    setIs0kmDropdownOpen(false);
  };

  // ✅ OPTIMIZADO: Prevenir scroll del body sin causar reflow
  useEffect(() => {
    if (isMenuOpen) {
      // ✅ Usar clase CSS en lugar de style directo (mejor performance)
      document.body.classList.add("menu-open");
    } else {
      document.body.classList.remove("menu-open");
    }
    return () => {
      document.body.classList.remove("menu-open");
    };
  }, [isMenuOpen]);

  const toggle0kmDropdown = (e) => {
    e.preventDefault();
    setIs0kmDropdownOpen(!is0kmDropdownOpen);
  };

  const handle0kmMouseEnter = () => {
    setIs0kmDropdownOpen(true);
  };

  const handle0kmMouseLeave = () => {
    setIs0kmDropdownOpen(false);
  };

  const handleScrollToFooter = (event) => {
    event.preventDefault();
    const footerEl = document.getElementById("contacto");
    if (footerEl) {
      footerEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    closeMenu();
  };

  return (
    <>
      <nav
        className={`${styles.navbar} ${isMenuOpen ? styles.navbarMenuOpen : ""}`}
      >
        <div className={styles.container}>
          <Link
            className={styles.brand}
            href="/"
            onClick={closeMenu}
          >
            <img
              src="/assets/logos/logos-indiana/indiana-final.webp"
              alt="Logo Indiana"
              className={styles.logo}
              width="200"
              height="80"
            />
          </Link>

          <button
            className={styles.mobileMenu}
            onClick={toggleMenu}
            aria-label="Toggle navigation"
            aria-expanded={isMenuOpen}
          >
            <span className={styles.hamburger}>
              <span className={styles.line}></span>
              <span className={styles.line}></span>
              <span className={styles.line}></span>
            </span>
          </button>

          {/* Menú desktop dentro del nav */}
          <div className={`${styles.nav} ${styles.navDesktop}`}>
            <div className={styles.navList}>
              <Link
                className={`${styles.navLink} ${isActive("/") ? styles.active : ""}`}
                href="/"
                aria-current={isActive("/") ? "page" : undefined}
                onClick={closeMenu}
              >
                Inicio
              </Link>

              {/* ✅ Peugeot | 0 KM con dropdown de Planes */}
              <div
                className={styles.dropdown}
                onMouseEnter={handle0kmMouseEnter}
                onMouseLeave={handle0kmMouseLeave}
              >
                <button
                  className={`${styles.dropdownToggle} ${isActive("/0km") || isActive("/planes") ? styles.active : ""} ${is0kmDropdownOpen ? styles.active : ""}`}
                  onClick={toggle0kmDropdown}
                  aria-expanded={is0kmDropdownOpen}
                  aria-haspopup="true"
                >
                  Peugeot <span className={styles.navDivider}>|</span> 0 KM
                  <span
                    className={`${styles.dropdownArrow} ${is0kmDropdownOpen ? styles.dropdownArrowOpen : ""}`}
                  >
                    ▼
                  </span>
                </button>
                <div
                  className={`${styles.dropdownMenu} ${is0kmDropdownOpen ? styles.dropdownMenuOpen : ""}`}
                >
                  <Link
                    className={`${styles.dropdownItem} ${isActive("/0km") ? styles.active : ""}`}
                    href="/0km"
                    onClick={closeMenu}
                  >
                    Peugeot <span className={styles.navDivider}>|</span> 0 KM
                  </Link>
                  <Link
                    className={`${styles.dropdownItem} ${isActive("/planes") ? styles.active : ""}`}
                    href="/planes"
                    onClick={closeMenu}
                  >
                    Planes
                  </Link>
                </div>
              </div>

              {/* ✅ Usados | Multimarca */}
              <Link
                className={`${styles.navLink} ${isActive("/usados") ? styles.active : ""}`}
                href="/usados"
                aria-current={isActive("/usados") ? "page" : undefined}
                onClick={closeMenu}
              >
                Usados <span className={styles.navDivider}>|</span> Multimarca
              </Link>
              <Link
                className={`${styles.navLink} ${isActive("/postventa") ? styles.active : ""}`}
                href="/postventa"
                aria-current={isActive("/postventa") ? "page" : undefined}
                onClick={closeMenu}
              >
                Postventa
              </Link>
              <a
                className={styles.navLink}
                href="#contacto"
                onClick={handleScrollToFooter}
              >
                Contacto
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Menú mobile fuera del nav para cubrir toda la pantalla */}
      <div
        className={`${styles.nav} ${styles.navMobile} ${isMenuOpen ? styles.open : ""}`}
      >
        <div className={styles.navList}>
          <Link
            className={`${styles.navLink} ${isActive("/") ? styles.active : ""}`}
            href="/"
            aria-current={isActive("/") ? "page" : undefined}
            onClick={closeMenu}
          >
            Inicio
          </Link>

          {/* ✅ Peugeot | 0 KM con dropdown de Planes */}
          <div
            className={styles.dropdown}
            onMouseEnter={handle0kmMouseEnter}
            onMouseLeave={handle0kmMouseLeave}
          >
            <button
              className={`${styles.dropdownToggle} ${isActive("/0km") || isActive("/planes") ? styles.active : ""} ${is0kmDropdownOpen ? styles.active : ""}`}
              onClick={toggle0kmDropdown}
              aria-expanded={is0kmDropdownOpen}
              aria-haspopup="true"
            >
              Peugeot <span className={styles.navDivider}>|</span> 0 KM
              <span
                className={`${styles.dropdownArrow} ${is0kmDropdownOpen ? styles.dropdownArrowOpen : ""}`}
              >
                ▼
              </span>
            </button>
            <div
              className={`${styles.dropdownMenu} ${is0kmDropdownOpen ? styles.dropdownMenuOpen : ""}`}
            >
              <Link
                className={`${styles.dropdownItem} ${isActive("/0km") ? styles.active : ""}`}
                href="/0km"
                onClick={closeMenu}
              >
                Peugeot <span className={styles.navDivider}>|</span> 0 KM
              </Link>
              <Link
                className={`${styles.dropdownItem} ${isActive("/planes") ? styles.active : ""}`}
                href="/planes"
                onClick={closeMenu}
              >
                Planes
              </Link>
            </div>
          </div>

          {/* ✅ Usados | Multimarca */}
          <Link
            className={`${styles.navLink} ${isActive("/usados") ? styles.active : ""}`}
            href="/usados"
            aria-current={isActive("/usados") ? "page" : undefined}
            onClick={closeMenu}
          >
            Usados <span className={styles.navDivider}>|</span> Multimarca
          </Link>
          <Link
            className={`${styles.navLink} ${isActive("/postventa") ? styles.active : ""}`}
            href="/postventa"
            aria-current={isActive("/postventa") ? "page" : undefined}
            onClick={closeMenu}
          >
            Postventa
          </Link>
          <a
            className={styles.navLink}
            href="#contacto"
            onClick={handleScrollToFooter}
          >
            Contacto
          </a>
        </div>
      </div>
    </>
  );
};

export default Nav;

