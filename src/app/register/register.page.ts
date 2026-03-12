import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: false
})
export class RegisterPage implements OnInit {

  constructor(
    private router: Router
  ) { }

  ngOnInit() {
  }

  doRegister() {
    this.router.navigate(['/tabs/tab1']);
  }

}
