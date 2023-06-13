import { ArraySchema, MapSchema, Schema, type } from "@colyseus/schema";

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

export class Message extends Schema {
  @type("string")  author: string;
  @type("string")  text: string;

  constructor(data: any) {
    super();
    this.author = data.author;
    this.text = data.text;
  }

}

export class RoomState extends Schema {
  @type({ map: Player }) players = new MapSchema<Player>();
  @type([ Message ]) messages = new ArraySchema<Message>();
}
