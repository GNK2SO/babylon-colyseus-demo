import { Client, Room } from "@colyseus/core";
import { Message, Player, RoomState } from "./schema/room-state.schema";

export class UntitledGameRoom extends Room<RoomState> {
  maxClients = 4;

  onCreate (options: any) {
    this.setState(new RoomState());

    this.onMessage("updatePosition", (client, data) => {
      const player = this.state.players.get(client.sessionId);
      player.setPosition(data);
    });

    this.onMessage("message", (client, data) => {
      console.log(`Receive message: ${data}`);
      this.state.messages.push(new Message(data));
    });
  }

  onJoin (client: Client, options: any) {
    console.log(client.sessionId, "joined!");
    this.state.players.set(client.sessionId, new Player());
  }

  onLeave (client: Client, consented: boolean) {
    console.log(client.sessionId, "left!");
    this.state.players.delete(client.sessionId);
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }

}
