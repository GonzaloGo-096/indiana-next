"use client";

import Script from "next/script";
import { buildIndianaGtmSnippet } from "@/lib/analytics/gtmLoader";
import { buildMetaPixelSnippet } from "@/lib/analytics/metaPixel";

function getGtmId() {
  return process.env.NEXT_PUBLIC_GTM_ID?.trim() ?? "";
}

function getGtmMarketingId() {
  return process.env.NEXT_PUBLIC_GTM_MARKETING_ID?.trim() ?? "";
}

function getMetaPixelId() {
  return process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() ?? "";
}

function gtmSnippet(id) {
  return `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${id}');`;
}

/**
 * GTM (Indiana + agencia de marketing) + Meta Pixel.
 * Cada contenedor GTM carga de forma independiente con su propio id de Script.
 * IDs desde NEXT_PUBLIC_* (ver .env.example).
 */
export default function MarketingTracking() {
  const gtmId = getGtmId();
  const gtmMarketingId = getGtmMarketingId();
  const pixelId = getMetaPixelId();

  if (!gtmId && !gtmMarketingId && !pixelId) {
    return null;
  }

  return (
    <>
      {/* noscript fallbacks */}
      {gtmId ? (
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
            height={0}
            width={0}
            style={{ display: "none", visibility: "hidden" }}
            title="Google Tag Manager"
          />
        </noscript>
      ) : null}
      {gtmMarketingId ? (
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${gtmMarketingId}`}
            height={0}
            width={0}
            style={{ display: "none", visibility: "hidden" }}
            title="Google Tag Manager – Marketing"
          />
        </noscript>
      ) : null}
      {/* Sin <noscript> del Pixel: sin JavaScript no hay banner, y avisaba a Meta
          sin consentimiento. */}

      {/* Contenedor Indiana: solo en producción, o en pruebas pedidas a propósito (gtmLoader.js) */}
      {gtmId ? (
        <Script id="gtm-loader" strategy="afterInteractive">
          {buildIndianaGtmSnippet(gtmId, {
            allowNonProduction: process.env.NEXT_PUBLIC_ANALYTICS_TEST === "true",
          })}
        </Script>
      ) : null}

      {/* Contenedor agencia de marketing */}
      {gtmMarketingId ? (
        <Script id="gtm-loader-marketing" strategy="afterInteractive">
          {gtmSnippet(gtmMarketingId)}
        </Script>
      ) : null}

      {pixelId ? (
        <Script id="meta-pixel" strategy="afterInteractive">
          {buildMetaPixelSnippet(pixelId)}
        </Script>
      ) : null}
    </>
  );
}
