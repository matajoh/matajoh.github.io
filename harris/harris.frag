#pragma vscode_glsllint_stage frag
precision mediump float;

float grayscale(vec4 color) {
  return 0.2989 * color.r + 0.5870 * color.g + 0.1140 * color.b;
}

vec3 sobel(sampler2D image, vec2 uv, vec2 resolution) {
    vec2 dx = vec2(1.0, 0.0) / resolution.x;
    vec2 dy = vec2(0.0, 1.0) / resolution.y;

    float k00 = grayscale(texture2D(image, uv - dy - dx));
    float k01 = grayscale(texture2D(image, uv - dy));
    float k02 = grayscale(texture2D(image, uv - dy + dx));
    float k10 = grayscale(texture2D(image, uv - dx));
    float k12 = grayscale(texture2D(image, uv + dx));
    float k20 = grayscale(texture2D(image, uv + dy - dx));
    float k21 = grayscale(texture2D(image, uv + dy));
    float k22 = grayscale(texture2D(image, uv + dy + dx));

    float gx = (k00 - k02) + 2.0 * (k10 - k12) + (k20 - k22);
    float gy = (k00 - k20) + 2.0 * (k01 - k21) + (k02 - k22);
    return vec3(gx * gx, gy * gy, gx * gy);
}

vec3 blurred_matrix(sampler2D image, vec2 uv, vec2 resolution) {
    vec2 dx = vec2(1.0, 0.0) / resolution.x;
    vec2 dy = vec2(0.0, 1.0) / resolution.y;

    vec3 matrix = sobel(image, uv - dy - dx, resolution) * 0.0625;
    matrix += sobel(image, uv - dy, resolution) * 0.125;
    matrix += sobel(image, uv - dy + dx, resolution) * 0.0625;
    matrix += sobel(image, uv - dx, resolution) * 0.125;
    matrix += sobel(image, uv, resolution) * 0.25;
    matrix += sobel(image, uv + dx, resolution) * 0.125;
    matrix += sobel(image, uv + dy - dx, resolution) * 0.0625;
    matrix += sobel(image, uv + dy, resolution) * 0.125;
    matrix += sobel(image, uv + dy + dx, resolution) * 0.0625;

    return matrix; 
}

float response(sampler2D image, vec2 uv, vec2 resolution) {
    vec3 M = blurred_matrix(image, uv, resolution);

    float det = M.x * M.y - M.z * M.z;
    float trace = M.x + M.y;
    float k = 0.04;
    return det - k * trace * trace;
}

vec4 harrisEdges(
    sampler2D image,
    vec2 uv,
    vec2 resolution,
    float threshold,
    bool showEdges
) {
    float h11 = response(image, uv, resolution);
    if(h11 < -0.025){
        // edge
        if(showEdges){
            return vec4(vec3(1.0, 0.0, 0.0), 1.0);
        }else{
            return texture2D(image, uv);
        }
    }

    // corner
    vec2 dx = vec2(1.0, 0.0) / resolution.x;
    vec2 dy = vec2(0.0, 1.0) / resolution.y;

    float h00 = response(image, uv - dy - dx, resolution);
    float h01 = response(image, uv - dy, resolution);
    float h02 = response(image, uv - dy + dx, resolution);
    float h10 = response(image, uv - dx, resolution);
    float h12 = response(image, uv + dx, resolution);
    float h20 = response(image, uv + dy - dx, resolution);
    float h21 = response(image, uv + dy, resolution);
    float h22 = response(image, uv + dy + dx, resolution);

    float max_h = max(max(max(max(max(max(max(h00, h01), h02), h10), h11), h12), h20), h21);

    if(max_h < threshold){
        return texture2D(image, uv);
    }
    
    return vec4(vec3(0.0, 1.0, 0.0), 1.0);
}

uniform sampler2D uSampler;
uniform vec2 uResolution;
uniform float uThreshold;
uniform bool uShowEdges;

varying vec2 vTexCoord;

void main() {
  vec2 uv = vTexCoord;
  uv = 1.0 - uv;
 
  gl_FragColor = harrisEdges(uSampler, uv, uResolution, uThreshold, uShowEdges);
}