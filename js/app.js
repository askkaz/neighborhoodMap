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

ko.bindingHandlers.map = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
        var mapObj = ko.utils.unwrapObservable(valueAccessor());
        var latLng = new google.maps.LatLng(
            ko.utils.unwrapObservable(mapObj.lat),
            ko.utils.unwrapObservable(mapObj.lng));
        var mapMarkers = ko.utils.unwrapObservable(mapObj.markers);
        var mapOptions = { center: latLng,
                          zoom: 14,
                          mapTypeId: google.maps.MapTypeId.ROADMAP};
        mapObj.googleMap = new google.maps.Map(element, mapOptions);
    	for (marker in mapMarkers){
    		markerLatLng= new google.maps.LatLng(mapMarkers[marker].lat,mapMarkers[marker].lon);
    		var addMarker = new google.maps.Marker({
    			position: markerLatLng,
   				title: mapMarkers[marker].name
			});
			// To add the marker to the map, call setMap();
			addMarker.setMap(mapObj.googleMap);
    	}
    },
    update: function(element, valueAccessor, allBindingsAccessor, viewModel){
    	//TODO
    }
};
//self.myMap().googleMap

var ViewModel = function() {
	var self = this;
    self.myMap = ko.observable({
        lat: ko.observable(mapCenterLatitude),
        lng: ko.observable(mapCenterLongitude),
        markers: ko.observable(markers)
    });

};

ko.applyBindings(new ViewModel());