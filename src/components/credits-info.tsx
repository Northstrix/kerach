"use client";

import { useState } from "react";
import { Info, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { KerachBadges } from "./KerachBadges";

const creditsMarkdown =
`[GradientGen](https://github.com/noegarsoux/GradientGen) by [noegarsoux](https://github.com/noegarsoux)

[Balatro Background Shaders](https://www.shadertoy.com/view/XXtBRr) by [xxidbr9](https://www.shadertoy.com/user/xxidbr9)

[Non liquid glass](https://codepen.io/lekzd/pen/dPGYjdj) by [Alexander Korotaev](https://codepen.io/lekzd)

[Floating voronoi lines](https://codepen.io/lekzd/pen/xbwMMzR) by [Alexander Korotaev](https://codepen.io/lekzd)

[Color Picker](https://21st.dev/community/components/uplusion23/color-picker/color-picker-with-swatches-and-onchange) by [Trevor McIntire](https://21st.dev/community/uplusion23)

[BUTTONS](https://codepen.io/uchihaclan/pen/NWOyRWy) by [TAYLOR](https://codepen.io/uchihaclan)

[react-color](https://github.com/uiwjs/react-color) by [uiw](https://github.com/uiwjs)

[Lucide React](https://www.npmjs.com/package/lucide-react)

[radix-ui](https://www.npmjs.com/package/radix-ui)
`;

function HighlightHover({ children, href, className }: { children: React.ReactNode, href?: string, className?: string }) {
  const baseClass = cn(
    "relative inline-block transition-colors duration-200",
    href ? "font-medium text-primary hover:text-accent hover:underline cursor-pointer no-underline" : "text-muted-foreground",
    className
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={baseClass}>
        {children}
        <span className="absolute bottom-0 left-0 h-[1px] w-0 bg-accent transition-all duration-300 group-hover:w-full" />
      </a>
    );
  }
  return <span className={baseClass}>{children}</span>;
}

function CreditHighlightHover({ children, href, className }: { children: React.ReactNode, href?: string, className?: string }) {
  const baseClass = cn(
    "relative inline-block px-0.5 transition-colors duration-200",
    href ? "font-medium text-primary hover:text-accent hover:underline cursor-pointer no-underline" : "text-muted-foreground",
    className
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={baseClass}>
        {children}
        <span className="absolute bottom-0 left-0 h-[1px] w-0 bg-accent transition-all duration-300 group-hover:w-full" />
      </a>
    );
  }
  return <span className={baseClass}>{children}</span>;
}

function renderEntry(entry: string) {
  const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(entry)) !== null) {
    if (match.index > lastIndex) {
      const text = entry.slice(lastIndex, match.index);
      if (text) parts.push(<CreditHighlightHover key={key++} className="">{text}</CreditHighlightHover>);
    }
    parts.push(<CreditHighlightHover key={key++} href={match[2]}>{match[1]}</CreditHighlightHover>);
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < entry.length) {
    parts.push(<CreditHighlightHover key={key++}>{entry.slice(lastIndex)}</CreditHighlightHover>);
  }

  return parts;
}

export function CreditsInfo() {
  const creditEntries = creditsMarkdown.trim().split(/\n/).map((e) => e.trim()).filter(Boolean);

  return (
    <AccordionItem value="info">
      <AccordionTrigger>
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4" /> Credit & Info
        </div>
      </AccordionTrigger>
      <AccordionContent className="space-y-4 pt-4 text-xs text-foreground pb-16">

        <div className="space-y-1">
          <span className="font-medium">The existence of this project wouldn't have been possible without the following:</span>
          <div className="space-y-0.5">
            {creditEntries.map((entry, i) => (
              <p key={i}>{renderEntry(entry)}</p>
            ))}
          </div>
        </div>

        <KerachBadges />

        {/* Made by inscription - BOTTOM, integrated as single flowing text */}
        <div className="mt-16 flex flex-col items-center">
          <div className="mb-2">
            <HighlightHover href="https://sourceforge.net/projects/kerach/">Source Code</HighlightHover>
          </div>
          <p className="text-center mx-4">
            Made by <HighlightHover href="https://maxim-bortnikov.netlify.app/">Maxim Bortnikov</HighlightHover> using <HighlightHover href="https://nextjs.org">Next.js</HighlightHover>, <HighlightHover href="https://www.perplexity.ai">Perplexity</HighlightHover>, <HighlightHover href="https://firebase.studio">Firebase Studio</HighlightHover>, and <HighlightHover href="https://aistudio.google.com">Google AI Studio</HighlightHover>.
          </p>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
