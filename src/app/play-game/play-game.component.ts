import { Component, OnInit, Input } from '@angular/core';
import { Observable } from 'rxjs';
import { Game, Round, Response } from '../shared/models/game.model';
import { GameService } from '../shared/services/game.service';
import { User } from '../shared/models/user.model';

@Component({
  selector: 'app-play-game',
  templateUrl: './play-game.component.html',
  styleUrls: ['./play-game.component.scss']
})
export class PlayGameComponent implements OnInit {
  @Input() game: Observable<Game>;
  @Input() gameId: string;

  public users: User[];
  public categories: string[];

  public routePrefix = 'https://all-the-fruits.firebaseapp.com/game/';
  // public routePrefix = 'localhost:4200/game/';

  public started = false;
  public starting = false;
  public reviewing = false;
  public final = false;

  public remainingSeconds: number;
  public timeoutSeconds = 5;

  public roundNumber = 0;
  public rounds: Round[];

  public currentLetter: string;

  public results = {};

  constructor(private gameService: GameService) { }

  ngOnInit() {
    this.game.subscribe(
      (game) => {
        console.log('event received');
        console.log('reviewing', this.reviewing);
        if (!this.started) {
          console.log('!started');
          this.users = game.users;

          if (!this.categories) {
            this.categories = game.categories;
          }

          if (this.users.length === game.people) {
            this.refreshRounds(game);
            if (game.currentRoundNumber === 0 && !this.rounds[this.roundNumber].ended) {
              this.startCountdown();
            } else {
              this.starting = false;
              this.started = true;
            }
          } else {
            const user = JSON.parse(localStorage.getItem('user'));

            if (user) {
              if (!this.users.find(u => u.uid === user.uid)) {
                this.users.push(user);
                this.gameService.addUserToGame(this.gameId, this.users, this.users.length === game.people);
              }
            }
          }
        } else if (!this.reviewing) {
          console.log('! Reviewing');
          if (game.rounds[this.roundNumber].ended) {
            // Round ended -> Next step or end round
            console.log('Round ended');
            if (this.allMyResponsesLoaded(game)) {
              console.log('My responses loaded');
              this.reviewing = true;
              this.rounds[this.roundNumber].responses = game.rounds[this.roundNumber].responses;
            } else {
              console.log('My responses NOT loaded');
              console.log('End round...');
              this.reviewing = false;
              this.endRound();
            }
          } else {
            // Round not ended, update responses
            console.log('Round NOT ended');
            this.rounds[this.roundNumber].responses = game.rounds[this.roundNumber].responses;
          }
        } else if (this.reviewing) {
          console.log('Reviewing');
          if (this.allMyResponsesLoaded(game)) {
            console.log('My responses loaded');
            this.rounds[this.roundNumber].next = game.rounds[this.roundNumber].next;
            this.rounds[this.roundNumber].responses = game.rounds[this.roundNumber].responses;

            this.checkNextRound(game);
          } else {
            console.log('My responses NOT loaded');
            console.log('End round...');
            this.reviewing = false;
            this.endRound();
          }
        }

        if (game.currentRoundNumber > this.roundNumber) {
          this.roundNumber = game.currentRoundNumber;
        }
        if (this.rounds && this.rounds[this.roundNumber]) {
          this.currentLetter = game.rounds[this.roundNumber].letter;
        }
      }
    );
  }

  private checkNextRound(game: Game): void {
    if (!this.rounds[this.roundNumber].next.includes(false)) {
      // console.log('Next round');
      this.refreshRounds(game);

      this.started = false;
      this.reviewing = false;

      this.startCountdown();
    }
  }

  private refreshRounds(game: Game): void {
    // console.log('refresh rounds');
    this.rounds = [];

    for (let rNumber = 0; rNumber < game.roundsNumber; rNumber++) {
      const currentRound = game.rounds[rNumber];

      for (let r = 0; r < currentRound.responses.length; r++) {
        const uindex = Math.ceil(((r + 1) / this.categories.length)) - 1;
        currentRound.responses[r].user = this.users[uindex].uid;
      }

      this.rounds.push(currentRound);
    }
  }

  public copyMessage(): void {
    const selBox = document.createElement('textarea');
    selBox.style.position = 'fixed';
    selBox.style.left = '0';
    selBox.style.top = '0';
    selBox.style.opacity = '0';
    selBox.value = this.routePrefix + this.gameId;
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    document.execCommand('copy');
    document.body.removeChild(selBox);
  }

  private startCountdown(): void {
    this.starting = true;
    this.remainingSeconds = this.timeoutSeconds;

    const interval = setInterval(
      () => {
        this.remainingSeconds -= .1;
      }, 100
    );

    const timeout = setTimeout(
      () => {
        this.starting = false;
        this.started = true;
        clearTimeout(timeout);
        clearInterval(interval);
      }, ((this.timeoutSeconds + 1) * 1000)
    );
  }

  public getUserResponses(): Response[] {
    const uid = JSON.parse(localStorage.getItem('user')).uid;

    return (this.rounds[this.roundNumber]) ?
      this.rounds[this.roundNumber].responses.filter(
        r => r.user === uid
      ) : null;
  }

  public endRound(): void {
    // Save response
    const uid = JSON.parse(localStorage.getItem('user')).uid;
    const uindex = this.users.findIndex(u => u.uid === uid);

    this.gameService.stopRound(this.gameId, this.roundNumber, this.rounds[this.roundNumber], uindex, this.categories.length,
      this.roundNumber, uid);
  }

  public getUserName(uid: string) {
    return (this.users.find(u => u.uid === uid)) ? this.users.find(u => u.uid === uid).displayName : '';
  }

  public getCurrentUserIndex() {
    return this.users.findIndex(u => u.uid === JSON.parse(localStorage.getItem('user')).uid);
  }

  public getCategoryResponses(responses: Response[], category: number) {
    return responses.filter(r => r.category === category);
  }

  public allResponsesLoaded() {
    let toret = true;
    this.rounds[this.roundNumber].responses.forEach(
      r => {
        if (r.roundNumber === null) {
          toret = false;
        }
      }
    );

    return toret;
  }

  public allMyResponsesLoaded(game: Game): boolean {
    let loaded = 0;

    game.rounds[this.roundNumber].responses.forEach(
      r => {
        if (r.user === JSON.parse(localStorage.getItem('user')).uid) {
          console.log('my response', r);
          loaded++;
        }
      }
    );

    return (loaded === this.categories.length);
  }

  public isValidResponse(response: Response) {
    const valids = response.valid.filter(v => v === true).length;
    const invalids = response.valid.filter(v => v === false).length;
    return valids > invalids;
  }

  public check(response: Response): void {
    this.gameService.updateChecks(this.gameId, this.roundNumber, this.rounds[this.roundNumber].responses.indexOf(response),
      this.getCurrentUserIndex(), !response.valid[this.getCurrentUserIndex()]);
  }

  public nextRound(): void {
    this.gameService.updateNext(this.gameId, this.roundNumber, this.getCurrentUserIndex());
  }

  public getCeilNumber(n: number): number {
    return Math.ceil(n);
  }

  private getResults() {
    this.users.forEach(u => {
      this.results[u.uid] = 0;
    });

    this.rounds.forEach(round => {
      for (let c = 0; c < this.categories.length; c++) {
        const catResponses = [];
        round.responses.filter(r => r.category === c).forEach(
          response => {
            catResponses.push(response.responseValue.toLowerCase().trim());
            if (this.isValidResponse(response)) {
              this.results[response.user] += 5;
            }
          }
        );
        round.responses.filter(r => r.category === c).forEach(
          response => {
            if (this.isValidResponse(response)) {
              if (this.getMatches(catResponses, response.responseValue) > 1) {
                this.results[response.user] += 5;
              } else {
                this.results[response.user] += 10;
              }
            }
          }
        );
      }
    });
  }

  public getSortedUsers(): User[] {
    // console.log('sort');
    // console.log(this.results);
    this.getResults();
    const points: number[] = [];
    this.users.forEach(u => {
      points.push(this.results[u.uid]);
    });
    const sortedPoints = points.sort((n1, n2) => {
      if (n1 < n2) {
        return 1;
      }

      if (n1 > n2) {
        return -1;
      }

      return 0;
    });

    const sortedUsers: User[] = [];
    this.users.forEach(u => {
      // console.log(u.uid);
      // console.log('su', sortedUsers);
      // console.log('sp', sortedPoints);

      sortedUsers[sortedPoints.indexOf(this.results[u.uid])] = u;
      sortedPoints[sortedPoints.indexOf(this.results[u.uid])] = null;
    });

    // console.log('final', sortedUsers);

    return sortedUsers;
  }

  private getMatches(array: string[], test: string) {
    let count = 0;
    array.forEach(e => {
      if (e === test.toLowerCase().trim()) {
        count++;
      }
    });

    return count;
  }
}
