precision mediump float;

uniform int uMode;
uniform bool uFlipped;
uniform sampler2D uCam;
uniform sampler2D uPyramid0;
uniform sampler2D uPyramid1;
uniform sampler2D uPyramid2;
uniform sampler2D uPyramid3;
uniform sampler2D uPyramid4;
uniform sampler2D uDoG0;
uniform sampler2D uDoG1;
uniform sampler2D uDoG2;
uniform sampler2D uDoG3;
uniform sampler2D uDoG4;

uniform vec2 uCameraSize;
uniform vec2 uBufferSize;

varying vec2 vTexCoord;

vec4 getPyramidColor(vec2 uv, float x_size, sampler2D level0, sampler2D level1, sampler2D level2, sampler2D level3, sampler2D level4){
  if(uv.y > uBufferSize.y * 2.0){
    return vec4(1.0);
  }

  uv.y = uv.y / (2.0 * uBufferSize.y);
  int level;
  if(uv.y < 0.5){
    uv.y *= 2.0;
    level = 0;
  }else if(uv.y < 0.75){
    uv.y = (uv.y - 0.5) * 4.0;
    x_size *= 0.5;
    level = 1;
  }else if (uv.y < 0.875){
    uv.y = (uv.y - 0.75) * 8.0;
    x_size *= 0.25;
    level = 2;
  }else if (uv.y < 0.9375){
    uv.y = (uv.y - 0.875) * 16.0;
    x_size *= 0.125;
    level = 3;
  }else if(uv.y < 0.96875){
    uv.y = (uv.y - 0.9375) * 32.0;
    x_size *= 0.0625;
    level = 4;
  }else{
    return vec4(1.0);
  }

  float x_start = 0.5 * (1.0 - x_size);
  float x_end = x_start + x_size;
  uv.x = (uv.x - x_start) / x_size;
  if(uv.x < 0.0 || uv.x > 1.0){
    return vec4(1.0);
  }

  if(level == 0){
    return texture2D(level0, uv);
  }else if(level == 1){
    return texture2D(level1, uv);
  }else if(level == 2){
    return texture2D(level2, uv);
  }else if(level == 3){
    return texture2D(level3, uv);
  }else if(level == 4){
    return texture2D(level4, uv);
  }
}

vec4 getScaleSpaceColor(vec2 uv){
  return getPyramidColor(uv, 1.0, uPyramid0, uPyramid1, uPyramid2, uPyramid3, uPyramid4);
}

vec4 getDoGColor(vec2 uv){
  vec4 dog = getPyramidColor(uv, 0.8, uDoG0, uDoG1, uDoG2, uDoG3, uDoG4);
  vec3 rgb = (dog.rgb + 1.0) * 0.5;
  rgb = (rgb - 0.5) * 4.0 + 0.5;
  return vec4(rgb, 1.0);
}

void main() {
  vec2 uv = vTexCoord;

  uv.y = 1.0 - uv.y;

  if(uMode == 0){
    if(uFlipped){
      uv.x = 1.0 - uv.x;
    }
    float x_start = (1.0 - uCameraSize.x) * 0.5;
    float x = (uv.x - x_start) / uCameraSize.x;
    if(x < 0.0 || x >= 1.0){
      gl_FragColor = vec4(1.0);
    }else{
      gl_FragColor = texture2D(uCam, vec2(x, uv.y));
    }
  }else if(uMode == 1){
    // image pyramid
    gl_FragColor = getScaleSpaceColor(uv);
  }else if(uMode == 2){
    // DoG pyramid
    gl_FragColor = getDoGColor(uv);
  }else{
    gl_FragColor = vec4(vec3(1.0, 0.0, 0.0), 1.0);
  }
}
