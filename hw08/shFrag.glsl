#version 300 es

precision highp float;

out vec4 FragColor;
in vec3 fragPos;  
in vec3 normal;  
in vec2 texCoord;
uniform int tLevel;

struct Material {
    sampler2D diffuse; // diffuse map
    vec3 specular;     // 표면의 specular color
    float shininess;   // specular 반짝임 정도
};

struct Light {
    //vec3 position;
    vec3 direction;
    vec3 ambient; // ambient 적용 strength
    vec3 diffuse; // diffuse 적용 strength
    vec3 specular; // specular 적용 strength
};

uniform Material material;
uniform Light light;
uniform vec3 u_viewPos;

void main() {
    // ambient
    vec3 rgb = texture(material.diffuse, texCoord).rgb;
    vec3 ambient = light.ambient * rgb;
  	
    // diffuse 
    vec3 norm = normalize(normal);
    //vec3 lightDir = normalize(light.position - fragPos);
    vec3 lightDir = normalize(light.direction);
    float dotNormLight = dot(norm, lightDir);
    float diff = max(dotNormLight, 0.0);
        if (tLevel==1) {
        diff = 0.5;
    } else if (tLevel==2) {
        diff = (diff<=0.5?0.25:0.75);
    } else if (tLevel==3) {
        if (diff<=0.333) diff = 0.167;
        else if (diff<=0.666) diff = 0.5;
        else diff = 0.833;
    } else if (tLevel==4) {
        if (diff<=0.25) diff = 0.125;
        else if (diff<=0.5) diff = 0.375;
        else if (diff<=0.75) diff = 0.625;
        else diff = 0.875;
    } else if (tLevel==5) {
        if (diff<=0.2) diff = 0.1;
        else if (diff<=0.4) diff = 0.3;
        else if (diff<=0.6) diff = 0.5;
        else if (diff<=0.8) diff = 0.7;
        else diff = 0.9;
    }

    vec3 diffuse = light.diffuse * diff * rgb;  
    
    // specular
    vec3 viewDir = normalize(u_viewPos - fragPos);
    vec3 reflectDir = reflect(-lightDir, norm);
    float spec = 0.0;
    if (dotNormLight > 0.0) {
        spec = pow(max(dot(viewDir, reflectDir), 0.0), material.shininess);
    }
        if (tLevel==1) {
        spec = 0.5;
    } else if (tLevel==2) {
        spec = (spec<=0.5?0.25:0.75);
    } else if (tLevel==3) {
        if (spec<=0.333) spec = 0.167;
        else if (spec<=0.666) spec = 0.5;
        else spec = 0.833;
    } else if (tLevel==4) {
        if (spec<=0.25) spec = 0.125;
        else if (spec<=0.5) spec = 0.375;
        else if (spec<=0.75) spec = 0.625;
        else spec = 0.875;
    } else if (tLevel==5) {
        if (spec<=0.2) spec = 0.1;
        else if (spec<=0.4) spec = 0.3;
        else if (spec<=0.6) spec = 0.5;
        else if (spec<=0.8) spec = 0.7;
        else spec = 0.9;
    }
    vec3 specular = light.specular * spec * material.specular;  
        
    vec3 result = ambient + diffuse + specular;
    FragColor = vec4(result, 1.0);
} 
