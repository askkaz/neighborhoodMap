//Redirect to https (needed for uber)
var loc = window.location.href + '';
if (loc.indexOf('http://askkaz') == 0) {
  window.location.href = loc.replace('http://', 'https://');
}

var unsortedMarkers = [{
  name: 'Mount Vernon',
  lat: 38.708987,
  lon: -77.086132
}, {
  name: 'The Pentagon',
  lat: 38.8710,
  lon: -77.0560
}, {
  name: 'Udvar Hazy Center',
  lat: 38.9114,
  lon: -77.4441

}, {
  name: 'Washington Monument',
  lat: 38.8895,
  lon: -77.0352
}, {
  name: 'The White House',
  lat: 38.8977,
  lon: -77.0366
}, {
  name: 'Lincoln Memorial',
  lat: 38.8893,
  lon: -77.0501
}, {
  name: 'Martin Luther King, Jr. Memorial',
  lat: 38.8861,
  lon: -77.0450
}, {
  name: 'Air and Space Museum',
  lat: 38.8880,
  lon: -77.0200
}, {
  name: 'Smithsonian Castle',
  lat: 38.8887,
  lon: -77.0260
}, {
  name: "Ford's Theatre",
  lat: 38.8967,
  lon: -77.0258
}, {
  name: 'US Capitol',
  lat: 38.8898,
  lon: -77.0091
}, {
  name: 'Supreme Court',
  lat: 38.8906,
  lon: -77.0044
}];
var markers = unsortedMarkers.sort(function(left, right) {
  return left.name == right.name ? 0 : (left.name < right.name ? -1 : 1)
});
for (marker in markers){
  markers[marker].latLng=new google.maps.LatLng(markers[marker].lat, markers[marker].lon);
}

var map = {};

var Place = function(data){
  var self=this;
  this.marker = new google.maps.Marker({
    position: data.latLng,
      title: data.name
  })
  google.maps.event.addListener(this.marker,'click', function(){
    viewModel.switchPlace(self);
  });
  this.price = ko.observable('Unavailable');
  this.updating = ko.observable(false);
  this.isSelected = ko.observable(false);
}

var ViewModel = function(){
  var self = this;
  self.placeList = ko.observableArray([]);
  self.bounds = new google.maps.LatLngBounds();
  markers.forEach(function (markerItem){
    self.placeList.push(new Place(markerItem));
    self.bounds.extend(markerItem.latLng);
  })
  self.iWindow = new google.maps.InfoWindow({
    content: 'test'
  });
  self.mapCenterLatitude = 38.9;
  self.mapCenterLongitude = -77.0;
  self.userLatitude = ko.observable(38.9);
  self.userLongitude = ko.observable(-77.0);
  self.mapLatLng = new google.maps.LatLng(self.mapCenterLatitude, self.mapCenterLongitude);
  self.userPosition = new google.maps.Marker({
    draggable: true,
    position: self.mapLatLng,
    title: "You are here",
    icon: 'https://maps.google.com/mapfiles/arrow.png'
  });

  google.maps.event.addListener(self.userPosition, 'dragend', function() {
    self.userLatitude(this.position.lat());
    self.userLongitude(this.position.lng());
    self.updatePrices();
  });
  this.currentPlace=ko.observable();
  this.switchPlace = function(clickedPlace){
    self.currentPlace(clickedPlace);
    self.iWindow.setContent(self.currentPlace().marker.title);
    self.iWindow.open(map,self.currentPlace().marker);
    self.currentPlace().isSelected(true);
  };
  this.switchPlace(this.placeList()[0]);

  self.updatePrices = function(){
    this.placeList().forEach(function(place){
      place.price('Fetching...');
      place.updating(true);
      $.ajax({
        url: "https://api.uber.com/v1/estimates/price",
        headers: {
         Authorization: "Token " + 'guQmO5RBKDkuf8vWZWqlrfBS9mX635G4_frn7ekR'
        },
        data: {
          start_latitude: self.userLatitude(),
          start_longitude: self.userLongitude(),
          end_latitude: place.marker.position.lat(),
          end_longitude: place.marker.position.lng()
      },
      success: function(result) {
        (result.prices[0] ? place.price(result.prices[0]) : place.price('Unavailable'));
      },
      error: function(result) {
        place.price('Unavailable');

      }

      });

          place.updating(false);


  });
}
}


ko.bindingHandlers.map = {
  init: function(element, valueAccessor, allBindingsAccessor, viewModel) {
    var mapObj = ko.utils.unwrapObservable(valueAccessor());
    //Remove the native google maps POI popups
    var remove_poi = [{
      "featureType": "poi",
      "elementType": "labels",
      "stylers": [{
        "visibility": "off"
      }]
    }]
    var mapOptions = {
      center: mapObj.mapLatLng,
      zoom: 14,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      styles: remove_poi,
      scrollWheel: false
    };
    map = new google.maps.Map(element, mapOptions);
    map.fitBounds(mapObj.bounds);
    google.maps.event.addDomListener(window, 'load', this);
    var input = /** @type {HTMLInputElement} */ (
      document.getElementById('pac-input'));
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
  },
  update: function(element, valueAccessor, allBindingsAccessor, viewModel) {
     var mapObj = ko.utils.unwrapObservable(valueAccessor());
     var places = ko.utils.unwrapObservable(mapObj.placeList());
     var userMarker = ko.utils.unwrapObservable(mapObj.userPosition);
     for (place in places) {
       places[place].marker.setMap(map);
     }
     userMarker.setMap(map);
  }
};

viewModel = new ViewModel();
ko.applyBindings(viewModel);
