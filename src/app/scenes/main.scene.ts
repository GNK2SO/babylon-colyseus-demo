import { Color3, Color4, Engine, HemisphericLight, MeshBuilder, Scene, StandardMaterial, UniversalCamera, Vector3 } from "babylonjs";
import { Key } from "../enums/keys.enum";
import { Player, } from "../models/player.model";
import { MultiplayerService } from "../services/mutiplayer.service";

export class MainScene {

    private canvas: HTMLCanvasElement;
    private engine: Engine;
    private scene: Scene;

    private intervalID: number;
    private players: Map<string, Player> = new Map();
    private playersPosition: Map<string, Vector3> = new Map();
    private multiplayerClient: MultiplayerService;

    constructor(canvas: HTMLCanvasElement, engine: Engine) {
        this.canvas = canvas;
        this.engine = engine;
        this.multiplayerClient = new MultiplayerService();
        this.initialize();
    }
    
    private initialize(): void {
        this.canvas.addEventListener('click', () => { this.canvas.requestPointerLock(); });
        this.setupScene();
        this.setupCurrentPlayer();
        this.setupRoom();
        this.setupConnection();
        new HemisphericLight("light", new Vector3(0, 10, 0), this.scene);
    }

    private setupScene(): void {
        const EARTH_GRAVITY = -9.807;
        this.scene = new Scene(this.engine);
        this.scene.gravity = new Vector3(0, EARTH_GRAVITY / 60, 0);
        this.scene.collisionsEnabled = true;
        this.scene.preventDefaultOnPointerDown = false;
    }

    private setupCurrentPlayer(): void {
        const PLAYER_HEIGHT = 2;

        const camera = new UniversalCamera('current-player-camera', new Vector3(0, PLAYER_HEIGHT, 0), this.scene);
        camera.fov = 0.6;
        camera.speed = 0.3;
        camera.applyGravity = true;
        camera.checkCollisions = true;
        camera.angularSensibility = 20000;
        camera.keysUp.push(Key.W);
        camera.keysDown.push(Key.S);
        camera.keysLeft.push(Key.A);
        camera.keysRight.push(Key.D);
        camera.setTarget(new Vector3(0, 0, -90));
        camera.attachControl(this.canvas, true);

        const player = MeshBuilder.CreateCapsule('current-player-body', {
            radius: .5,
            height: PLAYER_HEIGHT,
        }, this.scene);
        player.position = this.scene.activeCamera.position;
        player.position.y = player.getBoundingInfo().boundingBox.extendSize.y;

        player.material = new StandardMaterial('current-player-material');
        (player.material as StandardMaterial).emissiveColor = Color3.FromHexString("#ff9900");

        this.players.set('current-player', {
            body: player,
            camera: camera,
        });
    }

    private setupPlayer(id: string, position: Vector3): void {
        const player = MeshBuilder.CreateCapsule(`player-body-${id}`, {
            height: 2,
            radius: .5,
        }, this.scene);
        player.position = position;
        player.position.y = player.getBoundingInfo().boundingBox.extendSize.y / 2;

        this.players.set(id, { body: player });
    }

    private setupRoom(): void {
        const WALL_SIZE = 5;
        const WALL_WIDTH = 20;
        const WALL_THICKNESS = 0.2;

        const ground = MeshBuilder.CreateGround("ground", {
            width: WALL_WIDTH, 
            height: WALL_WIDTH,
        }, this.scene);
        ground.checkCollisions = true;

        const wallNorth = MeshBuilder.CreateBox("wallNorth", {
            width: WALL_WIDTH,
            depth: WALL_THICKNESS,
            height: WALL_SIZE,
            faceColors: [
                Color4.FromHexString("#FF0000"),
                Color4.FromHexString("#FF0000"),
                Color4.FromHexString("#FF0000"),
                Color4.FromHexString("#FF0000"),
                Color4.FromHexString("#FF0000"),
                Color4.FromHexString("#FF0000"),
            ],
        }, this.scene);
        wallNorth.position.y = wallNorth.getBoundingInfo().boundingBox.extendSize.y;
        wallNorth.position.z = ground.getBoundingInfo().boundingBox.extendSize.z;
        wallNorth.checkCollisions = true;

        const wallSouth = MeshBuilder.CreateBox("wallSouth", {
            width: WALL_WIDTH,
            depth: WALL_THICKNESS,
            height: WALL_SIZE,
            faceColors: [
                Color4.FromHexString("#00FF00"),
                Color4.FromHexString("#00FF00"),
                Color4.FromHexString("#00FF00"),
                Color4.FromHexString("#00FF00"),
                Color4.FromHexString("#00FF00"),
                Color4.FromHexString("#00FF00"),
            ],
        }, this.scene);
        wallSouth.position.y = wallSouth.getBoundingInfo().boundingBox.extendSize.y;
        wallSouth.position.z = -ground.getBoundingInfo().boundingBox.extendSize.z;
        wallSouth.checkCollisions = true;

        const wallEast = MeshBuilder.CreateBox("wallEast", {
            width: WALL_THICKNESS,
            depth: WALL_WIDTH,
            height: WALL_SIZE,
            faceColors: [
                Color4.FromHexString("#0000FF"),
                Color4.FromHexString("#0000FF"),
                Color4.FromHexString("#0000FF"),
                Color4.FromHexString("#0000FF"),
                Color4.FromHexString("#0000FF"),
                Color4.FromHexString("#0000FF"),
            ],
        }, this.scene);
        wallEast.position.y = wallEast.getBoundingInfo().boundingBox.extendSize.y;
        wallEast.position.x = ground.getBoundingInfo().boundingBox.extendSize.x;
        wallEast.checkCollisions = true;

        const wallWest = MeshBuilder.CreateBox("wallWest", {
            width: WALL_THICKNESS,
            depth: WALL_WIDTH,
            height: WALL_SIZE,
            faceColors: [
                Color4.FromHexString("#FF00FF"),
                Color4.FromHexString("#FF00FF"),
                Color4.FromHexString("#FF00FF"),
                Color4.FromHexString("#FF00FF"),
                Color4.FromHexString("#FF00FF"),
                Color4.FromHexString("#FF00FF"),
            ],
        }, this.scene);
        wallWest.position.y = wallWest.getBoundingInfo().boundingBox.extendSize.y;
        wallWest.position.x = -ground.getBoundingInfo().boundingBox.extendSize.x;
        wallWest.checkCollisions = true;

        const box = MeshBuilder.CreateBox("box", {
            size: 2,
            faceColors: [
                Color4.FromHexString("#FFFF00"),
                Color4.FromHexString("#FFFF00"),
                Color4.FromHexString("#FFFF00"),
                Color4.FromHexString("#FFFF00"),
                Color4.FromHexString("#FFFF00"),
                Color4.FromHexString("#FFFF00"),
            ]
        }, this.scene);
        box.checkCollisions = true;
        box.position.x = 5;
        box.position.z = 5;
        box.position.y = box.getBoundingInfo().boundingBox.extendSize.y;
    }

    private setupConnection(): void {
        this.multiplayerClient.join("UNTITLED_GAME").then(room => {

            console.log(`Connected into room ${room.roomId}`);

            room.state.players.onAdd((player: any, sessionId: string) => {
                console.log(`Player ${sessionId} has joined!`);

                if(sessionId === room.sessionId) {
                    const player = this.players.get('current-player');
                    this.players.set(sessionId, player);
                    this.players.delete('current-player');
                } else {
                    const position = new Vector3(player.x, player.y, player.z);
                    this.playersPosition.set(sessionId, position.clone());
                    this.setupPlayer(sessionId, position);
                }

                player.onChange(() => {
                    if(sessionId !== room.sessionId) {
                        player.y = this.players.get(sessionId).body.getBoundingInfo().boundingBox.extendSize.y;
                        this.playersPosition.set(sessionId, new Vector3(player.x, player.y, player.z));
                    }
                });
            });

            this.scene.registerBeforeRender(() => {
                this.players.forEach((player, sessionId) => {
                    if(sessionId !== room.sessionId) {
                        var targetPosition = this.playersPosition.get(sessionId);
                        if(targetPosition) {
                            player.body.position = Vector3.Lerp(player.body.position, targetPosition, 0.05);
                        }
                    }
                })
            })

            // this.intervalID = setInterval(() => {
            //     const player = this.players.get(room.sessionId);
            //     if(player) {
            //         room.send("updatePosition", {
            //             x: player.camera.position.x,
            //             y: player.camera.position.y,
            //             z: player.camera.position.z,
            //         });
            //     }
            // }, 10);

            // document.addEventListener('keydown', (ev) => {
            //     if (["w", "s", "a", "d"]. includes(ev.key)) {
            //         const player = this.players.get(room.sessionId);
            //         if(player) {
            //             room.send("updatePosition", {
            //                 x: player.camera.position.x,
            //                 y: player.camera.position.y,
            //                 z: player.camera.position.z,
            //             });
            //         }
            //     }
            // })

            // this.scene.onKeyboardObservable.add((data) => {
            //     if (["w", "s", "a", "d"]. includes(data.event.key)) {
            //         const player = this.players.get(room.sessionId);
            //         if(player) {
            //             room.send("updatePosition", {
            //                 x: player.camera.position.x,
            //                 y: player.camera.position.y,
            //                 z: player.camera.position.z,
            //             });
            //         }
            //     }
            // });

            room.state.players.onRemove((player: any, sessionId: string) => {
                console.log(`Player ${sessionId} has leave!`);
                if(sessionId !== room.sessionId) {
                    this.players.get(sessionId).body.dispose();
                    this.players.delete(sessionId);
                }
            });

        }).catch(error => {
            console.log(error);
            console.log(`Failed to connect`);
        });
    }

    public render(): void {
        this.scene.render();
    }

    public dispose(): void {
        clearInterval(this.intervalID);
        this.scene.onKeyboardObservable.clear();
    }
}