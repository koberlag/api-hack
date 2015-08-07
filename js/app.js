var autocomplete;
$(function(){
    $( "#from-date" ).datepicker();
	$(".filter-form").submit(function(){
		$(".result-container").html("");
		getEvents();
	});

	 // Create the autocomplete object, restricting the search
  // to geographical location types.
  	autocomplete = new google.maps.places.Autocomplete(
      /** @type {HTMLInputElement} */(document.getElementById('location')),
      { types: ['geocode'] });
  	
});

function getEvents(){
	// the parameters we need to pass in our request to StackOverflow's API
	 var request = {
	 	format : 'json',
	 	location : $("#location").val(),
	 	app_id : 'Proximity'
	 },
	 	eventUrl = "http://api.bandsintown.com/events/search";
	
	var eventData = $.ajax({
		url: eventUrl,
		data: request,
		dataType: "jsonp",
		type: "GET",
		})
	.done(function(eventData){
		// var searchResults = showSearchResults(tag, result.items.length);

		// $('.search-results').html(searchResults);

		$.each(eventData, function(i, eventResult) {
			var resultView = getEventView(eventResult);
			$('.result-container').append(resultView);
		});
	})
	.fail(function(jqXHR, error, errorThrown){
		var errorElem = showError(error);
		$('.search-results').append(errorElem);
	});
}

function getEventView(result){
	var eventContainer 	= $(".templates").find(".event-container").clone(),
		eventLink 		= eventContainer.find(".event-link"),
		venueName	  	= eventContainer.find(".venue-name"),
		venueCity 		= eventContainer.find(".venue-city"),
		venueState 		= eventContainer.find(".venue-state"),
		artistList		= eventContainer.find(".artist-list");

	eventLink.attr("href", result.url);
	venueName.text(result.venue.name);
	venueCity.text(result.venue.city);
	venueState.text(result.venue.region);

	$(result.artists).each(function(index, artist){
		 var artistItem = "<li>" + artist.name;
		 artistList.append(artistItem);
	});
	return eventContainer;
}

function geolocate() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      var geolocation = new google.maps.LatLng(
          position.coords.latitude, position.coords.longitude);
      var circle = new google.maps.Circle({
        center: geolocation,
        radius: position.coords.accuracy
      });
      autocomplete.setBounds(circle.getBounds());
    });
  }
}

function codeLatLng() {
	var x = autocomplete;
  var input = document.getElementById('latlng').value;
  var latlngStr = input.split(',', 2);
  var latlng = new google.maps.LatLng(latlngStr[0], latlngStr[1]);
  geocoder.geocode({'location': latlng}, function(results, status) {
    if (status == google.maps.GeocoderStatus.OK) {
      if (results[1]) {
        map.setZoom(11);
        marker = new google.maps.Marker({
          position: latlng,
          map: map
        });
        infowindow.setContent(results[1].formatted_address);
        infowindow.open(map, marker);
      } else {
        window.alert('No results found');
      }
    } else {
      window.alert('Geocoder failed due to: ' + status);
    }
  });
}