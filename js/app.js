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
  name: 'Eden Center',
  lat: 38.8736,
  lon: -77.1539
}, {
  name: 'Manassas Battlefield Park',
  lat: 38.8128,
  lon: -77.5217
}, {
  name: 'Mount Vernon',
  lat: 38.708987,
  lon: -77.086132
},{
  name: "Reagan Airport",
  lat: 38.8519,
  lon: -77.0377
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
/**
 * Represents a place in the region of interest.
 * @constructor
 * @param {object} data - contains a google latLng and name for the place
 */
 var Place = function(data) {
  var self=this;
  self.marker = new google.maps.Marker({
    position: data.latLng,
    title: data.name
  });
  //Add listener for someone clicking a place on the map to switch selection
  google.maps.event.addListener(self.marker, 'click', function() {
    viewModel.switchPlace(self);
  });
  self.price = ko.observable('Unavailable');
  self.updating = ko.observable(false);
  self.isSelected = ko.observable(false);
  self.matchesSearch = ko.observable(true);
};
/**
 * Represents the wiki data currently displayed.
 * @constructor
 */
 var Wiki=function(){
  var self=this;
  self.text=ko.observable('');
  self.link=ko.observable('#');
};
/**
 * Represents the view model for knockout to bind to.
 * @constructor
 */
 var ViewModel = function() {
  var self = this;
  self.wikiText = ko.observable('');
  self.wikiLink = ko.observable('');
  self.wikiInfo = ko.observable(new Wiki());
  //Map Properties
  self.searchInput = ko.observable('');
  self.mapLatLng = new google.maps.LatLng(mapCenterLatitude, mapCenterLongitude);
  self.bounds = new google.maps.LatLngBounds();
  self.iWindow = new google.maps.InfoWindow({
    content: ''
  });
  //Define User Properties
  self.userLatitude=ko.observable(userLat);
  self.userLongitude = ko.observable(userLon);
  self.userLatLng = new google.maps.LatLng(self.userLatitude(), self.userLongitude());
  self.userPosition = new google.maps.Marker({
    position: self.userLatLng,
    title: "You are here",
    icon: 'https://maps.google.com/mapfiles/arrow.png'
  });
  google.maps.event.addListener(self.userPosition, 'position_changed', function() {
    self.userLatitude(this.position.lat());
    self.userLongitude(this.position.lng());
    self.updatePrices();

  });
  //Places
  self.placeList = ko.observableArray([]);
  self.currentPlace = ko.observable();
  markers.forEach(function(markerItem) {
    self.placeList.push(new Place(markerItem));
    self.bounds.extend(markerItem.latLng); //extend bounds to fit markers
  });
  /**
  * Function that is called to update the wiki data using their API
  * @constructor
  */
  self.updateWiki = function() {
    var wikiRequest = 'https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exchars=300&explaintext&titles=' + self.currentPlace().marker.title + '&format=json&redirects';
    var wikiTimeout = setTimeout(function() {
      self.wikiInfo().text("Failed to get wiki resources");
      self.wikiInfo().link('#');
    }, 8000);
    $.ajax({
      url: wikiRequest,
      dataType: 'jsonp',
      success: function(response) {
        var pages = response.query.pages;
        for (var page in pages) {
          if (pages.hasOwnProperty(page)) {
            self.wikiInfo().text(pages[page].extract);
            self.wikiInfo().link('http://en.wikipedia.org/?curid=' + response.query.pages[page].pageid);
          }
        }
        clearTimeout(wikiTimeout);
      },
      error: function(){
        self.wikiInfo().text('Error getting wiki info...');
        clearTimeout(wikiTimeout);
      }
    });
  };
  /**
  * Function that is called to switch the current place in the view model
  * @constructor
  * @param {Place} clickedPlace, the currently selected place
  */
  self.switchPlace = function(clickedPlace) {
    if (self.currentPlace()) {
      self.currentPlace().isSelected(false);
    }
    self.currentPlace(clickedPlace);
    self.iWindow.setContent(self.currentPlace().marker.title);
    self.iWindow.open(map, self.currentPlace().marker);
    self.currentPlace().isSelected(true);
    self.updateWiki();
  };
  /**
  * Function that is called to update the pricing data using the UBER API
  * @constructor
  */
  self.updatePrices = function() {
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
self.noPlace = new Place(offMapMarker);
self.searchInput.subscribe(function(newVal) {
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
  self.switchPlace(self.placeList()[2]);
  self.updatePrices();

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
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      styles: remove_poi,
      streetViewControl: false,
      mapTypeControl: false,
      center: mapObj.user.position,
      zoom: 12,
      zoomControlOptions: {
        position: google.maps.ControlPosition.RIGHT_TOP
      }
    };
    map = new google.maps.Map(element, mapOptions);
    map.fitBounds(mapObj.mapBounds);
    google.maps.event.addDomListener(window, 'load', this);
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
};
var viewModel = new ViewModel();
ko.applyBindings(viewModel);
/**
* Function that is called to update the page based on page width
* @constructor
*/
function checkWidth(){
  if ($(document).width() > 767){
    $('.accordion-toggle').attr('data-toggle','');
    $('.panel-collapse').collapse('show');
  }
  else{
    $('.accordion-toggle').attr('data-toggle','collapse');
    $('.panel-collapse').collapse('hide');

  }
}
$(window).resize(function(){
  checkWidth();
});
$(document).ready(function(){
  checkWidth();
});