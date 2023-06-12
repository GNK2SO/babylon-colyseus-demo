import { Engine } from "babylonjs";
import { MainScene } from "./scenes/main.scene";

const canvas = document.getElementById("root") as HTMLCanvasElement;
const engine = new Engine(canvas, true);
const scene = new MainScene(canvas, engine);

engine.runRenderLoop(function () {
    scene.render();
});

window.addEventListener("resize", function () {
    engine.resize();
});