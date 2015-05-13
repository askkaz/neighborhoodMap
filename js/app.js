'use strict';
//Redirect to https if necessary... (needed for uber)
var loc = window.location.href + '';
if (loc.indexOf('http://askkaz') === 0) {
  window.location.href = loc.replace('http://', 'https://');
}

var offMapMarker = {
  name: 'No matching results....',
  latlng: new google.maps.LatLng(0, 89)
};
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
  name: "Ford's Theatre",
  lat: 38.8967,
  lon: -77.0258
}, {
  name: 'US Capitol',
  lat: 38.8898,
  lon: -77.0091
}, {
  name: 'US Supreme Court',
  lat: 38.8906,
  lon: -77.0044
}];
var markers = unsortedMarkers.sort(function(left, right) {
  return left.name == right.name ? 0 : (left.name < right.name ? -1 : 1);
});
for (var marker in markers) {
  if (markers.hasOwnProperty(marker)) {
    markers[marker].latLng = new google.maps.LatLng(markers[marker].lat, markers[marker].lon);
  }
}

var map = {};

var Place = function(data) {
  var self = this;
  this.marker = new google.maps.Marker({
    position: data.latLng,
    title: data.name
  });
  google.maps.event.addListener(this.marker, 'click', function() {
    viewModel.switchPlace(self);
  });
  this.price = ko.observable('Unavailable');
  this.updating = ko.observable(false);
  this.isSelected = ko.observable(false);
  this.matchesSearch = ko.observable(true);
};


var ViewModel = function() {
  var self = this;
  self.searchInput = ko.observable('');
  self.placeList = ko.observableArray([]);
  self.bounds = new google.maps.LatLngBounds();
  markers.forEach(function(markerItem) {
    self.placeList.push(new Place(markerItem));
    self.bounds.extend(markerItem.latLng);
  });
  self.iWindow = new google.maps.InfoWindow({
    content: ''
  });
  self.mapCenterLatitude = 38.9;
  self.mapCenterLongitude = -77.0;
  self.userLatitude = ko.observable(38.78);
  self.userLongitude = ko.observable(-77.27);
  self.wikiText = ko.observable('');
  self.wikiLink = ko.observable('');
  self.userWindow = new google.maps.InfoWindow({
    content: '<h5>Click on the map to change your start location!</h5>'
  });

  self.mapLatLng = new google.maps.LatLng(self.mapCenterLatitude, self.mapCenterLongitude);
  self.userLatLng = new google.maps.LatLng(self.userLatitude(), self.userLongitude());
  self.userPosition = new google.maps.Marker({
    position: self.userLatLng,
    title: "You are here",
    icon: 'https://maps.google.com/mapfiles/arrow.png'
  });
  self.userWindow.open(map, self.userPosition);


  google.maps.event.addListener(self.userPosition, 'position_changed', function() {
    self.userLatitude(this.position.lat());
    self.userLongitude(this.position.lng());
    self.updatePrices();
    self.userWindow.close();
  });

  self.currentPlace = ko.observable();
  self.updateWiki = function() {
    //http://en.wikipedia.org/?curid=152271
    var wikiRequest = 'https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exchars=300&explaintext&titles=' + self.currentPlace().marker.title + '&format=json&redirects';
    var wikiTimeout = setTimeout(function() {
      self.wikiText("Failed to get wiki resources");
      self.wikiLink('#');
    }, 8000);
    $.ajax({
      url: wikiRequest,
      dataType: 'jsonp',
      success: function(response) {
        var pages = response.query.pages;
        for (var page in pages) {
          if (pages.hasOwnProperty(page)) {
            self.wikiText(pages[page].extract);
            self.wikiLink('http://en.wikipedia.org/?curid=' + response.query.pages[page].pageid);
          }
        }
        clearTimeout(wikiTimeout);
      }
    });
  };
  this.switchPlace = function(clickedPlace) {
    if (self.currentPlace()) {
      self.currentPlace().isSelected(false);
    }
    self.currentPlace(clickedPlace);
    self.iWindow.setContent(self.currentPlace().marker.title);
    self.iWindow.open(map, self.currentPlace().marker);
    self.currentPlace().isSelected(true);
    self.updateWiki();
  };
  this.switchPlace(this.placeList()[0]);

  self.updatePrices = function() {
    this.placeList().forEach(function(place) {
      place.price('Fetching...');
      place.updating(true);
      var uberTimeout = setTimeout(function() {
        place.price('Unavailable');
      }, 8000);
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
          if (result.prices[0]) {
            place.price(result.prices[0].estimate);
          } else {
            place.price('Unavailable');
          }
          place.updating(false);
        },
        error: function() {
          place.price('Unavailable');
          place.updating(false);

        }

      });
      clearTimeout(uberTimeout);
    });
  };
  self.noPlace = new Place(offMapMarker);
  self.searchInput.subscribe(function(newVal) {

    var firstPlace = {};
    var re = new RegExp('(^|\\s)' + newVal, 'i');
    console.log(re);
    for (var place in self.placeList()) {

      if (self.placeList().hasOwnProperty(place)) {


        if (re.exec(self.placeList()[place].marker.title)) {
          self.placeList()[place].matchesSearch(true);
          self.placeList()[place].marker.setVisible(true);
          if (!firstPlace.marker) {
            firstPlace = self.placeList()[place];
          }
        } else {
          self.placeList()[place].matchesSearch(false);
          self.placeList()[place].marker.setVisible(false);
        }

      }
    }
    if (firstPlace.marker){
      self.switchPlace(firstPlace);
    }
    else{
      self.switchPlace(self.noPlace);
    }

  });
  self.updatePrices();
};


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
    }];
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
    for (var place in places) {
      if (places.hasOwnProperty(place)){
        places[place].marker.setMap(map);
      }

    }
    userMarker.setMap(map);
    google.maps.event.addListener(map, 'click', function(event) {
      placeMarker(event.latLng);
    });

    function placeMarker(location) {
      userMarker.setPosition(location);
    }

  }
};

var viewModel = new ViewModel();
ko.applyBindings(viewModel);