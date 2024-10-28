precision mediump float;

uniform int uLevel;
uniform int uPass;
uniform sampler2D uSampler;
uniform vec2 uResolution;
uniform bool uFlipped;

varying vec2 vTexCoord;

vec4 blur1(sampler2D image, vec2 uv, vec2 resolution, vec2 direction) {
  vec2 off1 = 1.3575675223704418 * direction / resolution;
  vec2 off2 = 3.20307462818947 * direction / resolution;
  vec4 color = texture2D(image, uv) * 0.25040446810988803;
  color += texture2D(image, uv + off1) * 0.32062061642894885;
  color += texture2D(image, uv - off1) * 0.32062061642894885;
  color += texture2D(image, uv + off2) * 0.05417714951610714;
  color += texture2D(image, uv - off2) * 0.05417714951610714;
  return color;  
}

vec4 blur2(sampler2D image, vec2 uv, vec2 resolution, vec2 direction) {
  vec2 off1 = 1.4513265055870015 * direction / resolution;
  vec2 off2 = 3.387999471950795 * direction / resolution;
  vec2 off3 = 5.3282422606446 * direction / resolution;
  vec2 off4 = 7.273574391024811 * direction / resolution;
  vec4 color = texture2D(image, uv) * 0.14425067804329547;
  color += texture2D(image, uv + off1) * 0.24633691729814775;
  color += texture2D(image, uv - off1) * 0.24633691729814775;
  color += texture2D(image, uv + off2) * 0.13118876490474946;
  color += texture2D(image, uv - off2) * 0.13118876490474946;
  color += texture2D(image, uv + off3) * 0.042174085703178134;
  color += texture2D(image, uv - off3) * 0.042174085703178134;
  color += texture2D(image, uv + off4) * 0.008174893072276888;
  color += texture2D(image, uv - off4) * 0.008174893072276888;
  return color;
}

vec4 blur3(sampler2D image, vec2 uv, vec2 resolution, vec2 direction) {
  vec2 off1 = 1.4790858706770835 * direction / resolution;
  vec2 off2 = 3.4513265055870015 * direction / resolution;
  vec2 off3 = 5.423866796623095 * direction / resolution;
  vec2 off4 = 7.396869331062852 * direction / resolution;
  vec2 off5 = 9.370485651861337 * direction / resolution;
  vec2 off6 = 11.344853073931679 * direction / resolution;
  vec4 color = texture2D(image, uv) * 0.09453233951853648;
  color += texture2D(image, uv + off1) * 0.1764804803148875;
  color += texture2D(image, uv - off1) * 0.1764804803148875;
  color += texture2D(image, uv + off2) * 0.13403187755949905;
  color += texture2D(image, uv - off2) * 0.13403187755949905;
  color += texture2D(image, uv + off3) * 0.08168037291331459;
  color += texture2D(image, uv - off3) * 0.08168037291331459;
  color += texture2D(image, uv + off4) * 0.039939903055972586;
  color += texture2D(image, uv - off4) * 0.039939903055972586;
  color += texture2D(image, uv + off5) * 0.015669309386665456;
  color += texture2D(image, uv - off5) * 0.015669309386665456;
  color += texture2D(image, uv + off6) * 0.004931887010392484;
  color += texture2D(image, uv - off6) * 0.004931887010392484;
  return color;
}

vec4 blur4(sampler2D image, vec2 uv, vec2 resolution, vec2 direction) {
  vec2 off1 = 1.490235616573984 * direction / resolution;
  vec2 off2 = 3.477229303567219 * direction / resolution;
  vec2 off3 = 5.464253797352863 * direction / resolution;
  vec2 off4 = 7.4513265055870015 * direction / resolution;
  vec2 off5 = 9.438464576727686 * direction / resolution;
  vec2 off6 = 11.425684810159542 * direction / resolution;
  vec2 off7 = 13.413003570253682 * direction / resolution;
  vec2 off8 = 15.400436705274199 * direction / resolution;
  vec2 off9 = 17.387999471950796 * direction / resolution;
  vec4 color = texture2D(image, uv) * 0.06455992996719914;
  color += texture2D(image, uv + off1) * 0.12500825300400698;
  color += texture2D(image, uv - off1) * 0.12500825300400698;
  color += texture2D(image, uv + off2) * 0.10983934400818976;
  color += texture2D(image, uv - off2) * 0.10983934400818976;
  color += texture2D(image, uv + off3) * 0.08702259855498484;
  color += texture2D(image, uv - off3) * 0.08702259855498484;
  color += texture2D(image, uv + off4) * 0.062167033306840785;
  color += texture2D(image, uv - off4) * 0.062167033306840785;
  color += texture2D(image, uv + off5) * 0.04004432073634035;
  color += texture2D(image, uv - off5) * 0.04004432073634035;
  color += texture2D(image, uv + off6) * 0.02325802021434619;
  color += texture2D(image, uv - off6) * 0.02325802021434619;
  color += texture2D(image, uv + off7) * 0.012180175209971647;
  color += texture2D(image, uv - off7) * 0.012180175209971647;
  color += texture2D(image, uv + off8) * 0.005751497007677878;
  color += texture2D(image, uv - off8) * 0.005751497007677878;
  color += texture2D(image, uv + off9) * 0.0024487929740419803;
  color += texture2D(image, uv - off9) * 0.0024487929740419803;
  return color;
}

vec4 grayscale(vec4 color) {
  float val = 0.2989 * color.r + 0.5870 * color.g + 0.1140 * color.b;
  return vec4(vec3(val), 1.0);
}

void main() {
  vec2 uv = vTexCoord;

  if(uFlipped && uLevel == 0 && uPass == 0){
    uv.x = 1.0 - uv.x;
  }

  float x = uv.x * 5.0;
  int interval = int(x);
  if(uPass < 1){
    if(uLevel == 0){
      if(uPass == -1){
        // copy in the camera and do the horizontal blur
        uv.x = fract(x);
        gl_FragColor = grayscale(blur1(uSampler, uv, uResolution, vec2(1.0, 0.0)));
      }else{
        gl_FragColor = blur1(uSampler, uv, uResolution, vec2(0.0, 1.0));
      }
    }else{
      // Copy in the result of the previous pyramid
      uv.x = (2.0 + fract(x)) / 5.0;
      gl_FragColor = texture2D(uSampler, uv);
    }
  }else{
    vec2 direction;
    if(uPass == 1){
      direction = vec2(1.0, 0.0);
    }else{
      direction = vec2(0.0, 1.0);
    }
    
    if(interval == 0){
      gl_FragColor = texture2D(uSampler, uv);
    }else if(interval == 1){
      gl_FragColor = blur1(uSampler, uv, uResolution, direction);
    }else if(interval == 2){
      gl_FragColor = blur2(uSampler, uv, uResolution, direction);
    }else if(interval == 3){
      gl_FragColor = blur3(uSampler, uv, uResolution, direction);
    }else if(interval == 4){
      gl_FragColor = blur4(uSampler, uv, uResolution, direction);
    }
  }
}