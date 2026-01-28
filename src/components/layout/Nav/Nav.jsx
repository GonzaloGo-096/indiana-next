"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Nav.module.css";

const Nav = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [is0kmDropdownOpen, setIs0kmDropdownOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (path) => pathname === path;

  const toggleMenu = useCallback(() => {
    setIsMenuOpen((prev) => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
    setIs0kmDropdownOpen(false);
  }, []);

  const handleBackdropClick = useCallback(() => {
    closeMenu();
  }, [closeMenu]);

  /* Scroll-lock: body.menu-open (globals.css) bloquea scroll; preservar/restaurar scrollY evita saltos */
  useEffect(() => {
    if (isMenuOpen) {
      const scrollY = typeof window !== "undefined" ? window.scrollY ?? window.pageYOffset : 0;
      document.body.classList.add("menu-open");
      document.body.style.setProperty("top", `-${scrollY}px`);

      return () => {
        document.body.classList.remove("menu-open");
        document.body.style.removeProperty("top");
        if (typeof window !== "undefined") {
          window.scrollTo(0, scrollY);
        }
      };
    }

    document.body.classList.remove("menu-open");
    document.body.style.removeProperty("top");
    return undefined;
  }, [isMenuOpen]);

  /* Cerrar menú con tecla Escape */
  useEffect(() => {
    if (!isMenuOpen) return;

    const handleEscape = (e) => {
      if (e.key === "Escape") closeMenu();
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isMenuOpen, closeMenu]);

  const toggle0kmDropdown = useCallback((e) => {
    e.preventDefault();
    setIs0kmDropdownOpen((prev) => !prev);
  }, []);

  const handle0kmMouseEnter = useCallback(() => {
    setIs0kmDropdownOpen(true);
  }, []);

  const handle0kmMouseLeave = useCallback(() => {
    setIs0kmDropdownOpen(false);
  }, []);

  const handleScrollToFooter = useCallback((event) => {
    event.preventDefault();
    const footerEl = document.getElementById("contacto");
    if (footerEl) {
      footerEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    closeMenu();
  }, [closeMenu]);

  return (
    <>
      {isMenuOpen && (
        <div
          className={styles.backdrop}
          onClick={handleBackdropClick}
          aria-hidden="true"
        />
      )}

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

