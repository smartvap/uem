/****************************************************
* UEM-1.5 Javascript Error Detection Agent          *
* Written by Qiming He                              *
* Choose one from these methods below for injection *
* 1. F5 irules                                      *
* 2. Apache mod_include SSI                         *
* 3. JAVA Instrumentations                          *
*    Redefine ServletResponse.class                 *
* Notes: F5 Stream injection is not available       *
* because the gzip compression is enabled.          *
* We use apache/IHS instead.                        *
* To do:                                            *
* 1. Detect white screen problem                    *
* 2. From which page did the error pop up           *
* 3. Unified error message                          *
* 4. Base filter on browser                         *
****************************************************/

/* Append javascript to document's head section    */
var appendJS = function (jsURL) {
	var js = document.createElement('script');
	js.setAttribute('type', 'text/javascript');
	js.setAttribute('src', jsURL);
	var head = document.getElementsByTagName('head')[0];
	head.appendChild(js);
}

/* If JSON is not supported, then add JSON depends */
if (typeof(JSON) == 'undefined') {
	// document.write("<script language='javascript' src='/json2.js'></script>");
	appendJS("/json2.js");
}

/* Deprecated clone any object, use merge instead  */
var clone = function (original) {
	var obj = {};
	for (var i in original) {
		obj[i] = original[i];
	}
	return obj;
}

/* Generate XTag ( User Trans Unified ID )         */
var genXTag = function () {
    var s = [];
    var hexDigits = "0123456789abcdef";
    for (var i = 0; i < 36; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01
    s[8] = s[13] = s[18] = s[23] = "-";
    var uuid = s.join("");
    return uuid;
}

/* Read cookie value using regular expression      */
var getCookieValue = function (cok, name) {
	var arr, reg = new RegExp("(^| )" + name + "=([^;]*)(;|$)");
	if (arr = cok.match(reg))
		return unescape(arr[2]);
	else
		return null;
}

/* Read parameter value using regular expression   */
var getParaValue = function (para, name) {
	var reg = new RegExp("(^|&|\\?)" + name + "=([^&]*)(&|$)");
	if (arr = para.match(reg))
		return unescape(arr[2]);
	else
		return null;
}

/****************************************************
* Save developer mode console object, in case of    *
* emergency, sometimes the console maybe destroy-   *
* -ed by business code                              *
****************************************************/
var saveOrigConsole = function () {
	if (!top['origConsole']) top['origConsole'] = console;
}

/* Try to restore console                          */
var tryFixupConsole = function () {
	if (!console.profile) console = top['origConsole'];
}

/****************************************************
* When the console is not available, use this       *
* method to print the log directly on the current   *
* document                                          *
****************************************************/
var debug = function (doc, log) {
	if (!doc || !doc.body || !log) return;
	if (doc.parentWindow && doc.parentWindow.console.profile) {
		console.log(log);
	} else {
		var txt = doc.body.createTextNode(log);
		var p = doc.body.createElement('p');
		p.appendChild(txt);
		doc.body.appendChild(p);
	}
}

/****************************************************
* Encapsulate jQuery function calls as events, and  *
* then add this event's interceptor                 *
* Usage: encJQryFunCallAsEvt(document, 'unbind',    *
* 'unbind', function(e) { ... });                   *
* Currently Not Used!                               *
****************************************************/
var encJQryFunCallAsEvt = function (doc, funcName, evtName, func) {
	(function($) {
		var origFunc = $.fn[funcName];
		$.fn[funcName] = function () {
			return origFunc.apply(this, arguments).trigger(evtName);
		};
	})($);
	if (!func) {
		$(doc).bind(evtName, func);
	}
}

/****************************************************
* UEM Data Receiving End                            *
* Bug Fix: To avoid cross-domain access problems,   *
* the UEM data receiving end should be forwarded by *
* the current service server.                       *
****************************************************/
var uemRcvURI = 'http://10.19.203.141/uem/uem-1.5.do';

/****************************************************
* Send abnormal data asynchronously, here support 2 *
* ajax methods, one is jQuery encapsulated ajax,    *
* the other is native ajax.                         *
****************************************************/
var postAjax = function (json_str) {
	top.console.log(json_str);
	if (typeof($) != 'undefined' && typeof($.ajax) != 'undefined') {
		$.ajax({
			type: "POST",
			url: uemRcvURI,
			contentType: "application/json; charset=utf-8",
			dataType: "json",
			data: json_str,
			crossDomain: true,
			success: function (jsonResult) {
				console.log('Upload Success!');
			},
			error: function (XMLHttpRequest, textStatus, errorThrown) {
				console.log("Response Code: " + XMLHttpRequest.status + ", Ready State: " + XMLHttpRequest.readyState);
			}
		});
	} else {
		var xhr = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject('Microsoft.XMLHTTP');
		xhr.open("POST", 'http://10.19.203.141/uem/uem-1.5.do', true);
		xhr.setRequestHeader('contentType', "application/json; charset=utf-8");
		xhr.setRequestHeader('dataType', "json");
		// xhr.setRequestHeader('XTag', genXTag());
		xhr.onreadystatechange = function() {
			if(xhr.readyState == 4) {  // Sometimes XMLHttpRequest does not exists
				if(xhr.status == 200) {
					console.log(xhr.responseText);
				}
			}
		};
		xhr.send(json_str);
	}
}

/****************************************************
* Merge the common uem parts in top & doc into one  *
* json object                                       *
****************************************************/
var mergeJson = function (json1, json2) {
	var mergedJson = {};
	for (var attr in json1) {
		mergedJson[attr] = json1[attr];
	}
	for (var attr in json2) {
		mergedJson[attr] = json2[attr];
	}
	return mergedJson;
}

/****************************************************
* Query Terminal's IP & MAC Using Wbem              *
****************************************************/
var queryIPMAC = function () {
	var ipmac;
	var locatorInfo;
	var serviceInfo;
	try {
		locatorInfo = new ActiveXObject ("WbemScripting.SWbemLocator");
		serviceInfo = locatorInfo.ConnectServer(".");
		var properties = serviceInfo.ExecQuery("SELECT MACAddress FROM Win32_NetworkAdapter WHERE ((MACAddress Is Not NULL) AND (Manufacturer <> 'Microsoft')) AND (NetConnectionStatus=2 OR NetConnectionStatus=9)");
		var e = new Enumerator (properties);
		var mac = "";
		for (; !e.atEnd(); e.moveNext()) {
			var p = e.item ();
			mac = "" + p.MACAddress;
			break;
		}
		if (mac) {
			properties = serviceInfo.ExecQuery("SELECT IPAddress, MACAddress, DNSServerSearchOrder FROM Win32_NetworkAdapterConfiguration");
			e = new Enumerator(properties);
			for (; !e.atEnd(); e.moveNext()) {
				var p = e.item();
				var ip = "" + p.IPAddress(0);
				var m = "" + p.MACAddress;
				var dns = "" + p.DNSServerSearchOrder(0);
				if(ip != "" && ip != "0.0.0.0" && m == mac) {
					ipmac = ip + ";" + dns;
					break;
				}
			}
			ipmac = mac.replace(/:/g, "-") + ";" + ipmac;
		}
		e = null;
		properties = null;
	} catch(e) {
		ipmac = "";
	}
	locatorInfo = null;
	serviceInfo = null;		
	return ipmac;
}

/****************************************************
* Encode parameter string from plain text to        *
* Unicode.                                          *
* Purpose: Plain text Chinese characters will       *
* appear garbled on pages of character sets. E.g,   *
* the character set encoding of the current file is *
* UTF-8, the plain text Chinese characters will be  *
* displayed as garbled. Call this function manually *
* to generate unicode string.                       *
****************************************************/
var encodeUnicode = function (str) {
	var res = [];
	for (var i = 0; i < str.length; i++) {
		res[i] = ( "00" + str.charCodeAt(i).toString(16) ).slice(-4);
	}
	return "\\u" + res.join("\\u");
}

/****************************************************
* Decode parameter string from unicode to plain     *
* text. Call this function to automatically decode  *
* unicode string                                    *
****************************************************/
var decodeUnicode = function (str) {
	str = str.replace(/\\/g, "%");
	return unescape(str);
}

/****************************************************
* Return the common part of json                    *
****************************************************/
var getCommonPart = function (doc, errTyp) {
	if (!top || !doc || !top['uem_common'] || !doc['uem_common']) return {};
	var jsonObj = mergeJson(top['uem_common'], doc['uem_common']);
	jsonObj['Curr_Time_of_Term'] = new Date().toLocaleString(); // System time of current terminal
	jsonObj['Curr_Url'] = doc.location.href; // Current Page's URL
	jsonObj['Title'] = doc.title; // Current Page's Title
	if (doc['Full_Path']) jsonObj['Location'] = doc['Full_Path']; // Roaming path, the location of current iframe
	jsonObj['Error_Type'] = errTyp; // Error Type
	jsonObj['Error_Detail'] = {}; // Error Details
	jsonObj['Screen_Shot'] = ''; // The Screen Shot is currently unavailable.
	return jsonObj;
}

/* Top UEM Common Info JSON Object Initialize */
/* Current Document UEM Common Info JSON Object Initialize */
var getUemCommonInfo = function (doc) {
	// Top UEM Common Info initialized only in the framework initialization
	if (!top['uem_common']) top['uem_common'] = {};
	if (!top['uem_common']['IP'] || !top['uem_common']['MAC']) { // For session not logged in
		var ipMac = queryIPMAC();
		var occ1st = ipMac.indexOf(';'); // The first occurrence of semicolon
		var occ2nd = ipMac.indexOf(';', occ1st + 1); // The second occurrence of semicolon
		top['uem_common']['IP'] = ipMac.substr(ipMac.indexOf(';') + 1, occ2nd - occ1st - 1);
		top['uem_common']['MAC'] = ipMac.substr(0, ipMac.indexOf(';'));
		top['uem_common']['DNS'] = ipMac.substr(occ2nd + 1);
		// queryHost();
	}
	if (!top['uem_common']['STAFFID'] || !top['uem_common']['STAFFTELNO'] || !top['uem_common']['ORGAID']) {
		if (doc.location.pathname == "/ngcrm/crm3/mainFrameForCRM3.action") {
			if (typeof($) != 'undefined' && $('#staffInfoDiv').length > 0) {
				var dropInfos = $('.drop_info', $('#staffInfoDiv')[0]);
				if (dropInfos.length >= 4) {
					top['uem_common']['STAFFID'] = dropInfos[0].innerText;
					top['uem_common']['STAFFTELNO'] = dropInfos[2].innerText;
					top['uem_common']['ORGAID'] = dropInfos[3].innerText;
				}
			}
		}
	}
	// Current Document UEM Common Info initialized for each document
	if (!doc['uem_common']) doc['uem_common'] = {};
	if (doc.location.search) {
		var tabName = getParaValue(doc.location.search, 'tabname');
		if (tabName) doc['uem_common']['Tab_Name'] = decodeURI(tabName);
		var tabId = getParaValue(doc.location.search, 'tabid');
		if (tabId) doc['uem_common']['Tab_Id'] = decodeURI(tabId);
		var bmeBusi = getParaValue(doc.location.search, 'BMEBusiness');
		if (bmeBusi) doc['uem_common']['BMEBusiness'] = bmeBusi;
	}
	if (doc.cookie) { // Inaccurate, may be the cookie of the last page visited
		var currMenuId = getCookieValue(doc.cookie, 'com.huawei.boss.CURRENT_MENUID');
		if (currMenuId && currMenuId != 'null') doc['uem_common']['Last_Menu_Id'] = currMenuId;
		var currTabId = getCookieValue(doc.cookie, 'com.huawei.boss.CURRENT_TAB');
		if (currTabId && currTabId != 'null') doc['uem_common']['Last_Tab_Id'] = currTabId;
	}
	if (doc.referrer) {
		var tabName = getParaValue(doc.referrer, 'tabname');
		if (tabName) doc['uem_common']['Refer_Tab_Name'] = decodeURI(tabName);
		var tabId = getParaValue(doc.referrer, 'tabid');
		if (tabId) doc['uem_common']['Refer_Tab_Id'] = decodeURI(tabId);
		var bmeBusi = getParaValue(doc.referrer, 'BMEBusiness');
		if (bmeBusi) doc['uem_common']['Refer_BMEBusiness'] = bmeBusi;
	}
}

/* Trace the path of the top window */
/* The Modal or Modaless dialog should trace the opener */
var tracePath = function (doc) {
	var wnd = doc.parentWindow;
	var path = wnd.location.pathname;
	var nDepth = 1; // Maximum Depth Default = 6
	while (! (wnd === top)) { // Check if reach the top of the frame
		wnd = wnd.parent; // Trace Back to the parent window
		path = wnd.location.pathname + ' >> ' + path;
		nDepth = nDepth + 1;
		if (nDepth >= 6) break; // Reach the maximum depth
	}
	doc['Full_Path'] = path; // Write path to properties for a rainy day
}

/* Get Key Business Information */
var getKeyBusiInfo = function (doc) {
	var para = doc.location.search;
	var idx = para.indexOf('BMEBusiness');
	if (idx == -1) return;
	para = para.substr(idx).split('&')[0]; // Get BMEBusiness part
	var arr = para.split('=');
	if (arr.length >= 2) doc['BMEBusiness'] = arr[1];
	
}

tracePath(document);
getUemCommonInfo(document);

window.onerror = function (msg, url, ln) {
	var jsonObj = getCommonPart(document, 'Js_Error');
	jsonObj['Error_Detail']['Msg_Detail'] = msg;
	jsonObj['Error_Detail']['Url'] = url;
	jsonObj['Error_Detail']['Line'] = ln;
	postAjax(JSON.stringify(jsonObj));
}

window.addEventListener("keydown", function(event) {
  if (event.keyCode === 69) {
    throw new Error("Oh shoot");
  }
});