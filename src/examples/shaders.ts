const makeShader = (content: string) => `#version 300 es
precision lowp float;
${content}`;

/**
* Calculates transformed vertices and provides (without normals)
* interpolated fragment positions.
*/
export const vertexPos = makeShader(
    'in vec4 aPos;' +
    'uniform mat4 uMat;' +
    'uniform vec4 uPos;' +

    'void main() {' +
        'gl_Position = uMat * (uPos + aPos);' +
    '}'
);

/**
* Static light color
*/
export const fragmentStatic = makeShader(
    'uniform vec3 uColor;' +
    'out vec4 outColor;' +

    'void main() {' +
        'outColor = vec4(uColor, 1.);' +
    '}'
);

/**
* Calculates transformed vertices and provides
* normals and interpolated fragment positions.
*/
export const vertexNormalFrag = makeShader(
    'in vec4 aPos, aNorm;' +
    'uniform mat4 uMat;' +
    'uniform vec4 uPos;' +
    'out vec3 vNormal, vFragPos;' +

    'void main() {' +
        'gl_Position = uMat * (uPos + aPos);' +
        'vFragPos = aPos.xyz;' +
        'vNormal = aNorm.xyz;' +
    '}'
);

/**
* Calculates transformed vertices and provides (without normals)
* interpolated fragment positions.
*/
export const vertexFrag = makeShader(
    'in vec4 aPos;' +
    'uniform mat4 uMat;' +
    'uniform vec4 uPos;' +
    'out vec3 vFragPos;' +

    'void main() {' +
        // TODO: pos should be calculated by world/view matrix
        'gl_Position = uMat * (uPos + aPos);' +
        'vFragPos = aPos.xyz;' +
    '}'
);

/**
* Calculates fragment colors using normals
*/
export const fragmentNormal = makeShader(
    'in vec3 vNormal;' +
    'out vec4 outColor;' +

    'void main() {' +
        'vec3 norm = normalize(vNormal);' +
        'outColor = vec4(norm, 1.);' +
    '}');

/**
* Calculates fragment lights using Phong lighting (ambient+diffuse+spectacular)
* source: learnopengl.com
*/
export const fragmentPhong = makeShader(
    'in vec3 vNormal, vFragPos;' +
    'uniform vec3 uColor, uLightPos, uCam;' +
    'out vec4 outColor;' +

    'void main() {' +
        // variables
        'vec3 lightColor = vec3(1.);' +
        'vec3 ambientStr = vec3(.1);' +
        'vec3 diffStr = vec3(1.);' +
        'vec3 spectacularStr = vec3(.5);' +
        'float shininess = 32.;' +

        // ambient
        'vec3 ambient = ambientStr * lightColor;' +

        // diffuse
        'vec3 norm = normalize(vNormal);' +
        'vec3 lightDir = normalize(uLightPos - vFragPos);' +
        'float diff = max(dot(norm, lightDir), 0.);' +
        'vec3 diffuse = lightColor * (diff * diffStr);' +

        // spectacular
        'vec3 viewDir = normalize(uCam - vFragPos);' +
        'vec3 reflectDir = reflect(-lightDir, norm);' +
        'float spec = pow(max(dot(viewDir, reflectDir), 0.), shininess);' +
        'vec3 spectacular = lightColor * (spec * spectacularStr);' +

        'vec3 result = (ambient + diffuse + spectacular) * uColor;' +
        'outColor = vec4(result, 1.);' +
    '}'
);
