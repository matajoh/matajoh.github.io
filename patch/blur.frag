precision mediump float;

uniform sampler2D uSampler;
uniform vec2 uResolution;
uniform bool uFlipped;
uniform int uPass;

vec4 pack(float value)
{
  value = clamp(value, 0.0, 1.0);
  int iValue = int(value * 16777215.0);
  int r = iValue / 65536;
  int g = (iValue - r * 65536) / 256;
  int b = iValue - r * 65536 - g * 256;
  return vec4(float(r) / 255.0, float(g) / 255.0, float(b) / 255.0, 1.0);
}

float unpack(vec4 color)
{
  float r = color.r * 16711680.0;
  float g = color.g * 65280.0;
  float b = color.b * 255.0;
  return clamp(float(r + g + b) / 16777215.0, 0.0, 1.0);
}

float grayscale(vec2 uv){
  vec4 color = texture2D(uSampler, uv);
  if(uPass == 0){
    return 0.2989 * color.r + 0.5870 * color.g + 0.1140 * color.b;
  }else{
    return unpack(color);
  }
}

float blur(vec2 uv, vec2 direction) {
  vec2 offset1 = 1.4073333740234375 * direction / uResolution;
  vec2 offset2 = 3.294214963912964 * direction / uResolution;
  vec2 offset3 = 5.201813220977783 * direction / uResolution;
  float value = 0.19967563450336456 * grayscale(uv);
  value += 0.29732251167297363 * grayscale(uv + offset1);
  value += 0.29732251167297363 * grayscale(uv - offset1);
  value += 0.09184833616018295 * grayscale(uv + offset2);
  value += 0.09184833616018295 * grayscale(uv - offset2);
  value += 0.01099133025854826 * grayscale(uv + offset3);
  value += 0.01099133025854826 * grayscale(uv - offset3);
  return value;
}

varying vec2 vTexCoord;

void main() {
  vec2 uv = vTexCoord;

  if(uFlipped){
    uv.x = 1.0 - uv.x;
  }

  vec2 direction = uPass == 0 ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  gl_FragColor = pack(blur(uv, direction));
}