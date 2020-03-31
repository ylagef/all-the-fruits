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

  constructor(
    private gameService: GameService,
    private route: ActivatedRoute,
    private router: Router,
    private afAuth: AngularFireAuth
  ) { }

  ngOnInit() {
    this.route.paramMap.subscribe(
      params => {
        if (params.get('id')) {
          this.afAuth.authState.subscribe((user: User) => {
            if (!user) {
              this.router.navigate(['login/' + params.get('id')]);
            } else {
              this.loadGame(params.get('id'));
            }
          });
        }
      }
    );
  }

  public loadGame(id: string) {
    this.gameId = id;

    const game = this.gameService.getGame(id);
    const sub = game.subscribe(
      (g: Game) => {
        if (g === undefined) {
          this.router.navigate(['game']);
        } else {
          this.game = game;
        }
        sub.unsubscribe();
      }
    );
  }

}
