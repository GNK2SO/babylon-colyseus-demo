import { MapSchema, Schema, type } from "@colyseus/schema";

export class Player extends Schema {
  @type("number")  x: number;
  @type("number")  y: number;
  @type("number")  z: number;

  constructor() {
    super();
    this.x = 0;
    this.y = 0;
    this.z = 0;
  }

}

export class RoomState extends Schema {
  @type({ map: Player }) players = new MapSchema<Player>();
}
