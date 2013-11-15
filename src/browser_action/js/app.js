var settings = new Store("settings");
var app = angular.module("iRacingFriends", []);

app.service("updateService", function() {
	this.update = function() {
		chrome.extension.sendMessage("forceUpdate");
	}
	this.onUpdate = function(callback) {
		chrome.storage.local.get("state", function(items) {
			callback(items.state);
		});
		chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
			if (request == "onUpdate") {
				chrome.storage.local.get("state", function(items) {
					callback(items.state);
				});
			}
		});
	}
});

app.controller("PopupController", function ($scope, updateService) {
	$scope.update = function() {
		$scope.refreshing = true;
		updateService.update();
	}

	updateService.onUpdate(function (state) {
		var friends = state.friends.slice();

		// filter only online
		if (!settings.get("showOffline")) {
			friends = friends.filter(function(a) { return a.isOnline });
		}

		// sort by online and name
		friends = friends.sort(function(a, b) {
			return a.isOnline != b.isOnline
				? a.isOnline ? -1 : 1
				: a.original.name < b.original.name ? -1 : 1;
		});

		$scope.friends = friends;
		$scope.refreshing = false;
		$scope.$apply();
	});
});
