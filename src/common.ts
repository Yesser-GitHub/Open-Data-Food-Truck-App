import { Headers, RequestOptions } from '@angular/http';  
import { LoadingController, Loading } from 'ionic-angular';
import { Injectable, EventEmitter } from '@angular/core';



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


@Injectable()
export class Common {

  private _lang: string;
  private _VisableAR: boolean;
  private _VisableEN: boolean;

  //custom Events
  logoutRequested$: EventEmitter<string>;
  tokenChanged$: EventEmitter<string>;
  //Refresh Menu
  loadMenuRequested$: EventEmitter<any>;
  constructor() {
    this._lang = '';
    this._VisableAR ;
    this._VisableEN;

  }


  get lang(): string {
    if (this._lang == undefined || this._lang == '') {
      this._lang = localStorage.getItem('lang');
    }
    if (this._lang == undefined || this._lang == '') {
      this._VisableAR = true;
      this._VisableEN = false;
      return 'en';
    }
    else if (this._lang == "AR") {
      this._VisableAR = false;
      this._VisableEN = true;
      return this._lang;
    }
    else if (this._lang == "EN") {
      this._VisableAR = true;
      this._VisableEN = false;
      return this._lang;
    }
    else return this._lang;
  }

  set lang(value: string) {
    this._lang = value;
    localStorage.setItem('lang', value);
  }
  set VisableAR(value: boolean) {
    this._VisableAR = value;
    localStorage.setItem('VisableAR', "" + value + "");
  }
  set VisableEN(value: boolean) {
    this._VisableEN = value;
    localStorage.setItem('VisableEN', "" + value + "");
  }

  get VisableAR(): boolean {
    if (this._VisableAR == undefined) {
      this._VisableAR = (localStorage.getItem('VisableAR') == "true" ? true : false);
    }
    return this._VisableAR;
  }
  get VisableEN(): boolean {
    if (this._VisableEN == undefined) {
      this._VisableEN = (localStorage.getItem('VisableEN') == "true" ? true : false);
    }
    return this._VisableEN;
  }


  get app_direction(): string {
    if (this._lang == 'ar')
      return 'rtl'
    else
      return 'ltr';
  }

  set app_direction(val) {
    
  }
  ///show loading


}

