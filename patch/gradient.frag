precision mediump float;

uniform sampler2D uSampler;
uniform vec2 uResolution;
uniform bool uFlipped;
uniform vec2 uPatchSize;

float unpack(vec4 color)
{
  float r = color.r * 16711680.0;
  float g = color.g * 65280.0;
  float b = color.b * 255.0;
  return clamp(float(r + g + b) / 16777215.0, 0.0, 1.0);
}

vec2 pack(float value){
  value = clamp(value, 0.0, 1.0);
  int iValue = int(value * 65535.0);
  int x = iValue / 256;
  int y = iValue - x * 256;
  return vec2(float(x) / 255.0, float(y) / 255.0);
}

vec4 compute_gradient(vec2 uv) {
    vec2 dx = vec2(1.0, 0.0) / uResolution.x;
    vec2 dy = vec2(0.0, 1.0) / uResolution.y;

    float left = unpack(texture2D(uSampler, uv - dx));
    float right = unpack(texture2D(uSampler, uv + dx));
    float top = unpack(texture2D(uSampler, uv - dy));
    float bottom = unpack(texture2D(uSampler, uv + dy));
    vec2 g = vec2(right - left, bottom - top);
    float mag = length(g);
    float theta = atan(g.y, g.x);
    const float pi = 3.14159265359;
    if(theta < 0.0){
        theta += 2.0 * pi;
    }
    theta = clamp(theta / (2.0 * pi), 0.0, 1.0);

    return vec4(pack(mag), theta, 1.0);
}

varying vec2 vTexCoord;

void main() {
  vec2 uv = vTexCoord;

  vec2 patchResolution = uPatchSize / uResolution;
  vec2 start = (1.0 - patchResolution) * 0.5;
  uv = start + uv * patchResolution;
 
  gl_FragColor = compute_gradient(uv);
}