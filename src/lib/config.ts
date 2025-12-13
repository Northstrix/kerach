export interface MeltConfig {
  hue: number;
  saturation: number;
  zoom: number;
  speed: number;
  detail: number;
  contrast: number;
}

export interface FlowConfig {
  velocity: number;
  detail: number;
  twist: number;
  speed: number;
  contrast: number;
  rgbR: number;
  rgbG: number;
  rgbB: number;
  colorOffset: number;
  hue: number;
  saturation: number;
}

export interface BalatroConfig {
  speed: number;
  spinRotation: number;
  spinSpeed: number;
  contrast: number;
  lighting: number;
  spinAmount: number;
  pixelFilter: number;
  spinEase: number;
  isRotate: boolean;
  color1: [number, number, number];
  color2: [number, number, number];
  color3: [number, number, number];
}

export interface GlassConfig {
  speed: number;
  sides: number;
  hue: number;
  saturation: number;
  contrast: number;
  density: number;
  glow: number;
}

export interface ChargedCellsConfig {
  speed: number;
  scale: number;
  hue: number;
  saturation: number;
  color1: [number, number, number];
  color2: [number, number, number];
  color3: [number, number, number];
}

export interface ShaderSettings {
  // Text
  text: string;
  fontSize: number;
  fontWeight: number;
  fontFamily: string;
  textTranslateX: number; // New
  textTranslateY: number; // New

  // Shader Selection
  activeShader: 'melt' | 'balatro' | 'glass' | 'flow' | 'charged-cells';

  // Specific Shader Configs
  melt: MeltConfig;
  flow: FlowConfig;
  balatro: BalatroConfig;
  glass: GlassConfig;
  chargedCells: ChargedCellsConfig;

  // Effects (Global)
  blurType: 'none' | 'gaussian' | 'motion' | 'zoom';
  blurStrength: number;
  blurAngle: number;
  noiseType: 'none' | 'grain' | 'static' | 'scanline';
  noiseStrength: number;

  // Animation
  isFrozen: boolean;
  manualTime: number;
}

export const defaultSettings: ShaderSettings = {
  text: "קרח",
  fontSize: 450,
  fontWeight: 600,
  fontFamily: "Quicksand",
  textTranslateX: 0,
  textTranslateY: 0,
  
  activeShader: 'melt',
  
  melt: {
    hue: 0,
    saturation: 1.0,
    zoom: 7.60,
    speed: 0.5,
    detail: 0.2,
    contrast: 1.0,
  },

  flow: {
    velocity: 0.2,
    detail: 200.0,
    twist: 50.0,
    speed: 2.5,
    contrast: 1.0,
    rgbR: 1.0,
    rgbG: 1.0,
    rgbB: 1.0,
    colorOffset: 0.0,
    hue: 0,
    saturation: 1.0,
  },

  balatro: {
    speed: 1,
    spinRotation: -2.0,
    spinSpeed: 7.0,
    contrast: 3.5,
    lighting: 0.4,
    spinAmount: 0.25,
    pixelFilter: 745.0,
    spinEase: 1.0,
    isRotate: false,
    color1: [0.871, 0.267, 0.231],
    color2: [0.0, 0.42, 0.706],
    color3: [0.086, 0.137, 0.145],
  },
  
  glass: {
    speed: 0.8,
    sides: 6,
    hue: 0,
    saturation: 1,
    contrast: 1,
    density: 15.0,
    glow: 1.2
  },

  chargedCells: {
    speed: 1.0,
    scale: 5.0,
    hue: 0,
    saturation: 1,
    color1: [0.18, 0.7, 0.4],
    color2: [0.58, 1.0, 0.15],
    color3: [0.0, 0.65, 0.31],
  },
  
  blurType: 'none',
  blurStrength: 0.0,
  blurAngle: 0,
  noiseType: 'none',
  noiseStrength: 0.0,
  
  isFrozen: false,
  manualTime: 0,
};