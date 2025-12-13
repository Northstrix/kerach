"use client";

import { useState } from "react";
import NamerUiBadge from "./namer-ui-badge";

// Helper to validate URLs safely
function sanitizeUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") return url;
    return null;
  } catch {
    return null;
  }
}

export function KerachBadges() {
  const [verifiedToolsLoaded, setVerifiedToolsLoaded] = useState(false);
  const [auraPlusPlusLoaded, setAuraPlusPlusLoaded] = useState(false);
  const [foundrLoaded, setFoundrLoaded] = useState(false);

  // Kerach-specific URLs
  const verifiedToolsLink = sanitizeUrl("https://www.verifiedtools.info");
  const verifiedToolsImg = "https://www.verifiedtools.info/badge.png";

  const auraPlusPlusLink = sanitizeUrl("https://auraplusplus.com/projects/kerach");
  const auraPlusPlusImg = "https://auraplusplus.com/images/badges/featured-on-light.svg";

  const foundrLink = sanitizeUrl("https://www.foundrlist.me/product/kerach");
  const foundrImg = "https://www.foundrlist.me/api/badge/kerach?style=featured";

  return (
    <div className="flex flex-col items-center gap-3 pt-4">
      {/* Namer UI Badge - Always visible */}
      <div className="w-full flex justify-center">
        <NamerUiBadge />
      </div>

      {/* Below badges stack */}
      <div className="flex flex-col items-center gap-2">
        {/* Verified Tools Badge */}
        <a
          href={verifiedToolsLoaded && verifiedToolsLink ? verifiedToolsLink : undefined}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            justifyContent: "center",
            alignItems: "center",
            textDecoration: "none",
            pointerEvents: verifiedToolsLoaded ? "auto" : "none",
          }}
        >
          <img
            src={verifiedToolsImg}
            alt={verifiedToolsLoaded ? "Verified on Verified Tools" : ""}
            loading="lazy"
            onLoad={() => setVerifiedToolsLoaded(true)}
            onError={() => setVerifiedToolsLoaded(false)}
            style={{
              opacity: verifiedToolsLoaded ? 1 : 0.01,
              height: verifiedToolsLoaded ? "81px" : "1px",
              width: "auto",
              objectFit: "contain",
              transition: "opacity 0.3s ease-out",
            }}
          />
        </a>

        {/* Aura++ Badge */}
        <a
          href={auraPlusPlusLoaded && auraPlusPlusLink ? auraPlusPlusLink : undefined}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            justifyContent: "center",
            alignItems: "center",
            textDecoration: "none",
            pointerEvents: auraPlusPlusLoaded ? "auto" : "none",
          }}
        >
          <img
            src={auraPlusPlusImg}
            alt={auraPlusPlusLoaded ? "Featured on Aura++" : ""}
            loading="lazy"
            onLoad={() => setAuraPlusPlusLoaded(true)}
            onError={() => setAuraPlusPlusLoaded(false)}
            style={{
              opacity: auraPlusPlusLoaded ? 1 : 0.01,
              height: auraPlusPlusLoaded ? "54px" : "1px",
              width: "auto",
              borderRadius: "12px",
              objectFit: "contain",
              transition: "opacity 0.3s ease-out",
            }}
          />
        </a>

        {/* Foundr Badge */}
        <a
          href={foundrLoaded && foundrLink ? foundrLink : undefined}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            justifyContent: "center",
            alignItems: "center",
            textDecoration: "none",
            pointerEvents: foundrLoaded ? "auto" : "none",
          }}
        >
          <img
            src={foundrImg}
            alt={foundrLoaded ? "Featured on Foundr" : ""}
            loading="lazy"
            onLoad={() => setFoundrLoaded(true)}
            onError={() => setFoundrLoaded(false)}
            style={{
              opacity: foundrLoaded ? 1 : 0.01,
              height: foundrLoaded ? "64px" : "1px",
              width: "auto",
              borderRadius: 6,
              objectFit: "contain",
              transition: "opacity 0.3s ease-out",
            }}
          />
        </a>
      </div>
    </div>
  );
}
