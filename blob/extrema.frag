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

float get(float arr[36], int i){
    if(i == 0){
        return arr[0];
    }
    if(i == 1){
        return arr[1];
    }
    if(i == 2){
        return arr[2];
    }
    if(i == 3){
        return arr[3];
    }
    if(i == 4){
        return arr[4];
    }
    if(i == 5){
        return arr[5];
    }
    if(i == 6){
        return arr[6];
    }
    if(i == 7){
        return arr[7];
    }
    if(i == 8){
        return arr[8];
    }
    if(i == 9){
        return arr[9];
    }
    if(i == 10){
        return arr[10];
    }
    if(i == 11){
        return arr[11];
    }
    if(i == 12){
        return arr[12];
    }
    if(i == 13){
        return arr[13];
    }
    if(i == 14){
        return arr[14];
    }
    if(i == 15){
        return arr[15];
    }
    if(i == 16){
        return arr[16];
    }
    if(i == 17){
        return arr[17];
    }
    if(i == 18){
        return arr[18];
    }
    if(i == 19){
        return arr[19];
    }
    if(i == 20){
        return arr[20];
    }
    if(i == 21){
        return arr[21];
    }
    if(i == 22){
        return arr[22];
    }
    if(i == 23){
        return arr[23];
    }
    if(i == 24){
        return arr[24];
    }
    if(i == 25){
        return arr[25];
    }
    if(i == 26){
        return arr[26];
    }
    if(i == 27){
        return arr[27];
    }
    if(i == 28){
        return arr[28];
    }
    if(i == 29){
        return arr[29];
    }
    if(i == 30){
        return arr[30];
    }
    if(i == 31){
        return arr[31];
    }
    if(i == 32){
        return arr[32];
    }
    if(i == 33){
        return arr[33];
    }
    if(i == 34){
        return arr[34];
    }
    if(i == 35){
        return arr[35];
    }    

    return arr[0];
}

void set(float arr[36], int i, float value){
    if(i == 0){
        arr[0] = value;
    }else if(i == 1){
        arr[1] = value;
    }else if(i == 2){
        arr[2] = value;
    }else if(i == 3){
        arr[3] = value;
    }else if(i == 4){
        arr[4] = value;
    }else if(i == 5){
        arr[5] = value;
    }else if(i == 6){
        arr[6] = value;
    }else if(i == 7){
        arr[7] = value;
    }else if(i == 8){
        arr[8] = value;
    }else if(i == 9){
        arr[9] = value;
    }else if(i == 10){
        arr[10] = value;
    }else if(i == 11){
        arr[11] = value;
    }else if(i == 12){
        arr[12] = value;
    }else if(i == 13){
        arr[13] = value;
    }else if(i == 14){
        arr[14] = value;
    }else if(i == 15){
        arr[15] = value;
    }else if(i == 16){
        arr[16] = value;
    }else if(i == 17){
        arr[17] = value;
    }else if(i == 18){
        arr[18] = value;
    }else if(i == 19){
        arr[19] = value;
    }else if(i == 20){
        arr[20] = value;
    }else if(i == 21){
        arr[21] = value;
    }else if(i == 22){
        arr[22] = value;
    }else if(i == 23){
        arr[23] = value;
    }else if(i == 24){
        arr[24] = value;
    }else if(i == 25){
        arr[25] = value;
    }else if(i == 26){
        arr[26] = value;
    }else if(i == 27){
        arr[27] = value;
    }else if(i == 28){
        arr[28] = value;
    }else if(i == 29){
        arr[29] = value;
    }else if(i == 30){
        arr[30] = value;
    }else if(i == 31){
        arr[31] = value;
    }else if(i == 32){
        arr[32] = value;
    }else if(i == 33){
        arr[33] = value;
    }else if(i == 34){
        arr[34] = value;
    }else if(i == 35){
        arr[35] = value;
    }    
}

void inc(float arr[36], int i, float value){
    set(arr, i, get(arr, i) + value);
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

    float hist[36];

    hist[0] = 0.0;
    hist[1] = 0.0;
    hist[2] = 0.0;
    hist[3] = 0.0;
    hist[4] = 0.0;
    hist[5] = 0.0;
    hist[6] = 0.0;
    hist[7] = 0.0;
    hist[8] = 0.0;
    hist[9] = 0.0;
    hist[10] = 0.0;
    hist[11] = 0.0;
    hist[12] = 0.0;
    hist[13] = 0.0;
    hist[14] = 0.0;
    hist[15] = 0.0;
    hist[16] = 0.0;
    hist[17] = 0.0;
    hist[18] = 0.0;
    hist[19] = 0.0;
    hist[20] = 0.0;
    hist[21] = 0.0;
    hist[22] = 0.0;
    hist[23] = 0.0;
    hist[24] = 0.0;
    hist[25] = 0.0;
    hist[26] = 0.0;
    hist[27] = 0.0;
    hist[28] = 0.0;
    hist[29] = 0.0;
    hist[30] = 0.0;
    hist[31] = 0.0;
    hist[32] = 0.0;
    hist[33] = 0.0;
    hist[34] = 0.0;
    hist[35] = 0.0;
    
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
            int bin = int(g.y * 36.0);
            inc(hist, bin, weight * g.x);
        }
    }

    float peak_value = 0.0;
    int peak_index = 0;
    float smoothed_hist[36];
    for(int i=0; i<36; i++){
        set(smoothed_hist, i, 0.375 * get(hist, i));
        int left1 = i - 1;
        if(left1 < 0){
            left1 += 36;
        }
        int left2 = i - 2;
        if(left2 < 0){
            left2 += 36;
        }
        int right1 = i + 1;
        if(right1 >= 36){
            right1 -= 36;
        }
        int right2 = i + 2;
        if(right2 >= 36){
            right2 -= 36;
        }
        inc(smoothed_hist, i, 0.25 * (get(hist, left1) + get(hist, right1)));
        inc(smoothed_hist, i,  0.0625 * (get(hist, left2) + get(hist, right2)));
        float value = get(smoothed_hist, i);
        if(value > peak_value){
            peak_value = value;
            peak_index = i;
        }
    }

    gl_FragColor = vec4(1.0, (float(peak_index) * 7.0) / 255.0, 0.0, 1.0);
}