import { AbstractMesh, Color3, Color4, Engine, Mesh, MeshBuilder, Scene, StandardMaterial, UniversalCamera, Vector3, VideoTexture } from "babylonjs";
import { AdvancedDynamicTexture, Button, Control, InputText, ScrollViewer, StackPanel, TextBlock, TextWrapping } from "babylonjs-gui";
import { Room } from "colyseus.js";
import { from, mergeMap } from "rxjs";
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

    private advancedTexture: AdvancedDynamicTexture;

    constructor(canvas: HTMLCanvasElement, engine: Engine) {
        this.canvas = canvas;
        this.engine = engine;
        this.multiplayerClient = new MultiplayerService();
        this.initialize();
    }
    
    private initialize(): void {
        // this.canvas.addEventListener('click', () => { this.canvas.requestPointerLock(); });
        this.setupScene();
        this.setupCurrentPlayer();
        this.setupRoom();
        this.setupHUD();
        this.setupShortcut();
        this.setupConnection();
    }

    private setupScene(): void {
        const EARTH_GRAVITY = -9.807;
        this.scene = new Scene(this.engine);
        this.scene.gravity = new Vector3(0, EARTH_GRAVITY / 60, 0);
        this.scene.collisionsEnabled = true;
        this.scene.preventDefaultOnPointerDown = false;
        this.scene.createDefaultLight();
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

        const plane = MeshBuilder.CreatePlane("digital-board", {
            width: 5,
            height: 3,
            sideOrientation: Mesh.DOUBLESIDE
        }, this.scene);
        plane.checkCollisions = true;
        plane.position.x = 0;
        plane.position.z = -9.89;
        plane.position.y = plane.getBoundingInfo().boundingBox.extendSize.y + 1;
    }

    private setupHUD(): void {
        const chatScroll = new ScrollViewer("chat-scroll");
        chatScroll.width = 0.3;
        chatScroll.height = 0.3;
        chatScroll.background = "black";
        chatScroll.paddingLeft = "8px";
        chatScroll.paddingBottom = "48px";
        chatScroll.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        chatScroll.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        chatScroll.addControl(new StackPanel("chat-messages"));
    
        const chatInput = new InputText("chat-input");
        chatInput.width = 0.3;
        chatInput.height = "40px";
        chatInput.paddingLeft = "8px";
        chatInput.paddingBottom = "8px";
        chatInput.placeholderText = "Digite sua mensagem...";
        chatInput.color = "white";
        chatInput.background = "black";
        chatInput.fontSize = "16px";
        chatInput.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        chatInput.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;

        const toggleAudioButton = Button.CreateImageOnlyButton("toggle-audio-button", "/assets/icons/mic.png");
        toggleAudioButton.top = -12;
        toggleAudioButton.width = "80px";
        toggleAudioButton.height = "80px";
        toggleAudioButton.color = "white";
        toggleAudioButton.background = "#AAAAAA";
        toggleAudioButton.cornerRadius = 40;
        toggleAudioButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        toggleAudioButton.image.setPadding("18px", "18px", "18px", "18px");

        const toggleVideoButton = Button.CreateImageOnlyButton("toggle-video-button", "/assets/icons/video.png");
        toggleVideoButton.top = -12;
        toggleVideoButton.width = "80px";
        toggleVideoButton.height = "80px";
        toggleVideoButton.color = "white";
        toggleVideoButton.background = "#AAAAAA";
        toggleVideoButton.cornerRadius = 40;
        toggleVideoButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        toggleVideoButton.image.setPadding("18px", "18px", "18px", "18px");
        toggleVideoButton.onPointerUpObservable.add(() => {
            const digitalBoard = this.scene.getMeshByName("digital-board");
            if(digitalBoard.material) {
                this.disposeMaterial(digitalBoard);
                toggleVideoButton.image.source = '/assets/icons/video.png';
            } else {
                VideoTexture.CreateFromWebCam(this.scene, (videoTexture) => {
                    toggleVideoButton.image.source = '/assets/icons/close.png';
                    const material = new StandardMaterial("video-material", this.scene);
                    material.diffuseTexture = videoTexture;
                    material.roughness = 1;
                    material.emissiveColor = Color3.White();
                    digitalBoard.material = material;
                }, { 
                    deviceId: '',
                    minWidth: 1024, 
                    minHeight: 1024,
                    maxWidth: 1024, 
                    maxHeight: 1024, 
                }, false, false);
            }
        });

        const shareScreenButton = Button.CreateImageOnlyButton("share-screen-button", "/assets/icons/share.jpg");
        shareScreenButton.top = -12;
        shareScreenButton.width = "80px";
        shareScreenButton.height = "80px";
        shareScreenButton.color = "white";
        shareScreenButton.background = "#AAAAAA";
        shareScreenButton.cornerRadius = 40;
        shareScreenButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        shareScreenButton.image.setPadding("18px", "18px", "18px", "18px");
        shareScreenButton.onPointerUpObservable.add(() => {
            const digitalBoard = this.scene.getMeshByName("digital-board");
            if(digitalBoard.material) {
                this.disposeMaterial(digitalBoard);
                shareScreenButton.image.source = '/assets/icons/share.jpg';
            } else {
                from(navigator.mediaDevices.getDisplayMedia({ video: true }))
                    .pipe(mergeMap(stream => from(VideoTexture.CreateFromStreamAsync(this.scene, stream, {}, false))))
                    .subscribe({
                        next: videoTexture => {
                            videoTexture.video.onpause = () => {
                                this.disposeMaterial(digitalBoard);
                                shareScreenButton.image.source = '/assets/icons/share.jpg';
                            }
                            shareScreenButton.image.source = '/assets/icons/close.png';
                            const material = new StandardMaterial("video-material", this.scene);
                            material.diffuseTexture = videoTexture;
                            material.roughness = 1;
                            material.emissiveColor = Color3.White();
                            digitalBoard.material = material;
                        },
                        error: error => {
                            console.error(error);
                        }
                    })
            }
        });

        const buttons = new StackPanel("media-buttons");
        buttons.isVertical = false;

        buttons.addControl(toggleAudioButton);
        buttons.addControl(toggleVideoButton);
        buttons.addControl(shareScreenButton);

        this.advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");
        this.advancedTexture.addControl(chatScroll);
        this.advancedTexture.addControl(chatInput);
        this.advancedTexture.addControl(buttons);
    }

    private disposeMaterial(mesh: AbstractMesh): void {
        const texture = (mesh.material as StandardMaterial).diffuseTexture as VideoTexture;
        texture.video.pause();

        const mediaStream = texture.video.srcObject as MediaStream;
        mediaStream.getVideoTracks().forEach((track: any) => track.stop());

        texture.video.srcObject = null;
        
        mesh.material.dispose();
        mesh.material = null;
    }

    private setupShortcut() {
        this.scene.onKeyboardObservable.add(({ event }) => {
            if(event.shiftKey && event.key === "C") {
                (this.advancedTexture.getControlByName("chat-input") as InputText).focus();
            }
        });
    }

    private setupConnection(): void {
        this.multiplayerClient.join("UNTITLED_GAME").then(room => {
            console.log(`Connected into room ${room.roomId}`);
            this.setupChatConnection(room);
            this.setupPlayerConnection(room);
        }).catch(error => {
            console.log(error);
            console.log(`Failed to connect`);
        });
    }

    private setupPlayerConnection(room: Room): void {
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

        this.intervalID = setInterval(() => {
            const player = this.players.get(room.sessionId);
            if(player) {
                room.send("updatePosition", {
                    x: player.camera.position.x,
                    y: player.camera.position.y,
                    z: player.camera.position.z,
                });
            }
        }, 10);

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

        this.scene.registerBeforeRender(() => {
            this.players.forEach((player, sessionId) => {
                if(sessionId !== room.sessionId) {
                    var targetPosition = this.playersPosition.get(sessionId);
                    if(targetPosition) {
                        player.body.position = Vector3.Lerp(player.body.position, targetPosition, 0.05);
                    }
                }
            });
        });
    }

    private setupChatConnection(room: Room): void {
        const chatInput = this.advancedTexture.getControlByName("chat-input") as InputText;
        const chatScroll = this.advancedTexture.getControlByName("chat-scroll") as ScrollViewer;
        const stackPanel = this.advancedTexture.getControlByName("chat-messages") as StackPanel;

        chatInput.onKeyboardEventProcessedObservable.add((event) => {
            if(event.key === 'Enter' && chatInput.text) {
                room.send("message", {
                    author: room.sessionId,
                    text: chatInput.text,
                });
                chatInput.text = "";
            }
            chatInput.focus();
        });

        room.state.messages.onAdd((message: any) => {
            const textBlock = new TextBlock(`message`);
            textBlock.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
            textBlock.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            textBlock.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            textBlock.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
            textBlock.textWrapping = TextWrapping.WordWrap;
            textBlock.resizeToFit = true;
            textBlock.text = `${message.author}: ${message.text}`;
            textBlock.color = "white";
            textBlock.fontSize = "16px";
            textBlock.paddingTop = stackPanel.children.length === 0 ? "12px" : "0px";
            textBlock.paddingBottom = "12px";
            textBlock.paddingRight = "12px";
            textBlock.paddingLeft = "12px";
            stackPanel.addControl(textBlock);
            chatScroll.verticalBar.value = 0;
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