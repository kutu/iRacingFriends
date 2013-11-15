this.manifest = {
	"name": "iRacing Friends",
	"settings": [
		{
			"tab": i18n.get("settings"),
			"group": i18n.get("popup"),
			"name": "showOffline",
			"type": "checkbox",
			"label": i18n.get("showOffline")
		},
		{
			"tab": i18n.get("settings"),
			"group": i18n.get("notification"),
			"name": "showNotification",
			"type": "radioButtons",
			"label": i18n.get("showNotification"),
			"options": [
				{ "value": -1, "text": "Never"},
				{ "value": 5, "text": "5 Seconds"},
				{ "value": 10, "text": "10 Seconds"},
				{ "value": 30, "text": "30 Seconds"},
				{ "value": 0, "text": "Forever (until you close it)"}
			]
		}
	]
}
