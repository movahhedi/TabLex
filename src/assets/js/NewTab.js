/*
	TabLex
	Developed by Shahab Movahhedi.
	https://shmovahhedi.com
	@movahhedi  /  @shmovahhedi
*/

//var FaviconAPI = "chrome://favicon2/?size=64&scale_factor=1x&page_url=";
var FaviconAPI = "https://www.google.com/s2/favicons?sz=64&domain_url=";

//const Bookmarks = JSON.parse(BookmarksJson);
Bookmarks.forEach((i) => {

	let NewTabSite = MyCreateElement("a", {
		className: "NewTabSite",
		href: i.Url,
		title: i.Title
	});

	let FaviconSrc = "";
	if (i.LocalFavicon)          FaviconSrc = "assets/images/BookmarkIcons/" + i.LocalFavicon;
	else if (i.FaviconUrlDirect) FaviconSrc = i.FaviconUrlDirect;
	else if (i.UrlForFavicon)    FaviconSrc = FaviconAPI + i.UrlForFavicon;
	else if (i.Url)              FaviconSrc = FaviconAPI + i.Url;

	let NewTabSite_Image = MyCreateElement("img", {
		className: "NewTabSite-Image",
		src: FaviconSrc
	});

	NewTabSite.appendChild(NewTabSite_Image);

	if (i.Style && i.Style == "Small") NewTabSite.classList.add("Small");
	else {
		let NewTabSite_TextBox = MyCreateElement("div", {
			className: "NewTabSite-TextBox"
		});
		let NewTabSite_Title = MyCreateElement("h4", {
			className: "NewTabSite-Title",
			textContent: i.Title
		});
		let NewTabSite_Url = MyCreateElement("p", {
			className: "NewTabSite-Url",
			textContent: i.Url
		});

		NewTabSite_TextBox.MyAppendChildren(NewTabSite_Title, NewTabSite_Url);
		NewTabSite.appendChild(NewTabSite_TextBox);
	}

	document.getElementById("NewTabSiteList").appendChild(NewTabSite);
});