// src/shaders/definitions.ts

const hueSatHelpers = `
vec3 rgb2hsv(vec3 c) {
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}
`;

export const flowVertShader = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

export const flowFragShader = `
precision highp float;
uniform float uTime;
uniform vec2 uResolution;
uniform float uVelocity;
uniform float uDetail;
uniform float uTwist;
uniform float uSpeed;
uniform float uContrast;
uniform float uRgbMultiplierR;
uniform float uRgbMultiplierG;
uniform float uRgbMultiplierB;
uniform float uColorOffset;
uniform float uHue;
uniform float uSaturation;

vec3 rgb2hsv(vec3 c) {
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

float f(in vec2 p) {
    return sin(p.x + sin(p.y + uTime * uVelocity)) * sin(p.y * p.x * 0.1 + uTime * uVelocity);
}

void main() {
    vec2 p = (gl_FragCoord.xy * 2.0 - uResolution) / min(uResolution.x, uResolution.y);
    float uScale = 5.0;
    p *= uScale;

    vec2 ep = vec2(0.05, 0.0);
    vec2 rz = vec2(0.0);

    for (int i = 0; i < 20; i++) {
        float t0 = f(p);
        float t1 = f(p + ep.xy);
        float t2 = f(p + ep.yx);
        vec2 g = vec2((t1 - t0), (t2 - t0)) / ep.xx;
        vec2 t = vec2(-g.y, g.x);

        p += (uTwist * 0.01) * t + g * (1.0 / uDetail);
        p.x += sin(uTime * uSpeed / 10.0) / 10.0;
        p.y += cos(uTime * uSpeed / 10.0) / 10.0;
        rz = g;
    }
    
    vec3 colorVec = vec3(rz * 0.5 + 0.5, 1.5);

    colorVec.r *= uRgbMultiplierR;
    colorVec.g *= uRgbMultiplierG;
    colorVec.b *= uRgbMultiplierB;
    
    colorVec += uColorOffset;
    
    colorVec = (colorVec - 0.5) * uContrast + 0.5;

    vec3 hsv = rgb2hsv(colorVec);
    hsv.x += uHue / 360.0;
    hsv.y *= uSaturation;
    colorVec = hsv2rgb(hsv);

    gl_FragColor = vec4(colorVec, 1.0);
}
`;

export const meltFragShader = `precision highp float;

uniform float uTime;
uniform vec2  uResolution;

uniform float uSpeed;
uniform float uZoom;
uniform float uDetail;
uniform float uHue;
uniform float uSaturation;
uniform float uContrast;

${hueSatHelpers}

// base field function, time‑scaled by uSpeed
float f(in vec2 p) {
  float t = uTime * uSpeed;
  return sin(p.x + sin(p.y + t * 0.2)) *
         sin(p.y * p.x * 0.1 + t * 0.2);
}

void main() {
  vec2 p = (gl_FragCoord.xy * 2.0 - uResolution) /
           min(uResolution.x, uResolution.y);

  float scale = max(0.1, uZoom);
  p *= scale;

  vec2 rz = vec2(0.0);
  float stepMul = mix(0.0, 0.1, clamp(uDetail, 0.0, 1.0));

  for (int i = 0; i < 15; i++) {
    float t0 = f(p);
    float t1 = f(p + vec2(0.05, 0.0));
    vec2 g = vec2(
      (t1 - t0),
      (f(p + vec2(0.0, 0.05)) - t0)
    ) / 0.05;
    vec2 t = vec2(-g.y, g.x);
    p += 0.05 * t + g * (0.2 + stepMul);
    rz = g;
  }

  // base color from flow field
  vec3 col = vec3(rz * 0.5 + 0.5, 1.0);

  // per‑shader hue / saturation overlay, same style as other shaders
  vec3 hsv = rgb2hsv(col);
  hsv.x += uHue / 360.0;
  hsv.y *= uSaturation;
  col = hsv2rgb(hsv);

  // per‑shader contrast
  col = (col - 0.5) * uContrast + 0.5;

  gl_FragColor = vec4(col, 1.0);
}`;

export const balatroFragShader = `
precision highp float;
uniform float uTime;
uniform vec2 uResolution;
uniform float uSpeed;

uniform float uSpinRotation;
uniform float uSpinSpeed;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform float uContrast;
uniform float uLighting;
uniform float uSpinAmount;
uniform float uPixelFilter;
uniform float uSpinEase;
uniform bool uIsRotate;

#define PI 3.14159265359

vec4 effect(vec2 screenSize, vec2 screen_coords) {
    float pixel_size = length(screenSize.xy) / uPixelFilter;
    vec2 uv = (floor(screen_coords.xy*(1./pixel_size))*pixel_size - 0.5*screenSize.xy)/length(screenSize.xy) - vec2(0.0);
    float uv_len = length(uv);
    
    float speed = (uSpinRotation*uSpinEase*0.2);
    if(uIsRotate){
       speed = uTime * speed;
    }
    speed += 302.2;
    float new_pixel_angle = atan(uv.y, uv.x) + speed - uSpinEase*20.*(1.*uSpinAmount*uv_len + (1. - 1.*uSpinAmount));
    vec2 mid = (screenSize.xy/length(screenSize.xy))/2.;
    uv = (vec2((uv_len * cos(new_pixel_angle) + mid.x), (uv_len * sin(new_pixel_angle) + mid.y)) - mid);
    
    uv *= 30.;
    speed = uTime*(uSpinSpeed);
    vec2 uv2 = vec2(uv.x+uv.y);
    
    for(int i=0; i < 5; i++) {
        uv2 += sin(max(uv.x, uv.y)) + uv;
        uv  += 0.5*vec2(cos(5.1123314 + 0.353*uv2.y + speed*0.131121),sin(uv2.x - 0.113*speed));
        uv  -= 1.0*cos(uv.x + uv.y) - 1.0*sin(uv.x*0.711 - uv.y);
    }
    
    float contrast_mod = (0.25*uContrast + 0.5*uSpinAmount + 1.2);
    float paint_res = min(2., max(0.,length(uv)*(0.035)*contrast_mod));
    float c1p = max(0.,1. - contrast_mod*abs(1.-paint_res));
    float c2p = max(0.,1. - contrast_mod*abs(paint_res));
    float c3p = 1. - min(1., c1p + c2p);
    float light = (uLighting - 0.2)*max(c1p*5. - 4., 0.) + uLighting*max(c2p*5. - 4., 0.);
    return (0.3/uContrast)*vec4(uColor1,1.0) + (1. - 0.3/uContrast)*(vec4(uColor1,1.0)*c1p + vec4(uColor2,1.0)*c2p + vec4(c3p*uColor3.rgb, c3p*1.0)) + light;
}

void main() {
    vec2 uv = gl_FragCoord.xy/uResolution.xy;
    gl_FragColor = effect(uResolution.xy, uv * uResolution.xy);
}
`;

export const psychedelicGlassFragShader = `precision highp float;
uniform vec2 uResolution;
uniform float uTime;
uniform float uSpeed;
uniform float uSides;
uniform float uHue;
uniform float uSaturation;
uniform float uContrast;
uniform float uDensity;
uniform float uGlow;

${hueSatHelpers}

vec3 palette(float t) {
  vec3 a = vec3(0.8, 0.5, 0.4);
  vec3 b = vec3(1.0, 1.0, 0.2);
  vec3 c = vec3(1.0, 1.0, 1.0);
  vec3 d = vec3(0.00, 0.25, 0.25);
  return a + b * cos(6.28318 * (c * t + d));
}

// SDF Parallelogram (glass pane primitive)
float sdParallelogram(in vec2 p, float wi, float he, float sk) {
    vec2 e = vec2(sk, he);
    p = (p.y < 0.0) ? -p : p;
    vec2 w = p - e; 
    w.x -= clamp(w.x, -wi, wi);
    vec2 d = vec2(dot(w, w), -w.y);
    float s = p.x * e.y - p.y * e.x;
    p = (s < 0.0) ? -p : p;
    vec2 v = p - vec2(wi, 0.0);
    v -= e * clamp(dot(v, e)/dot(e, e), -1.0, 1.0);
    d = min(d, vec2(dot(v,v), wi*he - abs(s)));
    return sqrt(d.x) * sign(-d.y);
}

// Line segment made of parallelograms
float sdLine(in vec2 p) {
    float size = 0.5;
    float width = size * 0.33;
    return min(
      sdParallelogram(p + vec2(-0.12, -0.5), 0.1, size * 1.5, size * 0.75),
      sdParallelogram(p + vec2(width + size * 0.175, size * 1.52), 0.1, size, 0.)
    );
}

// DON pattern (3 parallel lines)
float sdfDon(vec2 uv) {
  float d1 = sdLine(uv);
  float d2 = sdLine(uv + vec2(0.315, 0.0));
  float d3 = sdLine(uv + vec2(0.63, 0.0));
  return min(min(d1, d2), d3);
}

void main() {
  vec2 uv = (gl_FragCoord.xy / uResolution.xy) * 2.0 - 1.0;
  uv.y *= uResolution.y / uResolution.x;

  float t = uTime * uSpeed;
  float PI = 3.14159;
  float sectors = max(uSides, 2.0);
  float halfSector = sectors * 0.5;

  // Kaleidoscopic symmetry
  float angle = atan(uv.y, uv.x);
  angle = abs(mod(angle, PI / halfSector) - PI / sectors);
  uv = vec2(cos(angle), sin(angle)) * length(uv);

  // Pattern grid animation
  vec2 puv = uv + vec2(0.1, 0.05);
  float ind = floor((uv.y + uv.x) * 6.0) + t * 0.1;
  float g = mod(((uv.y + uv.x) * 6.0), 1.0);
  
  uv = vec2(uv.x + ind * 0.285, uv.y + uv.x) + t * 0.1;
  uv *= uDensity;
  uv = mod(uv, 2.5) - 1.25;
  
  puv = vec2(puv.x + ind * 0.285, puv.y + puv.x) + t * 0.1;
  puv *= uDensity;
  puv = mod(puv, 2.5) - 1.25;

  // SDF distance fields
  float d = sdfDon(uv);
  float p = sdfDon(puv);
  d = smoothstep(0.0, 0.02, d);
  p = smoothstep(0.0, 0.01, p);

  // Psychedelic palette with glass-like glow
  vec3 fgColor = palette(-t + ind * 0.1) * g * 1.579 * uGlow;
  vec3 bgColor = palette(-t + ind * 0.1) * g * 0.1;
  if (g > 0.95) {
    bgColor = mix(fgColor, palette(-t + uv.x + uv.y), 0.5);
  }

  vec3 color = mix(fgColor, bgColor, d);
  color = mix(color * 2.0, color, p);
  
  // Glass-like contrast + HSV adjustment
  color = (color - 0.5) * uContrast + 0.5;
  vec3 hsv = rgb2hsv(color);
  hsv.x += uHue / 360.0;
  hsv.y *= uSaturation;
  color = hsv2rgb(hsv);

  gl_FragColor = vec4(color, 1.0);
}`;

export const chargedCellsFragShader = `precision highp float;
uniform float uTime;
uniform vec2 uResolution;
uniform float uSpeed;
uniform float uScale;
uniform float uHue;
uniform float uSaturation;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;

${hueSatHelpers}

#define PI 3.14159

float hash1( float n ) { return fract(sin(n)*43758.5453); }
vec2  hash2( vec2  p ) {
  p = vec2( dot(p,vec2(127.1,311.7)), dot(p,vec2(269.5,183.3)) );
  return fract(sin(p)*43758.5453);
}

vec4 voronoi( in vec2 x, float w )
{
  vec2 n = floor( x );
  vec2 f = fract( x );

  vec4 m = vec4( 8.0, 0.0, 0.0, 0.0 );
  for( int j=-2; j<=2; j++ )
  for( int i=-2; i<=2; i++ )
  {
    vec2 g = vec2( float(i),float(j) );
    vec2 o = hash2( n + g );

    // animate
    o = 0.5 + 0.5*sin( uTime + 6.2831*o );

    // distance to cell
    float d = length(g - f + o);

    // cell color
    vec3 col = 0.5 + 0.5*sin(
      hash1(dot(n+g,vec2(7.0,113.0)))*2.5 +
      3.5 +
      vec3(2.0,3.0,0.0)
    );
    col = col * col;

    // smooth min
    float h = smoothstep( -1.0, 1.0, (m.x-d)/w );
    m.x   = mix( m.x,     d, h ) - h*(1.0-h)*w/(1.0+3.0*w);
    m.yzw = mix( m.yzw, col, h ) - h*(1.0-h)*w/(1.0+3.0*w);
  }

  return m;
}

float random(vec2 co)
{
  return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

float sdfGrid(vec2 uv, float r) {
  vec2 c = uv * 4.0 * r;
  float angle = r;
  float thickness = 0.5 + r;
  float one = abs(0.5 - mod(c.y + cos(angle) * c.x, 1.0)) * thickness;
  float two = abs(0.5 - mod(c.y - cos(angle) * c.x, 1.0)) * thickness;
  return min(one, two);
}

// 3‑stop palette: color1 -> color2 -> color3
vec3 paletteCharged(float t) {
  t = clamp(t, 0.0, 1.0);
  if (t < 0.5) {
    float k = t / 0.5;
    return mix(uColor1, uColor2, k);
  } else {
    float k = (t - 0.5) / 0.5;
    return mix(uColor2, uColor3, k);
  }
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution.xy * 2.0 - 1.0;
  uv.y *= uResolution.y / uResolution.x;

  float t = sin(uTime * 0.1 * uSpeed);

  vec4 v = voronoi(uScale * uv, 0.5);
  float r = pow(v.y, 0.5);

  float d = 0.0;
  d = max(sdfGrid(uv - t, r), d);
  d = max(sdfGrid(uv + t, 1.0 - r), -d);
  d = smoothstep(0.1, 0.15 + r * 0.1, d);

  vec3 fgColor = paletteCharged(0.6 * r);
  vec3 bgColor = paletteCharged(0.1 * r);

  // Add a slight edge accent using d
  vec3 edgeColor = paletteCharged(clamp(r + d * 0.5, 0.0, 1.0));
  vec3 color = mix(fgColor, bgColor, d);
  color = mix(color, edgeColor, 0.35);

  vec3 hsv = rgb2hsv(color);
  hsv.x += uHue / 360.0;
  hsv.y *= uSaturation;
  color = hsv2rgb(hsv);

  gl_FragColor = vec4(color, 1.0);
}`;
