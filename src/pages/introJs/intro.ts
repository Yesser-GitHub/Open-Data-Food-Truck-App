import { Component, ViewChild, ElementRef, NgZone } from '@angular/core';
import { ToastController, LoadingController, AlertController, NavController } from 'ionic-angular';
import { Slides } from 'ionic-angular';
import { HomePage } from '../home/home';


declare global {
  interface Storage {
    setObject(key: string, value: any);
    getObject(key: string): any;
    hasKey(key: string): boolean;
  }
}
Storage.prototype.setObject = function (key: string, value: any) {
  this.setItem(key, JSON.stringify(value));
}
Storage.prototype.getObject = function (key: string): any {
  var value = this.getItem(key);
  return value && JSON.parse(value);
}
Storage.prototype.hasKey = function (key: string): any {
  for (var i = 0; i < localStorage.length; i++)
    if (localStorage.key(i) == key)
      return true;
  return false;
}
declare var require: any
//const IntroJs = require("../../../node_modules/intro.js/intro");


@Component({
  selector: 'page-intro',
  templateUrl: 'intro.html'
})
export class IntroPage {
  @ViewChild(Slides) slides: Slides;

  constructor(public alerCtrl: AlertController, public navController: NavController) {
   
    let SkipIntro = localStorage.getObject('SkipIntro');
    if (SkipIntro != null && SkipIntro == true) {
      this.navController.push(HomePage)
    }
  }

  goToSlide() {
    alert("goToSlide")
    this.slides.slideTo(2, 500);
  }

  skip() {
    localStorage.setObject('SkipIntro', true);
    this.navController.push(HomePage)
  }
  begin() {
    this.navController.push(HomePage)
  }
}
