var autocomplete, lat, lng, resultsLatLng = [];
$(function(){
    setupAjaxLoadingIcon();
    $("#from-date").datepicker().datepicker('setDate', new Date());
	$(".filter-form").submit(getEvents);
	$(".location-icon").click(getCurrentLocation);
	// $(".map-view").on('click', showMapView);
	$(document).on('click', '.list-view', showListView);
	$(document).on('click', '.map-view', showMapView);
	$(".list-view").click(showListView);
});

function setupAjaxLoadingIcon(){
	var loading = $('#loading');
	$(document)
	.ajaxStart(function () {
    	loading.show();
  	})
  	.ajaxStop(function () {
    	loading.hide();
  	});
}

function getCurrentLocation(){
	if(!$(this).hasClass("current-location")){
	 	loading = $('#loading').show();
		$(".result-container").html("");
		geolocate()
	}
}

function showListView(){
	var resultContainer = $(".result-container").removeClass("map-container");
		resultContainer.html("");
		getEvents();
		// resultContainer.prepend($('.view-switch').clone());
}

function showMapView(){
	var resultContainer = $(".result-container").addClass("map-container"),
		map = document.getElementsByClassName("map")[0].cloneNode(false);
		resultContainer.html("");
		resultContainer.prepend($('.view-switch').clone());
		resultContainer.append(map);
		initMap(map);
}

//function to get a the date range string for the bands in town API
//The string begin date is the date selected in the from textbox, and the end date is approximately 1 year later.
//We send this range so that we can allow the user to select a start date, but also return data from dates occurring after.
function getDateRange(){
	var beginDate = new Date($("#from-date").val())
		endDate = new Date(beginDate.getTime() + (60*60*24*365*1000));
	return beginDate.toISOString().substring(0,10) + "," + endDate.toISOString().substring(0,10)
}

function initMap(mapElem) {
  var map = new google.maps.Map(mapElem, {
    center: {lat: lat, lng: lng},
    zoom: 15
  });

  var infowindow = new google.maps.InfoWindow();
  var service = new google.maps.places.PlacesService(map);

	for (var i = resultsLatLng.length - 1; i >= 0; i--) {
		var marker = new google.maps.Marker({
		    position: resultsLatLng[i].latlng,
		    map: map,
		    title: resultsLatLng[i].venue
	  	});
	  	marker.setMap(map);
	};
}

function initialize(){
 // Create the autocomplete object, restricting the search
  // to geographical location types.
  autocomplete = new google.maps.places.Autocomplete(
      /** @type {HTMLInputElement} */(document.getElementById('location')),
      { types: ['geocode'] });

  	geolocate();
  // When the user selects an address from the dropdown,
  // populate the city and state in the location field
  google.maps.event.addListener(autocomplete, 'place_changed', function() {
	 // Get the place details from the autocomplete object.
  	 var place = autocomplete.getPlace();
  	 lat = place.geometry.location.lat();
  	 lng = place.geometry.location.lng();
     getEvents();
     $(".location-icon").removeClass("current-location");
  });
}

function getEvents(){
	//Clear current results
	$(".result-container").html("");
	resultsLatLng.length = 0;

	// the parameters we need to pass in our request to the bands in town API
	var request = {
	 	format : 'json',
	 	location : lat + "," + lng,
	 	date : getDateRange(),
	 	radius: $("#proximity-list").val(),
	 	app_id : 'Proximity'
	 	// per_page:2
	 },
	 eventUrl = "http://api.bandsintown.com/events/search";
	
	getAJAX(request, eventUrl, "jsonp")
	.done(function(eventData){
		$.each(eventData, function(i, eventResult) {
			getArtistEvents(request, eventResult.id, eventResult.artists[0].name);
		});
		if(eventData.length > 0)
		{
			$('.result-container').prepend($('.view-switch').clone())
		}
	});
}

//Get all events, get artist by event artist name/ get event where event matches first call
function getArtistEvents(request, eventId, artist){
	// the parameters we need to pass in our request to the bands in town API
	 var radius = $("#proximity-list").val(),
	 eventUrl = "http://api.bandsintown.com/artists/name/events/search";
	 request.artist_id = artist;
	 request.api_version = "2.0";
	getAJAX(request, eventUrl, "jsonp")
	.done(function(eventData){
		$.each(eventData, function(i, eventResult) {
			if(eventId == eventResult.id){
				$('.result-container').append(getEventView(eventResult));
			}
		});
	});
}

function getAJAX(request, url, datatype){
	return $.ajax({
		url: url,
		data: request,
		dataType: datatype,
		type: "GET",
		})
	.fail(function(jqXHR, error, errorThrown){
		showError(error); 
	});
}

// takes error string and turns it into displayable DOM element
var showError = function(error){
	var errorElem = $('.templates .error').clone();
	var errorText = '<p>' + error + '</p>';
	errorElem.append(errorText);
	$('.result-container').append(errorElem);
};

function getEventView(result){
	var eventContainer 	= $(".templates").find(".event-container").clone(),
		eventLink 		= eventContainer.find(".event-link"),
		eventHeader     = eventContainer.find(".event-header"),
		eventTime		= eventContainer.find(".event-time"),
		artistList		= eventContainer.find(".artist-list");

	eventLink.attr("href", result.facebook_rsvp_url);
	eventHeader.text(result.title);
	eventTime.text(result.formatted_datetime);

	$(result.artists).each(function(index, artist){
		 var artistItem = "<li>" + artist.name;
		 artistList.append(artistItem);
	});
	
	resultsLatLng.push({ latlng:{lat: result.venue.latitude, lng: result.venue.longitude}, venue: result.venue.name});
	return eventContainer;
}

//Gets the current location and displays the city and state
function geolocate(){
	navigator.geolocation.getCurrentPosition(function (position) {
	    var geocoder = new google.maps.Geocoder();
	     lat = position.coords.latitude;
	     lng = position.coords.longitude;
	    var latlng = new google.maps.LatLng(lat, lng);

	    getEvents();
	    //reverse geocode the coordinates, returning location information.
	    geocoder.geocode({ 'latLng': latlng }, function (results, status) {
	    	if (status == google.maps.GeocoderStatus.OK) {
	    		var address = results[3].address_components,
		    		locationName = address[0].long_name + ", " + address[2].short_name;
		    	$("#location").val("(Current Location)");
		    	$(".location-icon").addClass("current-location");
			}
	    });
	});
}
