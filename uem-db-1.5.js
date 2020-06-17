/****************************************************
* UEM-1.5 IndexedDB Operator                        *
* Written by Qiming He                              *
****************************************************/
// global indexedDB object
var db = null;

// open or initialize indexedDB
var openDB = function() {
	if (!window.indexedDB) {
		console.log('浏览器不支持indexedDB');
		return;
	}
	var req = window.indexedDB.open('errDB', 1);
	req.onerror = function (evt) {
		console.log('数据库打开报错!');
	};
	req.onsuccess = function (evt) {
		console.log('数据库打开成功!');
	};
	req.onupgradeneeded = function (evt) {
		console.log('数据库升级成功!');
		db = evt.target.result;
	};
}

var rmDB = function() {
	var req = window.indexedDB.deleteDatabase('errDB');
	req.onsuccess = function (evt) {
		console.log('数据库删除成功!');
	}
	req.onerror = function (evt) {
		console.log('数据库删除失败!');
	}
}

window.indexedDB.deleteDatabase('errDB');

var openTab = function() {
	if (!db.objectStoreNames.contains('errs')) {
		var objStor = db.createObjectStore('errs', { keyPath : 'id' });
		objStor.createIndex('val', 'val', { unique: false });
		var reqAdd = db.transaction(['errs'], 'readwrite').objectStore('errs').add({ id : 1, val : 'xception' });
		reqAdd.onsuccess = function (e1) {
			console.log('数据写入成功');
		};
	}
}