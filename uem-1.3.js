/***********************
* 错误捕获并回传  v1.1 *
* 操作捕获并回传  v1.1 *
* For IE11             *
* Hugh 2018/4/11       *
***********************/

// 遍历对象的所有属性
var getAllPropNames = function (obj) {
	var props = [];
	for (var key in obj) {
		props = props.concat(key);
	}
	return props;
}

// 打印对象的所有属性类型（函数/字符串/对象...）
var prtObjAllAttrTyp = function (obj) {
	var json = "{\n";
	for (var key in obj) {
		if (json != "{\n") json += ", \n";
		json += "	" + key + " : '" + Object.prototype.toString.call(obj[key]) + "'";
	}
	json += "\n}";
	console.log(json);
}

var prtObjAllAttrVal = function (obj) {
	var json = "{\n";
	for (var key in obj) {
		// if (typeof(obj[key]) == "string") {
			if (json != "{\n") json += ", \n";
			json += "	" + key + " : '" + obj[key] + "'";
		// }
	}
	json += "\n}";
	console.log(json);
}

// 调试工具：标记元素所有事件回调,用以分析事件触发顺序
var tagAllEvents = function (elem, desc) {
	for (var key in elem) {
		if (key.indexOf("on") == 0) {
			var msg = desc + "['" + key + "']";
			console.log(msg);
			elem.addEventListener(key.replace('on', ''), function () {
				alert(msg);
			}, true);
			// elem[key] = function () { alert(msg); };
		}
	}
}

// 获取XTag
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

/************************
* 检查浏览器是否支持    *
* MutationObserver      *
************************/
var isMutObsSupp = function () {
	var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
	var bMutObsSupp = !!MutationObserver;
	return bMutObsSupp;
}

/************************
* 观察元素属性变化 v1.0 *
* 参数:                 *
* 元素、属性值、触发动作*
************************/
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

/************************
* 屏蔽所有cutomerInfo子 *
* 页的告警框 v1.0       *
* 参数:                 *
* 需要监视的元素        *
************************/
var blockCustFrmAlarms = function (elem) {
	var options = { // 需要观察的属性
		childList : true,
		attributes : true,
		characterData : true,
		subtree : true
	};
	var actions = function () { // 触发动作
	};
	var mo = obsvElemPropChgs(elem, options, actions); // 创建MO，开始观察元素属性变化
	elem.addEventListener('load', function (event) { // 等待iframe全部加载结束
		mo.disconnect(); // 关闭mo
	}, false);
}

/************************
* 根据键值查找cookie    *
************************/
var findCookie = function (key) {
	var strCookie = document.cookie;
	var arrCookie = strCookie.split("; ");
	for (var i = 0; i < arrCookie.length; i++) {
        var arr = arrCookie[i].split("=");
        if (key == arr[0]) {
            return arr[1];
        }
	}
	return null;
}

/************************
* 解析URL获取参数       *
************************/
var getParaVal = function (url, name) {
	if (url.indexOf("?") < 0) return null; // 无查询子串
	var paraStr = url.split("?")[1]; // 获取查询子串
	var arrPara = paraStr.split("&");
	for (var i = 0; i < arrPara.length; i++) {
		var arr = arrPara[i].split("=");
		if (arr[0] == name) return arr[1];
	}
	return null;
}

/************************
* 拦截初始界面的模态    *
* 对话框                *
************************/
var _showModalDialog = window.showModalDialog;
window.showModalDialog = function (sURL, vArguments, sFeatures) {
	if (sURL != "/ngcrm/ngportal/ngportalDownload.action") {
		_showModalDialog(sURL, vArguments, sFeatures);
	}
	console.log("showModalDialog: " + sURL);
}

/************************
* 拦截初始界面的alert、 *
* confirm对话框和open的 *
* 窗体                  *
************************/
var blockPopupBoxes = function () { // 屏蔽弹出框
	var custWnd = top.middleFrame.leftFrame.cutomerInfo; // 获取cutomerInfo iframe的contentWindow
	custWnd.addEventListener('unload', function () { // 添加contentWindow的unload事件，iframe的src变化会触发老window的销毁和新window的创建
		var timer = window.setInterval(function () { // 定时循环，检测新window的创建（目前没有事件可以跟踪到新window的创建
			custWnd = top.middleFrame.leftFrame.cutomerInfo; // 重新获取一次contentWindow
			if (custWnd.location.href.indexOf('/custcare/leftCsp.do') > 0) { // 新wind的地址改变说明新wind已生效
				var _alert = custWnd.alert; // 重写alert
				custWnd.alert = function (msg) {
					if (msg && msg.indexOf("您没有安装二代证控件，请到登录首页的[控件下载]处下载，进行安装注册！") < 0) _alert(msg);
					console.log(msg);
				};
				var _confirm = custWnd.confirm; // 重写confirm
				custWnd.confirm = function (msg) {
					if (!msg) console.log("无内容确认对话框！");
					else if (msg.indexOf("请下载安装“打印控件下载(2000,2003,XP版) ”！") < 0) _confirm(msg);
					else console.log(msg);
				};
				var _open = custWnd.open; // 重写open
				custWnd.open = function (url, name, features, replace) {
					if (url.indexOf("/custcare/custsvc/common/imageEvmsShow.do") < 0) _open(url, name, features, replace);
					console.log(url);
				};
				window.clearInterval(timer); // 清理定时器
			}
		}, 1); // 定时循环设置为1ms
	}, false);
}

/************************
* 拦截初始界面的alert、 *
* confirm对话框和open的 *
* 窗体                  *
************************/
if (top && top.middleFrame) {
	if (top.middleFrame.document.readyState == "complete") { // 一种情形：上级元素的document已就绪
		if (top.middleFrame.leftFrame.document.readyState == "complete") { // 一种情形：上级元素的document已就绪
			blockPopupBoxes();
		} else { // 另一种情形：上级元素document还未就绪，等待其就绪后再触发屏蔽
			top.middleFrame.leftFrame.document.addEventListener("readystatechange", function () {
				blockPopupBoxes();
			}, false);
		}
	} else { // 另一种情形：上级元素document还未就绪，等待其就绪后再触发屏蔽
		top.middleFrame.document.addEventListener("readystatechange", function () {
			if (top.middleFrame.leftFrame.document.readyState == "complete") { // 一种情形：上级元素的document已就绪
				blockPopupBoxes();
			} else { // 另一种情形：上级元素document还未就绪，等待其就绪后再触发屏蔽
				top.middleFrame.leftFrame.document.addEventListener("readystatechange", function () {
					blockPopupBoxes();
				}, false);
			}
		}, false);
	}
}

/************************
* 主入口                *
************************/
var hookWndLoadEvent = function () {
	var mTabSet = top.publicObject["mainTab"];
	mTabSet._createTabBody = function(sTabCode, sSrc) { // 创建页签函数重写
		var oDiv = document.createElement("div");
		oDiv.id = "div_" + sTabCode + '_' + this.oOwner.id;
		oDiv.style.width = "100%";
		if (this.fGetTabHeight() > 0) {
			oDiv.style.height = this.fGetTabHeight();
			if (top.publicObject["showMenuFullNameParam"] == "1") {
				if (sTabCode.indexOf("^") > -1 && sTabCode.indexOf("~") == -1) {
					oDiv.style.height = this.fGetTabHeight() + 16;
				}
			}
		} else {
			oDiv.style.height = "100%";
		}
		oDiv.style.overflow = "hidden";
		oDiv.border = "no";
		oDiv.margin = "0";
		oDiv.style.paddingBottom = 0;
		oDiv.cellpadding = "0"; 
		oDiv.cellspacing="0";
		oDiv.style.display = "none";
		var oIframe = document.createElement("iframe");
		var iframeId = "iframe_" + sTabCode + '_' + this.oOwner.id;
		oIframe.id = iframeId;
		oIframe.name = iframeId;
		oIframe.sTabCode = sTabCode;
		oIframe.frameBorder = "NO";
		oIframe.border = "0";
		oIframe.width = "100%";
		oIframe.height = "100%";
		oIframe.scrolling = "auto";
		if (oIframe.attachEvent) { // 自定义部分，添加onload事件处理
			oIframe.attachEvent('onload', onloadHandler);
		} else if (oIframe.addEventListener) {
			oIframe.addEventListener('load', onloadHandler);
		}
		oIframe.src = sSrc;
		oDiv.appendChild(oIframe);
		if (sSrc.indexOf("/ui-custsvc") == 0) {
			var tmpTabConfig = this.aTabConfigs[sTabCode];
			if (tmpTabConfig) {
				addTabInfo(iframeId, tmpTabConfig.tabOId, sTabCode, tmpTabConfig.userId, tmpTabConfig.menuId);
			}
		}
		oIframe = null;
		return oDiv;
	}
	
	var _openMenuFun = top.openMenuFun; // 重写菜单打开函数用以记录菜单ID
	top.openMenuFun = function (menuId, menuName, linkUrl) { // 设置当前页面window的菜单ID
		_openMenuFun(menuId, menuName, linkUrl);
		var tabCode = mTabSet.sSelectedTabCode;
		var tabName = mTabSet.getTabName(tabCode);
		var bodySet = mTabSet.oTabBodySet;
		var ifrmId = "iframe_" + tabCode + "_" + top.publicObject["mainTab"].oOwner.id;
		var ifrm = bodySet.ownerDocument.getElementById(ifrmId); // IE8通过bodySet.document直接获取
		top.publicObject["mainTab"]["currentMenuId"] = menuId;
	};
}

/************************
* 主入口    v1.1        *
************************/
// if (top.publicObject["mainTab"]) { // 若页签对象已生成则直接挂钩
// 	hookWndLoadEvent();
// } else { // 若页签对象未生成，需要等待窗体load后再挂钩
// 	if (window.attachEvent) { // IE8
// 		window.attachEvent('onload', hookWndLoadEvent);
// 	} else if (window.addEventListener) { // IE11
// 		window.addEventListener('load', hookWndLoadEvent);
// 	}
// }

/*************************
* 页面onload事件处理函数 *
* v1.0                   *
* 参数：事件或Window对象 *
*************************/
var onloadHandler = function (evtOrWnd) {
	if (evtOrWnd == undefined || evtOrWnd == null) return;
	if (evtOrWnd.srcElement != undefined && evtOrWnd.srcElement != null) {
		evtOrWnd = evtOrWnd.srcElement.contentWindow; // 若参数为事件，则通过srcElement获取当前窗体对象
	}
	var doc = evtOrWnd.document; // 当前iframe的document
	var menuId = null;
	var mainTab = top.publicObject["mainTab"]; // 页签集对象
	var tabCode = mainTab.sSelectedTabCode; // 当前页签编码
	var tabName = mainTab.getTabName(tabCode); // 页签标题
	if (mainTab.getMenuObj(tabCode) != null) { // 若当前页签编码就是菜单ID
		menuId = tabCode;
	} else {
		menuId = getParaVal(evtOrWnd.location.href, "currentMenuID");
		if (menuId == null || mainTab.getMenuObj(menuId) == null) {
			menuId = getParaVal(evtOrWnd.location.href, "tabid");
			if (menuId == null || mainTab.getMenuObj(menuId) == null) {
				menuId = mainTab.lastSelectCode;
				if (menuId == null || mainTab.getMenuObj(menuId) == null) {
					menuId = mainTab["currentMenuId"];
				}
			}
		}
	}
	console.log("menuId=" + menuId + ", tabName=" + tabName);
	
	/**************************
	* 情形1、错误消息提示拦截 *
	**************************/
	var jsonErrMsg = parseErrorPage(doc);
	if (jsonErrMsg) console.log(addHeader(menuId, null, null, tabCode, tabName, jsonErrMsg));
			
	/************************
	* 情形2、嵌入式异常拦截 *
	************************/
	var jsonEmbedExcept = parseExceptionPage(doc);
	if (jsonEmbedExcept) console.log(addHeader(menuId, null, null, tabCode, tabName, jsonEmbedExcept));
			
	/*******************************
	* 情形3、jQuery pop window拦截 *
	* jQuery.popwin.bmeModel 方法  *
	* 参考bme.min.js               *
	*******************************/
	if (evtOrWnd.jQuery && evtOrWnd.jQuery.popwin) { // 若jQuery、popwin可用
		evtOrWnd.jQuery.popwin.bmeModel = function (titleStr, url, beforeClosedFn, w, h, data) { // 原版拷贝
			var box = this.model(titleStr, url, w, h, data ? data : {}); // 原版拷贝
			box.beforeClosedFn = beforeClosedFn; // 原版拷贝
			box.beforeClosedFnParam = undefined; // 原版拷贝
			box.mode = "bmeModel"; // 原版拷贝
			var errWnd = box.doc.getElementById("popwin" + box.inst).contentWindow; // 添加特性，此时box还未完全初始化完成
			if (errWnd.attachEvent) {
				errWnd.attachEvent('onload', function (evt) { // 添加box初始化事件，注意：popwin的onload事件不支持srcElement
					onloadHandler(errWnd); // 嵌套分析此popwin弹出界面
				});
			} else if (errWnd.addEventListener) {
				errWnd.addEventListener('load', function (evt) {
					onloadHandler(errWnd);
				});
			}
			return box;
		}
	}
	
	/********************************
	* 情形4、所有内含iframe子页拦截 *
	********************************/
	var subFrames = doc.getElementsByTagName("iframe");
	for (var i = 0; i < subFrames.length; i++) {
		onloadHandler(subFrames[i].contentWindow);
	}
}

/**********************
* 通过WMI获取终端信息 *
* Defect1. 软硬件信息 *
**********************/
var getAdapterInfo = function () {
	var locator = new ActiveXObject ("WbemScripting.SWbemLocator"); 
	var service = locator.ConnectServer("."); //连接本机服务器
	var properties = service.ExecQuery("SELECT * FROM Win32_NetworkAdapterConfiguration");
	var e = new Enumerator (properties);
	var json_all = '{ 网卡信息 : [\r\n';
	for (; !e.atEnd(); e.moveNext ()) {
		var p = e.item ();
		json_str = ' {\r\n';
		if (p.Caption) json_str += '  网卡描述 : ' + p.Caption; else continue; //网卡描述,也可以使用Description
		if (p.IPAddress(0)) { //IP地址为数组类型,子网俺码及默认网关亦同
			json_str += ',\r\n  网卡地址 : ' + p.IPAddress(0);
			top['term_addr'] = p.IPAddress(0);
		} else continue;
		if (p.IPSubnet(0)) json_str += ',\r\n  子网掩码 : ' + p.IPSubnet(0); else continue; // 子网掩码
		if (p.DefaultIPGateway(0)) json_str += ',\r\n  默认网关 : ' + p.DefaultIPGateway(0); else continue; // 默认网关
		if (p.MACAddress) json_str += ',\r\n  物理地址 : ' + p.MACAddress; else continue; //网卡物理地址
		json_str += '\r\n }\r\n';
		json_all += json_str;
	}
	json_all += '] }';
	postAjax(json_all);
}

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

/*****************************************
* 添加菜单、选项卡、工号、用户号码等标识 *
* 封装异常/错误JSON报文                  *
*****************************************/
var addHeader = function (menuId, menuName, linkUrl, tabCode, tabName, errMsg) {
	if (errMsg == undefined || errMsg == null) return null; // 若错误消息不可用，则放弃封装
	if (menuId == undefined || menuId == null) return errMsg; // 若菜单标识不可用，则封装失败，直接返回原始报文
	var menuObj = top.publicObject["mainTab"].getMenuObj(menuId); // 根据menuId获取菜单对象
	if (menuObj == null) return errMsg; // 若菜单对象获取失败，则放弃封装
	var json_str = "{";
	json_str += "\n \"菜单标识\" : \"" + menuId + "\"";
	if (menuName == null) menuName = menuObj.menuName;
	json_str += ",\n \"菜单名称\" : \"" + menuName + "\"";
	if (linkUrl == null) linkUrl = menuObj.menuUrl;
	json_str += ",\n \"菜单链接\" : \"" + linkUrl + "\"";
	var path = "";
	while (menuObj != null) {
		path = menuObj.menuName + path;
		menuObj = top.publicObject["mainTab"].getMenuObj(menuObj.parentId);
		if (menuObj != null) path = ">>" + path;
	}
	json_str += ",\n \"菜单路径\" : \"" + path + "\"";
	var staffId = top.frames["bottomFrame"].frames["staffLoginInfo"].document.getElementsByTagName("span")[0].innerText;
	json_str += ",\n \"Tab页签编码\" : \"" + tabCode + "\"";
	json_str += ",\n \"Tab页签名称\" : \"" + tabName + "\"";
	if (staffId != null) json_str += ",\n \"工    号\" : \"" + staffId + "\"";
	json_str += ",\n \"错误信息\" : " + errMsg;
	json_str += "\n}";
	return json_str;
}

/***********************
* 自定义：解析错误页面 *
***********************/
var parseErrorPage = function (doc) {
	if (doc != undefined && doc != null && doc.getElementById != undefined && doc.getElementById("errorMsg") != null) {
		var errMsg = "{\n";
		var elems = doc.getElementsByTagName('font'); // 所有<font/>标签
		for (var i = 0; i < elems.length; i++) {
			if (elems[i].color == "#ff0000") {
				errMsg += " \"错误描述\" : \"" + elems[i].innerText + "\",\n";
			}
		}
		elems = doc.getElementById('messagedetail');
		errMsg += " \"详    情\" : \"" + elems.rows[0].cells[0].innerText + "\"\n";
		errMsg += "}";
		return errMsg;
	}
}

/***********************************************
* 自定义：解析异常页面                         *
* 特征：页面元素中含有<SPAN id=exception/>标签 *
* 参数：document对象                           *
* 返回：解析完成的JSON报文                     *
***********************************************/
var parseExceptionPage = function (doc) {
	var errMsg = null;
	var spans = doc.getElementsByTagName("span"); // 获取所有<span/>标签
	if (spans == undefined || spans == null) return null;
	var ifTagExist = false; // 是否存在<span id=exception/>标签
	for (var i = 0; i < spans.length; i++) { // 对于所有<span/>标签
		if (spans[i].id == "exception") { // 搜索ID为exception的<span/>标签
			ifTagExist = true;
		}
	}
	if (ifTagExist) { // 获取错误描述、解决方案、详情和错误码字段
		var errMsg = "{\n";
		var labels = doc.getElementsByTagName("label");
		for (var i = 0; i < labels.length; i++) {
			if (i == 0) errMsg += " \"错误描述\" : \"" + labels[i].title + "\",\n";
			else if (i == 1) errMsg += " \"解决方案\" : \"" + labels[i].title + "\",\n";
			else if (i == 2) errMsg += " \"详    情\" : \"" + labels[i].title + "\",\n";
			else if (i == 3) errMsg += " \"错 误 码\" : \"" + labels[i].title + "\",\n";
		}
		var tds = doc.getElementsByTagName("td");
		for (var i = 0; i < tds.length; i++) {
			if (tds[i].className == "bc_block_td edetail_first_col_td") {
				errMsg += " \"堆栈信息\" : \"" + tds[i].innerText + "\"\n";
			}
		}
		errMsg += "}";
	}
	return errMsg;
}

// 回传报文
function postAjax(json_str) {
	// if (typeof(setCookieNoCode) == 'undefined') {
	// 	document.cookie += '; user_actions=' + encodeURI(json_str.toString());
	// } else {
	// 	setCookieNoCode("user_actions", encodeURI(json_str.toString()));
	// }
	console.log(json_str);
	$.ajax({
		type: "POST",
		url: "http://10.19.193.135/ssyth/jsp/busi004/getcrmuseraction.jsp?json=" + encodeURI(json_str),
		contentType: "application/json",
		dataType: "json",
		data: json_str,
		success: function (jsonResult) {
			console.log(jsonResult);
		},
		error: function (XMLHttpRequest, textStatus, errorThrown) {
			console.log("返回码: " + XMLHttpRequest.status + ", 就绪状态: " + XMLHttpRequest.readyState);
		}
	});
	$.ajax({
		type: "POST",
		url: "http://10.19.240.42:8080/service/uem/user_actions.do?" + 'json=' + encodeURI(json_str.toString()),
		contentType: "application/json",
		dataType: "json",
		data: json_str,
		success: function (jsonResult) {
			console.log(jsonResult);
		},
		error: function (XMLHttpRequest, textStatus, errorThrown) {
			console.log("返回码: " + XMLHttpRequest.status + ", 就绪状态: " + XMLHttpRequest.readyState);
		}
	});
}


// 获取navigator属性JSON字串
var getNaviProps = function() {
	var props = "";
	props += " \"浏览器代码名\" : \"" + navigator["appCodeName"] + "\",\n"; // 在所有以Netscape（网景）代码为基础的浏览器中，它的值是 "Mozilla"，为了兼容起见，在 Microsoft 的浏览器中，它的值也是 "Mozilla"。
	props += " \"浏览器名称\" : \"" + navigator["appName"] + "\",\n";
	props += " \"浏览器次级版本\" : \"" + navigator["appMinorVersion"] + "\",\n";
	props += " \"浏览器CPU等级\" : \"" + navigator["cpuClass"] + "\",\n";
	props += " \"浏览器平台和版本\" : \"" + navigator["appVersion"] + "\",\n";
	props += " \"操作系统平台\" : \"" + navigator["platform"] + "\",\n";
	var plugLen = navigator["plugins"];
	props += " \"插件\" : {\n";
	for (var i = 0; i < plugLen; i++) {
		props += "  \"名称\" : \"" + navigator["plugins"][i].name + "\",\n";
		props += "  \"文件名\" : \"" + navigator["plugins"][i].filename + "\",\n";
		props += "  \"描述\" : \"" + navigator["plugins"][i].description + "\",\n";
		props += "  \"描述\" : \"" + navigator["plugins"][i].version ? navigator["plugins"][i].version : "" + "\",\n";
	}
	props += " }\n";

	// props += "\"\" : \"" + navigator["opsProfile : '[object Object]', 
	// props += "\"\" : \"" + navigator["userProfile : '[object Object]', 
	props += " \"操作系统语言\" : \"" + navigator["systemLanguage"] + "\",\n";
	props += " \"操作系统自然语言\" : \"" + navigator["userLanguage"] + "\",\n";
	props += " \"User-Agent头\" : \"" + navigator["userAgent"] + "\",\n";
	props += " \"终端是否脱机\" : \"" + navigator["onLine"].toString() + "\",\n";
	props += " \"浏览器是否启用Cookie\" : \"" + navigator["cookieEnabled"].toString() + "\"";
	// props += " \"MIME类型列表\" : \"" + navigator["mimeTypes : '[object Object]';
	console.log("{\n" + props + "\n}");
}

/***************
* 是否包含汉字 *
***************/
var ifContainCharacters = function (val) {     
	var reg = new RegExp("[\\u4E00-\\u9FFF]+", "g");
	if (reg.test(val)) {
		return true;
	}
	return false;
}

/***************
* 获取汉字部分 *
***************/
var getChinese = function (val) {
	if (val && val != "") {
		var reg = /[\u4E00-\u9FFF]/g;
		return val.match(reg).join("");
	}
	return val;
}

/********************
* 从元素标题中获取  *
* 获取可读文字信息  *
********************/
var getReadableInfo = function (elem, path) {
	var literal = ""; // 可读性文字
	var imgUrl = ""; // 图像链接
	if (!elem) return '( ' + path + ' >> 无效元素 )'; // 元素合法性检查

	if (ifContainCharacters(elem.title)) literal = elem.title; // 1.1、元素本身的属性
	else if (elem.innerText && ifContainCharacters(elem.innerText)) literal = elem.innerText; // 1.2、元素内部文字
	else if (elem.previousElementSibling && ifContainCharacters(elem.previousElementSibling.title))
		literal = elem.previousElementSibling.title; // 2.1、前兄弟的属性
	else if (elem.previousElementSibling && ifContainCharacters(elem.previousElementSibling.innerText))
		literal = elem.previousElementSibling.innerText; // 2.2、前兄弟的内部文字
	else if (elem.nextElementSibling && ifContainCharacters(elem.nextElementSibling.title))
		literal = elem.nextElementSibling.title; // 3.1、后兄弟的属性
	else if (elem.nextElementSibling && ifContainCharacters(elem.nextElementSibling.innerText))
		literal = elem.nextElementSibling.innerText; // 3.2、后兄弟的内部文字
	else if (elem.parentElement && ifContainCharacters(elem.parentElement.title))
		literal = elem.parentElement.title; // 4.1、父元素的属性
	else if (elem.parentElement && ifContainCharacters(elem.parentElement.innerText))
		literal = elem.parentElement.innerText; // 4.2、父元素的属性
	else if (elem.parentElement && elem.parentElement.parentElement && elem.parentElement.parentElement.parentElement && elem.parentElement.parentElement.parentElement.previousElementSibling && ifContainCharacters(elem.parentElement.parentElement.parentElement.previousElementSibling.innerText))
		literal = elem.parentElement.parentElement.parentElement.previousElementSibling.innerText; // 特殊情形
	else if (elem.parentElement && elem.parentElement.parentElement && ifContainCharacters(elem.parentElement.parentElement.innerText))
		literal = elem.parentElement.parentElement.innerText; // 特殊情形
	else literal = "";
	
	literal = literal.replace("\r\n", "，"); // 过滤掉所有换行符为逗号分割符
	if (literal != "") literal = getChinese(literal); // 提取中文
	if (literal.length > 8) literal = literal.substr(0, 8) + '...'; // 字符串截取前8个字符并加省略号
	
	var arrImgs = elem.currentStyle.backgroundImage.match(new RegExp(/\"(.*?)\"/g));
	if (arrImgs != null && arrImgs.length > 0) imgUrl = arrImgs[0];
	if (imgUrl != '' && literal != '') literal += ' '; // 若可读性文字和图像链接均存在则中间以空格分隔
	return "( " + path + " >> " + literal + imgUrl + " )";
}

// 拦截公共popwin弹窗
var interceptPopwin = function () {
	(function($3rd) {
		var origAppend = $3rd.fn.append;
		$3rd.fn.append = function () {
			return origAppend.apply(this, arguments).trigger("append");
		};
	})($3rd); // 添加自定义事件append

	$3rd("#popMain_iFrame_upper_id_div_id").bind("append", function () { // 第1种情形
		var ifrm = this.lastChild; // 最后被添加的元素
		var doc = ifrm.contentDocument;
		if (doc.readyState == "complete") {
			traverse(doc.getElementsByTagName('html')[0], '异常弹出框');
		} else {
			$(ifrm).bind('load', function () {
				traverseNested(this.contentDocument.getElementsByTagName('html')[0], '异常弹出框');
				var _click = $('button', this.contentDocument)[0].onclick; // onclick提前将对话框关闭了，造成bind的事件handler无法执行，因此需要重写onclick
				$('button', this.contentDocument)[0].onclick = function (event) {
					console.log('点击 ( 异常弹出框 >> ' + this.innerText + ' )');
					_click();
				}
				console.log("异常消息: " + $('.popwin_content', this.contentDocument)[0].innerText.replace("\r\n", ""));
			});
		}
	});

	$3rd("#popMain_iFrame_id_div_id").bind("append", function () { // 第2种情形
		var ifrm = this.lastChild; // 最后被添加的元素
		var doc = ifrm.contentDocument;
		if (doc.readyState == "complete") {
			traverseNested(doc.getElementsByTagName('html')[0], '异常弹出框');
		} else {
			$(ifrm).bind('load', function () {
				traverseNested(this.contentDocument.getElementsByTagName('html')[0], '异常弹出框');
				var _click = $('button', this.contentDocument)[0].onclick; // onclick提前将对话框关闭了，造成bind的事件handler无法执行，因此需要重写onclick
				$('button', this.contentDocument)[0].onclick = function (event) {
					console.log('点击 ( 异常弹出框 >> ' + this.innerText + ' )');
					_click();
				}
				console.log("异常消息: { 异常描述 : " + $3rd("p[ng-bind='$Page.exception.desc']", this.contentDocument)[0].innerText +
					", 解决方案 : " + $3rd("p[ng-bind='$Page.exception.solution']", this.contentDocument)[0].innerText +
					", 查看详情 : " + $3rd("p[ng-bind='$Page.exception.solution']", this.contentDocument)[0].innerText + " }");
			});
		}
	});
	
	// 第3种情形，老CRM的popwin弹出框
	var mo = obsvElemPropChgs($('#mainFrameForNG_body')[0], { childList : true }, function (divs) {
		for (var i = 0; i < divs.addedNodes.length; i++) { // 处理所有added Nodes
			if (divs.addedNodes[i].className == 'popwin') {
				var itemTitles = $('.popwin_title', divs.addedNodes[i]);
				if (itemTitles.length == 0) continue;
				var sTitle = itemTitles[0].innerText;
				if (sTitle == '错误') { // 错误popwin弹出框
					var ifrms = $('.popwin_iframe', $(divs.addedNodes[i]));
					if (ifrms.length == 0) continue;
					if (ifrms[0].contentDocument.readyState == 'complete') {
						traverseNested(ifrms[0].contentDocument.getElementsByTagName('html')[0], '根 >> 错误');
						var except_json = '{\r\n';
						var labels = $('.bc_field_label', ifrms[0].contentDocument);
						for (var j = 0; j < labels.length; j++) {
							if (labels[j].innerText == '') continue;
							if (j > 0) except_json += ',\r\n';
							except_json += ' ' + labels[j].innerText.replace('：', '') + ' : ' + labels[j].nextElementSibling.innerText;
						}
						except_json += ',\r\n';
						except_json += ' 原因详情 : ' + $('.detail_first_col_td', ifrms[0].contentDocument)[0].innerText;
						except_json += ',\r\n';
						except_json += ' 堆栈详情 : ' + $('.edetail_first_col_td', ifrms[0].contentDocument)[0].innerText;
						except_json += '\r\n}';
						console.log(except_json);
					} else {
						$(ifrms[0]).bind('load', function (evt) {
							if (!evt.target.contentDocument) return;
							traverseNested(evt.target.contentDocument.getElementsByTagName('html')[0], '根 >> 错误');
							var except_json = '{\r\n';
							var labels = $('.bc_field_label', evt.target.contentDocument);
							for (var j = 0; j < labels.length; j++) {
								if (labels[j].innerText == '') continue;
								if (j > 0) except_json += ',\r\n';
								except_json += ' ' + labels[j].innerText.replace('：', '') + ' : ' + labels[j].nextElementSibling.innerText;
							}
							except_json += ',\r\n';
							except_json += ' 原因详情 : ' + $('.detail_first_col_td', ifrms[0].contentDocument)[0].innerText;
							except_json += ',\r\n';
							except_json += ' 堆栈详情 : ' + $('.edetail_first_col_td', ifrms[0].contentDocument)[0].innerText;
							except_json += '\r\n}';
							console.log(except_json);
						});
					} // 处理popwin的iframe
				} // 错误popwin弹出框
			} // 处理popwin的div
		} // 处理所有added Nodes
		
		for (var i = 0; i < divs.removedNodes.length; i++) { // 处理所有removed Nodes
			if (divs.removedNodes[i].className == 'popwin') {
				var itemTitles = $('.popwin_title', divs.removedNodes[i]);
				if (itemTitles.length == 0) continue;
				var sTitle = itemTitles[0].innerText;
				if (sTitle == '错误') { // 错误popwin弹出框
					console.log('关闭错误提示框！');
				}
			}
		}
	});
}

// 解析popwin弹窗内容，参数为页签iframe的contentDocument
var parsePopwin = function (elem) {
	if (!elem || !elem.className) return;
	if (elem.className.indexOf('popwin_con') >= 0 && elem.className.indexOf('ng-scope') >= 0) { // 若当前div为popwin
		var titles = $('.popwin_title', elem.ownerDocument);
		if (titles.length == 0) return;
		var sTitle = titles[0].innerText;
		if (sTitle == '错误') { // 错误popwin弹出框
			var msgs = $('.ng-binding', elem);
			var jsonObj = clone(top['uem_json']);
			jsonObj['终端时间'] = new Date().toLocaleString();
			if (msgs.length != 3) jsonObj['异常'] = '错误消息无法正确解析!';
			var except_json = '{\r\n';
			except_json += ' 错误消息 : ' + msgs[0].innerText + ',\r\n';
			except_json += ' 解决方案 : ' + msgs[1].innerText + ',\r\n';
			except_json += ' 查看详情 : ' + msgs[2].innerText + '\r\n}';
			console.log(except_json);
		} else if (sTitle == '成功' || sTitle == '确认') {
			var except_json = '{ ' + sTitle + ' : ' + $('.popwin_content', elem)[0].innerText + ' }';
			var jsonObj = clone(top['uem_json']);
			jsonObj['终端时间'] = new Date().toLocaleString();
			jsonObj[sTitle] = $('.popwin_content', elem)[0].innerText;
			postAjax(JSON.stringify(jsonObj));
		} else if (sTitle == '产品详情') {
			var jsonObj = clone(top['uem_json']);
			jsonObj['终端时间'] = new Date().toLocaleString();
			jsonObj['系统提示'] = '产品详情对话框';
			postAjax(JSON.stringify(jsonObj));
		}
	} else if (elem.className == 'popwin uee-popwin-noresize') {
		var titles = $('.popwin_title', elem);
		if (titles.length == 0) return;
		var sTitle = titles[0].innerText;
		if (sTitle == '提示') {
			var msgs = $('.popwin_content', elem);
			var jsonObj = clone(top['uem_json']);
			jsonObj['终端时间'] = new Date().toLocaleString();
			jsonObj['提示'] = msgs[0].innerText;
			postAjax(JSON.stringify(jsonObj));
		}
	}
}

// 监视页签头、页签体
var monitorTabSet = function () {
	if (!top || !top.publicObject || !top.publicObject['mainTab'] || !top.publicObject["mainTab"].oTabHeadSet) return;
	var moHdr = obsvElemPropChgs(top.publicObject["mainTab"].oTabHeadSet, { childList : true }, function (hdrs) { // 拦截页签头
		for (var i = 0; i < hdrs.addedNodes.length; i++) {
			var oMenu = top.publicObject['mainTab'].getMenuObj(top.CUR_OPERATION);
			if (oMenu) { // 若当前菜单对象合法
				var sMenuName = oMenu.menuName;
				var sTabName = hdrs.addedNodes[i].innerText; // 从页签头部获取页签名
				if (sMenuName != sTabName) { // 若菜单名与页签名不同，说明是不同菜单的不同步骤
					sTabName = ' ~ ' + sTabName;
					hdrs.addedNodes[i]['tabName'] = hdrs.addedNodes[i].innerText; // 记录标签名称
				} else sTabName = ''; // 若菜单名和页签名相同，则无需记录页签名
				var jsonObj = clone(top['uem_json']);
				jsonObj['终端时间'] = new Date().toLocaleString();
				jsonObj['弹出页签'] = sMenuName + sTabName;
				postAjax(JSON.stringify(jsonObj));
				hdrs.addedNodes[i]['menuId'] = top.CUR_OPERATION; // 记录menuId到页签头
			} else {
				var sTabName = hdrs.addedNodes[i].innerText; // 从页签头部获取页签名
				hdrs.addedNodes[i]['tabName'] = hdrs.addedNodes[i].innerText;
				var jsonObj = clone(top['uem_json']);
				jsonObj['终端时间'] = new Date().toLocaleString();
				jsonObj['弹出页签'] = sTabName;
				postAjax(JSON.stringify(jsonObj));
			}
		}
		for (var i = 0; i < hdrs.removedNodes.length; i++) {
			if (hdrs.removedNodes[i]['menuId']) {
				var sMenuName = top.publicObject['mainTab'].getMenuObj(hdrs.removedNodes[i]['menuId']).menuName;
				var sTabName = hdrs.removedNodes[i]['tabName']; // 页签已销毁，innerText已无法取到
				if (sTabName) sTabName = ' ~ ' + sTabName; // 若已记录页签名
				else sTabName = ''; // 若未记录页签名
				var jsonObj = clone(top['uem_json']);
				jsonObj['终端时间'] = new Date().toLocaleString();
				jsonObj['关闭页签'] = sMenuName + sTabName;
				postAjax(JSON.stringify(jsonObj));
			} else {
				var sTabName = hdrs.removedNodes[i]['tabName']; // 从记录的tabName中获取
				var jsonObj = clone(top['uem_json']);
				jsonObj['终端时间'] = new Date().toLocaleString();
				jsonObj['关闭页签'] = sTabName;
				postAjax(JSON.stringify(jsonObj));
			}
		}
	});
}

/***********
* 克隆原语 *
***********/
var clone = function (original) {
	var obj = {};
	for (var i in original) {
		obj[i] = original[i];
	}
	return obj;
}

/********************
* 框架插码核心 v1.3 *
* 基于冒泡实现遍历  *
********************/
var traverse = function (doc, path) {
	if (!doc) return;
	$(doc).bind('click', function (e) { // 将click事件绑定到当前document上，等待冒泡事件
		var jsonObj = clone(top['uem_json']); // 获取JSON报文的公共部分
		jsonObj['终端时间'] = new Date().toLocaleString();
		jsonObj['操作内容'] = '点击 ' + getReadableInfo(e.target, path);
		postAjax(JSON.stringify(jsonObj));
	});
	$(doc).bind('change', function (e) { // 同上
		var jsonObj = clone(top['uem_json']); // 获取JSON报文的公共部分
		jsonObj['终端时间'] = new Date().toLocaleString();
		jsonObj['操作内容'] = '改变 ' + getReadableInfo(e.target, path) + ' 值为 ' + e.target.value;
		postAjax(JSON.stringify(jsonObj));
	});

	// 0、错误捕获
	if ($('form', doc).length > 0 && $('form', doc)[0].name == 'ErrFrm') {
		if (!top['uem_json']) {
			top['uem_json'] = {};
		}
		var jsonObj = clone(top['uem_json']);
		jsonObj['终端时间'] = new Date().toLocaleString();
		jsonObj['提示类型'] = '系统忙';
		jsonObj['提示内容'] = $('form', doc)[0].innerText;
		postAjax(JSON.stringify(jsonObj));
	}
	if ($('title', doc).length > 0 && $('title', doc)[0].innerText == '请求处理失败') {
		var jsonObj = clone(top['uem_json']);
		jsonObj['终端时间'] = new Date().toLocaleString();
		jsonObj['提示内容'] = $('body', doc)[0].innerText;
		postAjax(JSON.stringify(jsonObj));
	}
	
	// 1、搜索当前document内所有已存在的iframe/frame节点
	var frms = $('iframe, frame', doc);
	for (var i = 0; i < frms.length; i++) { // 遍历所有已存在的iframe/frame节点
		var frmDoc = frms[i].contentDocument; // 分别获取所有iframe/frame节点的document对象
		// 1.1、若状态为就绪，直接进行遍历
		if (frmDoc && frmDoc.readyState == "complete") {
			traverse(frmDoc, path + ' >> ' + frms[i].id);
		}
		// 1.2、iframe本身刷新或未加载完成的，等待load完成时遍历
		$(frms[i]).bind('load', function (e) {
			var frmDoc = e.target.contentDocument;
			if (frmDoc) {
				traverse(frmDoc, path + ' >> ' + e.target.id);
			}
		});
	}
	
	// 2、搜索当前document内所有即将添加的iframe/frame节点
	var mo = obsvElemPropChgs(doc.body, { childList : true, subtree : true }, function (elems) { // 定义监视器
		for (var i = 0; i < elems.addedNodes.length; i++) { // 所有添加的节点
			var newNode = elems.addedNodes[i];
			var sTagName = newNode.tagName;
			if (sTagName == 'IFRAME' || sTagName == 'FRAME') { // 2.1、若有新增的iframe节点，则递归插码
				if (newNode.contentDocument && newNode.contentDocument.readyState == 'complete') { // 2.1.1、若状态为就绪，直接进行遍历
					traverse(newNode.contentDocument, path + ' >> ' + newNode.id);
				}
				$(newNode).bind('load', function (e) { // 2.1.2、iframe本身刷新或未加载完成的，等待load完成时遍历
					traverse(e.target.contentDocument, path + ' >> ' + e.target.id);
				});
			} else if (sTagName == 'DIV' && newNode.id.indexOf('loadingcover') >= 0) { // 2.2、处理加载中提示
				var moLoading = obsvElemPropChgs(newNode, { attributes : true, attributeFilter : [ 'style' ] }, function (elem) {
					if (elem.target.style.display != 'none') { // 若加载中开始展示
						var jsonObj = clone(top['uem_json']);
						jsonObj['终端时间'] = new Date().toLocaleString();
						jsonObj['系统提示'] = '加载中...';
						postAjax(JSON.stringify(jsonObj));
					} else {
						var jsonObj = clone(top['uem_json']);
						jsonObj['终端时间'] = new Date().toLocaleString();
						jsonObj['系统提示'] = '加载完成...';
						postAjax(JSON.stringify(jsonObj));
					}
				});
				var ownBody = newNode.ownerDocument.body;
				if (!ownBody['monitors']) ownBody['monitors'] = [];
				ownBody['monitors'].push(moLoading);
			} else { // 2.3、有的iframe/frame节点是随其他新增元素一起加载的
				var subFrms = $('iframe, frame', elems.addedNodes[i]); // 二次搜索
				for (var j = 0; j < subFrms.length; j++) {
					if (subFrms[j].contentDocument.readyState == 'complete') { // 2.3.1、若状态为就绪，直接进行遍历
						traverse(subFrms[j].contentDocument, path + ' >> ' + subFrms[j].id);
					}
					$(subFrms[j]).bind('load', function (e) { // 2.3.2、iframe本身刷新或未加载完成的，等待load完成时遍历
						traverse(e.target.contentDocument, path + ' >> ' + e.target.id);
					});
				}
				parsePopwin(newNode); // 2.3.3、若新增节点为popwin相关，需要进行解析
			}
		}
	});
	if (!doc.body['monitors']) doc.body['monitors'] = [];
	doc.body['monitors'].push(mo); // 记录监视对象
	$(doc.body).bind('unload', function (e) { // 监视器随body卸载而关闭
		while (e.target['monitors'].length > 0) e.target['monitors'].pop().disconnect();
	});
	
	// 3、拦截模态框、非模态框、alert、confirm等
	var _showModalDialog = doc.parentWindow.showModalDialog;
	doc.parentWindow.showModalDialog = function (sURL, vArguments, sFeatures) {
		var jsonObj = clone(top['uem_json']);
		jsonObj['模态对话框'] = sURL;
		postAjax(JSON.stringify(jsonObj));
		_showModalDialog(sURL, vArguments, sFeatures);
	}
	var _showModelessDialog = doc.parentWindow.showModelessDialog;
	doc.parentWindow.showModelessDialog = function (sURL, vArguments, sFeatures) {
		var jsonObj = clone(top['uem_json']);
		jsonObj['非模态对话框'] = sURL;
		postAjax(JSON.stringify(jsonObj));
		_showModelessDialog(sURL, vArguments, sFeatures);
	}
	var _alert = doc.parentWindow.alert; // 重写alert
	doc.parentWindow.alert = function (msg) {
		var jsonObj = clone(top['uem_json']);
		jsonObj['告警提示框'] = msg;
		postAjax(JSON.stringify(jsonObj));
		_alert(msg);
	};
	var _confirm = doc.parentWindow.confirm; // 重写confirm
	doc.parentWindow.confirm = function (msg) {
		var jsonObj = clone(top['uem_json']);
		jsonObj['确认提示框'] = msg;
		postAjax(JSON.stringify(jsonObj));
		_confirm(msg);
	};
	var _open = doc.parentWindow.open; // 重写open
	doc.parentWindow.open = function (url, name, features, replace) {
		var jsonObj = clone(top['uem_json']);
		jsonObj['打开新窗口'] = msg;
		postAjax(JSON.stringify(jsonObj));
		_open(url, name, features, replace);
	};
}

/***********************
* 一次性执行：获取工号 *
***********************/
var oneOffExec = function () {
	if ($('#staffInfoDiv').length > 0) {
		var dropInfos = $('.drop_info', $('#staffInfoDiv')[0]);
		if (dropInfos.length >= 4) {
			top['uem_json'] = {
				工号 : "'" + dropInfos[0].innerText + "'",
				单位 : "'" + dropInfos[3].innerText + "'"
			};
		}
	}
	
	var ipMac = queryIPMAC(); // 获取IP、MAC
	if (!top['uem_json']) top['uem_json'] = {};
	top['uem_json']['终端IP'] = ipMac.substr(ipMac.indexOf(';') + 1);
	top['uem_json']['终端MAC'] = ipMac.substr(0, ipMac.indexOf(';'));
}

window.addEventListener('load', function () {
	// traverseNested(document.getElementsByTagName('html')[0], '根');
	// interceptPopwin();
	// interceptPublicObject();
	getNaviProps();
	traverse(document, '根');
	monitorTabSet();
	oneOffExec();
	interceptPopwin();
});