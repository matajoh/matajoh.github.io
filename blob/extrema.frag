precision highp float;

uniform float uThreshold;
uniform sampler2D uDoG;
uniform vec2 uDoGSize;
uniform sampler2D uPyramid;
uniform vec2 uPyramidSize;

varying vec2 vTexCoord;

const float pi = 3.14159265359;
const float weightFactor = -0.5 / (1.6 * 1.6);

float unpack(vec4 color)
{
  int r = int(color.r * 255.0);
  int g = int(color.g * 255.0);
  int b = int(color.b * 255.0);
  return float(r * 65536 + g * 256 + b) / 16777215.0;
}

float dog(vec2 uv){
    float dog = unpack(texture2D(uDoG, uv));
    dog = (dog - 0.5) * 2.0;
    return dog;
}

float grayscale(vec2 uv){
    return unpack(texture2D(uPyramid, uv));
}

vec2 gradient(vec2 uv){
    vec2 dx = vec2(1.0, 0.0) / uPyramidSize;
    vec2 dy = vec2(0.0, 1.0) / uPyramidSize;
    float left = grayscale(uv - dx);
    float right = grayscale(uv + dx);
    float top = grayscale(uv - dy);
    float bottom = grayscale(uv + dy);
    float gx = right - left;
    float gy = bottom - top;
    float mag = length(vec2(gx, gy));
    float theta = atan(gy, gx);
    if(theta < 0.0){
        theta += 2.0 * pi;
    }

    theta = clamp(theta / (2.0 * pi), 0.0, 1.0);
    return vec2(mag, theta);
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
    vec2 dx = vec2(1.0, 0.0) / uDoGSize;
    vec2 dy = vec2(0.0, 1.0) / uDoGSize;
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

mat4 set(mat4 m, int index, float value){
    if(index == 0){
        m[0][0] = value;
    }else if(index == 1){
        m[0][1] = value;
    }else if(index == 2){
        m[0][2] = value;
    }else if(index == 3){
        m[0][3] = value;
    }else if(index == 4){
        m[1][0] = value;
    }else if(index == 5){
        m[1][1] = value;
    }else if(index == 6){
        m[1][2] = value;
    }else if(index == 7){
        m[1][3] = value;
    }else if(index == 8){
        m[2][0] = value;
    }else if(index == 9){
        m[2][1] = value;
    }else if(index == 10){
        m[2][2] = value;
    }else if(index == 11){
        m[2][3] = value;
    }else if(index == 12){
        m[3][0] = value;
    }else if(index == 13){
        m[3][1] = value;
    }else if(index == 14){
        m[3][2] = value;
    }else if(index == 15){
        m[3][3] = value;
    }

    return m;
}

float get(mat4 m, int index){
    if(index == 0){
        return m[0][0];
    }else if(index == 1){
        return m[0][1];
    }else if(index == 2){
        return m[0][2];
    }else if(index == 3){
        return m[0][3];
    }else if(index == 4){
        return m[1][0];
    }else if(index == 5){
        return m[1][1];
    }else if(index == 6){
        return m[1][2];
    }else if(index == 7){
        return m[1][3];
    }else if(index == 8){
        return m[2][0];
    }else if(index == 9){
        return m[2][1];
    }else if(index == 10){
        return m[2][2];
    }else if(index == 11){
        return m[2][3];
    }else if(index == 12){
        return m[3][0];
    }else if(index == 13){
        return m[3][1];
    }else if(index == 14){
        return m[3][2];
    }else if(index == 15){
        return m[3][3];
    }

    return 0.0;
}

mat4 inc(mat4 m, int index, float value){
    return set(m, index, get(m, index) + value);
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
    if(xy_hess_det <= 0.0){
        gl_FragColor = vec4(vec3(0.0), 1.0);
        return;
    }

    if(ei_ratio * (xy_hess_trace * xy_hess_trace) >= (pow(ei_ratio, 2.0) * xy_hess_det)){
        gl_FragColor = vec4(vec3(0.0), 1.0);
        return;
    }

    mat4 hist;

    vec2 dx = vec2(1.0, 0.0) / uPyramidSize;
    vec2 dy = vec2(0.0, 1.0) / uPyramidSize;
    for(int i=0; i<16; i++){
        vec2 dr = (float(i) - 7.5) * dy;
        for(int j=0; j<16; j++){
            vec2 dc = (float(j) - 7.5) * dx;
            vec2 offset = dr + dc;
            float weight = exp(weightFactor * (offset.x * offset.x + offset.y * offset.y));
            vec2 neighbor = uv + dx + dr;
            vec2 g = gradient(neighbor);
            int bin = int(g.y * 16.0);
            hist = inc(hist, bin, weight * g.x);
        }
    }

    mat4 smoothed_hist;
    float peak_value = 0.0;
    int peak_index = 0;
    for(int i=0; i<16; i++){
        smoothed_hist = set(smoothed_hist, i, 0.375 * get(hist, i));
        int left1 = i - 1;
        if(left1 < 0){
            left1 += 16;
        }
        int left2 = i - 2;
        if(left2 < 0){
            left2 += 16;
        }
        int right1 = i + 1;
        if(right1 >= 16){
            right1 -= 16;
        }
        int right2 = i + 2;
        if(right2 >= 16){
            right2 -= 16;
        }
        smoothed_hist = inc(smoothed_hist, i, 0.25 * (get(hist, left1) + get(hist, right1)));
        smoothed_hist = inc(smoothed_hist, i,  0.0625 * (get(hist, left2) + get(hist, right2)));
        float value = get(smoothed_hist, i);
        if(value > peak_value){
            peak_value = value;
            peak_index = i;
        }
    }

    gl_FragColor = vec4(1.0, (float(peak_index) * 16.0) / 255.0, 0.0, 1.0);
}