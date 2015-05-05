var mapCenterLatitude = 38.9;
var mapCenterLongitude = -77.0;
var markers = [
{
  name: 'Washington Monument',
  lat: 38.8895,
  lon: -77.0352
},
{
  name: 'The White House',
  lat: 38.8977,
  lon: -77.0366
}
];


var googleMarkers = [];
for (marker in markers){
 console.log(marker);
 markerLatLng= new google.maps.LatLng(markers[marker].lat,markers[marker].lon);
 var addMarker = new google.maps.Marker({
  position: markerLatLng,
  title: markers[marker].name
});
 (function(addMarker){
  google.maps.event.addListener(addMarker,'click',function(){
    updateCurrentMarker(addMarker);
  });
})(addMarker);
googleMarkers.push(addMarker);
}

ko.bindingHandlers.map = {
  init: function (element, valueAccessor, allBindingsAccessor, viewModel) {

    var mapObj = ko.utils.unwrapObservable(valueAccessor());
    var latLng = new google.maps.LatLng(
      ko.utils.unwrapObservable(mapObj.lat),
      ko.utils.unwrapObservable(mapObj.lng));
    //var mapMarkers = ko.utils.unwrapObservable(mapObj.markers);
    var mapOptions = { center: latLng,
      zoom: 14,
      mapTypeId: google.maps.MapTypeId.ROADMAP};
      mapObj.googleMap = new google.maps.Map(element, mapOptions);
      google.maps.event.addDomListener(window, 'load', this);
    },
    update: function(element, valueAccessor, allBindingsAccessor, viewModel){
     console.log('hello');
     var mapObj = ko.utils.unwrapObservable(valueAccessor());
     var mapMarkers = ko.utils.unwrapObservable(mapObj.markers);
     for (marker in mapMarkers){
       mapMarkers[marker].setMap(mapObj.googleMap);
     }


   }
      // (function(addMarker){
      //   google.maps.event.addListener(addMarker, 'click', function() {
      //     console.log(addMarker);
      //               //add logic here to update page based on click?
      //             });
      // })(addMarker)

};

var updateCurrentMarker = function(marker){
  console.log(marker);
  marker.visible=false;
  viewModel.myMap().markers.valueHasMutated();
  //TODO something....
}

var ViewModel = function() {
 var self = this;
 self.myMap = ko.observable({
  lat: ko.observable(mapCenterLatitude),
  lng: ko.observable(mapCenterLongitude),
  markers: ko.observableArray(googleMarkers)
});

};
viewModel=new ViewModel();
ko.applyBindings(viewModel);
//google.maps.event.addDomListener(window, 'load', initialize);
//googleMarkers[0].setMap(viewModel.myMap().googleMap);


