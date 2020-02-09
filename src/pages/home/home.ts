import { Component, ViewChild, ElementRef, NgZone, DebugElement } from '@angular/core';
import { ToastController, LoadingController, AlertController, Alert, Platform } from 'ionic-angular';
import { Headers, RequestOptions, Http, Response, URLSearchParams } from '@angular/http';
import {GoogleMaps, GoogleMap, GoogleMapsEvent, Marker,GoogleMapsAnimation,
  MyLocation, Environment,Geocoder,GeocoderResult,Circle, ILatLng,Spherical, HtmlInfoWindow, MarkerCluster, CameraPosition} from '@ionic-native/google-maps';
import { SelectItem } from 'primeng/components/common/selectitem';
//import * as introJs from '../../../node_modules/intro.js/intro.js' ;
import { MenuItem } from 'primeng/api';
import { Common } from '../../common';
import { TranslateService } from 'ng2-translate';
import { EmailComposer } from '@ionic-native/email-composer';
import { elementAt, concat } from 'rxjs/operators';
import { Diagnostic } from '@ionic-native/diagnostic';
import { Globalization } from '@ionic-native/globalization';


declare var google;
class Report {
  Id: number = 0;
  Lat: number;
  Lng: number;
  Address: string;
  Type: string;
}


@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  items: MenuItem[];
  MenuItemReport: MenuItem[];
  Point: any// { latitude: number, longitude: number };
  map: GoogleMap;
  @ViewChild('map22') mapElement: ElementRef;
  @ViewChild('search_address') search_address: ElementRef;
  GoogleAutocomplete: any;
  autocomplete: any;
  autocompleteItems: any[] = [];
  geocoder: any;
  marker: Marker;
  LastLng: any;
  LastLat: any;
  loading: any;
  ATMSLst: any[] = [];
  ParkLst: any[] = [];
  DiffDays: any;
  dataDetails: any[] = [];
  CheckInLocation: any;
  overlayHidden: boolean = true;
  DetailsAddress: string = "";
  DetailsAddressType: string = "";
  CurrentAddress: string = "";

  HideMainCard: boolean = false;
  HideDetailsCard: boolean = true;
  HideCheckInPage: boolean = true;
  HideMapPage: boolean = false;
  HideAboutPage: boolean = true;
  ZoomLatLng: { lat: number, lng: number };
  TypeOfInteraction: any[] = [];
  InteractionId: number = 0;
  PointType: any[] = [];
  PointTypeId: any;
  NearByCheckIn: any[] = [];
  MapLocLoad: boolean;
  ATMToUserCheckIn: any[] = [];
  ParkToUserCheckIn: any[] = [];
  PlaceId: any;
  SelectedPlaceCheckIn: any = {};
  placeIdRequire: boolean = false;
  PointTypeIdRequire: boolean = false;
  ATMParkUserCkecksLST: any[] = [];
  DivDetailsSrc: string = "";
  DivDetailsStyle: any;
  DivDetailsPargraph: string = "";
  ParagraphDetailsStyle: any;
  ImageStyleIncaseUser: any;

  ATMParkUserToCheckIn: any[] = [];
  PlaceCheckInCount: number = 0;
  HideCheckSuccessCard: boolean = true;
  flage = true;
  _markerCluster: MarkerCluster;
  _hrefNavigation: string = "";
  ChechInTypesParagraph: any;
  MessagesTrans: any;
  legendDiv: boolean = true;
  _dir: string = "";
  Country: string = "";
  CountryCode: string = "";
  ReportItem: Report = <Report>{};
  placeSucessAddress: string = "";
  ParkOnOff: any[] = [];
  ATMOnOff: any[] = [];
  USEROnOff: any[] = [];
  preventAddNewPoint: boolean = false;
  parkOnly: boolean = false;
  atmOnly: boolean = false;
  horizontalDirLeft: boolean = true;
  fillDWList: any[] = [];
  constructor(public platform: Platform, public toastCtrl: ToastController, public http: Http, public translate: TranslateService,
    public emailComposer: EmailComposer, private globalization: Globalization,
    public Zone: NgZone, public loadingCtrl: LoadingController, public alerCtrl: AlertController, public common: Common, private diagnostic: Diagnostic) {
    try {
      this.GoogleAutocomplete = new google.maps.places.AutocompleteService();

    } catch (e) {
      console.log("e", e)
    }
    this.autocomplete = { input: '' };


  }

  ionViewDidLoad() {

    if (this.common.lang == 'AR')
      this._dir = 'rtl'
    else
      this._dir = 'ltr';

    this.loading = this.loadingCtrl.create({
      content: 'Please wait...'
    });

    this.loadMap();

    this.translate.get('InteractionType').subscribe((InteractionType) => {

      this.TypeOfInteraction = [
        { value: 1, label: InteractionType.AllNearBy },
        { value: 2, label: InteractionType.Parking },
        { value: 3, label: InteractionType.ATM },
        { value: 4, label: InteractionType.AddNewPoint }
      ]
    });
    this.translate.get('PointType').subscribe((PointType) => {
      this.PointType = [
        { value: 1, label: PointType.Park, valTxt: "Park" },
        { value: 2, label: PointType.ATM, valTxt: "ATM" },
      ]
    });
    this.translate.get('ChechInTypesParagraph').subscribe((value) => {
      this.ChechInTypesParagraph = value;
    });
    this.translate.get('Messages').subscribe((value) => {
      this.MessagesTrans = value;
    });
    this.translate.get('ViewIconLegends').subscribe(
      IconTxt => {
        this.translate.get('AboutUs').subscribe(
          AboutTxt => {
            this.translate.get('OpenDataPortal').subscribe(
              OpenDataPortalTxt => {
                this.fillMenueItems(IconTxt, AboutTxt, OpenDataPortalTxt);
              });
          });
      });

    this.translate.get('MenuReport').subscribe((value) => {
      this.MenuItemReport = [
        {
          label: value,
          command: (event) => {
            this.ReportErrorPlace();
          }
        }
      ];
    });

    this.globalization.getPreferredLanguage()
      .then(res => {

        if (res.value.indexOf("ar") != -1) { // ar
          this.horizontalDirLeft = false;
        }
        else
          this.horizontalDirLeft = true;
      })
      .catch(e => console.log("error ", e));
  }

  fillMenueItems(ViewIconLegendsTxt, AboutUsTxt, OpenDataPortalTxt) {
    this.items = [
      {
        label: "العربية",
        command: (event) => {

          this.ChangeLanguge("AR");
          this.CloseLegendPage();
        },
        visible: this.common.VisableAR,

      },
      {
        label: "EN",
        command: (event) => {
          this.CloseLegendPage();
          this.ChangeLanguge("EN");
        },
        visible: this.common.VisableEN,

      },
      {
        label: ViewIconLegendsTxt,//this.translate.g("ViewIconLegends"),//'View Icon Legends',
        command: (event) => {
          this.DisplayLegendPage(false);
        }

      }
      , {
        label: AboutUsTxt,
        command: (event) => {
          this.CloseLegendPage();
          this.DisplayAboutUs();
        }

      },
      {
        icon: 'pi pi-replay',
        label: OpenDataPortalTxt,
        url: 'https://data.gov.sa'
      }
    ];
  }
  ReportErrorPlace() {

    if (this.ReportItem != null && this.ReportItem.Id > 0) {
      let email = {
        to: 'sehamelsayed1993@gmail.com',
        subject: 'Report InCorrect Check-in',
        body: " ID: " + this.ReportItem.Id + "<br />" + " Address: " + this.ReportItem.Address + "<br />" +
          " Lat: " + this.ReportItem.Lat + "<br />" + " Lng: " + this.ReportItem.Lng + "<br />" + " Type: " + this.ReportItem.Type,
        isHtml: true,
        app: "Gmail"
      }

      this.emailComposer.open(email).then(() => {
        alert.present();
        this.ReportItem = <Report>{};
      })
      let alert = this.alerCtrl.create({
        title: '',
        subTitle: 'Thank You For Your Report',
        buttons: ['OK']
      });

    }
  }
  DisplayLegendPage(val: boolean) {
    document.documentElement.style.setProperty(`--position`, "absolute");
    this.legendDiv = val;
  }
  CloseLegendPage() {

    document.documentElement.style.setProperty(`--position`, "relative");
    this.legendDiv = true;
  }
  ChangeLanguge(lang) {
    if (lang == "AR") {
      this.common.lang = "AR";
      this.common.VisableAR = false;
      this.common.VisableEN = true;
    }
    else {
      this.common.lang = "EN";
      this.common.VisableAR = true;
      this.common.VisableEN = false;
    }
    window.location.reload();

  }
  DisplayAboutUs() {
    this.HideAboutPage = false;
    this.HideMapPage = true;
    this.HideCheckInPage = true;
  }
  loadMap() {

    this.map = GoogleMaps.create('map_canvas', {
      camera: {
        zoom: 16,
        tilt: 30
      }
    });
    this.loading.present();
    this.map.clear();
    this.GetLocation();
  }
  GetLocation() {
    this.map.getMyLocation()
      .then((location: MyLocation) => {
        this.map.animateCamera({
          target: location.latLng,
          zoom: 16,//14
          tilt: 30
        }).then(() => {

          this.loading.dismiss();
          this.marker = this.map.addMarkerSync({
            position: location.latLng,
            animation: GoogleMapsAnimation.BOUNCE,
            "icon": {
              url: "assets/imgs/MyLocation.png",
              size: {
                width: 50,
                height: 50,
              }
            }
          });
          this.MapLocLoad = true;
          this.Point = location.latLng;
          this.CheckInLocation = location.latLng;
          this.marker.showInfoWindow();
          this.DrawATMS();
          this.DrawPark();
          this.DrawUserChecks();
          this.map.on(GoogleMapsEvent.CAMERA_MOVE_START).subscribe((endRes) => {
            this.Point = endRes[0].target;

            this.MapLocLoad = false;
            this.FormateAtmData();
            this.FormateParkData();
            this.FormateUserChecksData();

            if (this.atmOnly) this.DrawATMOnlyToggle(true);
            if (this.parkOnly) this.DrawParkOnlyTOggle(true);


          });

          Geocoder.geocode({
            "position": this.CheckInLocation
          }).then((results: GeocoderResult[]) => {
            this.Country = results[0].country;
            this.CountryCode = results[0].countryCode;
            this.autocomplete.input = results[0].extra.lines.toString();
            this.CurrentAddress = results[0].extra.lines.toString();
          });
        });
      }, reason => {
        alert("Please turn on mobile location and Reopen the App");
        this.diagnostic.isLocationEnabled().then((isEnabled) => {
          if (!isEnabled && this.platform.is('cordova')) {
            // alert(isEnabled);
            this.diagnostic.switchToLocationSettings();
            this.GetLocation();
          }
        })

      });
  }
  selectSearchResult(item) {
    // fire when choose result from dwlist of plaes

    this.autocompleteItems = [];
    this.geocoder = new google.maps.Geocoder();
    this.autocomplete.input = item.description;

    Geocoder.geocode({
      "address": item.description //page.search_address.nativeElement.value
    })
      .then((results: GeocoderResult[]) => {
        this.loading.dismiss();
        this.marker = this.map.addMarkerSync({
          'position': results[0].position,
          "icon": {
            url: "assets/imgs/MyLocation.png",
            size: {
              width: 50,
              height: 50,
            }
          }
        });

        this.map.animateCamera({
          'target': results[0].position,
          'zoom': 16
        }).then(() => {
          this.marker.showInfoWindow();
        })
        debugger

        // this.MapLocLoad = false;
        this.Point = results[0].position;
        this.FormateAtmData();
        this.FormateParkData();
        this.FormateUserChecksData();
      });
  }
  updateSearchResults() {
    // fire when write on search box
    try {
      if (this.autocomplete.input == '')
        this.autocompleteItems = [];
      else {
        this.GoogleAutocomplete.getPlacePredictions({ input: this.autocomplete.input },
          (predictions, status) => {
            this.autocompleteItems = [];
            this.Zone.run(() => {
              if (predictions == null)
                this.autocompleteItems = [];
              else {
                predictions.forEach((prediction) => {
                  this.autocompleteItems.push(prediction);
                });
              }
              this.autocompleteItems = this.autocompleteItems;
            });
          });
      }
    } catch (e) {
      console.log(e)
    }
  }
  computeDistanceBetweenLanLng(position, latLng) {
    var BLoc: any = { lat: latLng.lat(), lng: latLng.lng() } //new google.maps.LatLng(position.lat, position.lng);
    let newValue1: ILatLng = <ILatLng>position;
    let newValue2: ILatLng = <ILatLng>BLoc;
    let Distance: number = Spherical.computeDistanceBetween(newValue1, newValue2);
    return Distance;
  }

  DrawATMS() {
    let limit = Number.MAX_SAFE_INTEGER;
    let Url = "https://data.gov.sa/Data/en/api/3/action/datastore_search?resource_id=e21abc9c-8825-4d23-b0b4-8179e88d6667&limit=" + limit;
    let header = new Headers({ 'Content-Type': 'application/json;charset=utf-8' });
    let Roption = new RequestOptions({ 'headers': header });
    this.http.get(Url, Roption)
      .subscribe(response => {

        let res = response.json();
        var result = res.result.records;
        if (result != undefined && result.length > 0) {
          if (result.length > 0) {
            this.ATMSLst = result;
            this.FormateAtmData();
          }
        }
      }, function (e) {
        console.log("error", e)
      })
  }
  FormateAtmData() {
    if (this.ATMSLst.length > 0) {
      for (var i = 0; i < this.ATMSLst.length; i++) {
        let latLng = new google.maps.LatLng(this.ATMSLst[i]["Y GIS Coordinates"], this.ATMSLst[i]["X GIS Coordinates"]);

        let dist = this.computeDistanceBetweenLanLng(this.Point, latLng);
        this.ATMSLst[i].Distance = dist;
        this.ATMSLst[i].latLng = latLng;
      }
      this.ATMSLst.sort((a, b) => a.Distance - b.Distance);
      this.dummyAtmData()

      if (localStorage.getObject("NearestATM") == undefined || localStorage.getObject("NearestATM") == null)
        localStorage.setObject("NearestATM", this.ATMSLst);
    }
  }
  dummyAtmData() {
    let d = [];
    for (var i = 0; i < 20; i++) {
      let NewMarker = this.map.addMarkerSync({
        "position": {
          "lat": this.ATMSLst[i].latLng.lat(),
          "lng": this.ATMSLst[i].latLng.lng()
        },
        "icon": {
          url: "assets/imgs/ATM.png",
          size: {
            width: 30,
            height: 30,
          }
        },
        Id: i,
        customInfo: this.ATMSLst[i]["id"],

      });
      this.ATMOnOff.push(NewMarker);
      NewMarker.one(GoogleMapsEvent.MARKER_CLICK).then((params) => this.MARKERATMClick(params, this, NewMarker))
    }
  }

  MARKERATMClick(params, _thisPage: HomePage, NewMarker) {

    let marker: Marker = <Marker>params[1];
    let Id: any = marker.get('customInfo');
    let obj = _thisPage.ATMSLst.find(a => a.id == Id);

    _thisPage.ZoomLatLng = { lat: obj["Y GIS Coordinates"], lng: obj["X GIS Coordinates"] }
    _thisPage.DetailsAddressType = "ATM";
    _thisPage.DetailsAddress = obj['الموقع'] + " , " + obj['City Arabic'];

    _thisPage.HideMainCard = true;
    _thisPage.HideDetailsCard = false;
    _thisPage.HideCheckSuccessCard = true;
    _thisPage.PlaceCheckInCount = (obj.checkin_count == null ? 0 : obj.checkin_count);
    _thisPage.DivDetailsSrc = "assets/imgs/ATM.png";
    _thisPage.DivDetailsStyle = {
      'background-color': '#d4f1e2'
    };
    _thisPage.DivDetailsPargraph = this.ChechInTypesParagraph.ATM;
    _thisPage.ParagraphDetailsStyle = {
      'color': '#37a76f'
    };
    this._hrefNavigation = "https://www.google.com/maps/dir/" + this.CheckInLocation.lat + "," +
      this.CheckInLocation.lng + "/" + obj["Y GIS Coordinates"] + "," + obj["X GIS Coordinates"];
    NewMarker.one(GoogleMapsEvent.MARKER_CLICK).then((params) => _thisPage.MARKERATMClick(params, _thisPage, NewMarker))
  }

  DrawPark() {
    let limit = Number.MAX_SAFE_INTEGER;
    let Url = "https://data.gov.sa/Data/en/api/3/action/datastore_search?resource_id=78708537-8606-4c88-916c-734b1bf38c5d&limit=" + limit;
    let header = new Headers({ 'Content-Type': 'application/json;charset=utf-8' });
    let Roption = new RequestOptions({ 'headers': header });
    this.http.get(Url, Roption)
      .subscribe(response => {

        let res = response.json();
        var result = res.result.records;
        if (result != undefined && result.length > 0) {
          this.ParkLst = result;
          this.FormateParkData();
        }
      }, function (e) {
        console.log("error", e)
      })
  }
  FormateParkData() {
    if (this.ParkLst.length > 0) {
      for (var i = 0; i < this.ParkLst.length; i++) {
        let latLng = new google.maps.LatLng(this.ParkLst[i].latd, this.ParkLst[i].lngd);
        this.ParkLst[i].latLng = latLng;
        this.ParkLst[i].Distance = this.computeDistanceBetweenLanLng(this.Point, latLng);
      }
      this.ParkLst.sort((a, b) => a.Distance - b.Distance);
      this.dummyParkData()
      if (localStorage.getObject("NearestPark") == undefined || localStorage.getObject("NearestPark") == null)
        localStorage.setObject("NearestPark", this.ATMSLst);


      //if (this.MapLocLoad == true) {
      //  this.ParkToUserCheckIn = this.ParkLst;
      //  //localStorage.setObject("NearestPark", this.ParkLst);
      //}
    }
  }
  dummyParkData() {
    let data = [];
    //this.ParkOnOff = [];
    for (var i = 0; i < 20; i++) {
      let NewMarker = this.map.addMarkerSync({
        "position": {
          "lat": this.ParkLst[i].latLng.lat(),
          "lng": this.ParkLst[i].latLng.lng()
        },
        "icon": {
          url: "assets/imgs/Parking.png",
          size: {
            width: 30,
            height: 30,
          }
        },
        customInfo: this.ParkLst[i]["id"],
        //visible: true

      });

      this.ParkOnOff.push(NewMarker);
      NewMarker.one(GoogleMapsEvent.MARKER_CLICK).then((params) => this.MARKERParkClick(params, this, NewMarker))
    }

    return data;
  }
  MARKERParkClick(params, _thisPage: HomePage, NewMarker) {

    let marker: Marker = <Marker>params[1];
    let Id: any = marker.get('customInfo');
    let obj = this.ParkLst.find(a => a.id == Id);
    _thisPage.DetailsAddressType = "Park";
    _thisPage.DetailsAddress = obj.PARCELNAME + " , " + obj.NEIGHBORHANAME + " , " + obj.MUNICIPALITYANAME;
    _thisPage.HideMainCard = true;
    _thisPage.HideDetailsCard = false;
    _thisPage.HideCheckSuccessCard = true;
    _thisPage.ZoomLatLng = { lat: obj.latd, lng: obj.lngd }
    _thisPage.PlaceCheckInCount = (obj.checkin_count == null ? 0 : obj.checkin_count);

    _thisPage.DivDetailsSrc = "assets/imgs/Parking.png";
    _thisPage.DivDetailsStyle = {
      'background-color': '#dcf0f5'
    };
    _thisPage.DivDetailsPargraph = this.ChechInTypesParagraph.Parking;
    _thisPage.ParagraphDetailsStyle = {
      'color': '#2e8ea8'
    };
    this._hrefNavigation = "https://www.google.com/maps/dir/" + this.CheckInLocation.lat + ","
      + this.CheckInLocation.lng + "/" + obj.latd + "," + obj.lngd;
    NewMarker.one(GoogleMapsEvent.MARKER_CLICK).then((params) => _thisPage.MARKERParkClick(params, _thisPage, NewMarker))
  }
  addParkCluster(data) {
    let markerCluster: MarkerCluster = this.map.addMarkerClusterSync({
      markers: data,
      icons: [
      ]
    });
    markerCluster.on(GoogleMapsEvent.MARKER_CLICK).subscribe((params) => {
      let marker: Marker = <Marker>params[1];
      let Id: any = marker.get('customInfo');

      let obj = this.ParkLst.find(a => a.id == Id);
      this.DetailsAddressType = "Park";
      this.DetailsAddress = obj.PARCELNAME + " , " + obj.NEIGHBORHANAME + " , " + obj.MUNICIPALITYANAME;
      this.HideMainCard = true;
      this.HideDetailsCard = false;
      this.HideCheckSuccessCard = true;
      this.ZoomLatLng = { lat: obj.latd, lng: obj.lngd }
      this.PlaceCheckInCount = (obj.checkin_count == null ? 0 : obj.checkin_count);

      this.DivDetailsSrc = "assets/imgs/Parking.png";
      this.DivDetailsStyle = {
        'background-color': '#dcf0f5'
      };
      this.DivDetailsPargraph = this.ChechInTypesParagraph.Parking;
      this.ParagraphDetailsStyle = {
        'color': '#2e8ea8'
      };
    });
    // markerCluster.on(GoogleMapsEvent.MARKER_CLICK).ti

  }
  DrawUserChecks() {

    let limit = Number.MAX_SAFE_INTEGER;
    let Url = "https://data.gov.sa/Data/en/api/3/action/datastore_search?resource_id=22f99ccd-6358-4b81-afc9-08291f5caf45&limit=" + limit;
    let header = new Headers({ 'Content-Type': 'application/json;charset=utf-8' });
    let Roption = new RequestOptions({ 'headers': header });
    this.http.get(Url, Roption)
      .subscribe(response => {

        let res = response.json();
        var result = res.result.records;
        if (result != undefined && result.length > 0) {
          if (result.length > 0) {
            this.ATMParkUserCkecksLST = result;
            this.FormateUserChecksData();
          }
        }
      }, function (e) {
        console.log("error", e)
      })
  }
  FormateUserChecksData() {
    if (this.ATMParkUserCkecksLST.length > 0) {
      for (var i = 0; i < this.ATMParkUserCkecksLST.length; i++) {
        let latLng = new google.maps.LatLng(this.ATMParkUserCkecksLST[i].LAT, this.ATMParkUserCkecksLST[i].lNG);

        let dist = this.computeDistanceBetweenLanLng(this.Point, latLng);
        this.ATMParkUserCkecksLST[i].Distance = dist;
        this.ATMParkUserCkecksLST[i].latLng = latLng;
      }
      this.ATMParkUserCkecksLST.sort((a, b) => a.Distance - b.Distance);
      this.dummyUserChecksData();

      if (localStorage.getObject("NearestUserATMPark") == undefined || localStorage.getObject("NearestUserATMPark") == null) {
        localStorage.setObject("NearestUserATMPark", this.ATMParkUserCkecksLST);
      }
    }
  }
  dummyUserChecksData() {
    let d = [];
    for (var i = 0; i < this.ATMParkUserCkecksLST.length; i++) {
      if (this.parkOnly && this.ATMParkUserCkecksLST[i].TYPE == "ATM") {
        continue;
      }
      else if (this.atmOnly && this.ATMParkUserCkecksLST[i].TYPE == "Park") {
        continue;
      }
      else {
        let imgURL = "";
        if (this.ATMParkUserCkecksLST[i].TYPE == "ATM")
          imgURL = "assets/imgs/UserATM.png";
        else
          imgURL = "assets/imgs/UserPark.png";

        let NewMarker = this.map.addMarkerSync({
          "position": {
            "lat": this.ATMParkUserCkecksLST[i].LAT,
            "lng": this.ATMParkUserCkecksLST[i].lNG
          },
          "icon": {
            url: imgURL,
            size: {
              width: 30,
              height: 30,
            }
          },
          customInfo: this.ATMParkUserCkecksLST[i]["id"]
        });
        let newObj = { marker: NewMarker, type: this.ATMParkUserCkecksLST[i].TYPE };
        this.USEROnOff.push(newObj);

        NewMarker.one(GoogleMapsEvent.MARKER_CLICK).then((params) => this.MARKERUserChecksClick(params, this, NewMarker))
      }
    }
    //console.log(" this.ATMParkUserCkecksLST", this.ATMParkUserCkecksLST)
    //console.log("USEROnOff", this.USEROnOff)
    //if (this.parkOnly) {
    //  for (var i = 0; i < this.USEROnOff.length; i++) {
    //    if (this.USEROnOff[i].type == "ATM") // remove
    //      this.USEROnOff[i].marker.setVisible(false);
    //    else
    //      this.USEROnOff[i].marker.setVisible(true);
    //  }
    //}
  }
  MARKERUserChecksClick(params, _thisPage: HomePage, NewMarker) {

    let marker: Marker = <Marker>params[1];
    let Id: any = marker.get('customInfo');

    let obj = this.ATMParkUserCkecksLST.find(a => a.id == Id);
    _thisPage.DetailsAddressType = "User" + obj.TYPE;
    _thisPage.DetailsAddress = obj.NAME;
    _thisPage.HideMainCard = true;
    _thisPage.HideDetailsCard = false;
    this.HideCheckSuccessCard = true;
    _thisPage.PlaceCheckInCount = (obj.checkin_count == null ? 0 : obj.checkin_count);
    _thisPage.ZoomLatLng = { lat: obj.LAT, lng: obj.lNG };

    this.ReportItem = {
      Id: obj.id,
      Address: obj.NAME,
      Lat: obj.LAT,
      Lng: obj.lNG,
      Type: (obj.TYPE == "ATM" ? "ATM" : "Parking")
    };


    if (obj.TYPE == "ATM") {
      _thisPage.DivDetailsSrc = "assets/imgs/UserATM.png";
      _thisPage.DivDetailsStyle = {
        'background-color': '#ffdac1'
      };
      _thisPage.DivDetailsPargraph = this.ChechInTypesParagraph.ATMByUser;
    }
    else {
      _thisPage.DivDetailsSrc = "assets/imgs/UserPark.png";
      _thisPage.DivDetailsStyle = {
        'background-color': '#ffdac1'
      };
      _thisPage.DivDetailsPargraph = this.ChechInTypesParagraph.ParkByUser;
    }
    _thisPage.ParagraphDetailsStyle = {
      'color': '#ff6600'
    };
    this._hrefNavigation = "https://www.google.com/maps/dir/" + this.CheckInLocation.lat + ","
      + this.CheckInLocation.lng + "/" + obj.LAT + "," + obj.lNG;
    NewMarker.one(GoogleMapsEvent.MARKER_CLICK).then((params) => _thisPage.MARKERUserChecksClick(params, _thisPage, NewMarker))
  }
  addUserChecksCluster(data) {
    let markerCluster: MarkerCluster = this.map.addMarkerClusterSync({
      markers: data,
      icons: [

      ]
    });
    markerCluster.on(GoogleMapsEvent.MARKER_CLICK).subscribe((params) => {
      let marker: Marker = <Marker>params[1];
      let Id: any = marker.get('customInfo');

      let obj = this.ATMParkUserCkecksLST.find(a => a.id == Id);
      this.DetailsAddressType = "User" + obj.TYPE;
      this.DetailsAddress = obj.NAME;
      this.HideMainCard = true;
      this.HideDetailsCard = false;
      this.HideCheckSuccessCard = true;
      this.PlaceCheckInCount = (obj.checkin_count == null ? 0 : obj.checkin_count);
      this.ZoomLatLng = { lat: obj.LAT, lng: obj.lNG };

      if (obj.TYPE == "ATM") {
        this.DivDetailsSrc = "assets/imgs/UserATM.png";
        this.DivDetailsStyle = {
          'background-color': '#ffdac1'
        };
        this.DivDetailsPargraph = this.ChechInTypesParagraph.ATMByUser;
      }
      else {
        this.DivDetailsSrc = "assets/imgs/UserPark.png";
        this.DivDetailsStyle = {
          'background-color': '#ffdac1'
        };
        this.DivDetailsPargraph = this.ChechInTypesParagraph.ParkByUser;
      }
      this.ParagraphDetailsStyle = {
        'color': '#ff6600'
      };


    });
  }


  DisplayDetails() {

    this.dataDetails = [];
    if (this.ATMSLst.length > 0)
      this.dataDetails.push({
        Distance: this.ATMSLst[0].Distance,
        Name: this.ATMSLst[0]["الموقع"],
        type: 1,
        lat: this.ATMSLst[0]["Y GIS Coordinates"],
        lng: this.ATMSLst[0]["X GIS Coordinates"]
      })

    if (this.ParkLst.length > 0)
      this.dataDetails.push({
        Distance: this.ParkLst[0].Distance,
        Name: this.ParkLst[0].NEIGHBORHANAME,
        type: 2,
        lat: this.ParkLst[0].latd,
        lng: this.ParkLst[0].lngd
      })

    this.overlayHidden = false;

  }
  UserCheckIn() {
    let headers = new Headers(
      {
        'Content-Type': 'application/json',
        "Accept": "application/json",
        "Authorization": "89fd8337-f201-4f5d-aa36-282008c52ba8"
      });
    let options = new RequestOptions({ headers: headers });
    let data = [{
      Lat: this.CheckInLocation.lat,
      Lng: this.CheckInLocation.lng,
      CreationTime: new Date()
    }];
    let datastore = {
      method: "insert",
      force: true,
      resource_id: "d22f5e76-e53c-47b2-ac9c-dc6f3dc82fdc",
      records: data
    };

    // let url = "http://mwteam-001-site29.ftempurl.com/home/checkIn";
    let url = "https://data.gov.sa/Data/en/api/3/action/datastore_upsert";
    this.http.post(url, datastore, options)
      .subscribe(response => {

        let Message = "";
        if (response.status == 200)
          Message = this.MessagesTrans.CkeckInSuccessfully;
        else
          Message = this.MessagesTrans.ErrorWhileCheckIn;
        let method = this.alerCtrl.create({
          message: Message,
          buttons: [
            {
              text: 'Ok',
              cssClass: 'method-color',
              handler: () => {
                //    console.log('Group clicked');
              }
            }
          ]
        });
        method.present()
      }
        , function (e) {
          console.log("error", e)
        })
  }
  hideOverlay() {
    this.overlayHidden = true;
  }

  ResetLocation() {
    let position: CameraPosition<any> = {
      target: this.CheckInLocation,
    }
    this.map.moveCamera(position);
    this.autocomplete.input = this.CurrentAddress;
  }
  BackToMainCard() {
    this.HideMainCard = false;
    this.HideDetailsCard = true;
    this.HideCheckSuccessCard = true;
    this.flage = true;
  }
  BackToMapPage() {

    this.HideMapPage = false;
    this.HideMainCard = false;
    this.HideCheckInPage = true;
    this.HideAboutPage = true;

    this.HideDetailsCard = true;

  }
  ZoomPlace(lat, lng) {
    let target = { lat: lat, lng: lng };
    let position: CameraPosition<any> = {
      target: target,
      zoom: 20
    }

    this.map.moveCamera(position);
  }
  CheckIn() {
    if (this.CountryCode == "SA") {
      this.HideCheckInPage = false;
      this.HideAboutPage = true;
      this.HideMainCard = true;
      this.HideDetailsCard = true;
      this.HideCheckSuccessCard = true;
      this.CloseLegendPage();
      this.InteractionId = 0;
      this.PointTypeId = 0;
    }
  }
  getClosestATMToMyLoc(dist: number) {
    let arrData: any[] = localStorage.getObject("NearestATM")
    if (arrData.length > 0) {
      //this.arrData[i].length
      for (var i = 0; i < arrData[i].length; i++) {
        if (arrData[i].Distance < dist) {
          this.NearByCheckIn.push({
            value: {
              id: arrData[i].id,
              type: "ATM",
            },
            label: arrData[i]['الموقع'] + " , " + arrData[i]['City Arabic'],
            type: "ATM",
            Distance: arrData[i].Distance,
            lat: arrData[i]["Y GIS Coordinates"],
            lng: arrData[i]["X GIS Coordinates"],
            checkin_count: arrData[i].checkin_count
          })
        }
        else
          continue;
      }
    }
  }
  getClosestUSERCheckInToMyLoc(PlaceType, dist: number) {
    // dist = 333014;

    if (localStorage.getObject("NearestUserATMPark") != undefined && localStorage.getObject("NearestUserATMPark") != null) {
      let arrData: any[] = localStorage.getObject("NearestUserATMPark")
      let newFilteredLST: any[] = [];
      if (PlaceType == "ATM")
        newFilteredLST = arrData.filter(function (i) { return i.TYPE == "ATM" });
      else if (PlaceType == "Park")
        newFilteredLST = arrData.filter(function (i) { return i.TYPE == "Park" });
      else
        newFilteredLST = arrData;

      if (newFilteredLST.length > 0) {
        for (var i = 0; i < newFilteredLST.length; i++) {
          let latLng = new google.maps.LatLng(newFilteredLST[i].LAT, newFilteredLST[i].lNG);

          newFilteredLST[i].Distance = this.computeDistanceBetweenLanLng(this.CheckInLocation, latLng);
          if (newFilteredLST[i].Distance < dist) {
            this.NearByCheckIn.push({
              value: {
                id: newFilteredLST[i].id,
                type: "USER" + newFilteredLST[i].TYPE,
              },
              label: newFilteredLST[i].NAME,
              type: "USER" + newFilteredLST[i].TYPE,
              Distance: newFilteredLST[i].Distance,
              lat: newFilteredLST[i].LAT,
              lng: newFilteredLST[i].lNG,
              checkin_count: newFilteredLST[i].checkin_count
            })
          }
          else
            continue;
        }
      }
    }
  }
  getClosestParkToMyLoc(dist: number) {
    let arrData: any[] = localStorage.getObject("NearestPark");
    if (arrData.length > 0) {
      for (var i = 0; i < arrData.length; i++) {
        if (arrData[i].Distance < dist) {
          this.NearByCheckIn.push({
            value: {
              id: arrData[i].id,
              type: "Park",
            },
            label: arrData[i].PARCELNAME + " , " + arrData[i].NEIGHBORHANAME + " , " + arrData[i].MUNICIPALITYANAME,
            type: "Park",
            Distance: arrData[i].Distance,
            lat: arrData[i].latd,
            lng: arrData[i].lngd,
            checkin_count: arrData[i].checkin_count
          })
        }
        else
          continue;
      }
    }
  }
  DetailView(item) {
    this.ZoomPlace(item.lat, item.lng)
    this.DetailsAddressType = item.type;
    this.DetailsAddress = item.label;
    this.PlaceCheckInCount = (item.checkin_count == null ? 0 : item.checkin_count);
    //Show Map First
    this.HideCheckInPage = true;
    this.HideMapPage = false;
    this.HideMainCard = true;
    this.HideDetailsCard = false;
    this.HideCheckSuccessCard = true;
    this.ZoomLatLng = { lat: item.lat, lng: item.lng };
    this.ReportItem = { Id: item.value.id, Address: item.label, Lat: item.lat, Lng: item.lng, Type: "" };
    if (item.type == "ATM") {
      this.DivDetailsSrc = "assets/imgs/ATM.png";
      this.DivDetailsStyle = {
        'background-color': '#d4f1e2'
      };
      this.DivDetailsPargraph = this.ChechInTypesParagraph.ATM;
      this.ParagraphDetailsStyle = {
        'color': '#37a76f'
      };
    }
    else if (item.type == "Park") {
      this.DivDetailsSrc = "assets/imgs/Parking.png";
      this.DivDetailsStyle = {
        'background-color': '#dcf0f5'
      };
      this.DivDetailsPargraph = this.ChechInTypesParagraph.Parking;
      this.ParagraphDetailsStyle = {
        'color': '#2e8ea8'
      };
    }
    else {
      if (item.type == "USERATM") {
        this.DivDetailsSrc = "assets/imgs/UserATM.png";
        this.DivDetailsStyle = {
          'background-color': '#ffdac1'
        };
        this.DivDetailsPargraph = this.ChechInTypesParagraph.ATMByUser;
        this.ReportItem.Type = "ATM";
      }
      else if (item.type == "USERPark") {
        this.DivDetailsSrc = "assets/imgs/UserPark.png";
        this.DivDetailsStyle = {
          'background-color': '#ffdac1'
        };
        this.DivDetailsPargraph = this.ChechInTypesParagraph.ParkByUser;
        this.ReportItem.Type = "Parking";
      }
      this.ParagraphDetailsStyle = {
        'color': '#ff6600'
      };
    }

  }
  changeInteraction(event) {
    this.PlaceId = 0;
    if (this.placeIdRequire == true)
      this.placeIdRequire = false;
    if (this.PointTypeIdRequire == true)
      this.PointTypeIdRequire = false;
    this.NearByCheckIn = [];
    if (event.value == 1) { // All
      if (this.ATMSLst.length > 0)
        this.getClosestATMToMyLoc(200);

      if (this.ParkLst.length > 0)
        this.getClosestParkToMyLoc(200);

      if (this.ATMParkUserCkecksLST.length > 0)
        this.getClosestUSERCheckInToMyLoc("All", 200);

      if (this.NearByCheckIn.length > 0)
        this.NearByCheckIn.sort((a, b) => a.Distance - b.Distance);
    }
    else if (event.value == 2) {// Parking
      if (this.ParkLst.length > 0)
        this.getClosestParkToMyLoc(200);

      if (this.ATMParkUserCkecksLST.length > 0)
        this.getClosestUSERCheckInToMyLoc("Park", 200);
      //  alert(this.NearByCheckIn.length)
      if (this.NearByCheckIn.length > 0)
        this.NearByCheckIn.sort((a, b) => a.Distance - b.Distance);
    }
    else if (event.value == 3) {// ATM

      if (this.ATMSLst.length > 0)
        this.getClosestATMToMyLoc(200);

      if (this.ATMParkUserCkecksLST.length > 0)
        this.getClosestUSERCheckInToMyLoc("ATM", 200);

      if (this.NearByCheckIn.length > 0)
        this.NearByCheckIn.sort((a, b) => a.Distance - b.Distance);
    }
    else { // value =4 add new point
      if (this.ATMSLst.length > 0)
        this.getClosestATMToMyLoc(50);

      if (this.ParkLst.length > 0)
        this.getClosestParkToMyLoc(50);

      if (this.ATMParkUserCkecksLST.length > 0)
        this.getClosestUSERCheckInToMyLoc("All", 50);

    }
  }

  changePlace(item) {
    this.SelectedPlaceCheckIn = this.NearByCheckIn.find(a => a.value.id == item.value.id);
  }
  SaveCheckIn() {

    if (this.InteractionId == 4) // add new point
    {
      if (this.PointTypeId.value == 1) // park
      {
        var arr = this.NearByCheckIn.filter(p => p.type == "USERPark" || p.type == "Park");
        if (arr.length > 0)
          this.preventAddNewPoint = true;
        else
          this.preventAddNewPoint = false;
      }
      else if (this.PointTypeId.value == 2) { // ATM
        var arr = this.NearByCheckIn.filter(p => p.type == "USERATM" || p.type == "ATM");
        if (arr.length > 0)
          this.preventAddNewPoint = true;
        else
          this.preventAddNewPoint = false;
      }
    }

    if (this.preventAddNewPoint == true && this.InteractionId == 4) {

      this.translate.get('PreventADDNewPoint').subscribe((value) => {
        let alertfy = this.alerCtrl.create({
          title: '',
          subTitle: value,
          buttons: ['OK']
        });
        alertfy.present();
      });

    } else {
      // in cass 1,2,3 we increment check in point of existing place
      if (this.InteractionId == 1 || this.InteractionId == 2 || this.InteractionId == 3) {
        if (this.PlaceId == null || this.PlaceId == 0) {
          this.placeIdRequire = true;
          return;
        }
        else {
          this.placeIdRequire = false;
          this.UpdateExistingLocation();
          // Save Check In
        }
      } else {// in cass new  we add new check in
        if (this.PointTypeId == null || this.PointTypeId == 0) {
          this.PointTypeIdRequire = true;
          return;
        }
        else { // Add Check in New point ====== USER CHECK IN
          this.PointTypeIdRequire = false;
          this.ADDNewLocation();
        }
      }
    }
  }
  InsertCheckIn(LocationId, type, selectedPlace) {
    let headers = new Headers(
      {
        'Content-Type': 'application/json',
        "Accept": "application/json",
        "Authorization": "89fd8337-f201-4f5d-aa36-282008c52ba8"
      });
    let options = new RequestOptions({ headers: headers });
    let data = [{
      Lat: this.CheckInLocation.lat,
      Lng: this.CheckInLocation.lng,
      CreationTime: new Date(),
      type: type,//this.SelectedPlaceCheckIn.type,
      location_id: LocationId//this.SelectedPlaceCheckIn.value.id
    }];
    let datastore = {
      method: "insert",
      force: true,
      resource_id: "9307b0a7-f734-48d9-84fc-2d2a7ddbfa8f",
      records: data
    };

    let url = "https://data.gov.sa/Data/en/api/3/action/datastore_upsert";
    this.http.post(url, datastore, options)
      .subscribe(response => {
        if (response.status == 200) {
          this.HideCheckInPage = true;
          this.HideMapPage = false;
          this.HideCheckSuccessCard = false;
          this.HideMainCard = true;
          this.HideDetailsCard = true;
          this.ZoomPlace(selectedPlace.lat, selectedPlace.lng);
        }

      }
        , function (e) {
          console.log("error", e)
        })
  }
  UpdateExistingLocation() {
    this.placeSucessAddress = this.SelectedPlaceCheckIn.label;
    let headers = new Headers(
      {
        'Content-Type': 'application/json',
        "Accept": "application/json",
        "Authorization": "89fd8337-f201-4f5d-aa36-282008c52ba8"
      });
    let options = new RequestOptions({ headers: headers });
    let data = [{
      checkin_count: (this.SelectedPlaceCheckIn.checkin_count == null ? 1 : Number.parseInt(this.SelectedPlaceCheckIn.checkin_count) + 1),
      id: this.SelectedPlaceCheckIn.value.id
    }];
    let ResourceId = "";
    if (this.SelectedPlaceCheckIn.type == "ATM") {
      ResourceId = "e21abc9c-8825-4d23-b0b4-8179e88d6667";
    } else if (this.SelectedPlaceCheckIn.type == "Park") {
      ResourceId = "78708537-8606-4c88-916c-734b1bf38c5d";

    } else if (this.SelectedPlaceCheckIn.type == "USERPark" || this.SelectedPlaceCheckIn.type == "USERATM") {
      ResourceId = "22f99ccd-6358-4b81-afc9-08291f5caf45";
    }
    let datastore = {
      method: "update",
      force: true,
      resource_id: ResourceId,
      records: data
    };

    let url = "https://data.gov.sa/Data/en/api/3/action/datastore_upsert";
    this.http.post(url, datastore, options)
      .subscribe(response => {
        if (response.status == 200)
          this.InsertCheckIn(data[0].id, this.SelectedPlaceCheckIn.type, this.SelectedPlaceCheckIn);
      }
        , function (e) {
          console.log("error", e)
        })
  }
  ADDNewLocation() {
    ////////////// Add New Place Then Check In
    this.placeSucessAddress = this.CurrentAddress;
    let headers = new Headers(
      {
        'Content-Type': 'application/json',
        "Accept": "application/json",
        "Authorization": "89fd8337-f201-4f5d-aa36-282008c52ba8"
      });
    let options = new RequestOptions({ headers: headers });
    let Id = Math.random() * (new Date().getDay() + new Date().getMonth() + new Date().getFullYear() + new Date().getMinutes() + new Date().getMilliseconds())
    Id = Number.parseInt(Id.toString());
    let data = [{
      LAT: this.CheckInLocation.lat,
      lNG: this.CheckInLocation.lng,
      CREATION_TIME: new Date(),
      TYPE: this.PointTypeId.valTxt,
      NAME: this.CurrentAddress,
      checkin_count: 1,
      id: Id
    }];
    //  alert(data[0].CREATION_TIME)
    let datastore = {
      method: "insert",
      force: true,
      resource_id: "22f99ccd-6358-4b81-afc9-08291f5caf45",
      records: data
    };

    let url = "https://data.gov.sa/Data/en/api/3/action/datastore_upsert";
    let seletedPlace = { lat: this.CheckInLocation.lat, lng: this.CheckInLocation.lng }
    this.http.post(url, datastore, options)
      .subscribe(response => {
        if (response.status == 200)
          this.InsertCheckIn(Id, "USER" + data[0].TYPE, seletedPlace);
      }
        , function (e) {
          console.log("error", e)
        })
  }
  DrawParkOnlyTOggle(fromCamerMove?: boolean) {
    if (fromCamerMove == null || fromCamerMove == false)
      this.parkOnly == false ? this.parkOnly = true : this.parkOnly = false;

    if (this.parkOnly) {
      // Remove ATM
      for (var i = 0; i < this.ATMOnOff.length; i++) {
        this.ATMOnOff[i].setVisible(false);
      }
      // draw Park
      for (var i = 0; i < this.ParkOnOff.length; i++) {
        this.ParkOnOff[i].setVisible(true);
      }
      // Remove User Atm & draw UserPark
      for (var i = 0; i < this.USEROnOff.length; i++) {
        if (this.USEROnOff[i].type == "ATM") // remove
          this.USEROnOff[i].marker.setVisible(false);
        else
          this.USEROnOff[i].marker.setVisible(true);
      }
    }
    else {
      // Remove ATM
      for (var i = 0; i < this.ATMOnOff.length; i++) {
        this.ATMOnOff[i].setVisible(true);
      }
      // draw Park
      for (var i = 0; i < this.ParkOnOff.length; i++) {
        this.ParkOnOff[i].setVisible(true);
      }
      // Remove User Atm & draw UserPark
      for (var i = 0; i < this.USEROnOff.length; i++) {
        if (this.USEROnOff[i].type == "ATM") // remove
          this.USEROnOff[i].marker.setVisible(true);
        else
          this.USEROnOff[i].marker.setVisible(true);
      }
    }

  }
  DrawATMOnlyToggle(fromCamerMove?: boolean) {
    if (fromCamerMove == null || fromCamerMove == false)
      this.atmOnly == false ? this.atmOnly = true : this.atmOnly = false;
    if (this.atmOnly) {
      // Draw ATM
      for (var i = 0; i < this.ATMOnOff.length; i++) {
        this.ATMOnOff[i].setVisible(true);
      }
      // Remove park
      for (var i = 0; i < this.ParkOnOff.length; i++) {
        this.ParkOnOff[i].setVisible(false);
      }
      // Remove User Park & draw User ATM
      for (var i = 0; i < this.USEROnOff.length; i++) {
        if (this.USEROnOff[i].type == "ATM") // remove
          this.USEROnOff[i].marker.setVisible(true);
        else
          this.USEROnOff[i].marker.setVisible(false);
      }
    }
    else {
      // Draw ATM
      for (var i = 0; i < this.ATMOnOff.length; i++) {
        this.ATMOnOff[i].setVisible(true);
      }
      // Remove park
      for (var i = 0; i < this.ParkOnOff.length; i++) {
        this.ParkOnOff[i].setVisible(true);
      }
      // Remove User Park & draw User ATM
      for (var i = 0; i < this.USEROnOff.length; i++) {
        if (this.USEROnOff[i].type == "ATM") // remove
          this.USEROnOff[i].marker.setVisible(true);
        else
          this.USEROnOff[i].marker.setVisible(true);
      }
    }
  }
}
