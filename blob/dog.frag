precision highp float;

uniform sampler2D uSampler;

varying vec2 vTexCoord;

float unpack(vec4 color)
{
  float r = color.r * 16711680.0;
  float g = color.g * 65280.0;
  float b = color.b * 255.0;
  return clamp(float(r + g + b) / 16777215.0, 0.0, 1.0);
}

vec4 pack(float value)
{
  value = clamp(value, 0.0, 1.0);
  int iValue = int(value * 16777215.0);
  int r = iValue / 65536;
  int g = (iValue - r * 65536) / 256;
  int b = iValue - r * 65536 - g * 256;
  return vec4(float(r) / 255.0, float(g) / 255.0, float(b) / 255.0, 1.0);
}

void main() {
    vec2 uv = vTexCoord;

    vec2 uv0 = vec2(uv.x * 4.0 / 5.0, uv.y);
    vec2 uv1 = vec2(uv0.x + 0.2, uv.y);

    float g0 = unpack(texture2D(uSampler, uv0));
    float g1 = unpack(texture2D(uSampler, uv1));
    float dog = g1 - g0;

    gl_FragColor = pack(dog * 0.5 + 0.5);
}