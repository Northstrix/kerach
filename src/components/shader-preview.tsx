"use client";

import { useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import type { ShaderSettings } from "@/lib/config";
import { vertexShader } from "@/shaders/vertex.glsl";
import { 
  meltFragShader, 
  balatroFragShader, 
  psychedelicGlassFragShader,
  flowFragShader,
  chargedCellsFragShader,
} from "@/shaders/definitions";

interface ShaderPreviewProps {
  settings: ShaderSettings;
}

// -------------------------------------------------------------------------
// SHADER MODIFIER (Runtime Injection)
// -------------------------------------------------------------------------
const modifyShaderWithMask = (shaderSource: string) => {
  const headerInjection = `
    varying vec2 vUv;
    uniform sampler2D u_mask;
  `;
  
  const mainInjection = `
    void main() {
      // 1. Sample the text mask
      vec4 mask = texture2D(u_mask, vUv);
      // 2. Discard pixels outside the text to reveal the white background
      if(mask.r < 0.1) discard;
  `;

  let modified = shaderSource;
  
  // Inject header (after precision or at top)
  if (modified.includes('precision highp float;')) {
    modified = modified.replace('precision highp float;', 'precision highp float;\n' + headerInjection);
  } else {
    modified = headerInjection + '\n' + modified;
  }

  // Inject discard logic at start of main()
  modified = modified.replace(/void\s+main\s*\(\s*\)\s*{/, mainInjection);

  return modified;
};

export function ShaderPreview({ settings }: ShaderPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Three.js Core
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  
  // Post-Processing Core
  const overlaySceneRef = useRef<THREE.Scene | null>(null);
  const overlayCameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const rtTextureRef = useRef<THREE.WebGLRenderTarget | null>(null);

  // Materials & Textures
  const mainMeshRef = useRef<THREE.Mesh | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const overlayMaterialRef = useRef<THREE.ShaderMaterial | null>(null);
  const textCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const textTextureRef = useRef<THREE.CanvasTexture | null>(null);

  // State Tracking
  const settingsRef = useRef(settings);
  const activeShaderRef = useRef<string>(settings.activeShader);

  // Update ref immediately when props change
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  // -------------------------------------------------------------------------
  // 1. FONT HELPER
  // -------------------------------------------------------------------------
  const getCanvasFont = (fontFamily: string, fontWeight: number, fontSize: number): string => {
    const fontMap: Record<string, string> = {
      "Inter": `${fontWeight} ${fontSize}px Inter, -apple-system, BlinkMacSystemFont, sans-serif`,
      "Roboto": `${fontWeight} ${fontSize}px Roboto, sans-serif`,
      "Open Sans": `${fontWeight} ${fontSize}px "Open Sans", sans-serif`,
      "Lato": `${fontWeight} ${fontSize}px Lato, sans-serif`,
      "Montserrat": `${fontWeight} ${fontSize}px Montserrat, sans-serif`,
      "Oswald": `${fontWeight} ${fontSize}px Oswald, sans-serif`,
      "Raleway": `${fontWeight} ${fontSize}px Raleway, sans-serif`,
      "Nunito": `${fontWeight} ${fontSize}px Nunito, sans-serif`,
      "Merriweather": `${fontWeight} ${fontSize}px Merriweather, serif`,
      "Poppins": `${fontWeight} ${fontSize}px Poppins, sans-serif`,
      "Playfair Display": `${fontWeight} ${fontSize}px "Playfair Display", serif`,
      "Ubuntu": `${fontWeight} ${fontSize}px Ubuntu, sans-serif`,
      "Roboto Mono": `${fontWeight} ${fontSize}px "Roboto Mono", monospace`,
      "Rubik": `${fontWeight} ${fontSize}px Rubik, sans-serif`,
      "Mukta": `${fontWeight} ${fontSize}px Mukta, sans-serif`,
      "Kanit": `${fontWeight} ${fontSize}px Kanit, sans-serif`,
      "PT Sans": `${fontWeight} ${fontSize}px "PT Sans", sans-serif`,
      "Work Sans": `${fontWeight} ${fontSize}px "Work Sans", sans-serif`,
      "Quicksand": `${fontWeight} ${fontSize}px Quicksand, sans-serif`,
      "Fira Sans": `${fontWeight} ${fontSize}px "Fira Sans", sans-serif`,
      "Alef": `${fontWeight} ${fontSize}px Alef, Arial Hebrew, sans-serif`,
    };
    return fontMap[fontFamily] || `${fontWeight} ${fontSize}px ${fontFamily}, sans-serif`;
  };

  // -------------------------------------------------------------------------
  // 2. TEXT TEXTURE GENERATION
  // -------------------------------------------------------------------------
  const updateTextTexture = useCallback(() => {
    const textCanvas = textCanvasRef.current;
    const texture = textTextureRef.current;
    const container = containerRef.current;
    const currentSettings = settingsRef.current;

    if (!textCanvas || !texture || !currentSettings || !container) return;

    const ctx = textCanvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    // We size the canvas to the container to ensure 1:1 pixel mapping for accurate translation
    const width = container.clientWidth * dpr;
    const height = container.clientHeight * dpr;

    // Check if resize is needed
    if (textCanvas.width !== width || textCanvas.height !== height) {
      textCanvas.width = width;
      textCanvas.height = height;
    } else {
      ctx.clearRect(0, 0, width, height);
    }

    const fontSize = currentSettings.fontSize * dpr;
    const fontWeight = currentSettings.fontWeight;
    const fontFamily = currentSettings.fontFamily || "Inter";

    // Setup Font
    ctx.font = getCanvasFont(fontFamily, fontWeight, fontSize);
    // FORCE CRISP (No antialias as requested)
    ctx.imageSmoothingEnabled = false;

    // Drawing settings
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Calculations
    const lines = currentSettings.text.split("\n");
    const lineSpacing = 1.2;
    // Calculate total text block height to center it vertically
    const totalTextHeight = fontSize * lines.length * lineSpacing;
    const startY = (height - totalTextHeight) / 2 + (fontSize * lineSpacing / 2);

    // Translation (scaled by DPR to match screen pixels)
    const translateX = currentSettings.textTranslateX * dpr;
    const translateY = currentSettings.textTranslateY * dpr;
    const centerX = width / 2;

    lines.forEach((line, index) => {
      // Line position + Vertical centering + User Offset
      const y = startY + (index * fontSize * lineSpacing) + translateY;
      const x = centerX + translateX;
      ctx.fillText(line, x, y);
    });

    // Texture Filtering - Nearest for crisp edges
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.needsUpdate = true;

    // Ensure the material has the updated mask
    if (materialRef.current) {
      materialRef.current.uniforms.u_mask.value = texture;
    }
  }, []);

  // -------------------------------------------------------------------------
  // 3. MATERIAL FACTORY
  // -------------------------------------------------------------------------
  const createMaterialForType = (type: string, maskTexture: THREE.CanvasTexture) => {
    let baseFragment = meltFragShader;
    let uniforms: any = {};

    // Common Uniforms
    const baseUniforms = {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2() },
      u_mask: { value: maskTexture },
      uHue: { value: 0.0 },
      uSaturation: { value: 1.0 },
      uContrast: { value: 1.0 },
    };

    if (type === 'balatro') {
      baseFragment = balatroFragShader;
      uniforms = {
        ...baseUniforms,
        uSpeed: { value: 1.0 },
        uSpinRotation: { value: -2.0 },
        uSpinSpeed: { value: 7.0 },
        uColor1: { value: new THREE.Vector3(0.87, 0.26, 0.23) },
        uColor2: { value: new THREE.Vector3(0.0, 0.42, 0.70) },
        uColor3: { value: new THREE.Vector3(0.08, 0.13, 0.14) },
        uLighting: { value: 0.4 },
        uSpinAmount: { value: 0.25 },
        uPixelFilter: { value: 745.0 },
        uSpinEase: { value: 1.0 },
        uIsRotate: { value: false },
      };
    } else if (type === 'glass') {
      baseFragment = psychedelicGlassFragShader;
      uniforms = {
        ...baseUniforms,
        uSpeed: { value: 0.8 },
        uSides: { value: 6.0 },
        uDensity: { value: 15.0 },
        uGlow: { value: 1.2 },
      };
    } else if (type === 'flow') {
      baseFragment = flowFragShader;
      uniforms = {
        ...baseUniforms,
        uSpeed: { value: 2.5 },
        uVelocity: { value: 0.2 },
        uDetail: { value: 200.0 },
        uTwist: { value: 50.0 },
        uRgbMultiplierR: { value: 1.0 },
        uRgbMultiplierG: { value: 1.0 },
        uRgbMultiplierB: { value: 1.0 },
        uColorOffset: { value: 0.0 },
      };
    } else if (type === 'charged-cells') {
      baseFragment = chargedCellsFragShader;
      uniforms = {
        ...baseUniforms,
        uSpeed: { value: 1.0 },
        uScale: { value: 5.0 },
        uColor1: { value: new THREE.Vector3(0.18, 0.7, 0.4) }, // Green-ish
        uColor2: { value: new THREE.Vector3(0.58, 1.0, 0.15) }, // Lime
        uColor3: { value: new THREE.Vector3(0.0, 0.65, 0.31) }, // Darker Green
      };
    } else {
      // Melt (Default)
      baseFragment = meltFragShader;
      uniforms = {
        ...baseUniforms,
        uSpeed: { value: 0.5 },
        uZoom: { value: 1.0 },
        uDetail: { value: 0.2 },
      };
    }

    // Inject masking logic
    const finalFragment = modifyShaderWithMask(baseFragment);

    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader: finalFragment,
      uniforms: uniforms,
      transparent: true,
    });
  };

  // -------------------------------------------------------------------------
  // 4. MAIN SETUP (Init)
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    const dpr = window.devicePixelRatio;

    // --- SETUP RENDER TARGET ---
    const rtTexture = new THREE.WebGLRenderTarget(0, 0, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
    });
    rtTextureRef.current = rtTexture;

    // --- SETUP TEXT CANVAS ---
    // Note: Dimensions set in updateTextTexture
    const textCanvas = document.createElement("canvas");
    textCanvasRef.current = textCanvas;
    const texture = new THREE.CanvasTexture(textCanvas);
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    textTextureRef.current = texture;

    // --- SETUP RENDERER ---
    const renderer = new THREE.WebGLRenderer({ 
        canvas, 
        antialias: false, // Crisp
        alpha: false 
    });
    renderer.setPixelRatio(dpr);
    renderer.setClearColor(0xffffff, 1);
    rendererRef.current = renderer;

    // --- MAIN SCENE ---
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    cameraRef.current = camera;
    
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = createMaterialForType(settings.activeShader, texture);
    materialRef.current = material;
    
    const mainMesh = new THREE.Mesh(geometry, material);
    mainMeshRef.current = mainMesh;
    scene.add(mainMesh);

    // --- OVERLAY SCENE (Effects) ---
    const overlayScene = new THREE.Scene();
    overlaySceneRef.current = overlayScene;
    const overlayCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    overlayCameraRef.current = overlayCamera;

    const overlayMaterial = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        u_texture: { value: null },
        u_time: { value: 0 },
        u_resolution: { value: new THREE.Vector2() },
        u_blurType: { value: 0 },
        u_blurStrength: { value: 0.0 },
        u_blurAngle: { value: 0.0 },
        u_noiseType: { value: 0 },
        u_noiseStrength: { value: 0.0 },
      },
      vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position, 1.0); }`,
      fragmentShader: `
        varying vec2 vUv;
        uniform sampler2D u_texture;
        uniform float u_time;
        uniform vec2 u_resolution;
        uniform int u_blurType;
        uniform float u_blurStrength;
        uniform float u_blurAngle;
        uniform int u_noiseType;
        uniform float u_noiseStrength;

        float rand(vec2 co) { return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453); }

        void main() {
            vec2 uv = vUv;
            vec4 base = texture2D(u_texture, uv);
            vec3 finalColor = base.rgb;
            
            // --- BLUR ---
            if(u_blurType == 1) { // Gaussian
                float str = u_blurStrength * 0.001; // Scaled for pixel-like feel
                vec3 sum = vec3(0.0);
                float total = 0.0;
                // Simple 5x5 kernel
                for(float x=-2.0; x<=2.0; x++) {
                    for(float y=-2.0; y<=2.0; y++) {
                         vec2 off = vec2(x,y)*str;
                         // weighting
                         float w = 1.0 - length(vec2(x,y))/3.0;
                         sum += texture2D(u_texture, uv+off).rgb * w;
                         total += w;
                    }
                }
                finalColor = sum/total;
            } else if (u_blurType == 2) { // Motion
                float str = u_blurStrength * 0.001;
                float rad = radians(u_blurAngle);
                vec2 dir = vec2(cos(rad), sin(rad));
                vec3 sum = vec3(0.0);
                for(float i=0.0; i<8.0; i++) {
                    sum += texture2D(u_texture, uv + dir*i*str).rgb;
                }
                finalColor = sum/8.0;
            } else if (u_blurType == 3) { // Zoom
                vec3 sum = vec3(0.0);
                vec2 center = vec2(0.5);
                float str = u_blurStrength * 0.01;
                for(float t=0.0; t<=10.0; t++) {
                     float pct = t/10.0;
                     vec2 pos = uv + (center-uv)*pct*str;
                     sum += texture2D(u_texture, pos).rgb;
                }
                finalColor = sum/11.0;
            }
            
            // --- NOISE ---
            float noise = 0.0;
            if (u_noiseType == 1) noise = (rand(uv * u_time) - 0.5) * u_noiseStrength;
            else if (u_noiseType == 2) noise = rand(uv + vec2(u_time)) * u_noiseStrength;
            else if (u_noiseType == 3) {
                float count = u_resolution.y * 0.5;
                noise = sin(uv.y * count + u_time * 10.0) * u_noiseStrength * 0.2;
            }
            finalColor += noise;
            
            gl_FragColor = vec4(finalColor, base.a);
         }
      `
    });
    overlayMaterialRef.current = overlayMaterial;
    const overlayMesh = new THREE.Mesh(geometry, overlayMaterial);
    overlayScene.add(overlayMesh);

    // Initial Text Draw
    updateTextTexture();

    // Cleanup
    return () => {
        renderer.dispose();
        rtTexture.dispose();
        texture.dispose();
        geometry.dispose();
        material.dispose();
        overlayMaterial.dispose();
    };
  }, []); 

  // -------------------------------------------------------------------------
  // 5. UPDATE LOOPS
  // -------------------------------------------------------------------------

  // A. Rebuild Material if Shader Type changes
  useEffect(() => {
    if (!sceneRef.current || !mainMeshRef.current || !textTextureRef.current) return;
    
    if (activeShaderRef.current !== settings.activeShader) {
      activeShaderRef.current = settings.activeShader;
      const oldMat = materialRef.current;
      
      const newMat = createMaterialForType(settings.activeShader, textTextureRef.current!);
      mainMeshRef.current.material = newMat;
      materialRef.current = newMat;
      
      if (oldMat) oldMat.dispose();
    }
  }, [settings.activeShader]);

  // B. Update Texture on Text/Font/Translation change
  // THIS IS CRITICAL: Add translation props to dependency array
  useEffect(() => {
    updateTextTexture();
  }, [
      settings.text, 
      settings.fontSize, 
      settings.fontWeight, 
      settings.fontFamily, 
      settings.textTranslateX, // Ensures update on translation
      settings.textTranslateY, // Ensures update on translation
      updateTextTexture
  ]);

  // C. Animation Loop
  useEffect(() => {
    let animationFrameId: number;
    const dpr = window.devicePixelRatio;

    const animate = (time: number) => {
      const current = settingsRef.current;
      if (!current || !containerRef.current || !rendererRef.current) {
        animationFrameId = requestAnimationFrame(animate);
        return;
      }

      const renderer = rendererRef.current;
      const scene = sceneRef.current;
      const camera = cameraRef.current;
      const rtTexture = rtTextureRef.current;
      const overlayScene = overlaySceneRef.current;
      const overlayCamera = overlayCameraRef.current;
      const overlayMaterial = overlayMaterialRef.current;

      // Handle Resize
      const { clientWidth, clientHeight } = containerRef.current;
      const width = clientWidth * dpr;
      const height = clientHeight * dpr;

      if (renderer.getSize(new THREE.Vector2()).x !== width || renderer.getSize(new THREE.Vector2()).y !== height) {
        renderer.setSize(clientWidth, clientHeight, false);
        rtTexture?.setSize(width, height);
        // Also trigger text update on resize to ensure bounds match
        updateTextTexture();
      }

      const now = time * 0.001;
      const elapsed = current.isFrozen ? current.manualTime : now;

      if (materialRef.current) {
        const mat = materialRef.current;
        const res = new THREE.Vector2(width, height);

        if (mat.uniforms.uTime) mat.uniforms.uTime.value = elapsed;
        if (mat.uniforms.uResolution) mat.uniforms.uResolution.value.copy(res);

        // Melt
        if (current.activeShader === "melt") {
          mat.uniforms.uZoom.value = current.melt.zoom;
          mat.uniforms.uSpeed.value = current.melt.speed;
          mat.uniforms.uDetail.value = current.melt.detail;
          mat.uniforms.uHue.value = current.melt.hue;
          mat.uniforms.uSaturation.value = current.melt.saturation;
          mat.uniforms.uContrast.value = current.melt.contrast;
        }

        // Flow
        if (current.activeShader === "flow") {
            mat.uniforms.uSpeed.value = current.flow.speed;
            mat.uniforms.uVelocity.value = current.flow.velocity;
            mat.uniforms.uDetail.value = current.flow.detail;
            mat.uniforms.uTwist.value = current.flow.twist;
            mat.uniforms.uContrast.value = current.flow.contrast;
            mat.uniforms.uRgbMultiplierR.value = current.flow.rgbR;
            mat.uniforms.uRgbMultiplierG.value = current.flow.rgbG;
            mat.uniforms.uRgbMultiplierB.value = current.flow.rgbB;
            mat.uniforms.uColorOffset.value = current.flow.colorOffset;
            mat.uniforms.uHue.value = current.flow.hue;
            mat.uniforms.uSaturation.value = current.flow.saturation;
        }

        // Balatro
        if (current.activeShader === "balatro") {
          mat.uniforms.uSpeed.value = current.balatro.speed;
          mat.uniforms.uSpinRotation.value = current.balatro.spinRotation;
          mat.uniforms.uSpinSpeed.value = current.balatro.spinSpeed;
          mat.uniforms.uContrast.value = current.balatro.contrast;
          mat.uniforms.uLighting.value = current.balatro.lighting;
          mat.uniforms.uSpinAmount.value = current.balatro.spinAmount;
          mat.uniforms.uPixelFilter.value = current.balatro.pixelFilter;
          mat.uniforms.uSpinEase.value = current.balatro.spinEase;
          mat.uniforms.uIsRotate.value = current.balatro.isRotate;
          
          // Fix for Colors not setting: Spread array into set()
          if (mat.uniforms.uColor1) mat.uniforms.uColor1.value.set(...current.balatro.color1);
          if (mat.uniforms.uColor2) mat.uniforms.uColor2.value.set(...current.balatro.color2);
          if (mat.uniforms.uColor3) mat.uniforms.uColor3.value.set(...current.balatro.color3);

          mat.uniforms.uHue.value = 0.0; // Reset for balatro if needed, or use separate logic
          mat.uniforms.uSaturation.value = 1.0;
        }

        // Glass
        if (current.activeShader === "glass") {
          mat.uniforms.uSpeed.value = current.glass.speed;
          mat.uniforms.uSides.value = current.glass.sides;
          mat.uniforms.uHue.value = current.glass.hue;
          mat.uniforms.uSaturation.value = current.glass.saturation;
          mat.uniforms.uContrast.value = current.glass.contrast;
          mat.uniforms.uDensity.value = current.glass.density;
          mat.uniforms.uGlow.value = current.glass.glow;
        }

        // Charged Cells
        if (current.activeShader === "charged-cells") {
            mat.uniforms.uSpeed.value = current.chargedCells.speed;
            mat.uniforms.uScale.value = current.chargedCells.scale;
            mat.uniforms.uHue.value = current.chargedCells.hue;
            mat.uniforms.uSaturation.value = current.chargedCells.saturation;
            if (mat.uniforms.uColor1) mat.uniforms.uColor1.value.set(...current.chargedCells.color1);
            if (mat.uniforms.uColor2) mat.uniforms.uColor2.value.set(...current.chargedCells.color2);
            if (mat.uniforms.uColor3) mat.uniforms.uColor3.value.set(...current.chargedCells.color3);
        }
      }

      // Render Pass 1
      if (scene && camera && rtTexture) {
        renderer.setRenderTarget(rtTexture);
        renderer.clear();
        renderer.render(scene, camera);
      }

      // Render Pass 2 (Overlay)
      if (overlayMaterial && overlayScene && overlayCamera && rtTexture) {
        overlayMaterial.uniforms.u_time.value = elapsed;
        overlayMaterial.uniforms.u_resolution.value.set(width, height);
        overlayMaterial.uniforms.u_texture.value = rtTexture.texture;
        
        // Post-FX Params
        overlayMaterial.uniforms.u_noiseStrength.value = current.noiseStrength;
        
        let blurType = 0;
        if (current.blurType === "gaussian") blurType = 1;
        else if (current.blurType === "motion") blurType = 2;
        else if (current.blurType === "zoom") blurType = 3;
        overlayMaterial.uniforms.u_blurType.value = blurType;
        overlayMaterial.uniforms.u_blurStrength.value = current.blurStrength;
        overlayMaterial.uniforms.u_blurAngle.value = current.blurAngle;
        
        let noiseType = 0;
        if (current.noiseType === "grain") noiseType = 1;
        else if (current.noiseType === "static") noiseType = 2;
        else if (current.noiseType === "scanline") noiseType = 3;
        overlayMaterial.uniforms.u_noiseType.value = noiseType;

        renderer.setRenderTarget(null);
        renderer.clear();
        renderer.render(overlayScene, overlayCamera);
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden bg-white">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}