precision mediump float;

vec4 blur(sampler2D image, vec2 uv, vec2 resolution, vec2 direction) {
    vec4 color = vec4(0.0);
    vec2 off1 = vec2(1.3333333333333333) * direction;
    color += texture2D(image, uv) * 0.29411764705882354;
    color += texture2D(image, uv + (off1 / resolution)) * 0.35294117647058826;
    color += texture2D(image, uv - (off1 / resolution)) * 0.35294117647058826;
    return color; 
}

float grayscale(vec4 color) {
  return 0.2989 * color.r + 0.5870 * color.g + 0.1140 * color.b;
}

vec4 compute_gradient(
    sampler2D textureSampler,
    vec2 textureCoord,
    vec2 resolution
) {
    vec2 dx = vec2(1.0, 0.0) / resolution.x;
    vec2 dy = vec2(0.0, 1.0) / resolution.y;

    float left = grayscale(blur(textureSampler, textureCoord - dx, resolution, vec2(1.0, 0.0)));
    float right = grayscale(blur(textureSampler, textureCoord + dx, resolution, vec2(1.0, 0.0)));
    float top = grayscale(blur(textureSampler, textureCoord - dy, resolution, vec2(0.0, 1.0)));
    float bottom = grayscale(blur(textureSampler, textureCoord + dy, resolution, vec2(0.0, 1.0)));
    vec2 g = vec2(right - left, bottom - top);
    float mag = length(g);
    float theta = atan(g.y, g.x);
    const float pi = 3.14159265359;
    if(theta < 0.0){
        theta += 2.0 * pi;
    }
    theta = clamp(theta / (2.0 * pi), 0.0, 1.0);
    return vec4(mag, theta, 0, 1.0);
}

uniform sampler2D uSampler;
uniform vec2 uResolution;
uniform bool uFlipped;
uniform vec2 uPatchSize;

varying vec2 vTexCoord;

void main() {
  vec2 uv = vTexCoord;

  if(uFlipped){
    uv.x = 1.0 - uv.x;
  }

  vec2 patchResolution = uPatchSize / uResolution;
  vec2 start = (1.0 - patchResolution) * 0.5;
  uv = start + uv * patchResolution;
 
  gl_FragColor = compute_gradient(uSampler, uv, uResolution);
}