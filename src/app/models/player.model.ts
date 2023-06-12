import { AbstractMesh, Camera, Vector3 } from "babylonjs";

export interface Player {
    body: AbstractMesh;
    camera?: Camera;
}

export abstract class PlayerPosition {
    private x: number;
    private y: number;
    private z: number;

    public toVector3() {
        return new Vector3(this.x, this.y, this.z);
    }
}