/**
* Calculates transformed vertices and provides
* normals and interpolated fragment positions.
*/
export const vertexNormalFrag: string = `#version 300 es
precision lowp float;
in vec4 aPos, aNorm;
uniform mat4 uMat;
out vec3 vNormal, vFragPos;

void main() {
    gl_Position = uMat * aPos;
    vFragPos = aPos.xyz;
    vNormal = aNorm.xyz;
}`;

/**
* Calculates transformed vertices and provides (without normals)
* interpolated fragment positions.
*/
export const vertexFrag: string = `#version 300 es
precision lowp float;
in vec4 aPos;
uniform mat4 uMat;
out vec3 vFragPos;

void main() {
    gl_Position = uMat * aPos;
    vFragPos = aPos.xyz;
}`;

/**
* Calculates fragment colors using normals
*/
export const fragmentNormal: string = `#version 300 es
precision lowp float;
in vec3 vNormal;
out vec4 outColor;

void main() {
    vec3 norm = normalize(vNormal);
    outColor = vec4(norm, 1.);
}`

/**
* Calculates fragment lights using Phong lighting (ambient+diffuse+spectacular)
*/
export const fragmentPhong: string = `#version 300 es
precision lowp float;
in vec3 vNormal, vFragPos;
uniform vec3 uColor, uLightPos, uCam;
out vec4 outColor;

void main() {
    vec3 lightColor = vec3(1.);
    vec3 norm = normalize(vNormal);
    vec3 lightDir = normalize(uLightPos - vFragPos);

    // ambient
    float ambientStr = .1;
    vec3 ambient = ambientStr * lightColor;

    // diffuse
    float diff = max(dot(norm, lightDir), 0.);
    vec3 diffuse = diff * lightColor;

    // spectacular
    float spectacularStr = .5;
    vec3 viewDir = normalize(uCam - vFragPos);
    vec3 reflectDir = reflect(-lightDir, norm);
    float spec = pow(max(dot(viewDir, reflectDir), 0.), 32.);
    vec3 spectacular = spectacularStr * spec * lightColor;

    vec3 result = (ambient + diffuse + spectacular) * uColor;
    outColor = vec4(result, 1.);
}`
