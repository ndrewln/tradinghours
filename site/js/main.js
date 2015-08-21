var module = angular.module("TradingHours", ["DataEngine"]);

module.controller("ExchangeListController", [
                  "$scope", "$interval", "$data_engine",
                  function($scope, $interval, $data_engine) {
	var render_current_time = function() {
		$scope.now = moment.utc();
		$scope.now_hm = $scope.now.format("HH:mm");
		$scope.now_s = $scope.now.format("ss");
	}

	render_current_time();
	$interval(render_current_time, 1000);

	$scope.exchanges = _.map(exchanges(), function(exchange){
		exchange._tradingWeek = $data_engine.tradingWeek(exchange.trading_hours);
		
		var sessionStrings = [];
		var sessionsByDays = _.groupBy(exchange.trading_hours, "days");
		_.forEach(sessionsByDays, function(specs, days) {
			var sessionString = days + ": ";
			var sessionsOrder = ["premarket", "regular", "postmarket"];
			var sortedSpecs = _.sortBy(specs, function(spec){
				var i = sessionsOrder.indexOf(spec.type);
				return i == -1 ? 1000 : i;
			});
			_.forEach(sortedSpecs, function(spec, i) {
				var typeMarkers = {
					"premarket": " (Pre)",
					"postmarket": " (Post)"
				}
				var marker = typeMarkers[spec.type] || "";
				sessionString += (i ? ", " : "" ) + spec.start + "-" + spec.end + marker;
			});
			sessionStrings.push(sessionString);
		});
		exchange._sessionString = sessionStrings.join(" ");
		return exchange;
	});

	var updateCurrentStates = function() {
		_.each($scope.exchanges, function(exchange){
			exchange._currentState = exchange._tradingWeek.frame($scope.now.tz(exchange.timezone)).type;
		});
	}

	updateCurrentStates();
	$interval(updateCurrentStates, 60000);

	var calculateTimelines = function() {
		_.each($scope.exchanges, function(exchange){
			exchange._timeline = $data_engine.timeline(exchange._tradingWeek, $scope.now.tz(exchange.timezone), 86400, 25920);
		});
	}

	calculateTimelines();
	$interval(calculateTimelines, 600000);
}])
