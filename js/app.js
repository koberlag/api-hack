var autocomplete, lat, lng;
$(function(){
	var loading = $('#loading');
	$(document)
	  .ajaxStart(function () {
	    loading.show();
	  })
	  .ajaxStop(function () {
	    loading.hide();
	  });
     $("#from-date").datepicker().datepicker('setDate', new Date());
	$(".filter-form").submit(function(){
		getEvents();
	});

	$(".location-icon").click(function(){
		if(!$(this).hasClass("current-location")){
		 	loading = $('#loading').show();
			$(".result-container").html("");
			geolocate()
		}
	});

	$(".map-view").click(function(){
		var resultContainer = $(".result-container");
		resultContainer.html("");
		var map = $("#map").clone(),
			viewSwitch = $('.view-switch').clone();
		resultContainer.prepend(viewSwitch);
		resultContainer.append(map);
		initMap();
	});

	$(".list-view").click(function(){
		var resultContainer = $(".result-container");
		resultContainer.html("");
		var map = $("#map").clone(),
			viewSwitch = $('.view-switch').clone();
		resultContainer.prepend(viewSwitch);
		getEvents();
	});
});

function initMap() {
  var map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: -33.866, lng: 151.196},
    zoom: 15
  });

  var infowindow = new google.maps.InfoWindow();
  var service = new google.maps.places.PlacesService(map);

  service.getDetails({
    placeId: 'ChIJN1t_tDeuEmsRUsoyG83frY4'
  }, function(place, status) {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
      var marker = new google.maps.Marker({
        map: map,
        position: place.geometry.location
      });
      google.maps.event.addListener(marker, 'click', function() {
        infowindow.setContent(place.name);
        infowindow.open(map, this);
      });
    }
  });
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

	var radius = $("#proximity-list").val(),
		beginDate = new Date($("#from-date").val())
		endDate = new Date(beginDate.getTime() + (60*60*24*365*1000));
	
	// the parameters we need to pass in our request to the bands in town API
	var request = {
	 	format : 'json',
	 	location : lat + "," + lng,
	 	date : beginDate.toISOString().substring(0,10) + "," + endDate.toISOString().substring(0,10),
	 	radius: radius,
	 	app_id : 'Proximity',
	 	per_page:2
	 },
	 eventUrl = "http://api.bandsintown.com/events/search";
	
	getAJAX(request, eventUrl, "jsonp")
	.done(function(eventData){
		$.each(eventData, function(i, eventResult) {
			getArtistEvents(request, eventResult.id, eventResult.artists[0].name)
			// var resultView = getEventView(eventResult);
			// $('.result-container').append(resultView);
		});
	});
}

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
				var resultView = getEventView(eventResult),
					resultContainer = $('.result-container');
				resultContainer.prepend($('.view-switch'));
				resultContainer.append(resultView);
			}
		});
	});
}
//Get all events, get artist by event artist name/ get event where event matches first call

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
