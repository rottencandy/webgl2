/**
* Calculates transformed vertices and provides
* normals and interpolated fragment positions.
*
* vertex inputs:
* vec4 aPos = vertex position
* vec4 aNorm = vertex normal
*
* outputs:
* vec3 vFragPos = interpolated fragment position
* vec3 vNormal = interpolated vertex normal
*
* uniforms:
* mat4 uMat = modelViewProjection matrix
*/
export const vertexNormalFragShader: string = `#version 300 es
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
*
* vertex inputs:
* vec4 aPos = vertex position
*
* outputs:
* vec3 vFragPos = interpolated fragment position
*
* uniforms:
* mat4 uMat = modelViewProjection matrix
*/
export const vertexFragShader: string = `#version 300 es
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
*
* vertex shader inputs:
* vec3 vFragPos = interpolated fragment position
* vec3 vNormal = interpolated vertex normal
*
* outputs:
* vec4 outColor = fragment color
*
* uniforms:
* NONE
*/
export const fragmentNormalShader: string = `#version 300 es
precision lowp float;
in vec3 vNormal;
out vec4 outColor;

void main() {
    vec3 norm = normalize(vNormal);
    outColor = vec4(norm, 1.);
}`

/**
* Single static color fragments
*
* vertex shader inputs:
* NONE
*
* outputs:
* vec4 outColor = fragment color
*
* uniforms:
* vec3 uColor = object color
*/
export const fragmentStaticShader: string = `#version 300 es
precision lowp float;
uniform vec3 uColor;
out vec4 outColor;

void main() {
    outColor = vec4(uColor, 1.);
}`

/**
* Calculates fragment lights using Phong lighting (ambient+diffuse+spectacular)
*
* vertex shader inputs:
* vec3 vFragPos = interpolated fragment position
* vec3 vNormal = interpolated vertex normal
*
* outputs:
* vec4 outColor = fragment color
*
* uniforms:
* vec3 uColor = object color
* vec3 uLightPos = global light position
* vec3 uCam = global camera position
*/
export const fragmentPhongShader: string = `#version 300 es
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
    float spec = pow(max(dot(viewDir, reflectDir), 0.), 1.);
    vec3 spectacular = spectacularStr * spec * lightColor;

    vec3 result = (ambient + diffuse + spectacular) * uColor;
    outColor = vec4(result, 1.);
}`

// todo vertex view
