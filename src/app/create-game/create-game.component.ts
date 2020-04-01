import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { AuthService } from '../shared/services/auth.service';
import { User } from '../shared/models/user.model';
import { GameService } from '../shared/services/game.service';
import { Game } from '../shared/models/game.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-create-game',
  templateUrl: './create-game.component.html',
  styleUrls: ['./create-game.component.scss']
})
export class CreateGameComponent implements OnInit {
  public user: User;
  public game: Game;

  public selectedCategory = '';
  public categoryValidationActive = false;

  public allLetters: string[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L',
    'M', 'N', 'Ñ', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

  public suggestedCategories: string[] = [
    'Nombre propio', 'Película o serie', 'País o ciudad', 'Fruta o verdura', 'Personaje famoso', 'Comida',
    'Excusa para llegar tarde', 'Apellido', 'Marca de automóvil', 'Videojuego', 'Artista', 'Libro', 'Animal',
    'Dibujo animado', 'Color', 'Equipo de fútbol', 'Grupo musical', 'Parte del cuerpo', 'Marca', 'Flor o planta',
    'Objeto', 'Profesión', 'Adjetivo', 'Insulto', 'Bebida', 'Electrodoméstico', 'Prenda', 'Carrera Universitaria',
    'Asignatura', 'Instrumento', 'Herramienta', 'Deporte'
  ];

  public step = 0;

  public categoriesError: string;
  public peopleError: string;
  public roundsError: string;
  public lettersError: string;

  public lettersHint = false;
  public categoriesHint = false;

  public suggestedAmount = 10;

  constructor(
    private authService: AuthService,
    public gameService: GameService,
    public router: Router
  ) { }

  ngOnInit() {
    this.user = this.authService.user;

    this.game = new Game();
    this.game.categories = [];
    this.game.excludedLetters = ['Ñ', 'W', 'X', 'Y', 'Z'];
    this.game.roundsNumber = 5;
    this.game.people = 2;

    // Shuffle array
    for (let i = this.suggestedCategories.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.suggestedCategories[i], this.suggestedCategories[j]] = [this.suggestedCategories[j], this.suggestedCategories[i]];
    }
  }

  public getSuggestedCategories(): string[] {
    return this.suggestedCategories.slice(0, this.suggestedAmount);
  }

  public loadMore(): void {
    if (this.suggestedAmount + 5 > this.suggestedCategories.length) {
      this.suggestedAmount = this.suggestedCategories.length;
    } else {
      this.suggestedAmount += 5;
    }
  }

  public handleLetter(letter: string): void {
    if (this.game.excludedLetters.includes(letter)) {
      this.game.excludedLetters.splice(this.game.excludedLetters.indexOf(letter), 1);
    } else {
      this.game.excludedLetters.push(letter);
    }

    this.checkLetterError();
  }

  public letterExluded(letter: string): boolean {
    return !(this.game.excludedLetters.includes(letter));
  }

  public addCategory(): void {
    if (this.selectedCategory !== '' && !this.categoryAdded(this.selectedCategory)) {
      this.game.categories.push(this.selectedCategory);
      this.selectedCategory = '';
    }

    this.checkCategoriesError();
  }

  public addSuggestedCategory(index: number): void {
    if (!this.categoryAdded(this.suggestedCategories[index])) {
      this.game.categories.push(this.suggestedCategories[index]);
    }

    this.checkCategoriesError();
  }

  public removeSuggestedCategory(i: number): void {
    const index = this.game.categories.findIndex(c =>
      c.toLowerCase().split(' ').join('').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      === this.suggestedCategories[i].toLowerCase().split(' ').join('').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    );

    this.game.categories.splice(index, 1);

    this.checkCategoriesError();
  }

  public removeCategory(index): void {
    this.game.categories.splice(index, 1);

    this.checkCategoriesError();
  }

  public createGame(): void {
    this.categoryValidationActive = true;
    this.checkCategoriesError();

    this.checkPeopleError();
    this.checkRoundsError();
    this.checkLetterError();

    if (!this.categoriesError && !this.peopleError && !this.roundsError && !this.lettersError) {
      this.gameService.createGame(this.game);
      // .then(
      //   data => {
      //     this.game.id = data.id;
      //     this.router.navigate(['game/' + this.game.id]);
      //   }
      // ).catch(error => console.error(error));
    }
  }

  public checkCategoriesError(): void {
    if (this.game.categories.length > 2 && !this.categoryValidationActive) {
      this.categoryValidationActive = true;
    }

    if (this.categoryValidationActive) {
      if (this.game.categories.length < 3) {
        this.categoriesError = 'At least 3 categories must be selected';
      } else {
        this.categoriesError = '';
      }
    }
  }

  public checkPeopleError(): void {
    if (this.game.people < 2) {
      this.peopleError = 'At least 2 people';
    } else if (this.game.people > 20) {
      this.peopleError = 'Max 20 people';
    } else {
      this.peopleError = '';
    }
  }

  public checkRoundsError(): void {
    if (this.game.roundsNumber < 1) {
      this.roundsError = 'At least 1 round';
    } else {
      this.roundsError = '';
    }
  }

  public checkLetterError(): void {
    if ((this.game.excludedLetters.length + this.game.roundsNumber) > this.allLetters.length) {
      this.lettersError = 'At least one letter per round must be available';
    } else {
      this.lettersError = '';
    }
  }

  public categoryAdded(category: string): boolean {
    return this.game.categories.find(
      ((c: string) =>
        c.toLowerCase().split(' ').join('').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        === category.toLowerCase().split(' ').join('').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      )
    ) !== undefined;
  }

  public nextStep(): void {
    this.step++;
  }
}
