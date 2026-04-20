"use client";

import { useState, useEffect, useCallback, useRef, useId } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Nav.module.css";
import { NavMenuContent } from "./NavMenuContent";
import { navStrings } from "./navStrings";
import { useMobileNavA11y } from "./useMobileNavA11y";

function useScrollLock(menuOpen) {
  useEffect(() => {
    if (!menuOpen) {
      document.body.classList.remove("menu-open");
      document.body.style.removeProperty("top");
      return undefined;
    }

    const scrollY = window.scrollY ?? window.pageYOffset;
    document.body.classList.add("menu-open");
    document.body.style.setProperty("top", `-${scrollY}px`);

    return () => {
      document.body.classList.remove("menu-open");
      document.body.style.removeProperty("top");
      window.scrollTo(0, scrollY);
    };
  }, [menuOpen]);
}

function useCloseOnEscape(menuOpen, onClose) {
  useEffect(() => {
    if (!menuOpen) return undefined;

    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen, onClose]);
}

export default function Nav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const menuButtonRef = useRef(null);
  const mobilePanelRef = useRef(null);

  const reactId = useId();
  const idSafe = reactId.replace(/:/g, "");
  const mobilePanelId = `${idSafe}-mobile-panel`;
  const dropdownIdDesktop = `${idSafe}-dropdown-desktop`;
  const dropdownIdMobile = `${idSafe}-dropdown-mobile`;

  const closeAll = useCallback(() => {
    setMenuOpen(false);
    setDropdownOpen(false);
  }, []);

  const toggleMenu = useCallback(() => {
    setMenuOpen((v) => !v);
  }, []);

  const toggleDropdown = useCallback((e) => {
    e.preventDefault();
    setDropdownOpen((v) => !v);
  }, []);

  const openDropdownHover = useCallback(() => {
    setDropdownOpen(true);
  }, []);

  const closeDropdownHover = useCallback(() => {
    setDropdownOpen(false);
  }, []);

  const goToContact = useCallback(
    (event) => {
      event.preventDefault();
      const footerEl = document.getElementById("contacto");
      if (footerEl) {
        footerEl.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      closeAll();
    },
    [closeAll],
  );

  useScrollLock(menuOpen);
  useCloseOnEscape(menuOpen, closeAll);
  useMobileNavA11y(menuOpen, mobilePanelRef, menuButtonRef);

  const dropdownProps = {
    isOpen: dropdownOpen,
    toggle: toggleDropdown,
    onMouseEnter: openDropdownHover,
    onMouseLeave: closeDropdownHover,
  };

  return (
    <>
      {menuOpen && (
        <div
          className={styles.backdrop}
          onClick={closeAll}
          aria-hidden="true"
        />
      )}

      <nav
        className={`${styles.navbar} ${menuOpen ? styles.navbarMenuOpen : ""}`}
        aria-label={navStrings.primaryNav}
      >
        <div className={styles.navbarInner}>
          <div className={styles.container}>
            <Link className={styles.brand} href="/" onClick={closeAll}>
              <img
                src="/assets/logos/logos-indiana/indiana-final.webp"
                alt="Indiana Peugeot — inicio"
                className={styles.logo}
                width={200}
                height={80}
                decoding="async"
              />
            </Link>

            <button
              ref={menuButtonRef}
              type="button"
              className={styles.mobileMenu}
              onClick={toggleMenu}
              aria-label={menuOpen ? navStrings.closeMenu : navStrings.openMenu}
              aria-expanded={menuOpen}
              aria-controls={mobilePanelId}
            >
              <span className={styles.hamburger} aria-hidden="true">
                <span className={styles.line} />
                <span className={styles.line} />
                <span className={styles.line} />
              </span>
            </button>

            <div className={`${styles.nav} ${styles.navDesktop}`}>
              <div className={styles.navList}>
                <NavMenuContent
                  styles={styles}
                  pathname={pathname}
                  onNavigate={closeAll}
                  onContactClick={goToContact}
                  dropdownMenuId={dropdownIdDesktop}
                  dropdown={dropdownProps}
                />
              </div>
            </div>
          </div>
        </div>

        <div
          ref={mobilePanelRef}
          id={mobilePanelId}
          className={`${styles.nav} ${styles.navMobile} ${menuOpen ? styles.open : ""}`}
          aria-label={navStrings.mobileMenuRegion}
          aria-hidden={!menuOpen}
          inert={!menuOpen}
          tabIndex={-1}
        >
          <div className={styles.navList}>
            <NavMenuContent
              styles={styles}
              pathname={pathname}
              onNavigate={closeAll}
              onContactClick={goToContact}
              dropdownMenuId={dropdownIdMobile}
              dropdown={dropdownProps}
            />
          </div>
        </div>
      </nav>
    </>
  );
}
