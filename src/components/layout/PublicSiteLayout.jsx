import { Suspense } from "react";
import Nav from "./Nav";
import FooterLazy from "./Footer/FooterLazy";
import ClientOnlyComponents from "./ClientOnlyComponents";
import MarketingTracking from "../tracking/MarketingTracking";
import loadingStyles from "../../app/loading.module.css";

function PageFallback() {
  return <div className={loadingStyles.container} aria-hidden />;
}

export default function PublicSiteLayout({ children }) {
  return (
    <>
      <MarketingTracking />
      <ClientOnlyComponents />
      <Nav />
      <main className="main-content">
        <Suspense fallback={<PageFallback />}>{children}</Suspense>
      </main>
      <FooterLazy />
    </>
  );
}

