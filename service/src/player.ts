import { Card, IPlayer, PlayerState } from './sharedTypes';

export class Player implements IPlayer {
  private _id?: string;
  private _name: string;
  private _teamCode: string;
  private _connected: boolean;
  private _cards: Card[] = [];

  constructor(player: IPlayer) {
    this._id = player.id;
    this._name = player.name;
    this._teamCode = player.teamCode;
    this._connected = player.connected || true;
    this._cards = player.cards || [];
  }

  public get id(): string | undefined {
    return this._id;
  }

  public set id(id: string) {
    this._id = id;
  }

  public get name(): string {
    return this._name;
  }

  public get teamCode(): string {
    return this._teamCode;
  }

  public get connected(): boolean {
    return this._connected;
  }

  public set connected(connected: boolean) {
    this._connected = connected;
  }

  public get cards(): Card[] {
    return this._cards;
  }

  public addCards(cards: Card[]) {
    this._cards.push(...cards);
  }

  public removeCard(card: Card) {
    const index = this._cards.findIndex(
      (c) => c.value === card.value && c.suit === card.suit
    );
    if (index !== -1) {
      this._cards.splice(index, 1);
    }
  }

  public removeAllCards() {
    this._cards = [];
  }

  public hasCard(card: Card): boolean {
    return this._cards.some(
      (c) => c.value === card.value && c.suit === card.suit
    );
  }

  public hasSuit(suit: string): boolean {
    return this._cards.some((c) => c.suit === suit);
  }

  public getState(): PlayerState {
    return {
      id: this._id,
      name: this._name,
      teamCode: this._teamCode
    };
  }

  public getStateWithCards(): IPlayer {
    return {
      id: this._id,
      name: this._name,
      teamCode: this._teamCode,
      connected: this._connected,
      cards: this._cards
    };
  }
}
