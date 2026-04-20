import { Suspense } from "react";
import PublicSiteChrome from "./PublicSiteChrome";
import loadingStyles from "../../app/loading.module.css";

function PageFallback() {
  return <div className={loadingStyles.container} aria-hidden />;
}

export default function PublicSiteLayout({ children }) {
  return (
    <PublicSiteChrome>
      <Suspense fallback={<PageFallback />}>{children}</Suspense>
    </PublicSiteChrome>
  );
}

