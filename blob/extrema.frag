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

vec2 xy_gradient(mat3 middle){
    float dx = 0.5 * (middle[1][2] - middle[1][0]);
    float dy = 0.5 * (middle[2][1] - middle[0][1]);
    return vec2(dx, dy);
}

mat2 xy_hessian(mat3 middle){
    float dxx = middle[1][2] - 2.0 * middle[1][1] + middle[1][0];
    float dyy = middle[2][1] - 2.0 * middle[1][1] + middle[0][1];
    float dxy = 0.25 * (middle[2][2] - middle[2][0] - middle[0][2] + middle[0][0]);
    return mat2(dxx, dxy, dxy, dyy);
}

float det2(mat2 m){
    return m[0][0] * m[1][1] - m[0][1] * m[1][0];
}

mat2 inverse2(mat2 m){
    float det = det2(m);
    if(det == 0.0){
        return mat2(0.0);
    }

    mat2 adj = mat2(m[1][1], -m[0][1], -m[1][0], m[0][0]);
    return adj / det;
}

void main() {
    vec2 uv = vTexCoord;
    vec2 offset = vec2(0.25, 0.0);

    uv.x = (uv.x * 0.5) + 0.25;
    float value = dog(uv);

    gl_FragColor = vec4(vec3(0.0), 1.0);
    if(abs(value) < uThreshold){
        return;
    }

    mat3 top = extract_patch(uv + offset);
    mat3 middle = extract_patch(uv);
    mat3 bottom = extract_patch(uv - offset);

    if(value < 0.0){
        if(!is_minimum(middle, value, true)){
            return;
        }

        if(!is_minimum(top, value, false)){
            return;
        }

        if(!is_minimum(bottom, value, false)){
            return;
        }
    }else{
        if(!is_maximum(middle, value, true)){
            return;
        }

        if(!is_maximum(top, value, false)){
            return;
        }

        if(!is_maximum(bottom, value, false)){
            return;
        }
    }
    
    mat2 xy_hess = xy_hessian(middle);

    vec2 xy_grad = xy_gradient(middle);
    vec2 xy = uv;
    for(int i=0; i<5; i++){
        vec2 update = -inverse2(xy_hess) * xy_grad;
        if(abs(update.x) < 0.5 && abs(update.y) < 0.5){
            break;
        }

        xy += update / uResolution;
        middle = extract_patch(xy);
        xy_grad = xy_gradient(middle);
        xy_hess = xy_hessian(middle);
    }

    value = dog(xy);
    if(abs(value) < uThreshold){
        return;
    }

    vec2 update = (xy - uv);

    const float ei_ratio = 10.0;
    float xy_hess_det = det2(xy_hess);
    float xy_hess_trace = xy_hess[0][0] + xy_hess[1][1];

    if(xy_hess_det <= 0.0){
        return;
    }

    if(ei_ratio * (xy_hess_trace * xy_hess_trace) >= (pow(ei_ratio, 2.0) * xy_hess_det)){
        return;
    }
   
    gl_FragColor = vec4(update.y, update.x, 1.0, 1.0);
}