import { Client, Room } from "colyseus.js";

export class MultiplayerService {
    
    private readonly client: Client;

    constructor() {
        this.client = new Client("ws://localhost:2567");
    }

    async join(roomId: string): Promise<Room> {
        return await this.client.joinOrCreate(roomId);
    }

}