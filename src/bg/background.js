var settings = new Store("settings", {
	showOffline: true,
	showNotification: "5"
});

var state;
var alarmId = "iRacingFriends";
var notificationId = "iRacingFriends";
var autoCloseNotificationTimeout;

chrome.runtime.onInstalled.addListener(function(details) {
	init();
});

chrome.alarms.onAlarm.addListener(function(alarm) {
	if (alarm.name == alarmId) {
		update();
	}
});

chrome.notifications.onClicked.addListener(function(id) {
	if (id == notificationId) {
		chrome.notifications.clear(id, function() {});
	}
});

chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
	if (request == "forceUpdate") {
		console.log("forceUpdate");
		update();
	}
});

function init() {
	chrome.alarms.create(alarmId, {periodInMinutes: 1});

	chrome.storage.local.clear(function() {
		update();
	});
}

function update() {
	chrome.storage.local.get("state", function(items) {
		state = items.state || {};
		console.log("state", state);
		getFriendsOnline(onFriendsOnline);
	});
}

function getFriendsOnline(callback) {
	var xhr = new XMLHttpRequest();
	xhr.open("GET", "http://members.iracing.com/membersite/member/GetDriverStatus?friends=1", true);
	xhr.onreadystatechange = function() {
		var resp = null;
		if (xhr.readyState == 4 && xhr.status == 200) {
			try {
    			var resp = JSON.parse(xhr.responseText.replace(/\+/g, " "));
				if (callback) {
					callback(resp);
				}
			} catch (error) {
			}
		}
	}
	xhr.send();
}

function onFriendsOnline(data) {
	if (!data) return;

	var prevFriends = state.friends;
	state.friends = [];
	var countOnline = 0;

	// find for notify
	var notifyList = [];
	for (var i = 0; i < data.fsRacers.length; i++) {
		var isOnline = false,
			regStatus;

		var item = data.fsRacers[i];

		var prev, prevFriend;
		if (prevFriends && prevFriends.length) {
			for (var j = 0; j < prevFriends.length; j++) {
				prevFriend = prevFriends[j];
				prev = prevFriend.original;
				if (prev.custid == item.custid) break;
			}
		}

		var friend = {
			original: item,
			isOnline: false,
			regStatus: ""
		};

		var isNotify = false;

		// come online
		if (item.lastSeen) {
			friend.isOnline = true;
			countOnline++;
			if (!prev || !prev.lastSeen) {
				isNotify = true;
			}
		}

		// registered to
		if (
			item.regStatus &&
			item.sessionId && item.subSessionStatus != "subses_done"
		) {
			if (item.regStatus == "reg_registered" && item.userRole == 0) {
				friend.regStatus = "Registered to race at " +
					new Date(item.startTime).toLocaleTimeString().replace(/(.*):\d{2}/, "$1");
			} else if (item.regStatus == "reg_joined") {
				var eventTypeId = item.eventTypeId;
				friend.regStatus =
					eventTypeId == 5 ? "Racing" :
					eventTypeId == 4 ? "Time Trialing" :
					eventTypeId == 3 ? "Qualifying" :
					eventTypeId == 2 ? "Practicing" :
					eventTypeId == 1 ? "Testing" :
					false
			}

			if (
				friend.regStatus &&
				(!prev || !prevFriend.regStatus || prevFriend.regStatus != friend.regStatus)
			) {
				isNotify = true;
			}
		}

		if (isNotify) {
			notifyList.push(friend);
		}

		state.friends.push(friend);
	}

	// save state
	chrome.storage.local.set({state: state}, function() {});

	// change badge counter
	chrome.browserAction.setBadgeText({
		text: countOnline ? countOnline.toString() : ""
	});

	// change badge color
	chrome.browserAction.setBadgeBackgroundColor({
		color: state.friends.some(function(a) {return a.regStatus != ""}) ? [0, 192, 0, 127] : [0, 0, 0, 127]
	});

	// send message to popup
	chrome.extension.sendMessage("onUpdate");

	// notify
	if (settings.get("showNotification") != "-1" && notifyList.length) {
		notify(notifyList);
	}
}

function notify(friends) {
	var items = friends.map(function(friend) {
		return {
			title: friend.original.name,
			message:
				friend.regStatus ? "[" + friend.regStatus + "]" :
				friend.isOnline ?  "[Online]" :
				""
		}
	});
	chrome.notifications.create(
		notificationId,
		{
			type: "list",
			title: "",
			message: "",
			iconUrl: "/icons/icon128.png",
			items: items,
			priority: 3
		},
		function(id) {}
	);
	if (autoCloseNotificationTimeout) {
		clearTimeout(autoCloseNotificationTimeout);
	}

	var timeout = settings.get("showNotification");
	if (timeout != "0") {
		autoCloseNotificationTimeout = setTimeout(function() {
			chrome.notifications.clear(notificationId, function() {});
		}, parseInt(timeout) * 1000);
	}

}
