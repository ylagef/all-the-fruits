import { Component, OnInit } from '@angular/core';
import { AuthService } from '../shared/services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/auth';
import { User } from '../shared/models/user.model';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  private nextRoute: string;

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private afAuth: AngularFireAuth,
    private router: Router) { }

  ngOnInit() {
    const authSub = this.afAuth.authState.subscribe((user: User) => {
      if (!user) {
        this.route.paramMap.subscribe(
          params => {
            if (params.get('id')) {
              this.nextRoute = params.get('id');
            }
          }
        );
      } else {
        this.router.navigate(['/game']);
      }
      authSub.unsubscribe();
    });
  }

  public signIn(): void {
    this.authService.signinWithGoogle(this.nextRoute).then(
      () => this.nextRoute = null
    );
  }

}
