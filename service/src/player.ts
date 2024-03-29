import { Card } from './types';

export class Player {
  private id: string;
  private name: string;
  private teamCode: string;
  private connected: boolean;
  private cards: Card[] = [];

  constructor(id: string, name: string, teamCode: string, connected: boolean) {
    this.id = id;
    this.name = name;
    this.teamCode = teamCode;
    this.connected = connected;
  }

  public get Id(): string {
    return this.id;
  }

  public set Id(id: string) {
    this.id = id;
  }

  public get Name(): string {
    return this.name;
  }

  public get TeamCode(): string {
    return this.teamCode;
  }

  public get Connected(): boolean {
    return this.connected;
  }

  public set Connected(connected: boolean) {
    this.connected = connected;
  }

  public get Cards(): Card[] {
    return this.cards;
  }

  public addCards(cards: Card[]) {
    this.cards.push(...cards);
  }

  public removeCard(card: Card) {
    const index = this.cards.findIndex(
      (c) => c.value === card.value && c.suit === card.suit
    );
    if (index !== -1) {
      this.cards.splice(index, 1);
    }
  }

  public hasCard(card: Card): boolean {
    return this.cards.some(
      (c) => c.value === card.value && c.suit === card.suit
    );
  }

  public toJSON() {
    return {
      id: this.id,
      name: this.name,
      teamCode: this.teamCode
    };
  }
}
