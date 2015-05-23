"use strict";function checkWidth(){$(document).width()>767?($(".accordion-toggle").attr("data-toggle",""),$(".panel-collapse").collapse("show")):($(".accordion-toggle").attr("data-toggle","collapse"),$(".panel-collapse").collapse("hide"))}var loc=window.location.href+"";0===loc.indexOf("http://askkaz")&&(window.location.href=loc.replace("http://","https://"));var offMapMarker={name:"No matching results....",latlng:new google.maps.LatLng(0,89)},markers=[{name:"Eden Center",lat:38.8736,lon:-77.1539},{name:"Manassas Battlefield Park",lat:38.8128,lon:-77.5217},{name:"Mount Vernon",lat:38.708987,lon:-77.086132},{name:"Reagan Airport",lat:38.8519,lon:-77.0377},{name:"The Pentagon",lat:38.871,lon:-77.056},{name:"The White House",lat:38.8977,lon:-77.0366},{name:"Udvar Hazy Center",lat:38.9114,lon:-77.4441},{name:"US Capitol",lat:38.8898,lon:-77.0091}];for(var marker in markers)markers.hasOwnProperty(marker)&&(markers[marker].latLng=new google.maps.LatLng(markers[marker].lat,markers[marker].lon));var map={},mapCenterLatitude=38.9,mapCenterLongitude=-77,userLat=38.78,userLon=-77.27,Place=function(e){var a=this;a.marker=new google.maps.Marker({position:e.latLng,title:e.name}),google.maps.event.addListener(a.marker,"click",function(){viewModel.switchPlace(a)}),a.price=ko.observable("Unavailable"),a.updating=ko.observable(!1),a.isSelected=ko.observable(!1),a.matchesSearch=ko.observable(!0)},Wiki=function(){var e=this;e.text=ko.observable(""),e.link=ko.observable("#")},ViewModel=function(){var e=this;e.wikiText=ko.observable(""),e.wikiLink=ko.observable(""),e.wikiInfo=ko.observable(new Wiki),e.searchInput=ko.observable(""),e.mapLatLng=new google.maps.LatLng(mapCenterLatitude,mapCenterLongitude),e.bounds=new google.maps.LatLngBounds,e.iWindow=new google.maps.InfoWindow({content:""}),e.userLatitude=ko.observable(userLat),e.userLongitude=ko.observable(userLon),e.userLatLng=new google.maps.LatLng(e.userLatitude(),e.userLongitude()),e.userPosition=new google.maps.Marker({position:e.userLatLng,title:"You are here",icon:"https://maps.google.com/mapfiles/arrow.png"}),google.maps.event.addListener(e.userPosition,"position_changed",function(){e.userLatitude(this.position.lat()),e.userLongitude(this.position.lng()),e.updatePrices()}),e.placeList=ko.observableArray([]),e.currentPlace=ko.observable(),markers.forEach(function(a){e.placeList.push(new Place(a)),e.bounds.extend(a.latLng)}),e.updateWiki=function(){var a="https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exchars=300&explaintext&titles="+e.currentPlace().marker.title+"&format=json&redirects",t=setTimeout(function(){e.wikiInfo().text("Failed to get wiki resources"),e.wikiInfo().link("#")},8e3);$.ajax({url:a,dataType:"jsonp",success:function(a){var o=a.query.pages;for(var i in o)o.hasOwnProperty(i)&&(e.wikiInfo().text(o[i].extract),e.wikiInfo().link("http://en.wikipedia.org/?curid="+a.query.pages[i].pageid));clearTimeout(t)},error:function(){e.wikiInfo().text("Error getting wiki info..."),clearTimeout(t)}})},e.switchPlace=function(a){e.currentPlace()&&e.currentPlace().isSelected(!1),e.currentPlace(a),e.iWindow.setContent(e.currentPlace().marker.title),e.iWindow.open(map,e.currentPlace().marker),e.currentPlace().isSelected(!0),e.updateWiki()},e.updatePrices=function(){e.placeList().forEach(function(a){a.price("Fetching..."),a.updating(!0);var t=setTimeout(function(){a.price("Unavailable"),a.updating(!1)},8e3);$.ajax({url:"https://api.uber.com/v1/estimates/price",headers:{Authorization:"Token guQmO5RBKDkuf8vWZWqlrfBS9mX635G4_frn7ekR"},data:{start_latitude:e.userLatitude(),start_longitude:e.userLongitude(),end_latitude:a.marker.position.lat(),end_longitude:a.marker.position.lng()},success:function(e){a.price(e.prices[0]?e.prices[0].estimate:"Unavailable"),a.updating(!1)},error:function(){a.price("Unavailable"),a.updating(!1)}}),clearTimeout(t)})},e.noPlace=new Place(offMapMarker),e.searchInput.subscribe(function(a){var t={},o=new RegExp("(^|\\s)"+a,"i");for(var i in e.placeList())e.placeList().hasOwnProperty(i)&&(o.exec(e.placeList()[i].marker.title)?(e.placeList()[i].matchesSearch(!0),e.placeList()[i].marker.setVisible(!0),t.marker||(t=e.placeList()[i])):(e.placeList()[i].matchesSearch(!1),e.placeList()[i].marker.setVisible(!1)));e.switchPlace(t.marker?t:e.noPlace)}),e.switchPlace(e.placeList()[2]),e.updatePrices(),ko.bindingHandlers.map={init:function(e,a,t,o){function i(e){p.setPosition(e)}var n=ko.utils.unwrapObservable(a()),r=[{featureType:"poi",elementType:"labels",stylers:[{visibility:"off"}]}],s={mapTypeId:google.maps.MapTypeId.ROADMAP,styles:r,streetViewControl:!1,mapTypeControl:!1,center:n.user.position,zoom:12,zoomControlOptions:{position:google.maps.ControlPosition.RIGHT_TOP}};map=new google.maps.Map(e,s),map.fitBounds(n.mapBounds),google.maps.event.addDomListener(window,"load",this);var l=ko.utils.unwrapObservable(n.places());for(var c in l)l.hasOwnProperty(c)&&l[c].marker.setMap(map);var p=ko.utils.unwrapObservable(n.user);p.setMap(map),google.maps.event.addListener(map,"click",function(e){i(e.latLng)})}}},viewModel=new ViewModel;ko.applyBindings(viewModel),$(window).resize(function(){checkWidth()}),$(document).ready(function(){checkWidth()});