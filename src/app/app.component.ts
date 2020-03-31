import { Component } from '@angular/core';
import { AuthService } from './shared/services/auth.service';
import { User } from 'firebase';
import { AngularFireAuth } from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  public user: Observable<User>;

  constructor(
    private authService: AuthService,
    public translate: TranslateService,
    private afAuth: AngularFireAuth
  ) {
    this.user = this.afAuth.authState;

    translate.addLangs(['en', 'es']);
    translate.setDefaultLang('es');
  }

  public switchLang(lang: string): void {
    this.translate.use(lang);
  }

  public logOut(): void {
    this.authService.signOut();
  }
}
