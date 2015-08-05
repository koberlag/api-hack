$(function(){
	$(".filter-form").submit(function(){
		$(".results").html("");
		getEvents();
	});
});

function getEvents(){
	// the parameters we need to pass in our request to StackOverflow's API
	 var request = {
	 	format : 'json',
	 	location : 'Austin',
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
			$('.results').append(resultView);
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




// var test = [{
// id: 10352592,
// url: "http://www.bandsintown.com/event/10352592",
// datetime: "2015-08-04T11`e7:00:00",
// ticket_url: "http://www.bandsintown.com/event/10352592/buy_tickets?came_from=233",
// artists: [
// {
// name: "Flynt Reid",
// url: "http://www.bandsintown.com/FlyntReid",
// mbid: null
// }
// ],
// venue: {
// id: 525661,
// url: "http://www.bandsintown.com/venue/525661",
// name: "Chuggin Monkey",
// city: "Austin",
// region: "TX",
// country: "United States",
// latitude: 30.267478,
// longitude: -97.74126
// },
// ticket_status: "unavailable",
// on_sale_datetime: null
// },
// {
// id: 10244112,
// url: "http://www.bandsintown.com/event/10244112",
// datetime: "2015-08-04T18:00:00",
// ticket_url: "http://www.bandsintown.com/event/10244112/buy_tickets?came_from=233",
// artists: [
// {
// name: "Amanda Cevallos",
// url: "http://www.bandsintown.com/AmandaCevallos",
// mbid: null
// }
// ],
// venue: {
// id: 1114364,
// url: "http://www.bandsintown.com/venue/1114364",
// name: "The Broken Spoke",
// city: "Austin",
// region: "TX",
// country: "United States",
// latitude: 30.240763,
// longitude: -97.785176
// },
// ticket_status: "unavailable",
// on_sale_datetime: null
// },
// {
// id: 10150152,
// url: "http://www.bandsintown.com/event/10150152",
// datetime: "2015-08-04T19:00:00",
// ticket_url: "http://www.bandsintown.com/event/10150152/buy_tickets?came_from=233",
// artists: [
// {
// name: "Dan Quinn Band",
// url: "http://www.bandsintown.com/DanQuinnBand",
// mbid: null
// }
// ],
// venue: {
// id: 2272899,
// url: "http://www.bandsintown.com/venue/2272899",
// name: "Vulcan Gas Company",
// city: "Austin",
// region: "TX",
// country: "United States",
// latitude: 30.267162,
// longitude: -97.738465
// },
// ticket_status: "unavailable",
// on_sale_datetime: null
// }];