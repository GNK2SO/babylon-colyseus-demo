import { AbstractMesh, Camera } from "babylonjs";

export interface Player {
    body: AbstractMesh;
    camera?: Camera;
}