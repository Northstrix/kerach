"use client";

import { type Dispatch, type SetStateAction, useState } from "react";
import {
  Image,
  SlidersHorizontal,
  Type,
  Wind,
  Play,
  Pause,
  Sparkles,
  Palette,
} from "lucide-react";
import type { ShaderSettings } from "@/lib/config";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import HalomotButton from "./halomot-button";
import { ColorPicker } from '@/components/color-picker';
import { hsvaToRgba, rgbaToHsva } from '@uiw/color-convert';
import { Download, Upload } from "lucide-react";
import { CreditsInfo } from "./credits-info";
import { cn } from '@/lib/utils';

interface ControlsProps {
  settings: ShaderSettings;
  setSettings: Dispatch<SetStateAction<ShaderSettings>>;
}

const FONT_OPTIONS = [
  "Inter", "Roboto", "Open Sans", "Lato", "Montserrat", "Oswald",
  "Raleway", "Nunito", "Merriweather", "Poppins", "Playfair Display",
  "Ubuntu", "Roboto Mono", "Rubik", "Mukta", "Kanit", "PT Sans",
  "Work Sans", "Quicksand", "Fira Sans", "Alef"
];

// --- HELPER FUNCTIONS ---

// Convert [0-1, 0-1, 0-1] array to Hex String #RRGGBB for input[type=color]
const rgbToHex = (rgb: [number, number, number]) => {
  const toHex = (c: number) => {
    const hex = Math.round(c * 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };
  return "#" + toHex(rgb[0]) + toHex(rgb[1]) + toHex(rgb[2]);
};

// Convert Hex String from input[type=color] to [0-1, 0-1, 0-1]
const hexToRgb = (hex: string): [number, number, number] => {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return [r, g, b];
};

export function Controls({ settings, setSettings }: ControlsProps) {
  const [tab, setTab] = useState<'export' | 'import'>('export');
  const [jsonInput, setJsonInput] = useState('');

  // General Handler for top-level primitives
  const handleSliderChange = (key: keyof ShaderSettings) => (value: number[]) => {
    setSettings((prev) => ({ ...prev, [key]: value[0] }));
  };

  const toggleAnimation = () => {
    setSettings((prev) => ({ ...prev, isFrozen: !prev.isFrozen }));
  };

  // Handler for nested shader configs (Melt, Balatro, Glass)
  const updateNested = <K extends keyof ShaderSettings>(
    category: 'melt' | 'balatro' | 'glass' | 'flow' | 'chargedCells',
    key: string,
    value: any
  ) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const handleImport = () => {
    try {
      const importedSettings = JSON.parse(jsonInput);
      setSettings(importedSettings);
      setJsonInput('');
    } catch (error) {
      alert("Invalid JSON format");
    }
  };

  return (
    <Accordion type="multiple" defaultValue={["text", "appearance", "shader", "effects", "animation", "config"]} className="w-full">
      {/* 1. TEXT */}
      <AccordionItem value="text">
        <AccordionTrigger>
          <div className="flex items-center gap-2">
            <Type className="h-4 w-4" /> Text
          </div>
        </AccordionTrigger>
        <AccordionContent className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Content</Label>
            <Textarea
              value={settings.text}
              onChange={(e) => setSettings((prev) => ({ ...prev, text: e.target.value }))}
              className="h-24 font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label>Font Family</Label>
            <select
              value={settings.fontFamily || ""}
              onChange={(e) => setSettings((prev) => ({ ...prev, fontFamily: e.target.value }))}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {FONT_OPTIONS.map((font) => (
                <option key={font} value={font}>
                  {font}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-3">
            <Label>Font Size: {settings.fontSize}px</Label>
            {/* UPDATED: MAX 320 */}
            <Slider value={[settings.fontSize]} onValueChange={handleSliderChange("fontSize")} min={4} max={1000} step={1} />
          </div>
          <div className="space-y-3">
            <Label>Font Weight: {settings.fontWeight}</Label>
            <Slider value={[settings.fontWeight]} onValueChange={handleSliderChange("fontWeight")} min={100} max={900} step={100} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label>Offset X: {settings.textTranslateX}px</Label>
              <Slider
                value={[settings.textTranslateX]}
                onValueChange={handleSliderChange("textTranslateX")}
                min={-200}
                max={200}
                step={1}
              />
            </div>
            <div className="space-y-3">
              <Label>Offset Y: {settings.textTranslateY}px</Label>
              <Slider
                value={[settings.textTranslateY]}
                onValueChange={handleSliderChange("textTranslateY")}
                min={-200}
                max={200}
                step={1}
              />
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* 2. APPEARANCE */}
      <AccordionItem value="appearance">
        <AccordionTrigger>
          <div className="flex items-center gap-2">
            <Image className="h-4 w-4" /> Appearance
          </div>
        </AccordionTrigger>
        <AccordionContent className="space-y-6 pt-4">
          <div className="space-y-3">
            <Label className="text-primary font-semibold">Active Shader</Label>
            <Select
              value={settings.activeShader}
              onValueChange={(val: any) => setSettings(prev => ({ ...prev, activeShader: val }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="melt">Melt</SelectItem>
                <SelectItem value="flow">Flow</SelectItem>
                <SelectItem value="balatro">Balatro</SelectItem>
                <SelectItem value="glass">Psychedelic Glass</SelectItem>
                <SelectItem value="charged-cells">Charged Cells</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* 3. SHADER ADJUSTMENTS (Dynamic) */}
      <AccordionItem value="shader">
        <AccordionTrigger>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4" /> Shader Settings
          </div>
        </AccordionTrigger>
        <AccordionContent className="space-y-6 pt-4">

          {/* MELT SHADER CONTROLS */}
          {settings.activeShader === 'melt' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-left-2">
              <div className="space-y-3">
                <Label>Hue Shift: {settings.melt.hue}°</Label>
                <Slider value={[settings.melt.hue]} onValueChange={(v) => updateNested('melt', 'hue', v[0])} min={0} max={360} step={1} />
              </div>
              <div className="space-y-3">
                <Label>Saturation: {settings.melt.saturation.toFixed(2)}</Label>
                <Slider value={[settings.melt.saturation]} onValueChange={(v) => updateNested('melt', 'saturation', v[0])} min={0} max={2} step={0.05} />
              </div>
              <div className="space-y-3">
                <Label>Contrast: {settings.melt.contrast.toFixed(2)}</Label>
                <Slider value={[settings.melt.contrast]} onValueChange={(v) => updateNested('melt', 'contrast', v[0])} min={0} max={3} step={0.1} />
              </div>
              <div className="space-y-3">
                <Label>Zoom: {settings.melt.zoom.toFixed(2)}</Label>
                <Slider value={[settings.melt.zoom]} onValueChange={(v) => updateNested('melt', 'zoom', v[0])} min={0.1} max={32} step={0.1} />
              </div>
              <div className="space-y-3">
                <Label>Speed: {settings.melt.speed.toFixed(2)}</Label>
                <Slider value={[settings.melt.speed]} onValueChange={(v) => updateNested('melt', 'speed', v[0])} min={0} max={2} step={0.05} />
              </div>
              <div className="space-y-3">
                <Label>Detail: {settings.melt.detail.toFixed(2)}</Label>
                <Slider value={[settings.melt.detail]} onValueChange={(v) => updateNested('melt', 'detail', v[0])} min={0} max={1} step={0.05} />
              </div>
            </div>
          )}

          {/* FLOW SHADER CONTROLS */}
          {settings.activeShader === 'flow' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-left-2">
              <div className="space-y-3">
                <Label>Speed: {settings.flow.speed.toFixed(2)}</Label>
                <Slider value={[settings.flow.speed]} onValueChange={(v) => updateNested('flow', 'speed', v[0])} min={0} max={200} step={0.1} />
              </div>
              <div className="space-y-3">
                <Label>Velocity: {settings.flow.velocity.toFixed(2)}</Label>
                <Slider value={[settings.flow.velocity]} onValueChange={(v) => updateNested('flow', 'velocity', v[0])} min={0} max={10} step={0.01} />
              </div>
              <div className="space-y-3">
                <Label>Detail: {settings.flow.detail.toFixed(0)}</Label>
                <Slider value={[settings.flow.detail]} onValueChange={(v) => updateNested('flow', 'detail', v[0])} min={10} max={500} step={1} />
              </div>
              <div className="space-y-3">
                <Label>Twist: {settings.flow.twist.toFixed(1)}</Label>
                <Slider value={[settings.flow.twist]} onValueChange={(v) => updateNested('flow', 'twist', v[0])} min={-100} max={100} step={1} />
              </div>
              <div className="space-y-3">
                <Label>Contrast: {settings.flow.contrast.toFixed(2)}</Label>
                <Slider value={[settings.flow.contrast]} onValueChange={(v) => updateNested('flow', 'contrast', v[0])} min={0} max={3} step={0.1} />
              </div>
              
              {/* UPDATED: Flow Shader Color Picker Layout */}
              <div className="flex flex-wrap gap-4">
                 <div className="flex-1 min-w-[300px] space-y-2">
                    <Label className="flex items-center gap-2">
                      <Palette className="w-3 h-3" /> Tint Color
                    </Label>
                    <ColorPicker
                      // 1. READ: Combine rgbR, rgbG, rgbB into a single HSVA object for the picker
                      value={rgbaToHsva({
                        r: settings.flow.rgbR * 255,
                        g: settings.flow.rgbG * 255,
                        b: settings.flow.rgbB * 255,
                        a: 1
                      })}
                      // 2. WRITE: Split the picker result back into rgbR, rgbG, rgbB
                      onValueChange={(hsva) => {
                        const rgba = hsvaToRgba(hsva);
                        setSettings((prev) => ({
                          ...prev,
                          flow: {
                            ...prev.flow,
                            rgbR: rgba.r / 255,
                            rgbG: rgba.g / 255,
                            rgbB: rgba.b / 255,
                          },
                        }));
                      }}
                      hideDefaultSwatches
                      hideContrastRatio
                      className="w-full max-w-none"
                    />
                 </div>
              </div>

              <div className="space-y-3">
                <Label>Color Offset: {settings.flow.colorOffset.toFixed(2)}</Label>
                <Slider value={[settings.flow.colorOffset]} onValueChange={(v) => updateNested('flow', 'colorOffset', v[0])} min={-1} max={1} step={0.05} />
              </div>
              <div className="space-y-3">
                <Label>Hue: {settings.flow.hue}°</Label>
                <Slider value={[settings.flow.hue]} onValueChange={(v) => updateNested('flow', 'hue', v[0])} min={0} max={360} step={1} />
              </div>
              <div className="space-y-3">
                <Label>Saturation: {settings.flow.saturation.toFixed(2)}</Label>
                <Slider value={[settings.flow.saturation]} onValueChange={(v) => updateNested('flow', 'saturation', v[0])} min={0} max={2} step={0.05} />
              </div>
            </div>
          )}

          {/* BALATRO SHADER CONTROLS */}
          {settings.activeShader === 'balatro' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-left-2">
              {/* Native Color Inputs */}
              <div className="space-y-6">
                <Label className="flex items-center gap-2">
                  <Palette className="w-3 h-3" /> Shader Colors
                </Label>
                {/* UPDATED: Flex layout with min-width 300px for shared wrapping */}
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-[300px]">
                    <Label className="text-xs uppercase mb-2 block text-muted-foreground">Color 1</Label>
                    <ColorPicker
                      value={rgbaToHsva({
                        r: settings.balatro.color1[0] * 255,
                        g: settings.balatro.color1[1] * 255,
                        b: settings.balatro.color1[2] * 255,
                        a: 1
                      })}
                      onValueChange={(hsva) => {
                        const rgba = hsvaToRgba(hsva);
                        updateNested('balatro', 'color1', [
                          rgba.r / 255,
                          rgba.g / 255,
                          rgba.b / 255
                        ]);
                      }}
                      hideDefaultSwatches
                      hideContrastRatio
                      className="w-full max-w-none"
                    />
                  </div>
                  <div className="flex-1 min-w-[300px]">
                    <Label className="text-xs uppercase mb-2 block text-muted-foreground">Color 2</Label>
                    <ColorPicker
                      value={rgbaToHsva({
                        r: settings.balatro.color2[0] * 255,
                        g: settings.balatro.color2[1] * 255,
                        b: settings.balatro.color2[2] * 255,
                        a: 1
                      })}
                      onValueChange={(hsva) => {
                        const rgba = hsvaToRgba(hsva);
                        updateNested('balatro', 'color2', [
                          rgba.r / 255,
                          rgba.g / 255,
                          rgba.b / 255
                        ]);
                      }}
                      hideDefaultSwatches
                      hideContrastRatio
                      className="w-full max-w-none"
                    />
                  </div>
                  <div className="flex-1 min-w-[300px]">
                    <Label className="text-xs uppercase mb-2 block text-muted-foreground">Color 3</Label>
                    <ColorPicker
                      value={rgbaToHsva({
                        r: settings.balatro.color3[0] * 255,
                        g: settings.balatro.color3[1] * 255,
                        b: settings.balatro.color3[2] * 255,
                        a: 1
                      })}
                      onValueChange={(hsva) => {
                        const rgba = hsvaToRgba(hsva);
                        updateNested('balatro', 'color3', [
                          rgba.r / 255,
                          rgba.g / 255,
                          rgba.b / 255
                        ]);
                      }}
                      hideDefaultSwatches
                      hideContrastRatio
                      className="w-full max-w-none"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <Label>Contrast: {settings.balatro.contrast.toFixed(2)}</Label>
                <Slider value={[settings.balatro.contrast]} onValueChange={(v) => updateNested('balatro', 'contrast', v[0])} min={0} max={5} step={0.1} />
              </div>
              <div className="space-y-3">
                <Label>Lighting: {settings.balatro.lighting.toFixed(2)}</Label>
                <Slider value={[settings.balatro.lighting]} onValueChange={(v) => updateNested('balatro', 'lighting', v[0])} min={0} max={1} step={0.05} />
              </div>
              <div className="space-y-3">
                <Label>Spin Amount: {settings.balatro.spinAmount.toFixed(2)}</Label>
                <Slider value={[settings.balatro.spinAmount]} onValueChange={(v) => updateNested('balatro', 'spinAmount', v[0])} min={-2} max={2} step={0.05} />
              </div>
              <div className="space-y-3">
                <Label>Pixel Filter (Res): {settings.balatro.pixelFilter.toFixed(0)}</Label>
                <Slider value={[settings.balatro.pixelFilter]} onValueChange={(v) => updateNested('balatro', 'pixelFilter', v[0])} min={100} max={2000} step={10} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Rotate Whole View</Label>
                <Switch
                  checked={settings.balatro.isRotate}
                  onCheckedChange={(c) => updateNested('balatro', 'isRotate', c)}
                />
              </div>
            </div>
          )}

          {/* GLASS SHADER CONTROLS */}
          {settings.activeShader === 'glass' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-left-2">
              <div className="space-y-3">
                <Label>Speed: {settings.glass.speed.toFixed(2)}</Label>
                <Slider value={[settings.glass.speed]} onValueChange={(v) => updateNested('glass', 'speed', v[0])} min={0} max={3} step={0.1} />
              </div>
              <div className="space-y-3">
                <Label>Sides: {settings.glass.sides.toFixed(0)}</Label>
                <Slider value={[settings.glass.sides]} onValueChange={(v) => updateNested('glass', 'sides', v[0])} min={3} max={64} step={1} />
              </div>
              <div className="space-y-3">
                <Label>Hue Shift: {settings.glass.hue.toFixed(0)}</Label>
                <Slider value={[settings.glass.hue]} onValueChange={(v) => updateNested('glass', 'hue', v[0])} min={0} max={360} step={1} />
              </div>
              <div className="space-y-3">
                <Label>Density: {settings.glass.density.toFixed(1)}</Label>
                <Slider value={[settings.glass.density]} onValueChange={(v) => updateNested('glass', 'density', v[0])} min={5} max={50} step={1} />
              </div>
              <div className="space-y-3">
                <Label>Glow: {settings.glass.glow.toFixed(2)}</Label>
                <Slider value={[settings.glass.glow]} onValueChange={(v) => updateNested('glass', 'glow', v[0])} min={0.5} max={3} step={0.1} />
              </div>
            </div>
          )}

          {/* CHARGED CELLS SHADER CONTROLS */}
          {settings.activeShader === 'charged-cells' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-left-2">
              <div className="space-y-6">
                <Label className="flex items-center gap-2">
                  <Palette className="w-3 h-3" /> Cell Colors
                </Label>
                {/* UPDATED: Flex layout with min-width 300px for shared wrapping */}
                <div className="flex flex-wrap gap-4">
                  {/* Color 1 */}
                  <div className="flex-1 min-w-[300px]">
                    <Label className="text-xs uppercase mb-2 block text-muted-foreground">Color 1</Label>
                    <ColorPicker
                      value={rgbaToHsva({
                        r: settings.chargedCells.color1[0] * 255,
                        g: settings.chargedCells.color1[1] * 255,
                        b: settings.chargedCells.color1[2] * 255,
                        a: 1
                      })}
                      onValueChange={(hsva) => {
                        const rgba = hsvaToRgba(hsva);
                        updateNested('chargedCells', 'color1', [
                          rgba.r / 255,
                          rgba.g / 255,
                          rgba.b / 255
                        ]);
                      }}
                      hideDefaultSwatches
                      hideContrastRatio
                      className="w-full max-w-none"
                    />
                  </div>
                  {/* Color 2 */}
                  <div className="flex-1 min-w-[300px]">
                    <Label className="text-xs uppercase mb-2 block text-muted-foreground">Color 2</Label>
                    <ColorPicker
                      value={rgbaToHsva({
                        r: settings.chargedCells.color2[0] * 255,
                        g: settings.chargedCells.color2[1] * 255,
                        b: settings.chargedCells.color2[2] * 255,
                        a: 1
                      })}
                      onValueChange={(hsva) => {
                        const rgba = hsvaToRgba(hsva);
                        updateNested('chargedCells', 'color2', [
                          rgba.r / 255,
                          rgba.g / 255,
                          rgba.b / 255
                        ]);
                      }}
                      hideDefaultSwatches
                      hideContrastRatio
                      className="w-full max-w-none"
                    />
                  </div>
                  {/* Color 3 */}
                  <div className="flex-1 min-w-[300px]">
                    <Label className="text-xs uppercase mb-2 block text-muted-foreground">Color 3</Label>
                    <ColorPicker
                      value={rgbaToHsva({
                        r: settings.chargedCells.color3[0] * 255,
                        g: settings.chargedCells.color3[1] * 255,
                        b: settings.chargedCells.color3[2] * 255,
                        a: 1
                      })}
                      onValueChange={(hsva) => {
                        const rgba = hsvaToRgba(hsva);
                        updateNested('chargedCells', 'color3', [
                          rgba.r / 255,
                          rgba.g / 255,
                          rgba.b / 255
                        ]);
                      }}
                      hideDefaultSwatches
                      hideContrastRatio
                      className="w-full max-w-none"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <Label>Speed: {settings.chargedCells.speed.toFixed(2)}</Label>
                <Slider value={[settings.chargedCells.speed]} onValueChange={(v) => updateNested('chargedCells', 'speed', v[0])} min={0} max={5} step={0.1} />
              </div>
              <div className="space-y-3">
                <Label>Scale: {settings.chargedCells.scale.toFixed(1)}</Label>
                <Slider value={[settings.chargedCells.scale]} onValueChange={(v) => updateNested('chargedCells', 'scale', v[0])} min={0} max={100} step={0.1} />
              </div>
              <div className="space-y-3">
                <Label>Hue: {settings.chargedCells.hue}°</Label>
                <Slider value={[settings.chargedCells.hue]} onValueChange={(v) => updateNested('chargedCells', 'hue', v[0])} min={0} max={360} step={1} />
              </div>
              <div className="space-y-3">
                <Label>Saturation: {settings.chargedCells.saturation.toFixed(2)}</Label>
                <Slider value={[settings.chargedCells.saturation]} onValueChange={(v) => updateNested('chargedCells', 'saturation', v[0])} min={0} max={2} step={0.05} />
              </div>
            </div>
          )}

        </AccordionContent>
      </AccordionItem>

      {/* 4. EFFECTS */}
      <AccordionItem value="effects">
        <AccordionTrigger>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" /> Post-Effects
          </div>
        </AccordionTrigger>
        <AccordionContent className="space-y-6 pt-4">
          {/* Blur */}
          <div className="space-y-3">
            <Label>Blur Type</Label>
            <Select
              value={settings.blurType}
              onValueChange={(val: any) =>
                setSettings((prev) => ({ ...prev, blurType: val }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="gaussian">Gaussian</SelectItem>
                <SelectItem value="motion">Motion</SelectItem>
                <SelectItem value="zoom">Zoom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {settings.blurType !== "none" && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
              <div className="space-y-2">
                <Label>Blur Strength: {settings.blurStrength.toFixed(2)}</Label>
                <Slider
                  value={[settings.blurStrength]}
                  onValueChange={(v) =>
                    setSettings((prev) => ({
                      ...prev,
                      blurStrength: v[0],
                    }))
                  }
                  min={0}
                  max={50}
                  step={0.01}
                />
              </div>
              {settings.blurType === "motion" && (
                <div className="space-y-2">
                  <Label>Blur Angle: {settings.blurAngle.toFixed(0)}°</Label>
                  <Slider
                    value={[settings.blurAngle]}
                    onValueChange={(v) =>
                      setSettings((prev) => ({
                        ...prev,
                        blurAngle: v[0],
                      }))
                    }
                    min={0}
                    max={360}
                    step={1}
                  />
                </div>
              )}
            </div>
          )}

          {/* Noise */}
          <div className="space-y-3 pt-2 border-t border-border">
            <Label>Noise Type</Label>
            <Select
              value={settings.noiseType}
              onValueChange={(val: any) =>
                setSettings((prev) => ({ ...prev, noiseType: val }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="grain">Film Grain</SelectItem>
                <SelectItem value="static">Static</SelectItem>
                <SelectItem value="scanline">Scanlines</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {settings.noiseType !== "none" && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
              <Label>Noise Strength: {settings.noiseStrength.toFixed(2)}</Label>
              <Slider
                value={[settings.noiseStrength]}
                onValueChange={(v) =>
                  setSettings((prev) => ({
                    ...prev,
                    noiseStrength: v[0],
                  }))
                }
                min={0}
                max={1}
                step={0.02}
              />
            </div>
          )}
        </AccordionContent>
      </AccordionItem>

      {/* 5. ANIMATION */}
      <AccordionItem value="animation">
        <AccordionTrigger>
          <div className="flex items-center gap-2">
            <Wind className="h-4 w-4" /> Animation
          </div>
        </AccordionTrigger>
        <AccordionContent className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {settings.isFrozen ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              <span className="text-sm font-medium">
                {settings.isFrozen ? "Paused" : "Playing"}
              </span>
            </div>
            <HalomotButton
              onClick={toggleAnimation}
              inscription={settings.isFrozen ? "Resume" : "Pause"}
              icon={settings.isFrozen ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
            />
          </div>

          {settings.isFrozen && (
            <div className="space-y-2">
              <Label>Manual Time: {settings.manualTime.toFixed(2)}s</Label>
              <Slider
                value={[settings.manualTime]}
                onValueChange={(v) =>
                  setSettings((prev) => ({
                    ...prev,
                    manualTime: v[0],
                  }))
                }
                min={0}
                max={120}
                step={0.1}
              />
            </div>
          )}
        </AccordionContent>
      </AccordionItem>

      {/* 6. CONFIG IMPORT/EXPORT */}
      <AccordionItem value="config">
        <AccordionTrigger>
          <div className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Config
          </div>
        </AccordionTrigger>
        <AccordionContent className="space-y-4 pt-4">
          {/* Tabs */}
          <div className="flex border-b border-border">
            <button
              className={cn(
                "px-4 py-2 text-sm font-medium -mb-px border-b-2 transition-colors",
                tab === 'export'
                  ? "border-primary text-primary"
                  : "border-transparent hover:text-foreground/80 text-muted-foreground"
              )}
              onClick={() => setTab('export')}
            >
              Export
            </button>
            <button
              className={cn(
                "px-4 py-2 text-sm font-medium -mb-px border-b-2 transition-colors",
                tab === 'import'
                  ? "border-primary text-primary"
                  : "border-transparent hover:text-foreground/80 text-muted-foreground"
              )}
              onClick={() => setTab('import')}
            >
              Import
            </button>
          </div>

          {/* Export Tab */}
          {tab === 'export' && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Click the "Export Config" button to get the latest configuration</Label>
              <Textarea
                value={jsonInput}
                readOnly
                className="h-64 font-mono text-xs bg-muted/50 resize-none"
              />
              <HalomotButton
                inscription="Export Config"
                icon={<Download className="h-3 w-3" />}
                onClick={() => {
                  const currentConfig = JSON.stringify(settings, null, 2);
                  setJsonInput(currentConfig); // Just fill textarea with current settings
                }}
                fillWidth
              />
            </div>
          )}

          {/* Import Tab */}
          {tab === 'import' && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Paste config JSON</Label>
              <Textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder="Paste your JSON config here..."
                className="h-64 font-mono text-xs resize-none"
                spellCheck={false}
              />
              <HalomotButton
                inscription="Import Config"
                icon={<Upload className="h-3 w-3" />}
                onClick={handleImport}
                fillWidth
              />
            </div>
          )}
        </AccordionContent>
      </AccordionItem>

      {/* 7. CREDITS & INFO */}
      <CreditsInfo />
    </Accordion>
  );
}