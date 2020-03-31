import { Component, OnInit } from '@angular/core';
import { AuthService } from '../shared/services/auth.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  private nextRoute: string;

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute) { }

  ngOnInit() {
    this.route.paramMap.subscribe(
      params => {
        if (params.get('id')) {
          this.nextRoute = params.get('id');
        }
      }
    );
  }

  public signIn(): void {
    this.authService.signinWithGoogle(this.nextRoute).then(
      () => this.nextRoute = null
    );
  }

}
