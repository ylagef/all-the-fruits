import { User } from 'firebase';

export class Response {
    public user: string;
    public category: number;
    public roundNumber: number;
    public responseValue: string;
    public valid: boolean[];

    constructor() {
    }

}

export class Round {
    public id: number;

    public letter: string;
    public responses: Response[];
    public ended = false;

    public next: boolean[];

    constructor() {
    }

}

export class Game {
    public id: string;

    public admin: string;
    public categories: string[];
    public excludedLetters: string[];
    public people: number;
    public roundsNumber: number;

    public users: User[];

    public rounds: Round[];
    public currentRoundNumber: number;

    constructor() {
    }
}
