var autocomplete, lat, lng;
$(function(){
    $( "#from-date" ).datepicker();
	$(".filter-form").submit(function(){
		$(".result-container").html("");
		  // Get the place details from the autocomplete object.
  		var place = autocomplete.getPlace();
		getEvents();
		// getLocation();
	});

	initialize();
});

function initialize(){
	// // Create the autocomplete object, restricting the search
 //  	// to geographical location types.
 //  	autocomplete = new google.maps.places.Autocomplete($('#location'), 
 //  	{ 
 //  		types: ['geocode'] 
 //  	});
 // Create the autocomplete object, restricting the search
  // to geographical location types.
  autocomplete = new google.maps.places.Autocomplete(
      /** @type {HTMLInputElement} */(document.getElementById('location')),
      { types: ['geocode'] });

  	geolocate();
  // When the user selects an address from the dropdown,
  // populate the city and state in the location field
  google.maps.event.addListener(autocomplete, 'place_changed', function() {
     getEvents();
  });
}

function getEvents(){
	// the parameters we need to pass in our request to the bands in town API
	 var radius = $("#proximity-list").val(),
	 request = {
	 	format : 'json',
	 	location : lat + "," + lng,
	 	radius: radius,
	 	app_id : 'Proximity',
	 	per_page:3
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
				var resultView = getEventView(eventResult);
				$('.result-container').append(resultView);
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
		venueName	  	= eventContainer.find(".venue-name"),
		venueCity 		= eventContainer.find(".venue-city"),
		venueState 		= eventContainer.find(".venue-state"),
		artistList		= eventContainer.find(".artist-list");

	eventLink.attr("href", result.facebook_rsvp_url);
	eventLink.text(result.title);
	venueName.text(result.venue.name);
	venueCity.text(result.venue.city);
	venueState.text(result.venue.region);

	$(result.artists).each(function(index, artist){
		 var artistItem = "<li>" + artist.name;
		 artistList.append(artistItem);
	});
			var x = result.artists[0],
				imageUrl = x.thumb_url;

	eventContainer.css("background-image", 'url(' + imageUrl + ')');  

	return eventContainer;
}

// function geolocate() {
//   if (navigator.geolocation) {
//     navigator.geolocation.getCurrentPosition(function(position) {
//       var geolocation = new google.maps.LatLng(
//           position.coords.latitude, position.coords.longitude);
//       var circle = new google.maps.Circle({
//         center: geolocation,
//         radius: position.coords.accuracy
//       });
//       getLocationName(geolocation);
//       autocomplete.setBounds(circle.getBounds());
//     });
//   }
// }

//Gets the current location and displays the city and state
function geolocate(){
	navigator.geolocation.getCurrentPosition(function (position) {
	    var geocoder = new google.maps.Geocoder();
	     lat = position.coords.latitude;
	     lng = position.coords.longitude;
	    var latlng = new google.maps.LatLng(lat, lng);

	    getEvents(lat, lng);
	    //reverse geocode the coordinates, returning location information.
	    geocoder.geocode({ 'latLng': latlng }, function (results, status) {
	    	if (status == google.maps.GeocoderStatus.OK) {
	    		var address = results[3].address_components,
		    		locationName = address[0].long_name + ", " + address[2].short_name;
		    	$("#location").val(locationName);
			}
	    });
	});
}
