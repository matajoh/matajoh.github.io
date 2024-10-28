precision highp float;

uniform float uThreshold;
uniform sampler2D uSampler;
uniform vec2 uResolution;

varying vec2 vTexCoord;

float unpack(vec4 color)
{
  int r = int(color.r * 255.0);
  int g = int(color.g * 255.0);
  int b = int(color.b * 255.0);
  return float(r * 65536 + g * 256 + b) / 16777215.0;
}

float dog(vec2 uv){
    float dog = unpack(texture2D(uSampler, uv));
    dog = (dog - 0.5) * 2.0;
    return dog;
}

bool is_minimum(mat3 m, float value, bool omit_center) {
    for(int i=0; i<3; i++) {
        for(int j=0; j<3; j++) {
            if(omit_center && i == 1 && j == 1) {
                continue;
            }

            if(m[i][j] <= value){
                return false;
            }
        }
    }

    return true;
}

bool is_maximum(mat3 m, float value, bool omit_center) {
    for(int i=0; i<3; i++) {
        for(int j=0; j<=3; j++) {
            if(omit_center && i == 1 && j == 1) {
                continue;
            }

            if(m[i][j] >= value){
                return false;
            }
        }
    }

    return true;
}

mat3 extract_patch(vec2 center){
    vec2 dx = vec2(1.0, 0.0) / uResolution;
    vec2 dy = vec2(0.0, 1.0) / uResolution;
    return mat3(
        dog(center - dx - dy), dog(center - dy), dog(center + dx - dy),
        dog(center - dx), dog(center), dog(center + dx),
        dog(center - dx + dy), dog(center + dy), dog(center + dx + dy)
    );
}

mat3 hessian(mat3 bottom, mat3 middle, mat3 top){
    float center_pixel_value = middle[1][1];
    float dxx = middle[1][2] - 2.0 * center_pixel_value + middle[1][0];
    float dyy = middle[2][1] - 2.0 * center_pixel_value + middle[0][1];
    float dss = top[1][1] - 2.0 * center_pixel_value + bottom[1][1];
    float dxy = 0.25 * (middle[2][2] - middle[2][0] - middle[0][2] + middle[0][0]);
    float dxs = 0.25 * (top[1][2] - top[1][0] - bottom[1][2] + bottom[1][0]);
    float dys = 0.25 * (top[2][1] - top[0][1] - bottom[2][1] + bottom[0][1]);
    return mat3(dxx, dxy, dxs, 
                dxy, dyy, dys,
                dxs, dys, dss);
}

void main() {
    vec2 uv = vTexCoord;
    vec2 offset = vec2(0.25, 0.0);

    uv.x = (uv.x * 0.5) + 0.25;
    float value = dog(uv);

    if(abs(value) < uThreshold){
        gl_FragColor = vec4(vec3(0.0), 1.0);
        return;
    }

    mat3 top = extract_patch(uv + offset);
    mat3 middle = extract_patch(uv);
    mat3 bottom = extract_patch(uv - offset);

    if(value < 0.0){
        if(!is_minimum(middle, value, true)){
            gl_FragColor = vec4(vec3(0.0), 1.0);
            return;
        }

        if(!is_minimum(top, value, false)){
            gl_FragColor = vec4(vec3(0.0), 1.0);
            return;
        }

        if(!is_minimum(bottom, value, false)){
            gl_FragColor = vec4(vec3(0.0), 1.0);
            return;
        }
    }else{
        if(!is_maximum(middle, value, true)){
            gl_FragColor = vec4(vec3(0.0), 1.0);
            return;
        }

        if(!is_maximum(top, value, false)){
            gl_FragColor = vec4(vec3(0.0), 1.0);
            return;
        }

        if(!is_maximum(bottom, value, false)){
            gl_FragColor = vec4(vec3(0.0), 1.0);
            return;
        }
    }
    
    mat3 hess = hessian(bottom, middle, top);    
    float xy_hess_trace = hess[0][0] + hess[1][1];
    float xy_hess_det = hess[0][0] * hess[1][1] - hess[0][1] * hess[1][0];
    float ei_ratio = 10.0;
    if(xy_hess_det > 0.0){
        if(ei_ratio * (xy_hess_trace * xy_hess_trace) < (pow(ei_ratio, 2.0) * xy_hess_det)){
            if(value < 0.0){
                gl_FragColor = vec4(vec3(1.0, 0.0, 1.0), 1.0);
            }else{
                gl_FragColor = vec4(vec3(1.0, 1.0, 0.0), 1.0);
            }
            return;
        }
    }
    
    gl_FragColor = vec4(vec3(0.0), 1.0);;
}