import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from '@angular/fire/firestore';
import { Game, Round, Response } from '../models/game.model';
import { Observable, Subject } from 'rxjs';
import { User } from '../models/user.model';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class GameService {
  public letters: string[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L',
    'M', 'N', 'Ñ', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

  private gamesRef: AngularFirestoreCollection<Game>;
  private gameRef: AngularFirestoreDocument<any>;
  public game$: Observable<any>;
  public id: string;

  constructor(
    private firestore: AngularFirestore,
    private router: Router
  ) {
    this.gamesRef = this.firestore.collection('games');
  }

  public createGame(game: Game): void {
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
    game.admin = JSON.parse(localStorage.getItem('user')).uid;

    this.gamesRef.add(JSON.parse(JSON.stringify(game))).then(
      docRef => {
        this.getGame(docRef.id);
      }
    );
  }

  public getGame(id: string): Observable<Game> {
    // console.log('g g');
    this.id = id;

    this.gameRef = this.gamesRef.doc(this.id);
    this.game$ = this.gamesRef.doc(this.id).valueChanges();

    const sub = this.game$.subscribe(
      (g: Game) => {
        const current = JSON.parse(localStorage.getItem('user'));
        if (g === undefined || ((g.people === g.users.length) && !(g.users.find(u => u.uid === current.uid)))) {
          // If undefined or if full and I'm not player
          this.router.navigate(['game']);
        } else {
          this.router.navigate(['game/' + this.id]);
        }

        sub.unsubscribe();
      }
    );

    return this.game$;
  }

  public addUserToGame(users: User[], lastUser: boolean): void {
    // console.log('a u t g');
    if (lastUser) {
      this.gameRef.update(
        {
          users,
          currentRoundNumber: 0
        }
      );
    } else {
      this.gameRef.update(
        { users }
      );
    }
  }

  public stopRound(id: number, round: Round, from: number, amount: number, roundNumber: number, uid: string): void {
    // console.log('s r');
    const sub = this.game$.subscribe(
      (game: Game) => {
        // const game = doc.data();

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

        this.gameRef.update(JSON.parse(JSON.stringify(game)));
        sub.unsubscribe();
      }
    );
  }

  public updateChecks(id: number, responseIndex: number, userIndex: number, value: boolean): void {
    // console.log('u c');
    const sub = this.game$.subscribe(
      (game: Game) => {
        game.rounds[id].responses[responseIndex].valid[userIndex] = value;

        this.gameRef.update(JSON.parse(JSON.stringify(game)));
        sub.unsubscribe();
      }
    );
  }

  public updateNext(id: number, userIndex: number): void {
    // console.log('u c');
    const sub = this.game$.subscribe(
      (game: Game) => {
        if (!game.rounds[id].next[userIndex]) {
          game.rounds[id].next[userIndex] = true;

          if (!game.rounds[id].next.includes(false)) {
            game.currentRoundNumber++;
          }

          this.gameRef.update(JSON.parse(JSON.stringify(game)));
        }

        sub.unsubscribe();
      }
    );
  }
}
