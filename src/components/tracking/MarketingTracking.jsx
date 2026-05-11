"use client";

import Script from "next/script";

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
      {pixelId ? (
        <noscript>
          <img
            height={1}
            width={1}
            style={{ display: "none" }}
            src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
            alt=""
          />
        </noscript>
      ) : null}

      {/* Contenedor Indiana */}
      {gtmId ? (
        <Script id="gtm-loader" strategy="afterInteractive">
          {gtmSnippet(gtmId)}
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
          {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${pixelId}');
fbq('track','PageView');`}
        </Script>
      ) : null}
    </>
  );
}
