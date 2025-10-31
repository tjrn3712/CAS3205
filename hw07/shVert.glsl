#version 300 es
layout(location=0) in vec3 aPos;
layout(location=1) in vec3 aNormal;
layout(location=2) in vec4 aColor;
layout(location=3) in vec2 aTex;

uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_projection;
uniform vec3 u_viewPos;

struct Material { vec3 diffuse; vec3 specular; float shininess; };
struct Light    { vec3 position; vec3 ambient; vec3 diffuse; vec3 specular; };
uniform Material material;
uniform Light    light;

// Gouraud
out vec3 vGouraud;
// Phong
out vec3 vFragPos;
out vec3 vNormal;

vec3 phongLighting(vec3 fragPos, vec3 normal) {
    vec3 ambient = light.ambient * material.diffuse;

    vec3 L = normalize(light.position - fragPos);
    float diff = max(dot(normal, L), 0.0);
    vec3 diffuse = light.diffuse * (diff * material.diffuse);

    vec3 V = normalize(u_viewPos - fragPos);
    vec3 R = reflect(-L, normal);
    float spec = pow(max(dot(V, R), 0.0), material.shininess);
    vec3 specular = light.specular * (spec * material.specular);

    return ambient + diffuse + specular;
}

void main() {
    vec3 fragPos = vec3(u_model * vec4(aPos, 1.0));
    mat3 normalMat = mat3(transpose(inverse(u_model)));
    vec3 N = normalize(normalMat * aNormal);

    vFragPos  = fragPos;
    vNormal   = N;
    vGouraud  = phongLighting(fragPos, N);

    gl_Position = u_projection * u_view * vec4(fragPos, 1.0);
}
