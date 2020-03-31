import { Injectable, NgZone } from '@angular/core';
import { auth } from 'firebase/app';
import { User } from '../models/user.model';
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root'
})

export class AuthService {
  public user: User;

  constructor(
    private router: Router,
    private ngZone: NgZone,
    private afAuth: AngularFireAuth
  ) {
    this.afAuth.authState.subscribe((u: User) => {
      if (u) {
        this.user = new User();
        this.user.uid = u.uid;
        this.user.displayName = u.displayName;

        localStorage.setItem('user', JSON.stringify(this.user));
      }
    });
  }

  // Firebase SignInWithPopup
  private oAuthProvider(provider, nextRoute?: string) {
    return this.afAuth.auth.signInWithPopup(provider)
      .then(() => {
        this.ngZone.run(() => {
          if (nextRoute) {
            this.router.navigate(['game/' + nextRoute]);
          } else {
            this.router.navigate(['game']);
          }
        });
      }).catch((error) => {
        console.error(error);
      });
  }

  // Firebase Google Sign-in
  public signinWithGoogle(nextRoute?: string) {
    return this.oAuthProvider(new auth.GoogleAuthProvider(), nextRoute);
  }

  // Firebase Logout
  public signOut(): void {
    this.afAuth.auth.signOut().then(
      () => {
        localStorage.removeItem('user');
        this.router.navigate(['/']);
      }
    ).catch(error => console.error(error));
  }
}
