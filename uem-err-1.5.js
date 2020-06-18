/****************************************************
* UEM-1.5 Error Detection Agent                     *
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
function postAjax(json_str) {
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
* Query Terminal's Network Info Using WMI           *
* Requirements: IE ActiveX must be enabled          *
* Bug Fix: Win32_NetworkAdapter was abandoned due   *
* to its low performance                            *
* Spec: Return JSON Object of Network Information   *
****************************************************/
var getWbemPropStr = function (prop, key) {
	if (!prop || !prop.Properties_ || !key) return '';
	var wbemProp = prop.Properties_.Item(key);
	if (!wbemProp) return '';
	if (!wbemProp.IsArray) return wbemProp.Value;
	else {
		var wbemPropStr = '';
		for (var i = 0; i < 8; i++) {
			var propVal = '';
			try {
				propVal = wbemProp.Value(i);
				if (wbemPropStr) wbemPropStr = wbemPropStr + ', ';
			} catch (e) {
				break;
			}
			wbemPropStr = wbemPropStr + propVal;
		}
		return wbemPropStr;
	}
}

var qryNetInf = function () {
	var arrNetInf = {};
	var locInf = null;
	var svcInf = null;
	var props = null;
	try {
		locInf = new ActiveXObject ("WbemScripting.SWbemLocator");
		if (!locInf) return '';
		svcInf = locInf.ConnectServer(".");
		if (!svcInf) return '';
		props = svcInf.ExecQuery("SELECT Caption, DefaultIPGateway, DHCPEnabled, DNSDomainSuffixSearchOrder, DNSHostName, DNSServerSearchOrder, IPAddress, IPSubnet, MACAddress FROM Win32_NetworkAdapterConfiguration WHERE IPEnabled = 'True'");
		if (!props) return '';
		var n = props.Count;
		for (var i = 0; i < n; i++) {
			var prop = props.ItemIndex(i);
			var netInf = {};
			netInf['Caption'] = getWbemPropStr(prop, 'Caption');
			netInf['DefaultIPGateway'] = getWbemPropStr(prop, 'DefaultIPGateway');
			netInf['DHCPEnabled'] = getWbemPropStr(prop, 'DHCPEnabled');
			netInf['DNSDomainSuffixSearchOrder'] = getWbemPropStr(prop, 'DNSDomainSuffixSearchOrder');
			netInf['DNSHostName'] = getWbemPropStr(prop, 'DNSHostName');
			netInf['DNSServerSearchOrder'] = getWbemPropStr(prop, 'DNSServerSearchOrder');
			netInf['IPAddress'] = getWbemPropStr(prop, 'IPAddress');
			netInf['IPSubnet'] = getWbemPropStr(prop, 'IPSubnet');
			netInf['MACAddress'] = getWbemPropStr(prop, 'MACAddress');
			arrNetInf['Network' + i] = netInf;
		}
	} catch(e) {
		console.log(e);
	}
	locInf = null;
	svcInf = null;
	props = null;
	return arrNetInf;
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

/****************************************************
* Special Exception Parser: errorMsg                *
****************************************************/
var parseException_A = function (doc) {
	if (doc && !doc['spec_err'] && doc.getElementById("errorMsg") != null) {
		var jsonObj = getCommonPart(doc, 'Special');
		var errDesc = doc.getElementsByTagName('font');
		for (var i = 0; i < errDesc.length; i++) {
			if (errDesc[i].color == "#ff0000" || errDesc[i].color == "red") {
				jsonObj['Error_Detail']['ERR_DESC'] = errDesc[i].innerText;
				break;
			}
		}
		var errDetail = doc.getElementById('messagedetail');
		if (errDetail) jsonObj['Error_Detail']['Msg_Detail'] = errDetail.rows[0].cells[0].innerText;
		postAjax(JSON.stringify(jsonObj));
		doc['spec_err'] = true;
	}
}

/****************************************************
* Special Exception Parser: exception span          *
****************************************************/
var parseException_B = function (doc) {
	if (doc && !doc['spec_err']) {
		var span = doc.getElementById('exception');
		if (span != null && span.tagName == 'SPAN') {
			var jsonObj = getCommonPart(doc, 'Special');
			var labels = doc.getElementsByTagName("label");
			for (var i = 0; i < labels.length; i++) {
				if (i == 0) jsonObj['Error_Detail']['ERR_DESC'] = labels[i].title;
				else if (i == 1) jsonObj['Error_Detail']['SOLUTION'] = labels[i].title;
				else if (i == 2) jsonObj['Error_Detail']['ERR_DETAIL'] = labels[i].title;
				else if (i == 3) jsonObj['Error_Detail']['ERRCODE'] = labels[i].title;
			}
			var tds = doc.getElementsByTagName("td");
			for (var i = 0; i < tds.length; i++) {
				if (tds[i].className == "bc_block_td edetail_first_col_td") {
					jsonObj['Error_Detail']['STACK_INFO'] = tds[i].innerText;
				}
			}
			postAjax(JSON.stringify(jsonObj));
			doc['spec_err'] = true;
		}
	}
}

/****************************************************
* Special Exception Parser: Login Error             *
****************************************************/
var parseException_C = function (doc) {
	if (doc && !doc['spec_err'] && doc.location && doc.location.pathname == "/ngcrm/ngportal/loginNew.action") {
		var errMsgDivs = document.getElementsByClassName('login_box_div login_errormessage');
		if (errMsgDivs.length > 0) {
			var jsonObj = getCommonPart(doc, 'Special');
			jsonObj['Error_Detail']['Msg_Detail'] = errMsgDivs[0].innerText.replace('\r', '').replace('\n', '');
			if (doc.getElementById('staffNo')) jsonObj['Error_Detail']['Staff_No'] = doc.getElementById('staffNo').value;
			postAjax(JSON.stringify(jsonObj));
			doc['spec_err'] = true;
		}
	}
}

/****************************************************
* Special Exception Parser: jQuery Popwin Error     *
****************************************************/
var parseException_D = function (doc) {
	if (doc && !doc['spec_err'] && doc.parentWindow && doc.parentWindow.commonUtil) {
		/* Intercept commonUtil.frameMsgbox */
		var origPopwin = doc.parentWindow.commonUtil.frameMsgbox;
		doc.parentWindow.commonUtil.frameMsgbox = function($scope,type,title,msg,okCallBack,cancelCallBack,closeCallBack,width,height){
			var jsonObj = getCommonPart(doc, 'Special');
			for (var key in msg) {
				if (msg[key] != null) {
					jsonObj['Error_Detail'][key.substr(0, 1).toUpperCase() + key.substr(1)] = msg[key];
				}
			}
			postAjax(JSON.stringify(jsonObj));
			return origPopwin($scope,type,title,msg,okCallBack,cancelCallBack,closeCallBack,width,height);
		}
	}
}

/****************************************************
* Special Exception Parser: jQuery Popwin Error     *
****************************************************/
var parseException_E = function (doc) {
	if (doc && !doc['spec_err'] && doc.getElementById('winmsg-popup')) {
		var pArr = doc.getElementsByClassName('ng-binding');
		if (pArr.length > 0) {
			var jsonObj = getCommonPart(doc, 'Special');
			for (var i = 0; i < pArr.length; i++) {
				var attrName = pArr[i].attributes[1].nodeValue; // Get the key name
				if (attrName.length > 32) { // If key too long, then customize to Msg_x
					attrName = 'Msg_' + i;
				}
				jsonObj['Error_Detail'][attrName] = pArr[i].innerText;
			}
			postAjax(JSON.stringify(jsonObj));
			doc['spec_err'] = true;
		}
	}
}

/****************************************************
* Special Exception Parser: Request Process Failure *
****************************************************/
var parseException_F = function (doc) {
	if (doc && !doc['spec_err'] && doc.title == decodeUnicode('\u8bf7\u6c42\u5904\u7406\u5931\u8d25')) {
		var jsonObj = getCommonPart(doc, 'Special');
		jsonObj['Error_Detail']['Cause'] = doc.getElementsByClassName('font_normal ng-binding')[0].innerText;
		postAjax(JSON.stringify(jsonObj));
		doc['spec_err'] = true;
	}
}

/****************************************************
* Special Exception Parser: Alert and Confirm       *
****************************************************/
var parseException_G = function (doc) {
	/* Intercept Alert */
	var _alert = doc.parentWindow.alert; // Rewrite function
	if (_alert.toString && _alert.toString().indexOf('getCommonPart') == -1) { // check if already rewritten
		doc.parentWindow.alert = function (msg) {
			var jsonObj = getCommonPart(doc, 'Alert');
			jsonObj['Error_Detail']['Msg_Detail'] = msg;
			postAjax(JSON.stringify(jsonObj));
			return _alert(msg);
		};
	}
	/* Intercept Confirm */
	var _confirm = doc.parentWindow.confirm; // Rewrite function
	if (_confirm.toString && _confirm.toString().indexOf('getCommonPart') == -1) { // check if already rewritten
		doc.parentWindow.confirm = function (msg) {
			var jsonObj = getCommonPart(doc, 'Confirm');
			jsonObj['Error_Detail']['Msg_Detail'] = msg;
			postAjax(JSON.stringify(jsonObj));
			return _confirm(msg);
		};
	}
	/* Intercept window.open() */
	//var _open = doc.parentWindow.open;
	//if (_open.toString && _open.toString().indexOf('uem_common') == -1) {
	//	doc.parentWindow.open = function (url, name, features, replace) {
	//		var jsonObj = mergeJson(top['uem_common'], doc['uem_common']);
	//		jsonObj['Curr_Time_of_Term'] = new Date().toLocaleString();
	//		if (doc['Full_Path']) jsonObj['Location'] = doc['Full_Path'];
	//		jsonObj['Open'] = url;
	//		postAjax(JSON.stringify(jsonObj));
	//		return _open(url, name, features, replace);
	//	};
	//}
	/* Intercept Modal Dialog */
	//var _showModalDialog = doc.parentWindow.showModalDialog;
	//if (_showModalDialog.toString && _showModalDialog.toString().indexOf('uem_common') == -1) {
	//	doc.parentWindow.showModalDialog = function (sURL, vArguments, sFeatures) {
	//		var jsonObj = mergeJson(top['uem_common'], doc['uem_common']);
	//		jsonObj['Curr_Time_of_Term'] = new Date().toLocaleString();
	//		jsonObj['Modal'] = sURL;
	//		if (doc['Full_Path']) jsonObj['Location'] = doc['Full_Path'];
	//		postAjax(JSON.stringify(jsonObj));
	//		return _showModalDialog(sURL, vArguments, sFeatures);
	//	};
	//}
	/* Intercept Modeless Dialog */
	//var _showModelessDialog = doc.parentWindow.showModelessDialog;
	//if (_showModelessDialog.toString && _showModelessDialog.toString().indexOf('uem_common') == -1) {
	//	doc.parentWindow.showModelessDialog = function (sURL, vArguments, sFeatures) {
	//		var jsonObj = mergeJson(top['uem_common'], doc['uem_common']);
	//		jsonObj['Curr_Time_of_Term'] = new Date().toLocaleString();
	//		jsonObj['Modeless'] = sURL;
	//		if (doc['Full_Path']) jsonObj['Location'] = doc['Full_Path'];
	//		postAjax(JSON.stringify(jsonObj));
	//		return _showModelessDialog(sURL, vArguments, sFeatures);
	//	};
	//}
}

/****************************************************
* Traverse search error messages Return the         *
* innerText of the element.                         *
* errKey - the error to be searched                 *
****************************************************/
var traverseSearch = function (node, errKey) {
	var sErr = '';
	if (node.nodeType === 3 && node.nodeValue.indexOf(errKey) != -1 && !node['shown']) {
		node['shown'] = true; // Has matched the current keyword, and there is no need to be shown in the last errors
		return node.nodeValue;
	} else if (node.nodeType === 1 && node.tagName != 'SCRIPT') {
		for (var i = 0; i < node.childNodes.length; i++) {
			sErr = sErr + traverseSearch(node.childNodes[i], errKey);
		}
	}
	return sErr;
}

/****************************************************
* To parse 4xx or 5xx error code pages              *
****************************************************/
var arrInterErrs = [ "Internal Error", "\u9875\u9762\u4e0d\u5b58\u5728", "502 Bad Gateway", "503 Service Temporarily Unavailable", "504 Gateway Time-out", "403 Forbidden" ];

/****************************************************
* General Exception Parser: 4xx And 5xx Internal    *
* Server Error                                      *
****************************************************/
var parseException_H = function (doc) {
	if (doc && !doc['spec_err']) {
		var sErr = '';
		var sCode = '';
		for (var i = 0; i < arrInterErrs.length; i++) {
			var plain = decodeUnicode(arrInterErrs[i]);
			if (doc.body.innerText.indexOf(plain) != -1) {
				sErr = sErr + traverseSearch(doc.body, plain) + ", ";
				if (arrInterErrs[i] == '\u9875\u9762\u4e0d\u5b58\u5728') sCode = '404';
				else if (arrInterErrs[i] == 'Internal Error') sCode = '500';
				break;
			}
		}
		if (sErr != '') {
			var jsonObj = getCommonPart(doc, 'Internal');
			jsonObj['Error_Detail']['Msg_Detail'] = sErr;
			jsonObj['Error_Detail']['ERRCODE'] = sCode;
			postAjax(JSON.stringify(jsonObj));
			doc['spec_err'] = true;
		}
	}
}

/****************************************************
* Special Exception Parser: White Screen Detection  *
****************************************************/
var parseException_I = function (doc) {
	if (doc && !doc['spec_err']) {
		var sErr = '';
		if (doc.getElementsByTagName('body').length == 0 || doc.getElementsByTagName('html').length == 0)
			sErr = decodeUnicode('\u7591\u4f3c\u767d\u5c4f');
		
	}
}

/* General Error Keywords */
var arrGenErrs = [ "\u9519\u8bef", "\u5f02\u5e38", "\u4e0d\u5b58\u5728", "\u4e0d\u5bf9\u5e94" ];

/****************************************
 * General Exception Collector          *
 * Purpose: When the special exception  *
 * detector cannot parse the current    *
 * page, it will be handled over to the *
 * general exception collector          *
 ***************************************/
var intercept = function (doc) {
	if (!doc || !doc.body || !doc.body.innerText || doc['spec_err']) return; // If already parsed by the special exception detector
	var sErr = '';
	for (var i = 0; i < arrGenErrs.length; i++) {
		var plain = decodeUnicode(arrGenErrs[i]);
		if (doc.body.innerText.indexOf(plain) != -1) { // Filter first to narrow the search
			var s = traverseSearch(doc.body, plain); // Search recursively
			if (s != '') sErr = sErr + s + ", "; // If not found, no message merge
		}
	}
	if (sErr != '') {
		var jsonObj = getCommonPart(doc, 'General');
		jsonObj['Error_Detail']['Msg_Detail'] = sErr; // Error Details
		postAjax(JSON.stringify(jsonObj));
		doc['spec_err'] = true;
	}
}

/* Top UEM Common Info JSON Object Initialize */
/* Current Document UEM Common Info JSON Object Initialize */
var getUemCommonInfo = function (doc) {
	if (!top['uem_common']) top['uem_common'] = {};
	if (!top['uem_common']['Network']) top['uem_common']['Network'] = qryNetInf();
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
	// Unavailable for Enterprise Model
	// while (wnd.dialogArguments) { // showModalDialog got the opener
	// 	wnd = wnd.dialogArguments;
	// 	path = wnd.location.pathname + ' >> ' + path;
	// 	var parentTop = wnd.top;
	// 	while (! (wnd === parentTop)) {
	// 		wnd = wnd.parent;
	// 		path = wnd.location.pathname + ' >> ' + path;
	// 	}
	// }
	// while (wnd.opener) { // open got the opener
	// 	wnd = wnd.opener;
	// 	path = wnd.location.pathname + ' >> ' + path;
	// 	var parentTop = wnd.top;
	// 	while (! (wnd === parentTop)) {
	// 		wnd = wnd.parent;
	// 		path = wnd.location.pathname + ' >> ' + path;
	// 	}
	// }
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
/* Observe Element Property Changes */
var obsvElemPropChgs = function (elem, options, actions) {
	var callback = function (records) {
		records.map(function (record) {
			actions(record);
		});
	};
	var mo = new MutationObserver(callback);
	mo.observe(elem, options);
	return mo;
}

/* SDCMCC Main Frame Loading Monitor */
var monitorMainFrmLoad = function (doc) {
	if (doc.location.pathname != "/ngcrm/crm3/mainFrameForCRM3.action") return;
	if (!doc.getElementById('loading')) return;
	top['Mainfrm_Load_Monitor'] = obsvElemPropChgs(doc.getElementById('loading'), { attributes : true }, function (obj) {
		if (obj.attributeName == 'style' && obj.target.style.display != 'none') {
			var jsonObj = mergeJson(top['uem_common'], doc['uem_common']);
			jsonObj['Curr_Time_of_Term'] = new Date().toLocaleString();
			if (doc['Full_Path']) jsonObj['Location'] = doc['Full_Path'];
			jsonObj['Sys_Prompt'] = 'NGCRM系统主界面加载中...';
			postAjax(JSON.stringify(jsonObj));
		} else if (obj.attributeName == 'style' && obj.target.style.display == 'none') {
			var jsonObj = mergeJson(top['uem_common'], doc['uem_common']);
			jsonObj['Curr_Time_of_Term'] = new Date().toLocaleString();
			if (doc['Full_Path']) jsonObj['Location'] = doc['Full_Path'];
			jsonObj['Sys_Prompt'] = 'NGCRM系统主界面加载完成.';
			postAjax(JSON.stringify(jsonObj));
		}
	});
}

/* SDCMCC Tabsets Monitor */
var monitorTabSet = function (doc) {
	if (doc.location.pathname != "/ngcrm/crm3/mainFrameForCRM3.action") return; // You can find tabset in main frame
	if (!top || !top.publicObject || !top.publicObject['mainTab'] || !top.publicObject["mainTab"].oTabHeadSet) return;
	var moHdr = obsvElemPropChgs(top.publicObject["mainTab"].oTabHeadSet, { childList : true }, function (hdrs) { // Intercept Tabset Headers
		var jsonObj = mergeJson(top['uem_common'], doc['uem_common']);
		jsonObj['Curr_Time_of_Term'] = new Date().toLocaleString();
		for (var i = 0; i < hdrs.addedNodes.length; i++) { // For each of new created headers
			if (hdrs.addedNodes[i]['Msg_Delivered']) { // To avoid monitored duplicate nodes changing
				break;
			} else {
				hdrs.addedNodes[i]['Msg_Delivered'] = true;
			}
			var oMenu = top.publicObject['mainTab'].getMenuObj(top.CUR_OPERATION); // Get the menu object of current opened tab
			if (oMenu) { // 若当前菜单对象合法
				var sMenuName = oMenu.menuName;
				var sTabName = hdrs.addedNodes[i].innerText; // 从页签头部获取页签名
				if (sMenuName != sTabName) { // 若菜单名与页签名不同，说明是不同菜单的不同步骤
					sTabName = ' ~ ' + sTabName;
					hdrs.addedNodes[i]['tabName'] = hdrs.addedNodes[i].innerText; // 记录标签名称
				} else sTabName = ''; // 若菜单名和页签名相同，则无需记录页签名
				jsonObj['Popup_Tab'] = sMenuName + sTabName;
				postAjax(JSON.stringify(jsonObj));
				hdrs.addedNodes[i]['menuId'] = top.CUR_OPERATION; // 记录menuId到页签头
			} else {
				var sTabName = hdrs.addedNodes[i].innerText; // 从页签头部获取页签名
				hdrs.addedNodes[i]['tabName'] = hdrs.addedNodes[i].innerText;
				jsonObj['Popup_Tab'] = sTabName;
				postAjax(JSON.stringify(jsonObj));
			}
		}
		for (var i = 0; i < hdrs.removedNodes.length; i++) {
			if (hdrs.removedNodes[i]['menuId']) {
				var sMenuName = top.publicObject['mainTab'].getMenuObj(hdrs.removedNodes[i]['menuId']).menuName;
				var sTabName = hdrs.removedNodes[i]['tabName']; // 页签已销毁，innerText已无法取到
				if (sTabName) sTabName = ' ~ ' + sTabName; // 若已记录页签名
				else sTabName = ''; // 若未记录页签名
				jsonObj['Shutdown_Tab'] = sMenuName + sTabName;
				postAjax(JSON.stringify(jsonObj));
			} else {
				var sTabName = hdrs.removedNodes[i]['tabName']; // 从记录的tabName中获取
				jsonObj['Shutdown_Tab'] = sTabName;
				postAjax(JSON.stringify(jsonObj));
			}
		}
	});
}

getUemCommonInfo(document);
parseException_H(document); // Sometimes alert and confirm are triggered before page onload

window.onerror = function (msg, url, ln) {
	var jsonObj = getCommonPart(document, 'Js_Error');
	jsonObj['Error_Detail']['Msg_Detail'] = msg;
	jsonObj['Error_Detail']['Url'] = url;
	jsonObj['Error_Detail']['Line'] = ln;
	postAjax(JSON.stringify(jsonObj));
}

if (window.addEventListener) {
	window.addEventListener('load', function () {
		tracePath(document);
		getUemCommonInfo(document);
		parseException_A(document);
		parseException_B(document);
		parseException_C(document);
		parseException_D(document);
		parseException_E(document);
		parseException_F(document);
		parseException_G(document);
		parseException_H(document);
		parseException_I(document);
		intercept(document);
	}, false);
} else if (window.attachEvent) {
	window.attachEvent('onload', function () {
		tracePath(document);
		getUemCommonInfo(document);
		parseException_A(document);
		parseException_B(document);
		parseException_C(document);
		parseException_D(document);
		parseException_E(document);
		parseException_F(document);
		parseException_G(document);
		parseException_H(document);
		parseException_I(document);
		intercept(document);
	});
}