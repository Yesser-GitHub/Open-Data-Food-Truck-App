
import { Component, ViewChild } from '@angular/core';
import { Nav, Platform } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

import { HomePage } from '../pages/home/home';
import { MarkerPage } from '../pages/marker/marker';
import { CirclePage } from '../pages/circle/circle';
import { IntroPage } from '../pages/introJs/intro';
import { Common } from '../common';
import { TranslateService } from 'ng2-translate';
import { Diagnostic } from '@ionic-native/diagnostic';

@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  @ViewChild(Nav) nav: Nav;

  rootPage: any;
  runApp: boolean = false;
  pages: Array<{ title: string, component: any }>;

  constructor(public platform: Platform, public statusBar: StatusBar, public translate: TranslateService,
    public common: Common, private diagnostic: Diagnostic) {
    this.pages = [{ title: 'Home', component: HomePage }];


    this.platform.ready().then(() => {

      //if (this.platform.is('android')) {

      //  this.diagnostic.isLocationAvailable()
      //    .then((state) => {
      //      if (state == this.diagnostic.locationMode.LOCATION_OFF) {
      //        diagnostic.permission.ACCESS_FINE_LOCATION;
      //        diagnostic.switchToLocationSettings();

      //      } else {

      //        if (state == true)
      //          this.initializeApp();
      //        else
      //          this.f1().then(res => this.f2());

      //      }
      //    }).catch(e => alert("error" + e));


      //}
      //else {
        this.initializeApp();
     // }
   });

  }

  f1() {
    return new Promise((resolve, reject) => {
      this.diagnostic.switchToLocationSettings();
      this.runApp = true;
      resolve();

    });
  }

  f2() {
    //    alert("f2" + this.runApp)
    if (this.runApp == true)
      this.initializeApp();
  }


  initializeApp() {

    this.rootPage = HomePage;

    if (this.common.lang == "AR") {
      this.translate.setDefaultLang('ar');
      this.translate.use('ar');
    }
    else {
      this.translate.setDefaultLang('en');
      this.translate.use('en');
    }
    this.statusBar.styleDefault();
    localStorage.clear();
  }

  openPage(page) {

    this.nav.setRoot(page.component);
  }
}
