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

vec2 gradient_direction(vec2 g)
{
  float pi = 3.1415926535897932384626433832795;
  float pi4 = pi / 4.0;
  float theta = atan(g.y, g.x);
  theta -= pi / 8.0;
  theta = theta < 0.0 ? theta + 2.0 * pi : theta;
  theta = pi4 * floor(theta / pi4);
  return vec2(cos(theta), sin(theta));
}

vec2 gradient(sampler2D textureSampler, vec2 textureCoord, vec2 resolution) {
    vec2 dx = vec2(1.0, 0.0) / resolution.x;
    vec2 dy = vec2(0.0, 1.0) / resolution.y;

    float left = grayscale(blur(textureSampler, textureCoord - dx, resolution, vec2(1.0, 0.0)));
    float right = grayscale(blur(textureSampler, textureCoord + dx, resolution, vec2(1.0, 0.0)));
    float top = grayscale(blur(textureSampler, textureCoord - dy, resolution, vec2(0.0, 1.0)));
    float bottom = grayscale(blur(textureSampler, textureCoord + dy, resolution, vec2(0.0, 1.0)));

    return vec2(right - left, bottom - top);
}

vec4 cannyEdgeDetection(
    sampler2D textureSampler,
    vec2 textureCoord,
    vec2 resolution,
    float weakThreshold,
    float strongThreshold
) {
    vec2 g = gradient(textureSampler, textureCoord, resolution);
    float grad = length(g);

    if(grad < weakThreshold){
        return vec4(vec3(0), 1.0);
    }

    vec2 gradDir = gradient_direction(g) / resolution;
    vec2 offDir = vec2(-gradDir.y, gradDir.x);

    float grad0 = length(gradient(textureSampler, textureCoord + offDir, resolution));
    float grad1 = length(gradient(textureSampler, textureCoord - offDir, resolution));

    if(grad < grad0 || grad < grad1){
        return vec4(vec3(0), 1.0);
    }

    if(grad >= strongThreshold){
        return vec4(vec3(1), 1.0);
    }

    grad0 = length(gradient(textureSampler, textureCoord + gradDir, resolution));
    grad1 = length(gradient(textureSampler, textureCoord - gradDir, resolution));

    if(grad0 >= strongThreshold || grad1 >= strongThreshold){
        return vec4(vec3(1), 1.0);
    }

    return vec4(vec3(0), 1.0);
}

uniform sampler2D uSampler;
uniform vec2 uResolution;
uniform float uWeakThreshold;
uniform float uStrongThreshold;
uniform bool uFlipped;

varying vec2 vTexCoord;

void main() {
  vec2 uv = vTexCoord;

  uv.y = 1.0 - uv.y;
  if(uFlipped){
    uv.x = 1.0 - uv.x;
  }
 
  gl_FragColor = cannyEdgeDetection(uSampler, uv, uResolution, uWeakThreshold, uStrongThreshold);
}