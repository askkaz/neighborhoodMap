var latitude = 38.9;
var longitude = -77.0;

ko.bindingHandlers.map = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
        var mapObj = ko.utils.unwrapObservable(valueAccessor());
        var latLng = new google.maps.LatLng(
            ko.utils.unwrapObservable(mapObj.lat),
            ko.utils.unwrapObservable(mapObj.lng));
        var mapOptions = { center: latLng,
                          zoom: 14,
                          mapTypeId: google.maps.MapTypeId.ROADMAP};

        mapObj.googleMap = new google.maps.Map(element, mapOptions);
    }
};

var Cat = function(data){
	// this.clickCount = ko.observable(data.clickCount);
	// this.name = ko.observable(data.name);
	// this.imgSrc = ko.observable(data.imgSrc);
	// this.imgAttribution = ko.observable(data.imgAttribution);
	// this.level = ko.computed(function(){
	// 	if(this.clickCount() >= 100){
	// 		return "teen";
	// 	} else if(this.clickCount()>=10){
	// 		return "infant";
	// 	} else{
	// 		return "newborn";
	// 	}
	// }, this);
	// this.nicknames = ko.observableArray(data.nicknames);


};
var ViewModel = function() {
	var self = this;
    self.myMap = ko.observable({
        lat: ko.observable(latitude),
        lng: ko.observable(longitude)});

};

ko.applyBindings(new ViewModel());