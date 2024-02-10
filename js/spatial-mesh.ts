import {
  Component,
  Material,
  Mesh,
  MeshAttribute,
  MeshComponent,
  MeshIndexType,
  Object3D,
  PhysXComponent,
  Shape,
} from "@wonderlandengine/api";
import { property } from "@wonderlandengine/api/decorators.js";

const tempVec = new Float32Array(3);
const tempQuat = new Float32Array(4);
type MeshContext = {
  id: number;
  timestamp: number;
  mesh: Object3D;
};

export class SpatialMesh extends Component {
  static TypeName = "spatial-mesh";

  @property.material()
  material?: Material;

  private roomMeshes = new Map<XRMesh, MeshContext>();
  private meshId = 0;

  update(dt: number) {
    const xr = this.engine.xr;
    if (!xr) return;
    const frame = xr.frame;
    const referenceSpace = xr.currentReferenceSpace;
    const detectedMeshes = xr.frame.detectedMeshes;
    detectedMeshes?.forEach((mesh: XRMesh) => {
      const meshPose = frame.getPose(mesh.meshSpace, referenceSpace);
      let geometry;
      if (this.roomMeshes.has(mesh)) {
        // // may have been updated:
        const meshContext = this.roomMeshes.get(mesh)!;
        // meshMesh = meshContext.mesh;
        // wireframeMesh = meshContext.wireframe;
        if (meshContext.timestamp < mesh.lastChangedTime) {
          //   // the mesh was updated!
          meshContext.timestamp = mesh.lastChangedTime;
          geometry = meshContext.mesh;
          const meshComponent = geometry.getComponent(MeshComponent)?.mesh!;
          this.updateGeometry(meshComponent, mesh.vertices, mesh.indices);
        }
      } else {
        // Create geometry:
        geometry = this.createGeometry(mesh.vertices, mesh.indices);
        const meshContext: MeshContext = {
          id: this.meshId,
          timestamp: mesh.lastChangedTime,
          mesh: geometry,
        };
        this.roomMeshes.set(mesh, meshContext);
        this.meshId++;
      }
      if (meshPose && geometry) {
        this.setXRRigidTransformLocal(geometry, meshPose?.transform!);
      }
    });
  }

  private updateGeometry(
    meshComponent: Mesh,
    vertices: Float32Array,
    indices: Uint32Array
    ) {
    meshComponent.indexData?.set(indices);
    const positions = meshComponent.attribute(MeshAttribute.Position);
    let v = 0;
    for (let i = 0; i < vertices.length / 3; i++) {
      positions?.set(i, [vertices[v], vertices[v + 1], vertices[v + 2]]);
      v += 3;
    }
  }

  private createGeometry(
    vertices: Float32Array,
    indices: Uint32Array
  ): Object3D {
    const meshObj = this.engine.scene.addObject();
    const meshComp = meshObj.addComponent(MeshComponent)!;
    meshComp.material = this.material;
    const mesh = new Mesh(this.engine, {
      vertexCount: vertices.length / 3,
      indexData: indices,
      indexType: MeshIndexType.UnsignedInt,
    });

    this.updateGeometry(mesh, vertices, indices);

    meshComp.mesh = mesh;
    return meshObj;
  }

  setXRRigidTransformLocal(o: Object3D, transform: XRRigidTransform) {
    const r = transform.orientation;
    tempQuat[0] = r.x;
    tempQuat[1] = r.y;
    tempQuat[2] = r.z;
    tempQuat[3] = r.w;

    const t = transform.position;
    tempVec[0] = t.x;
    tempVec[1] = t.y;
    tempVec[2] = t.z;

    o.resetPositionRotation();
    o.setTransformWorld(tempQuat);
    o.setPositionWorld(tempVec);
  }
}
