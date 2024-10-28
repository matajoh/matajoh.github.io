precision mediump float;

uniform float uThreshold;
uniform sampler2D uSampler;
uniform vec2 uResolution;

varying vec2 vTexCoord;

float dog(vec2 uv){
    float dog = texture2D(uSampler, uv).r;
    return (dog - 0.5) * 2.0;
}

bool is_minimum(vec2 center, float value, bool omit_center) {
    vec2 dx = vec2(1.0, 0.0) / uResolution;
    vec2 dy = vec2(0.0, 1.0) / uResolution;
    for(int i=-1; i<=1; i++) {
        vec2 row = float(i) * dy;
        for(int j=-1; j<=1; j++) {
            if(omit_center && i == 0 && j == 0) {
                continue;
            }

            vec2 pos = row + float(j) * dx;
            float neighbor = dog(center + pos);
            if(neighbor < value){
                return false;
            }
        }
    }

    return true;
}

bool is_maximum(vec2 center, float value, bool omit_center) {
    vec2 dx = vec2(1.0, 0.0) / uResolution;
    vec2 dy = vec2(0.0, 1.0) / uResolution;
    for(int i=-1; i<=1; i++) {
        vec2 row = float(i) * dy;
        for(int j=-1; j<=1; j++) {
            if(omit_center && i == 0 && j == 0) {
                continue;
            }

            vec2 pos = row + float(j) * dx;
            float neighbor = dog(center + pos);
            if(neighbor > value){
                return false;
            }
        }
    }

    return true;
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

    if(value < 0.0){
        if(!is_minimum(uv, value, true)){
            gl_FragColor = vec4(vec3(0.0), 1.0);
            return;
        }

        if(!is_minimum(uv + vec2(0.25, 0.0), value, false)){
            gl_FragColor = vec4(vec3(0.0), 1.0);
            return;
        }

        if(!is_minimum(uv + vec2(-0.25, 0.0), value, false)){
            gl_FragColor = vec4(vec3(0.0), 1.0);
            return;
        }
    }else{
        if(!is_maximum(uv, value, true)){
            gl_FragColor = vec4(vec3(0.0), 1.0);
            return;
        }

        if(!is_maximum(uv + vec2(0.25, 0.0), value, false)){
            gl_FragColor = vec4(vec3(0.0), 1.0);
            return;
        }

        if(!is_maximum(uv + vec2(-0.25, 0.0), value, false)){
            gl_FragColor = vec4(vec3(0.0), 1.0);
            return;
        }
    }
    
    // TODO add dominant orientation computation here (test out in other dedicated demo first)
    gl_FragColor = vec4(vec3(1.0, 0.0, 0.0), 1.0);

}