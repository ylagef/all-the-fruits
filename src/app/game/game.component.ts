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
  public game$: Observable<Game>;
  public gameId: string;

  public loaded = false;

  constructor(
    private gameService: GameService,
    private route: ActivatedRoute,
    private router: Router,
    private afAuth: AngularFireAuth
  ) { }

  ngOnInit() {
    this.loaded = false;

    this.route.paramMap.subscribe(
      params => {
        this.gameId = params.get('id');

        const authSub = this.afAuth.authState.subscribe((user: User) => {
          if (!user) {
            localStorage.removeItem('user');
            (this.gameId) ? this.router.navigate(['login/' + this.gameId]) : this.router.navigate(['login']);
          } else {
            if (this.gameId) {
              this.game$ = this.gameService.getGame(this.gameId);
              const gameSub = this.game$.subscribe(() => {
                this.loaded = true;
                gameSub.unsubscribe();
              });
            } else {
              this.loaded = true;
            }
          }
          authSub.unsubscribe();
        });
      }
    );
  }
}
