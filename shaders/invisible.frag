#include "lib/Compatibility.frag"

#define USE_MATERIAL_ID /* provides fragMaterialId */

#include "lib/Inputs.frag"

#include "lib/Materials.frag"

struct Material {
   lowp vec4 color;
};

Material decodeMaterial(uint matIndex) {
    {{decoder}}
    return mat;
}

void main() {
    outColor = vec4(.0,.0,.0,.0);
}
