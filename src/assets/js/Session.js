/*
	TabLex
	Developed by Shahab Movahhedi.
	https://shmovahhedi.com
	@movahhedi  /  @shmovahhedi
*/

var SessionList = document.getElementById("Sidebar-TabList");

// Get Sessions
browser.storage.local.get(['TabSessions'], function (result) {
	if (result.TabSessions) {
		var TabSessions = JSON.parse(result.TabSessions);

		// TabSessions.forEach((i) => {
		Object.keys(TabSessions).forEach(function (key) {
			let i = TabSessions[key];

			let SessionItem = MyCreateElement("div", {
				className: "Sidebar-Tab",
			});
			let SessionItem_Title = MyCreateElement("h4", {
				className: "Title",
				textContent: i.Title
			});
			let SessionItem_TabCount = MyCreateElement("p", {
				className: "TabCount",
				textContent: i.Tabs.length + " tabs"
			});
			let SessionItem_Date = MyCreateElement("p", {
				className: "Date",
				textContent: timeDifference(Date.now(), i.DT)
				// textContent: new Date(i.DT).toLocaleTimeString("en-US") + " " + new Date(i.DT).toLocaleDateString("en-US")
			});

			SessionItem.MyAppendChildren(SessionItem_Title, SessionItem_TabCount, SessionItem_Date);

			SessionItem.dataset.sessionId = key;

			$(SessionItem).on("click", function () {
				browser.windows.create(
					{
						url: i.Tabs[0].url,
						focused: true,
						state: 'maximized',
					},
					function (ThisWindow) {
						i.Tabs.slice(1).forEach((j) => {
							browser.tabs.create({
								windowId: ThisWindow.id,
								url: j.url,
								active: false
							});
						});
					}
				);
			});

			SessionList.appendChild(SessionItem);
		});
	}
	else {
		l("No sessions.");
	}
});


$(function () {
	$("#Sessions-Download").on("click", function () {
		// Get Sessions
		browser.storage.local.get(['TabSessions'], function (result) {
			if (result.TabSessions) {
				var blob = new Blob([result.TabSessions], {type: "text/json;charset=UTF-8"});
				chrome.downloads.download({
					url: URL.createObjectURL(blob),
					filename: "tabs-" + Date.now() + ".json"
				});
			}
		});
	});

	$("#Sessions-DeleteAll").on("click", function () {
		browser.storage.local.set({"TabSessions": "{}"}, function () {
			l("DELETED");
		});
	});

	$("#NewSession-Button").on("click", function () {
		// Get Sessions
		browser.storage.local.get(['TabSessions'], function (result) {
			var TabSessions = {};
			if (result.TabSessions) {
				TabSessions = JSON.parse(result.TabSessions);
				// TabSessions = result.TabSessions;
			}

			// Get Current Tabs
			var CurrentTabs = [];
			browser.tabs.query({ currentWindow: true }, function (Tabs_Result) {
				Tabs_Result.forEach(function (tab) {
					if (tab.url == "chrome://newtab/") return;

					var obj = {
						id: tab.id,
						title: tab.title,
						url: tab.url,
						favIconUrl: tab.favIconUrl
					};
					CurrentTabs.push(obj);
				});

				// Store
				var SessionToStore = {
					Title: $("#New-SessionName").val(),
					Tabs: CurrentTabs,
					DT: Date.now()
				};
				TabSessions[Date.now()] = SessionToStore;
				// TabSessions.push(SessionToStore);

				let TabSessionsJson = JSON.stringify(TabSessions);
				browser.storage.local.set({"TabSessions": TabSessionsJson}, function () {
					l("Set");
				});
			});
		});
	});
});

// chrome.tabs.getAllInWindow(undefined, function (a) {
// 	l(a);
// });
// chrome.tabs.query({ active: true, currentWindow: true });
