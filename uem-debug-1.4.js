/****************************************************
* UEM-1.4 Javascript Agent                          *
* Written by Hugh                                   *
* Choose one from these methods below for injection *
* 1. F5 irules                                      *
* 2. Apache mod_include SSI                         *
* 3. JAVA Instrumentations                          *
*    Redefine ServletResponse.class                 *
* Notes: F5 Stream injection is not available       *
* because the gzip compression is enabled.          *
* We use apache/IHS instead.                        *
* To do:                                            *
* 1. Business Success Layout handle                 *
* 2. Alert/Confirm still has problem                *
* 3. Get Key Business Information Not completed     *
* 4. Cross-domain Security Bugs                     *
****************************************************/
/* If JSON is not supported */
if (typeof(JSON) == 'undefined') {
	document.write("<script language='javascript' src='/uem/json2.js'></script>");
}
/* Document convert to image */
document.write("<script type='text/javascript' src='/uem/polyfill.min.js'></script>");
document.write("<script type='text/javascript' src='/uem/html2canvas.min.js'></script>");
/* Clone Any Object */
/* Deprecated, use mergeJson instead */
var clone = function (original) {
	var obj = {};
	for (var i in original) {
		obj[i] = original[i];
	}
	return obj;
}
/* UUID Generator */
var getUUID = function () {
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
/* Read cookie value using regular expression */
var getCookieValue = function (cok, name) {
	var arr, reg = new RegExp("(^| )" + name + "=([^;]*)(;|$)");
	if (arr = cok.match(reg))
		return unescape(arr[2]);
	else
		return null;
}
/* Read parameter value using regular expression */
var getParaValue = function (para, name) {
	var reg = new RegExp("(^|&|\\?)" + name + "=([^&]*)(&|$)");
	if (arr = para.match(reg))
		return unescape(arr[2]);
	else
		return null;
}
/* Save or Fixup console, sometimes the console maybe destroyed by business code */
var saveOrigConsole = function () {
	if (!top['origConsole']) top['origConsole'] = console;
}
var tryFixupConsole = function () {
	if (!console.profile) console = top['origConsole'];
}
/* Not Used. Turn off the unbind feature to prevent specific event interceptors from being overwritten */
/* Usage: disableUnbind(document, 'mouseup'); */
var disableUnbind = function (doc, evt_typ) {
	var custUnBind = $(doc).unbind;
	$(doc).unbind = function (type, fn) {
		if (type != evt_typ) custUnBind(type, fn);
	};
}
/* Not Used. Encapsulate jQuery function calls as events, and then add this event's interceptor */
/* Usage: encJQryFunCallAsEvt(document, 'unbind', 'unbind', function(e) { ... }); */
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
/* Not Used. Check who stopped bubbling */
var whoStoppedBubbling = function (doc) {
	$('*', doc).bind('mouseup', function (e) {
		if (e.isDefaultPrevented() || e.isPropagationStopped()) console.log(e.target.outerHTML);
	});
}
/* Use jQuery or IE native method to intercept events. */
var intercept = function (doc) {
	if (!doc) return;
	if (typeof($) != 'undefined' && typeof(jQuery) != 'undefined' && $(doc).bind) {
		if ($(doc).unbind) {
			$(doc).unbind('mouseup'); // To avoid repeated injection
			$(doc).unbind('change'); // Sometimes it does not work
		}
		$(doc).bind('mouseup', function (e) {
			elemSelect(e.target, 'click');
		});
		$(doc).bind('change', function (e) {
			elemSelect(e.target, 'change');
		});
	} else if (doc.addEventListener != undefined) {
		var mouseupHandler = function (e) {
			elemSelect(e.target ? e.target : e.srcElement, 'click');
		};
		doc.removeEventListener('mouseup', mouseupHandler, false);
		doc.addEventListener('mouseup', mouseupHandler, false);
		var changeHandler = function (e) {
			elemSelect(e.target ? e.target : e.srcElement, 'change');
		};
		doc.removeEventListener('change', changeHandler, false);
		doc.addEventListener('change', changeHandler, false);
	} else if (doc.attachEvent != undefined) {
		var mouseupHandler = function (e) {
			elemSelect(e.target ? e.target : e.srcElement, 'click');
		};
		doc.detachEvent('onmouseup', mouseupHandler);
		doc.attachEvent('onmouseup', mouseupHandler);
		var changeHandler = function (e) {
			elemSelect(e.target ? e.target : e.srcElement, 'change');
		};
		doc.detachEvent('onchange', changeHandler);
		doc.attachEvent('onchange', changeHandler);
	} else {
		doc['onmouseup'] = function (e) {
			elemSelect(e.target ? e.target : e.srcElement, 'click');
		}
		doc['onchange'] = function (e) {
			elemSelect(e.target ? e.target : e.srcElement, 'change');
		}
	}
}
function postAjax(json_str) {
	tryFixupConsole();
	console.log(json_str);
	if (typeof($) != 'undefined' && typeof($.ajax) != 'undefined') {
		$.ajax({
			type: "POST",
			url: 'http://10.19.203.142/ssyth/jsp/busi004/getcrmuseraction.jsp?json=' + encodeURI(json_str),
			contentType: "application/json",
			dataType: "json",
			data: json_str,
			success: function (jsonResult) {
				console.log(jsonResult);
			},
			// Header XTag is currently disabled
			// It may be used on browsers that disabled cookies
			// beforeSend: function (xhr) {
			// 	xhr.setRequestHeader('XTag', getUUID());
			// },
			error: function (XMLHttpRequest, textStatus, errorThrown) {
				console.log("Response Code: " + XMLHttpRequest.status + ", Ready State: " + XMLHttpRequest.readyState);
			}
		});
	} else {
		var xhr = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject('Microsoft.XMLHTTP');
		xhr.open("POST", 'http://10.19.203.142/ssyth/jsp/busi004/getcrmuseraction.jsp', true);
		xhr.setRequestHeader('XTag', getUUID());
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
/* Merge the common uem parts in top & doc into one json object */
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
/* The element operation handler */
var elemSelect = function (elem, operTyp) {
	// setBorderStyle(elem);
	// setTimeout(function() { restoreBorderStyle(elem); }, 1000);
	var currTm = new Date().getTime();
	if (elem['Msg_Delivered_Time'] && currTm - elem['Msg_Delivered_Time'] <= 500) return; // Check if triggered 1 event 2 times in 0.5s
	else elem['Msg_Delivered_Time'] = currTm;
	var jsonObj = mergeJson(top['uem_common'], elem.ownerDocument['uem_common']);
	jsonObj['Curr_Time_of_Term'] = new Date().toLocaleString();
	jsonObj['Elem_Outer_Html'] = elem.outerHTML;
	jsonObj['Oper_Type'] = operTyp;
	if (operTyp == 'change') jsonObj['New_Value'] = elem.value;
	jsonObj['Location'] = elem.ownerDocument['Full_path'];
	jsonObj['XTag'] = getUUID();
	elem.ownerDocument.cookie = 'XTag=' + jsonObj['XTag'] + '; path=/';
	postAjax(JSON.stringify(jsonObj));
}
/* Mark the border of the target element to red */
var setBorderStyle = function (elem) {
	elem['ori_bord_style'] = elem.style.border;
	elem.style.border = '1px solid red';
}
/* Restore the border style */
var restoreBorderStyle = function (elem) {
	if (elem['ori_bord_style'] != undefined) elem.style.border = elem['ori_bord_style'];
}
/* Query Terminal's IP & MAC Using Wbem */
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
			properties = serviceInfo.ExecQuery("SELECT IPAddress,MACAddress FROM Win32_NetworkAdapterConfiguration");
			e = new Enumerator(properties);
			for (; !e.atEnd(); e.moveNext()) {
				var p = e.item();
				var ip = "" + p.IPAddress(0);
				var m = "" + p.MACAddress;
				if(ip != "" && ip != "0.0.0.0" && m == mac) {
					ipmac = ip;
					break;
				}
			}
			ipmac = mac.replace(/:/g, "-")+";"+ipmac;
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
/* Error Type 1 */
var parseLoginError = function (doc) {
	if (doc.location.pathname == "/ngcrm/ngportal/loginNew.action") {
		var errMsgDivs = document.getElementsByClassName('login_box_div login_errormessage');
		if (errMsgDivs.length > 0) {
			var errMsg = errMsgDivs[0].innerText.replace('\r', '').replace('\n', '');
			var jsonObj = mergeJson(top['uem_common'], doc['uem_common']);
			jsonObj['Curr_Time_of_Term'] = new Date().toLocaleString();
			if (doc['Full_path']) jsonObj['Location'] = doc['Full_path'];
			jsonObj['ERROR'] = errMsg;
			postAjax(JSON.stringify(jsonObj));
		}
	}
}
/* Error Type 2 */
var parseErrorPage = function (doc) {
	if (doc && doc.getElementById("errorMsg") != null) {
		var jsonObj = mergeJson(top['uem_common'], doc['uem_common']);
		jsonObj['Curr_Time_of_Term'] = new Date().toLocaleString();
		if (doc['Full_path']) jsonObj['Location'] = doc['Full_path'];
		var errDesc = doc.getElementsByTagName('font');
		for (var i = 0; i < errDesc.length; i++) {
			if (errDesc[i].color == "#ff0000" || errDesc[i].color == "red") {
				jsonObj['ERR_DESC'] = errDesc[i].innerText;
			}
		}
		var errDetail = doc.getElementById('messagedetail');
		if (errDetail) jsonObj['ERR_DETAIL'] = errDetail.rows[0].cells[0].innerText;
		postAjax(JSON.stringify(jsonObj));
	}
}
/* Error Type 3 */
var parseExceptionPage = function (doc) {
	var spans = doc.getElementsByTagName("span");
	if (spans == undefined || spans == null) return null;
	var ifTagExist = false; // if exists <span id=exception/>
	for (var i = 0; i < spans.length; i++) { // Search span with exceptions
		if (spans[i].id == "exception") {
			ifTagExist = true;
			break;
		}
	}
	if (ifTagExist) {
		var jsonObj = mergeJson(top['uem_common'], doc['uem_common']);
		jsonObj['Curr_Time_of_Term'] = new Date().toLocaleString();
		if (doc['Full_path']) jsonObj['Location'] = doc['Full_path'];
		var labels = doc.getElementsByTagName("label");
		for (var i = 0; i < labels.length; i++) {
			if (i == 0) jsonObj['ERR_DESC'] = labels[i].title;
			else if (i == 1) jsonObj['SOLUTION'] = labels[i].title;
			else if (i == 2) jsonObj['ERR_DETAIL'] = labels[i].title;
			else if (i == 3) jsonObj['ERRCODE'] = labels[i].title;
		}
		var tds = doc.getElementsByTagName("td");
		for (var i = 0; i < tds.length; i++) {
			if (tds[i].className == "bc_block_td edetail_first_col_td") {
				jsonObj['STACK_INFO'] = tds[i].innerText;
			}
		}
		postAjax(JSON.stringify(jsonObj));
	}
}
/* Error Type 4: Popwin Error */
var interceptPopwinExcept = function (doc) {
	if (doc.parentWindow.commonUtil) {
		/* Intercept commonUtil.frameMsgbox */
		var origPopwin = doc.parentWindow.commonUtil.frameMsgbox;
		doc.parentWindow.commonUtil.frameMsgbox = function($scope,type,title,msg,okCallBack,cancelCallBack,closeCallBack,width,height){
			var jsonObj = mergeJson(top['uem_common'], doc['uem_common']);
			jsonObj['Curr_Time_of_Term'] = new Date().toLocaleString();
			if (doc['Full_path']) jsonObj['Location'] = doc['Full_path'];
			for (var key in msg) {
				if (msg[key] != null) {
					jsonObj[key.substr(0, 1).toUpperCase() + key.substr(1)] = msg[key];
				}
			}
			postAjax(JSON.stringify(jsonObj));
			return origPopwin($scope,type,title,msg,okCallBack,cancelCallBack,closeCallBack,width,height);
		}
		/* Intercept commonUtil.showWindow */
		var origShowWnd = doc.parentWindow.commonUtil.showWindow;
		doc.parentWindow.commonUtil.showWindow = function(wintype, url, args, style) {
			if (arguments.length == 3) { // The order and number of entries must follow the conventions of business code
				style = arguments[2];
				args = arguments[1];
				url = arguments[0];
				wintype = "0";
			}
			var jsonObj = mergeJson(top['uem_common'], doc['uem_common']);
			jsonObj['Curr_Time_of_Term'] = new Date().toLocaleString();
			if (doc['Full_path']) jsonObj['Location'] = doc['Full_path'];
			jsonObj['Pop_Window'] = url;
			postAjax(JSON.stringify(jsonObj));
			return origShowWnd(wintype, url, args, style);
		}
		/* Intercept Loading Prompt */
		var origLoadStart = doc.parentWindow.commonUtil.startLoading;
		doc.parentWindow.commonUtil.startLoading = function() {
			var jsonObj = mergeJson(top['uem_common'], doc['uem_common']);
			jsonObj['Curr_Time_of_Term'] = new Date().toLocaleString();
			if (doc['Full_path']) jsonObj['Location'] = doc['Full_path'];
			jsonObj['Sys_Prompt'] = 'Loading...';
			postAjax(JSON.stringify(jsonObj));
			return origLoadStart();
		}
		var origLoadEnd = doc.parentWindow.commonUtil.endLoading;
		doc.parentWindow.commonUtil.endLoading = function() {
			var jsonObj = mergeJson(top['uem_common'], doc['uem_common']);
			jsonObj['Curr_Time_of_Term'] = new Date().toLocaleString();
			if (doc['Full_path']) jsonObj['Location'] = doc['Full_path'];
			jsonObj['Sys_Prompt'] = 'Load Complete.';
			postAjax(JSON.stringify(jsonObj));
			return origLoadEnd();
		}
	}
}
/* Error Type 5: Request Process Failure */
var interceptReqProcFail = function (doc) {
	if (doc.getElementsByTagName('TITLE').length == 0) return;
	var title = doc.getElementsByTagName('TITLE')[0].innerText;
	if (title == '请求处理失败') {
		var jsonObj = mergeJson(top['uem_common'], doc['uem_common']);
		jsonObj['Curr_Time_of_Term'] = new Date().toLocaleString();
		if (doc['Full_path']) jsonObj['Location'] = doc['Full_path'];
		jsonObj['ERROR'] = title;
		jsonObj['Cause'] = doc.getElementsByClassName('font_normal ng-binding')[0].innerText;
		postAjax(JSON.stringify(jsonObj));
	}
}
/* Error Type 6: 500 Internal Server Error */
var intercept500Error = function (doc) {
	if (doc.getElementsByTagName('TITLE').length == 0) return;
	var title = doc.getElementsByTagName('TITLE')[0].innerText;
	if (title == '500 Internal Server Error') {
		var jsonObj = mergeJson(top['uem_common'], doc['uem_common']);
		jsonObj['Curr_Time_of_Term'] = new Date().toLocaleString();
		if (doc['Full_path']) jsonObj['Location'] = doc['Full_path'];
		jsonObj['ERROR'] = title;
		jsonObj['DETAIL'] = '';
		var arrP = doc.getElementsByTagName('P');
		for (var i = 0; i < arrP.length; i++) {
			jsonObj['DETAIL'] += arrP[i].innerText;
		}
		postAjax(JSON.stringify(jsonObj));
	}
}
/* Intercept all kinds of MessgeBoxes */
var interceptMsgBoxes = function (doc) {
	/* Intercept Alert */
	var _alert = doc.parentWindow.alert;
	if (_alert.toString && _alert.toString().indexOf('uem_common') == -1) { // check if already intercepted
		doc.parentWindow.alert = function (msg) {
			var jsonObj = mergeJson(top['uem_common'], doc['uem_common']);
			jsonObj['Curr_Time_of_Term'] = new Date().toLocaleString();
			if (doc['Full_path']) jsonObj['Location'] = doc['Full_path'];
			jsonObj['Alert'] = msg;
			postAjax(JSON.stringify(jsonObj));
			return _alert(msg);
		};
	}
	/* Intercept Confirm */
	var _confirm = doc.parentWindow.confirm;
	if (_confirm.toString && _confirm.toString().indexOf('uem_common') == -1) {
		doc.parentWindow.confirm = function (msg) {
			var jsonObj = mergeJson(top['uem_common'], doc['uem_common']);
			jsonObj['Curr_Time_of_Term'] = new Date().toLocaleString();
			if (doc['Full_path']) jsonObj['Location'] = doc['Full_path'];
			jsonObj['Confirm'] = msg;
			postAjax(JSON.stringify(jsonObj));
			return _confirm(msg);
		};
	}
	/* Intercept window.open() */
	var _open = doc.parentWindow.open;
	if (_open.toString && _open.toString().indexOf('uem_common') == -1) {
		doc.parentWindow.open = function (url, name, features, replace) {
			var jsonObj = mergeJson(top['uem_common'], doc['uem_common']);
			jsonObj['Curr_Time_of_Term'] = new Date().toLocaleString();
			if (doc['Full_path']) jsonObj['Location'] = doc['Full_path'];
			jsonObj['Open'] = url;
			postAjax(JSON.stringify(jsonObj));
			return _open(url, name, features, replace);
		};
	}
	/* Intercept Modal Dialog */
	var _showModalDialog = doc.parentWindow.showModalDialog;
	if (_showModalDialog.toString && _showModalDialog.toString().indexOf('uem_common') == -1) {
		doc.parentWindow.showModalDialog = function (sURL, vArguments, sFeatures) {
			var jsonObj = mergeJson(top['uem_common'], doc['uem_common']);
			jsonObj['Curr_Time_of_Term'] = new Date().toLocaleString();
			jsonObj['Modal'] = sURL;
			if (doc['Full_path']) jsonObj['Location'] = doc['Full_path'];
			postAjax(JSON.stringify(jsonObj));
			return _showModalDialog(sURL, vArguments, sFeatures);
		};
	}
	/* Intercept Modeless Dialog */
	var _showModelessDialog = doc.parentWindow.showModelessDialog;
	if (_showModelessDialog.toString && _showModelessDialog.toString().indexOf('uem_common') == -1) {
		doc.parentWindow.showModelessDialog = function (sURL, vArguments, sFeatures) {
			var jsonObj = mergeJson(top['uem_common'], doc['uem_common']);
			jsonObj['Curr_Time_of_Term'] = new Date().toLocaleString();
			jsonObj['Modeless'] = sURL;
			if (doc['Full_path']) jsonObj['Location'] = doc['Full_path'];
			postAjax(JSON.stringify(jsonObj));
			return _showModelessDialog(sURL, vArguments, sFeatures);
		};
	}
}
/* Top UEM Common Info JSON Object Initialize */
/* Current Document UEM Common Info JSON Object Initialize */
var getUemCommonInfo = function (doc) {
	// Top UEM Common Info initialized only in the framework initialization
	if (!top['uem_common']) top['uem_common'] = {};
	if (!top['uem_common']['IP'] || !top['uem_common']['MAC']) { // For session not logged in
		var ipMac = queryIPMAC();
		top['uem_common']['IP'] = ipMac.substr(ipMac.indexOf(';') + 1);
		top['uem_common']['MAC'] = ipMac.substr(0, ipMac.indexOf(';'));
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
	if (doc.cookie) {
		var currMenuId = getCookieValue(doc.cookie, 'com.huawei.boss.CURRENT_MENUID');
		if (currMenuId && currMenuId != 'null') doc['uem_common']['Curr_Menu_Id'] = currMenuId;
		var currTabId = getCookieValue(doc.cookie, 'com.huawei.boss.CURRENT_TAB');
		if (currTabId && currTabId != 'null') doc['uem_common']['Curr_Tab_Id'] = currTabId;
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
	doc['Full_path'] = path; // Write path to properties for a rainy day
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
			if (doc['Full_path']) jsonObj['Location'] = doc['Full_path'];
			jsonObj['Sys_Prompt'] = 'NGCRM系统主界面加载中...';
			postAjax(JSON.stringify(jsonObj));
		} else if (obj.attributeName == 'style' && obj.target.style.display == 'none') {
			var jsonObj = mergeJson(top['uem_common'], doc['uem_common']);
			jsonObj['Curr_Time_of_Term'] = new Date().toLocaleString();
			if (doc['Full_path']) jsonObj['Location'] = doc['Full_path'];
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
/* Page Snapshot */
var makePageSnapshot = function (doc) {
	if (!doc['Snapshot']) { // There is no snapshot yet.
		html2canvas(doc).then(function(canvas) {
			var data = canvas.toDataURL('image/png');
			doc['Snapshot'] = data;
			doc['Snap_Width'] = canvas.width;
			doc['Snap_Height'] = canvas.height;
		}
	}
}
	
getUemCommonInfo(document);
interceptMsgBoxes(document);

if (window.addEventListener) {
	window.addEventListener('load', function () {
		tracePath(document);
		getUemCommonInfo(document);
		monitorMainFrmLoad(document);
		intercept(document);
		interceptMsgBoxes(document);
		parseLoginError(document);
		parseErrorPage(document);
		parseExceptionPage(document);
		monitorTabSet(document);
		saveOrigConsole();
		interceptPopwinExcept(document);
		interceptReqProcFail(document);
		intercept500Error(document);
	}, false);
} else if (window.attachEvent) {
	window.attachEvent('onload', function () {
		tracePath(document);
		getUemCommonInfo(document);
		monitorMainFrmLoad(document);
		intercept(document);
		interceptMsgBoxes(document);
		parseLoginError(document);
		parseErrorPage(document);
		parseExceptionPage(document);
		monitorTabSet(document);
		saveOrigConsole();
		interceptPopwinExcept(document);
		interceptReqProcFail(document);
		intercept500Error(document);
	});
}