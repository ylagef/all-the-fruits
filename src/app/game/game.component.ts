import { Component, OnInit } from '@angular/core';
import { Game } from '../shared/models/game.model';
import { GameService } from '../shared/services/game.service';
import { Observable } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/auth';
import { User } from '../shared/models/user.model';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss']
})
export class GameComponent implements OnInit {

  public game: Observable<Game>;
  public gameId: string;

  public loaded = false;

  constructor(
    private gameService: GameService,
    private route: ActivatedRoute,
    private router: Router,
    private afAuth: AngularFireAuth
  ) { }

  ngOnInit() {
    this.route.paramMap.subscribe(
      params => {
        this.afAuth.authState.subscribe((user: User) => {
          if (!user) {
            localStorage.removeItem('user');
            if (params.get('id')) {
              this.router.navigate(['login/' + params.get('id')]);
            } else {
              this.router.navigate(['login']);
            }
          } else {
            if (params.get('id')) {
              this.loadGame(params.get('id'));
            } else {
              this.loaded = true;
            }
          }
        });


      }
    );
  }

  public loadGame(id: string) {
    this.gameId = id;

    const game = this.gameService.getGame(id);
    const sub = game.subscribe(
      (g: Game) => {
        this.loaded = true;

        const current = JSON.parse(localStorage.getItem('user'));
        if (g === undefined ||
          ((g.people === g.users.length) && !(g.users.find(u => u.uid === current.uid)))) {
          // If undefined, if full and I'm not player
          this.router.navigate(['game']);
        } else {
          this.game = game;
        }
        sub.unsubscribe();
      }
    );
  }

}
