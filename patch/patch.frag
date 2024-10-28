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

varying vec2 vTexCoord;

float grayscale(vec4 color) {
  return 0.2989 * color.r + 0.5870 * color.g + 0.1140 * color.b;
}

vec4 maskedPatch(vec2 uv)
{
  vec2 patchResolution = uPatchSize / uResolution;
  vec2 tl = (1.0 - patchResolution) * 0.5;
  vec2 br = tl + patchResolution;
  if(uv.x < tl.x || uv.x > br.x || uv.y < tl.y || uv.y > br.y){
    float gray = 0.25 * grayscale(texture2D(uCam, uv));
    return vec4(vec3(gray), 1.0);
  }

  return texture2D(uCam, uv);
}

vec4 rotatedPatch(vec2 uv)
{
  const float pi = 3.14159265359;
  vec2 patchResolution = uPatchSize / uResolution;
  float angle = float(uOrientation) * 10.0 * pi / 180.0;
  vec2 center = vec2(0.5, 0.5);
  vec2 offset = (uv - center) * patchResolution;
  uv.x = center.x + offset.x * cos(angle) - offset.y * sin(angle);
  uv.y = center.y + offset.x * sin(angle) + offset.y * cos(angle);
  return texture2D(uCam, uv);
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

    if(uv.x < h_div){
      uv.x = (uv.x / h_div);
      if(uFlipped){
        uv.x = 1.0 - uv.x;
      }

      gl_FragColor = maskedPatch(uv);
    }else{
      uv.x = (uv.x - h_div) * 2.0;
      if(uFlipped){
        uv.x = 1.0 - uv.x;
      }

      gl_FragColor = rotatedPatch(uv);
    }
  }else{
    uv.y = uv.y - v_div;
    int bin = int(uv.x * 36.0);
    
    float value;
    if(bin == 0){
      value = uH0.r;
    }else if(bin == 1){
      value = uH0.g;
    }else if(bin == 2){
      value = uH0.b;
    }else if(bin == 3){
      value = uH0.a;
    }else if(bin == 4){
      value = uH1.r;
    }else if(bin == 5){
      value = uH1.g;
    }else if(bin == 6){
      value = uH1.b;
    }else if(bin == 7){
      value = uH1.a;
    }else if(bin == 8){
      value = uH2.r;
    }else if(bin == 9){
      value = uH2.g;
    }else if(bin == 10){
      value = uH2.b;
    }else if(bin == 11){
      value = uH2.a;
    }else if(bin == 12){
      value = uH3.r;
    }else if(bin == 13){
      value = uH3.g;
    }else if(bin == 14){
      value = uH3.b;
    }else if(bin == 15){
      value = uH3.a;
    }else if(bin == 16){
      value = uH4.r;
    }else if(bin == 17){
      value = uH4.g;
    }else if(bin == 18){
      value = uH4.b;
    }else if(bin == 19){
      value = uH4.a;
    }else if(bin == 20){
      value = uH5.r;
    }else if(bin == 21){
      value = uH5.g;
    }else if(bin == 22){
      value = uH5.b;
    }else if(bin == 23){
      value = uH5.a;
    }else if(bin == 24){
      value = uH6.r;
    } else if(bin == 25){
      value = uH6.g;
    }else if(bin == 26){
      value = uH6.b;
    }else if(bin == 27){
      value = uH6.a;
    }else if(bin == 28){
      value = uH7.r;
    }else if(bin == 29){
      value = uH7.g;
    }else if(bin == 30){
      value = uH7.b;
    }else if(bin == 31){
      value = uH7.a;
    }else if(bin == 32){
      value = uH8.r;
    }else if(bin == 33){
      value = uH8.g;
    }else if(bin == 34){
      value = uH8.b;
    }else if(bin == 35){
      value = uH8.a;
    }

    float binDiv = (1.0 - v_div) * (1.0 - value);
    if(uv.y < binDiv){
      gl_FragColor = vec4(vec3(1.0), 1.0);
    }else{
      if(bin == uOrientation){
        gl_FragColor = vec4(vec3(1.0, 0.0, 0.0), 1.0);
      }else{
        gl_FragColor = vec4(vec3(0.0), 1.0);
      }
    }
  }
}