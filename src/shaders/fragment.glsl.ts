export const fragmentShader = `
precision highp float;

varying vec2 vUv;
uniform float u_time;
uniform vec2 u_resolution;
uniform sampler2D u_mask;
uniform float u_zoom;


float f(in vec2 p) {
  return sin(p.x + sin(p.y + u_time * 0.2)) * sin(p.y * p.x * 0.1 + u_time * 0.2);
}

void main() {
    vec4 mask = texture2D(u_mask, vUv);
    if (mask.a < 0.5) {
        discard;
    }

    vec2 p = (gl_FragCoord.xy * 2.0 - u_resolution) / min(u_resolution.x, u_resolution.y);
    float uScale = u_zoom;
    p *= uScale;
    vec2 rz = vec2(0.0);
    for (int i = 0; i < 15; i++) {
        float t0 = f(p);
        float t1 = f(p + vec2(0.05, 0.0));
        vec2 g = vec2((t1 - t0), (f(p + vec2(0.0, 0.05)) - t0)) / 0.05;
        vec2 t = vec2(-g.y, g.x);
        p += 0.05 * t + g * 0.2;
        rz = g;
    }
    vec3 colorVec = vec3(rz * 0.5 + 0.5, 1.5);
    colorVec = (colorVec - 0.5) * 1.5 + 0.5;
    gl_FragColor = vec4(colorVec, 1.0);
}
`;
