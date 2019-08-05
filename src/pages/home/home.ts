import { Component, ViewChild, ElementRef, NgZone } from '@angular/core';
import { ToastController, LoadingController, AlertController } from 'ionic-angular';
import { Headers, RequestOptions, Http, Response, URLSearchParams } from '@angular/http';
import {GoogleMaps, GoogleMap, GoogleMapsEvent, Marker,GoogleMapsAnimation,
  MyLocation, Environment,Geocoder,GeocoderResult,Circle, ILatLng,Spherical, HtmlInfoWindow, MarkerCluster} from '@ionic-native/google-maps';
import { debounce } from 'ionic-angular/umd/util/util';

declare var google;

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

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  Point: any// { latitude: number, longitude: number };
  map: GoogleMap;
  @ViewChild('map22') mapElement: ElementRef;
  @ViewChild('search_address') search_address: ElementRef;
  GoogleAutocomplete: any;
  autocomplete: any;
  autocompleteItems: any;
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
  constructor(public toastCtrl: ToastController, public http: Http,
    public Zone: NgZone, public loadingCtrl: LoadingController,public alerCtrl: AlertController) {
    try {
      this.GoogleAutocomplete = new google.maps.places.AutocompleteService();

    } catch (e) {
      console.log("e", e)
    }
    this.autocomplete = { input: '' };
    this.autocompleteItems = [];
  }

  ionViewDidLoad() {
    this.loading = this.loadingCtrl.create({
      content: 'Please wait...'
    });
    let DateOfData = localStorage.getObject('DataDate');
    if (DateOfData != null) {
      const date1 = new Date(DateOfData);
      const date2 = new Date();
      const diffTime = Math.abs(date2.getTime() - date1.getTime());
      this.DiffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    this.loadMap();
  }

  loadMap() {
    //Environment.setEnv({
    //  'API_KEY_FOR_BROWSER_RELEASE': 'AIzaSyCb3y8TNCjUycucVQ3a3zBq2TrbfLKBjso',
    //  'API_KEY_FOR_BROWSER_DEBUG': 'AIzaSyCb3y8TNCjUycucVQ3a3zBq2TrbfLKBjso'
    //});

    this.map = GoogleMaps.create('map_canvas', {
      camera: {
        zoom: 16,
        tilt: 30
      }
    });
    this.loading.present();
    this.map.clear();
    this.map.getMyLocation()
      .then((location: MyLocation) => {

        this.map.animateCamera({
          target: location.latLng,
          zoom: 14,
          tilt: 30
        }).then(() => {
          this.loading.dismiss();
          // add a marker
          this.marker = this.map.addMarkerSync({
            //title: 'Click Her To Find Nearst Park & ATM ',
            snippet: '',
            position: location.latLng,
            animation: GoogleMapsAnimation.BOUNCE
          });

          this.Point = location.latLng;
          this.CheckInLocation = location.latLng;
          this.marker.showInfoWindow();
          this.DrawATMS();
          this.DrawPark();
        
          this.map.on(GoogleMapsEvent.CAMERA_MOVE_START).subscribe((endRes) => {
            console.log(endRes)
            this.Point = endRes[0].target;
            this.FormateAtmData();
            this.FormateParkData();
          });

        });
      }, reason => {
        alert("Error")
        alert(reason); // Error!
      });
  }
  
  DrawShap(center) {
    let radius = 60;  
    let circle: Circle = this.map.addCircleSync({
      'center': center,
      'radius': radius,
      'strokeColor': '#AA00FF',
      'strokeWidth': 5,
      'fillColor': '#00880055',
    //  'clickable': true
    });
    circle.setClickable(true)
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
          //'title': " Click Her To Find Nearst Park & ATM "
        });

        this.map.animateCamera({
          'target': results[0].position,
           'zoom': 16
        }).then(() => {
          this.marker.showInfoWindow();
          })
        this.Point = results[0].position;
        this.FormateAtmData();
        this.FormateParkData();
       
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
  showToast(message: string) {
    let toast = this.toastCtrl.create({
      message: message,
      duration: 2000,
      position: 'middle'
    });
    toast.present(toast);
  }
  computeDistanceBetweenLanLng(position, latLng) {
    var BLoc: any = { lat: latLng.lat(), lng: latLng.lng() } //new google.maps.LatLng(position.lat, position.lng);
    let newValue1: ILatLng = <ILatLng>position;
    let newValue2: ILatLng = <ILatLng>BLoc;
    let Distance: number = Spherical.computeDistanceBetween(newValue1, newValue2);
    return Distance;
  }

  DrawATMS() {
    let DataFromStorage = localStorage.getObject('ATMSLst');

    if (DataFromStorage != null && DataFromStorage.length>0 && this.DiffDays < 29) {
      this.ATMSLst = DataFromStorage;
      this.FormateAtmData();
    }
    else {
      let limit = Number.MAX_SAFE_INTEGER;
      let Url = "https://data.gov.sa/Data/en/api/3/action/datastore_search?resource_id=7269fc92-72ce-4fcc-a442-4884912f88bb&limit=" + limit;
      let header = new Headers({ 'Content-Type': 'application/json;charset=utf-8' });
      let Roption = new RequestOptions({ 'headers': header });
      this.http.get(Url, Roption)
        .subscribe(response => {

          let res = response.json();
          var result = res.result.records;
          if (result != undefined && result.length > 0) {
            if (result.length > 0) {
              this.ATMSLst = result;
              localStorage.setObject('ATMSLst', this.ATMSLst);
              localStorage.setObject('DataDate', new Date());
              this.FormateAtmData();
            }
          }
        }, function (e) {
          console.log("error", e)
        })
    }
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
      this.addAtmCluster(this.dummyAtmData());
    }
  }
  dummyAtmData() {
    let d = [];
    for (var i = 0; i < 20; i++) {
      d.push(
        {
          "position": {
            "lat": this.ATMSLst[i].latLng.lat(),
            "lng": this.ATMSLst[i].latLng.lng()
          },
          "title": this.ATMSLst[i].Site,
          "icon": {
            url: "assets/imgs/ATMIcon.png",
            size: {
               width: 30,
                height: 30,
              }
          }
      }
      )
    }
    return d;
  }
  addAtmCluster(data) {
    let markerCluster: MarkerCluster = this.map.addMarkerClusterSync({
      markers: data,
      icons: [

      ]
    });
  }
  DrawPark() {
    let DataFromStorage = localStorage.getObject('ParkLst');
    if (DataFromStorage != null && this.DiffDays < 29) {
      this.ParkLst = DataFromStorage;
      this.FormateParkData();
    }
    else {
      let limit = Number.MAX_SAFE_INTEGER;
      let Url = "https://data.gov.sa/Data/en/api/3/action/datastore_search?resource_id=855e79eb-31b9-443d-9c72-bd1ce3786865&limit=" + limit;
      let header = new Headers({ 'Content-Type': 'application/json;charset=utf-8' });
      let Roption = new RequestOptions({ 'headers': header });
      this.http.get(Url, Roption)
        .subscribe(response => {
          
          let res = response.json();
          var result = res.result.records;
          if (result != undefined && result.length > 0) {
            this.ParkLst = result;
            localStorage.setObject('ParkLst', this.ParkLst);
            this.FormateParkData();
          }
        }, function (e) {
          console.log("error", e)
        })
    }
  }

  FormateParkData() {
    if (this.ParkLst.length > 0) {
      for (var i = 0; i < this.ParkLst.length; i++) {
        let latLng = new google.maps.LatLng(this.ParkLst[i].latd, this.ParkLst[i].lngd);
        this.ParkLst[i].latLng = latLng;
        this.ParkLst[i].Distance = this.computeDistanceBetweenLanLng(this.Point, latLng);
      }
      this.ParkLst.sort((a, b) => a.Distance - b.Distance);
      this.addParkCluster(this.dummyParkData());

    }
  }
  dummyParkData() {
    let data = [];
    for (var i = 0; i < 20; i++) {
      data.push(
        {
          "position": {
            "lat": this.ParkLst[i].latLng.lat(),
            "lng": this.ParkLst[i].latLng.lng()
          },
          "title": this.ParkLst[i].PARCELNAME,
          "icon": {
            url: "assets/imgs/park.png",
            size: {
              width: 30,
              height: 30,
            }
          }
        }
      )
    }
    return data;
  }
  addParkCluster(data) {
    let markerCluster: MarkerCluster = this.map.addMarkerClusterSync({
      markers: data,
      icons: [

      ]
    });
  }
  DisplayDetails() {
    this.dataDetails = [];
    if (this.ATMSLst.length > 0) {
     
      this.dataDetails.push({ Distance: this.ATMSLst[0].Distance, Name: this.ATMSLst[0]["الموقع"], type: 1 })
    }
    if (this.ParkLst.length > 0) {
      this.dataDetails.push({ Distance: this.ParkLst[0].Distance, Name: this.ParkLst[0].NEIGHBORHANAME, type: 2 })
    }

    this.overlayHidden = false;
  }
  UserCheckIn() {
    let headers = new Headers(
      {
        'Content-Type': 'application/json',
        "Accept": "application/json",
        "Authorization":"89fd8337-f201-4f5d-aa36-282008c52ba8"
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

    let url = "https://data.gov.sa/Data/en/api/3/action/datastore_upsert";
    this.http.post(url, datastore, options)
      .subscribe(response => {

        let Message = "";
        if (response.status == 200)
          Message = "Ckeck In Successfully";
        else
          Message = "Error While Check In";
        let method = this.alerCtrl.create({
          message: Message,
          buttons: [
            {
              text: 'Ok',
              cssClass: 'method-color',
              handler: () => {
                console.log('Group clicked');
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
  getMyStyles() {
    return  {
        'margin-top': '120%',
      };
  }
  hideOverlay() {
    this.overlayHidden = true;
  }
}
