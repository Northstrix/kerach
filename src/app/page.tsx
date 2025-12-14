"use client";
import { Controls } from "@/components/controls";
import { ShaderPreview } from "@/components/shader-preview";
import { usePersistentState } from "@/hooks/use-persistent-state";
import { defaultSettings, type ShaderSettings } from "@/lib/config";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Home() {
  const [settings, setSettings] = usePersistentState<ShaderSettings>(
    "shader-text-settings",
    defaultSettings
  );

  return (
    <div className="flex h-screen w-full flex-col lg:flex-row">
      <div className="relative flex h-1/2 w-full items-center justify-center bg-muted/20 lg:h-full lg:w-2/3">
        <ShaderPreview settings={settings} />
      </div>

      <ScrollArea className="h-1/2 w-full lg:h-full lg:w-1/3">
        <div className="p-6">
          <header className="mb-6">
            <a
              href="/"
              className="inline-flex items-center gap-[10px] text-4xl font-bold tracking-tighter text-foreground transition-colors duration-300 ease-in-out hover:text-[hsl(var(--accent))]"
            >
              <img
                src="/logo.webp"
                alt="Kerach logo"
                width={40}
                height={40}
                className="h-auto w-[40px]"
              />
              <span>Kerach</span>
            </a>
            <p className="text-muted-foreground">
              A Makeshift Text Shaderer
            </p>
          </header>

          <Controls settings={settings} setSettings={setSettings} />
        </div>
      </ScrollArea>
    </div>
  );
}
