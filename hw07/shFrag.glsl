#version 300 es
precision highp float;

in vec3 vGouraud;
in vec3 vFragPos;
in vec3 vNormal;

out vec4 FragColor;

uniform int u_shadingModel; // 0=GOURAUD, 1=PHONG

uniform vec3 u_viewPos;
struct Material { vec3 diffuse; vec3 specular; float shininess; };
struct Light    { vec3 position; vec3 ambient; vec3 diffuse; vec3 specular; };
uniform Material material;
uniform Light    light;

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
    if (u_shadingModel == 0) {
        FragColor = vec4(vGouraud, 1.0);
    } else {
        vec3 N = normalize(vNormal);
        vec3 color = phongLighting(vFragPos, N);
        FragColor = vec4(color, 1.0);
    }
}
