precision mediump float;

uniform sampler2D uSampler;

varying vec2 vTexCoord;

void main() {
    vec2 uv = vTexCoord;

    vec2 uv0 = vec2(uv.x * 4.0 / 5.0, uv.y);
    vec2 uv1 = vec2(uv0.x + 0.2, uv.y);

    vec3 g0 = texture2D(uSampler, uv0).rgb;
    vec3 g1 = texture2D(uSampler, uv1).rgb;
    vec3 dog = g1 - g0;
    
    gl_FragColor = vec4(dog, 1.0);
}