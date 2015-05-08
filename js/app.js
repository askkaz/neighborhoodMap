//Redirect to https (needed for uber)
var loc = window.location.href + '';
if (loc.indexOf('http://') == 0) {
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
for (var i = 0; i < markers.length; i++) {
  markers[i]['idx'] = i;
}

var map = {};
var mapCenterLatitude = 38.9;
var mapCenterLongitude = -77.0;
var userLatitude = 38.9;
var userLongitude = -77.0;
var mapLatLng = new google.maps.LatLng(mapCenterLatitude, mapCenterLongitude);
var bounds = new google.maps.LatLngBounds();
var infoWindow = new google.maps.InfoWindow({
  content: ''
});
var infoContent = '';

var googleMarkers = ko.observableArray();
for (marker in markers) {
  //getEstimatesForUserLocation(markers[marker].lat,markers[marker].lon);
  markerLatLng = new google.maps.LatLng(markers[marker].lat, markers[marker].lon);
  bounds.extend(markerLatLng);
  var addMarker = new google.maps.Marker({
    position: markerLatLng,
    title: markers[marker].name,
    index: markers[marker].idx
  });
  (function(addMarker) {
    google.maps.event.addListener(addMarker, 'click', function() {
      updateCurrentMarker(addMarker);
    });
  })(addMarker);
  googleMarkers.push(addMarker);
}

var userPosition = new google.maps.Marker({
  draggable: true,
  position: mapLatLng,
  title: "You are here",
  icon: 'https://maps.google.com/mapfiles/arrow.png'
});
google.maps.event.addListener(userPosition, 'dragend', function() {
  viewModel.userLat(this.position.lat());
  viewModel.userLon(this.position.lng());
  updatePrices();



});
//googleMarkers.push(userPosition);

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
      center: mapLatLng,
      zoom: 14,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      styles: remove_poi
    };
    map = new google.maps.Map(element, mapOptions);
    map.fitBounds(bounds);
    google.maps.event.addDomListener(window, 'load', this);
    var input = /** @type {HTMLInputElement} */ (
      document.getElementById('pac-input'));
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

  },
  update: function(element, valueAccessor, allBindingsAccessor, viewModel) {
    console.log('hello');
    var mapObj = ko.utils.unwrapObservable(valueAccessor());
    var mapMarkers = ko.utils.unwrapObservable(mapObj.markers);
    var userMarker = ko.utils.unwrapObservable(mapObj.userMarker);
    for (marker in mapMarkers) {
      mapMarkers[marker].setMap(map);
    }
    userMarker.setMap(map);
  }

};

var updateCurrentMarker = function(marker) {
  (function(marker) {
    infoContent = marker.title;
    infoWindow.setContent(infoContent);
  })(marker);
  infoWindow.open(map, marker);
  //marker.visible=false;
  //viewModel.myMap().markers.valueHasMutated();
  //TODO something....
}

var priceListItem = function(title, price) {
  this.title = title;
  this.price = price;
}

var updatePrices = function() {

  googleMarkers().forEach(function(marker) {
    //viewModel.priceList.removeAll();
    var thisLat = marker.position.lat();
    var thisLon = marker.position.lng();

    $.ajax({
      url: "https://api.uber.com/v1/estimates/price",
      headers: {
        Authorization: "Token " + 'guQmO5RBKDkuf8vWZWqlrfBS9mX635G4_frn7ekR'
      },
      data: {
        start_latitude: viewModel.userLat(),
        start_longitude: viewModel.userLon(),
        end_latitude: thisLat,
        end_longitude: thisLon
      },
      success: function(result) {
        viewModel.priceList.replace(viewModel.priceList()[marker.index], new priceListItem(marker.title, result.prices[0].estimate));
      },
      error: function(result) {
        viewModel.priceList.replace(viewModel.priceList()[marker.index], new priceListItem(marker.title, 'Unavailable'));
      }

    });
  });

}

var initPrices = function() {
  googleMarkers().forEach(function(marker) {
    viewModel.priceList.replace(viewModel.priceList()[marker.index], new priceListItem(marker.title, 'Unavailable'));
  });
}


var ViewModel = function() {
  var self = this;
  self.myMap = ko.observable({
    lat: ko.observable(mapCenterLatitude),
    lng: ko.observable(mapCenterLongitude),
    markers: googleMarkers,
    userMarker: userPosition
  });
  self.userLat = ko.observable(userLatitude);
  self.userLon = ko.observable(userLongitude);
  this.priceList = new ko.observableArray([]);
  for (marker in markers) {
    this.priceList.push({
      title: '',
      price: ''
    });
  }


  self.chosenPlace = ko.observable();
  self.placeSelected = function(place) {
    self.chosenPlace(place);
    console.log(place.title);
  }
  self.isSelected = function(name) {
      var selectedPlace = self.chosenPlace();
      if (selectedPlace) {
        return selectedPlace.title == name;
      }
    }
    // this.sortedPrices = new ko.computed(function(){
    // return self.priceList().sort(function(left, right) { return left.title == right.title ? 0 : (left.title < right.title ? -1 : 1) });
    //});
  this.processListClick = function(item) {
    console.log(item);
  }
};
viewModel = new ViewModel();
ko.applyBindings(viewModel);
initPrices();
updatePrices();