precision mediump float;

uniform bool uFlipped;
uniform sampler2D uCam;
uniform sampler2D uPatch;
uniform vec2 uResolution;
uniform vec2 uPatchSize;
uniform float uHistogramSize;
uniform vec4 uH0;
uniform vec4 uH1;
uniform vec4 uH2;
uniform vec4 uH3;
uniform vec4 uH4;
uniform vec4 uH5;
uniform vec4 uH6;
uniform vec4 uH7;
uniform vec4 uH8;
uniform int uOrientation;
uniform float uGradMax;

varying vec2 vTexCoord;

float grayscale(vec4 color) {
  return 0.2989 * color.r + 0.5870 * color.g + 0.1140 * color.b;
}

float histValue(int bin)
{
  if(bin < 0){
    bin += 36;
  }
  if(bin >= 36){
    bin -= 36;
  }
  if(bin == 0){
    return uH0.r;
  }
  if(bin == 1){
    return uH0.g;
  }    
  if(bin == 2){
    return uH0.b;
  }
  if(bin == 3){
    return uH0.a;
  }
  if(bin == 4){
    return uH1.r;
  }
  if(bin == 5){
    return uH1.g;
  }
  if(bin == 6){
    return uH1.b;
  }
  if(bin == 7){
    return uH1.a;
  }
  if(bin == 8){
    return uH2.r;
  }
  if(bin == 9){
    return uH2.g;
  }
  if(bin == 10){
    return uH2.b;
  }
  if(bin == 11){
    return uH2.a;
  }
  if(bin == 12){
    return uH3.r;
  }
  if(bin == 13){
    return uH3.g;
  }
  if(bin == 14){
    return uH3.b;
  }
  if(bin == 15){
    return uH3.a;
  }
  if(bin == 16){
    return uH4.r;
  }
  if(bin == 17){
    return uH4.g;
  }
  if(bin == 18){
    return uH4.b;
  }
  if(bin == 19){
    return uH4.a;
  }
  if(bin == 20){
    return uH5.r;
  }
  if(bin == 21){
    return uH5.g;
  }
  if(bin == 22){
    return uH5.b;
  }
  if(bin == 23){
    return uH5.a;
  }
  if(bin == 24){
    return uH6.r;
  }
  if(bin == 25){
    return uH6.g;
  }
  if(bin == 26){
    return uH6.b;
  }
  if(bin == 27){
    return uH6.a;
  }
  if(bin == 28){
    return uH7.r;
  }
  if(bin == 29){
    return uH7.g;
  }
  if(bin == 30){
    return uH7.b;
  }
  if(bin == 31){
    return uH7.a;
  }
  if(bin == 32){
    return uH8.r;
  }
  if(bin == 33){
    return uH8.g;
  }
  if(bin == 34){
    return uH8.b;
  }
  if(bin == 35){
    return uH8.a;
  }
  return 0.0;
}

const float pi = 3.14159265359;

float interpolateOrientation()
{
  float peak_index = float(uOrientation);
  float peak_value = histValue(uOrientation);
  float left_value = histValue(uOrientation - 1);
  float right_value = histValue(uOrientation + 1);
  float interpolated_peak_index = (peak_index + 0.5 * (left_value - right_value) / (left_value - 2.0 * peak_value + right_value));
  if(interpolated_peak_index > 36.0){
    interpolated_peak_index -= 36.0;
  }

  float orientation = interpolated_peak_index * 10.0;

  if(abs(orientation - 360.) < 1e-7)
  {
    orientation = 0.0;
  }

  return orientation * pi / 180.0;
}

vec4 maskedPatch(vec2 uv, float angle)
{
  vec2 patchResolution = uPatchSize / uResolution;
  vec2 tl = (1.0 - patchResolution) * 0.5;
  vec2 br = tl + patchResolution;
  if(uv.x < tl.x || uv.x > br.x || uv.y < tl.y || uv.y > br.y){
    float gray = 0.25 * grayscale(texture2D(uCam, uv));
    return vec4(vec3(gray), 1.0);
  }

  float dx = (uv.x - 0.5) / patchResolution.x;
  float dy = (uv.y - 0.5) / patchResolution.y;
  float radius = sqrt(dx * dx + dy * dy);
  float dr = radius - 0.5;
  float circle_weight = exp(-0.5 * dr * dr / (0.02 * 0.02));

  float da = atan(dy, dx) - angle;
  if(da < -pi){
    da += 2.0 * pi;
  }else if(da > pi){
    da -= 2.0 * pi;
  }

  float line_weight = exp(-0.5 * da * da / (0.1 * 0.1));
  if(dr > 0.){
    line_weight = 0.0;
  }
  
  vec4 color = texture2D(uCam, uv);
  vec4 stroke = vec4(vec3(1.0, 0.0, 0.0), 1.0);

  return clamp((1.0 - circle_weight - line_weight) * color + circle_weight * stroke + line_weight * stroke, 0.0, 1.0);
}

float unpack(vec2 color)
{
  float x = color.x * 65280.0;
  float y = color.y * 255.0;
  return clamp(float(x + y) / 65535.0, 0.0, 1.0);
}

vec4 rotatedPatch(vec2 uv, float angle)
{
  vec2 patchResolution = uPatchSize / uResolution;  
  vec2 center = vec2(0.5, 0.5);
  vec2 offset = (uv - center) * patchResolution;
  vec2 cam_uv = vec2(center.x + offset.x * cos(angle) - offset.y * sin(angle),
                     center.y + offset.x * sin(angle) + offset.y * cos(angle));
  return texture2D(uCam, cam_uv);
}

void main() {
  vec2 uv = vTexCoord;

  uv.y = 1.0 - uv.y;

  float width = uResolution.x + uResolution.y;
  float height = uResolution.y + uHistogramSize;

  float v_div = uResolution.y / height;

  if(uv.y < v_div){
    uv.y = uv.y / v_div;
    float h_div = uResolution.x / width;
    float orientation = interpolateOrientation();

    if(uv.x < h_div){
      uv.x = (uv.x / h_div);
      if(uFlipped){
        uv.x = 1.0 - uv.x;
      }

      gl_FragColor = maskedPatch(uv, orientation);
    }else{
      uv.x = (uv.x - h_div) * 2.0;
      if(uFlipped){
        uv.x = 1.0 - uv.x;
      }

      gl_FragColor = rotatedPatch(uv, orientation);
    }
  }else{
    uv.y = uv.y - v_div;
    int bin = int(uv.x * 36.0);
    float value = histValue(bin);
    float maxPeak = histValue(uOrientation);
    float binDiv = (1.0 - v_div) * (1.0 - (value / maxPeak));
    if(uv.y < binDiv){
      gl_FragColor = vec4(vec3(1.0), 1.0);
    }else{
      float lhs = histValue(bin - 1);
      float rhs = histValue(bin + 1);
      if(bin == uOrientation){
        gl_FragColor = vec4(vec3(1.0, 0.0, 0.0), 1.0);
      }else if(value > lhs && value > rhs && value > 0.8 * maxPeak){ 
        gl_FragColor = vec4(vec3(0.0, 1.0, 0.0), 1.0);
      }else{
        gl_FragColor = vec4(vec3(0.0), 1.0);
      }
    }
  }
}