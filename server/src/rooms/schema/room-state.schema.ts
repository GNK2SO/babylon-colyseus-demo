import { ArraySchema, MapSchema, Schema, type } from "@colyseus/schema";

export class Position extends Schema {
  @type("number") x: number;
  @type("number") y: number;
  @type("number") z: number;

  constructor() {
    super();
    this.x = 0;
    this.y = 0;
    this.z = 0;
  }

}

export class Player extends Schema {

  @type(Position) position: Position;

  constructor() {
    super();
    this.position = new Position();
  }

  setPosition(data: any): void {
    this.position.x = data.position.x;
    this.position.y = data.position.y;
    this.position.z = data.position.z;
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
