'use strict';
//Redirect to https if necessary... (needed for uber)
var loc = window.location.href + '';
if (loc.indexOf('http://askkaz') === 0) {
  window.location.href = loc.replace('http://', 'https://');
}
//MODEL
var offMapMarker = {
  name: 'No matching results....',
  latlng: new google.maps.LatLng(0, 89)
};
var markers = [{
  name: "Ford's Theatre",
  lat: 38.8967,
  lon: -77.0258
}, {
  name: 'Lincoln Memorial',
  lat: 38.8893,
  lon: -77.0501
}, {
  name: 'MLK Memorial',
  lat: 38.8861,
  lon: -77.0450
}, {
  name: 'Mount Vernon',
  lat: 38.708987,
  lon: -77.086132
}, {
  name: 'The Pentagon',
  lat: 38.8710,
  lon: -77.0560
}, {
  name: 'The White House',
  lat: 38.8977,
  lon: -77.0366
}, {
  name: 'Udvar Hazy Center',
  lat: 38.9114,
  lon: -77.4441
}, {
  name: 'US Capitol',
  lat: 38.8898,
  lon: -77.0091
}, {
  name: 'US Supreme Court',
  lat: 38.8906,
  lon: -77.0044
}, {
  name: 'Washington Monument',
  lat: 38.8895,
  lon: -77.0352
}];
//Make google markers from data
for (var marker in markers) {
  if (markers.hasOwnProperty(marker)) {
    markers[marker].latLng = new google.maps.LatLng(markers[marker].lat, markers[marker].lon);
  }
}
var map = {};
var mapCenterLatitude = 38.9;
var mapCenterLongitude = -77.0;
var userLat = 38.78;
var userLon = -77.27;


var Place = function(data) {
  var self=this;
  this.marker = new google.maps.Marker({
    position: data.latLng,
    title: data.name
  });
  //Add listener for someone clicking a place on the map to switch selection
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
  this.wikiText = ko.observable('');
  this.wikiLink = ko.observable('');

  //Map Properties
  this.searchInput = ko.observable('');
  this.mapLatLng = new google.maps.LatLng(mapCenterLatitude, mapCenterLongitude);
  this.bounds = new google.maps.LatLngBounds();
  this.iWindow = new google.maps.InfoWindow({
    content: ''
  });

  //Define User Properties
  this.userLatitude=ko.observable(userLat);
  this.userLongitude = ko.observable(userLon);
  this.userLatLng = new google.maps.LatLng(this.userLatitude(), this.userLongitude());
  this.userPosition = new google.maps.Marker({
    position: self.userLatLng,
    title: "You are here",
    icon: 'https://maps.google.com/mapfiles/arrow.png'
  });
  this.userWindow = new google.maps.InfoWindow({
    content: '<h5>Click on the map to change your start location!</h5>'
  });
  this.userWindow.open(map, this.userPosition);
  google.maps.event.addListener(this.userPosition, 'position_changed', function() {
    self.userLatitude(this.position.lat());
    self.userLongitude(this.position.lng());
    self.updatePrices();
    self.userWindow.close();
  });

  //Places
  this.placeList = ko.observableArray([]);
  this.currentPlace = ko.observable();
  markers.forEach(function(markerItem) {
    self.placeList.push(new Place(markerItem));
    self.bounds.extend(markerItem.latLng); //extend bounds to fit markers
  });

  this.updateWiki = function() {
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

  this.updatePrices = function() {
    self.placeList().forEach(function(place) {
      place.price('Fetching...');
      place.updating(true);
      var uberTimeout = setTimeout(function() {
        place.price('Unavailable');
        place.updating(false);
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
  this.noPlace = new Place(offMapMarker);
  this.searchInput.subscribe(function(newVal) {
    var firstPlace = {}; //define var to hold first search
    var re = new RegExp('(^|\\s)' + newVal, 'i');
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
    if (firstPlace.marker) {
      self.switchPlace(firstPlace);
    } else {
      self.switchPlace(self.noPlace);
    }
  });
  //Initialize selected place and prices
  this.switchPlace(this.placeList()[0]);
  this.updatePrices();
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
      center: mapObj.mapCenter,
      zoom: 14,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      styles: remove_poi,
      scrollwheel: false,
      draggable: $(document).width() > 480 ? true : false //Turn off panning for mobile.
    };
    map = new google.maps.Map(element, mapOptions);
    map.fitBounds(mapObj.mapBounds);
    google.maps.event.addDomListener(window, 'load', this);
    //search input
    var input = /** @type {HTMLInputElement} */ (
      document.getElementById('pac-input'));
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
    //markers
    var places = ko.utils.unwrapObservable(mapObj.places());
    for (var place in places) {
      if (places.hasOwnProperty(place)) {
        places[place].marker.setMap(map);
      }
    }
    var userMarker = ko.utils.unwrapObservable(mapObj.user);
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

