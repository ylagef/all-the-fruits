import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Game, Round, Response } from '../models/game.model';
import { Observable } from 'rxjs';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class GameService {
  public letters: string[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L',
    'M', 'N', 'Ñ', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

  constructor(
    private firestore: AngularFirestore
  ) { }

  public createGame(game: Game) {
    const roundsArray: Round[] = [];
    this.letters = this.letters.filter(l => !game.excludedLetters.includes(l));

    for (let r = 0; r < game.roundsNumber; r++) {
      const round: Round = new Round();
      round.id = r;

      const lIndex = Math.floor(Math.random() * this.letters.length);
      round.letter = this.letters[lIndex];
      this.letters.splice(lIndex, 1);

      round.next = [];

      round.responses = [];
      for (let p = 0; p < game.people; p++) {
        for (let c = 0; c < game.categories.length; c++) {
          const response: Response = new Response();
          response.user = null;
          response.category = c;
          response.responseValue = '';
          response.valid = [];
          response.roundNumber = null;

          for (let p2 = 0; p2 < game.people; p2++) {
            response.valid[p2] = true;
          }

          round.responses.push(response);
        }

        round.next[p] = false;
      }

      roundsArray.push(round);
    }

    game.users = [];
    game.rounds = roundsArray;
    game.currentRoundNumber = -1;

    return this.firestore.collection('games').add(JSON.parse(JSON.stringify(game)));
  }

  public getGame(id: string): Observable<any> {
    // console.log('g g');
    return this.firestore.collection<Game>('games').doc(id).valueChanges();
  }

  public addUserToGame(gameId: string, users: User[], lastUser: boolean) {
    // console.log('a u t g');
    if (lastUser) {
      this.firestore.collection('games').doc(gameId).update(
        {
          users,
          currentRoundNumber: 0
        }
      );
    } else {
      this.firestore.collection('games').doc(gameId).update(
        { users }
      );
    }
  }

  public stopRound(gameId: string, id: number, round: Round, from: number, amount: number, roundNumber: number, uid: string) {
    // console.log('s r');
    const sub = this.firestore.collection<Game>('games').doc(gameId).valueChanges().subscribe(
      (game: Game) => {
        if (!game.rounds[id].ended) {
          game.rounds[id].ended = true;
        }

        // Update responses
        for (let i = (from * amount); i < ((from * amount) + amount); i++) {
          game.rounds[id].responses[i] = round.responses[i];
          game.rounds[id].responses[i].roundNumber = roundNumber;
          game.rounds[id].responses[i].user = uid;

          if (game.rounds[id].responses[i].responseValue.trim() === '') {
            for (let vi = 0; vi < game.rounds[id].responses[i].valid.length; vi++) {
              game.rounds[id].responses[i].valid[vi] = false;
            }
          }
        }

        this.firestore.collection('games').doc(gameId).update(JSON.parse(JSON.stringify(game)));
        sub.unsubscribe();
      }
    );
  }

  public updateChecks(gameId: string, id: number, responseIndex: number, userIndex: number, value: boolean) {
    // console.log('u c');

    const sub = this.firestore.collection<Game>('games').doc(gameId).valueChanges().subscribe(
      (game: Game) => {
        game.rounds[id].responses[responseIndex].valid[userIndex] = value;

        this.firestore.collection('games').doc(gameId).update(JSON.parse(JSON.stringify(game)));
        sub.unsubscribe();
      }
    );
  }

  public updateNext(gameId: string, id: number, userIndex: number) {
    // console.log('u c');
    const sub = this.firestore.collection<Game>('games').doc(gameId).valueChanges().subscribe(
      (game: Game) => {
        if (!game.rounds[id].next[userIndex]) {
          game.rounds[id].next[userIndex] = true;

          if (!game.rounds[id].next.includes(false)) {
            game.currentRoundNumber++;
          }

          this.firestore.collection('games').doc(gameId).update(JSON.parse(JSON.stringify(game)));
        }

        sub.unsubscribe();
      }
    );
  }
}
