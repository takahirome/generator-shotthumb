/*
	
*	project: generator-shotthumb

*	takahiro ishiayama. 
*	@t_ishiyama
*	sirok,inc.

*/

(function(){

	"use strict";

	var PLUGIN_ID = require("./package.json").name,
		MENU_ID = "ShotThumb";
	var MENU_LABEL = "$$$/JavaScripts/Generator/shotthumb/Menu=ShotThumb";

	var _generator = null;
	var _config = null;
	var _currentDocumentId = null;
	var _currentMenuStatus = null;
	var _eventCnt = 0; //photoshop eventCnt
	var _psdExportCnt = 50; //backUpPsdFile with eventCnt
	var _exportPsd = false; //backUpPsdFileFlg
	var _menuState = true; //menuState

	//初期化
	function init(generator, config){
		_generator = generator;
		_config = config;

		//console.log("initializing generator getting started tutorial with config %j", _config);
		console.log("SHOT-BACK STARTED!");
		
		//addmenuItems
		//(name, displayName, enabled, checked) 
		_generator.addMenuItem(MENU_ID, MENU_LABEL, true, true).then(
			function(){
				console.log("[CREATE]", MENU_ID);
			},function(){
				console.log("[FAILED]", MENU_ID);
			}
		);

		_generator.onPhotoshopEvent("generatorMenuChanged", handleGeneratorMenuChanged);


		//初期化
		function initLater(){

			//重いので無し
			//_generator.onPhotoshopEvent("currentDocumentChanged", handleCurrentDocumentChanged);
				
				_generator.onPhotoshopEvent("imageChanged", handleImageChanged);
				//TODO　動かない
				//_generator.onPhotoshopEvent("toolChanged", handleToolChanged);
				requestEntireDocument();
		}

		process.nextTick(initLater);

	}

	
	/*Events*/
	//ドキュメントチェンジイベント
	//getDocumentInfo (documentId, flags)
	//動作が重くなるため、書き出しを非同期にしてから
	function handleCurrentDocumentChanged(id) {
        console.log("handleCurrentDocumentChanged: "+id);
        setCurrentDocumentId(id);
        getshotthumb(this);
    }


	//メニューチェンジイベント

	function handleGeneratorMenuChanged(event){
		console.log("menuChanged" );
		
		var menu = event.generatorMenuChanged;
        if (!menu || menu.name !== MENU_ID) {
            return;
        }

        var menuState = _generator.getMenuState(menu.name);
        console.log("Menu event %s, starting state %s", stringify(event), stringify(menuState));


        //toggleChecked
        //var params = {name: MENU_ID, enabled: menuState.enabled, checked: menuState.checked};
        _generator.toggleMenu(MENU_ID, menuState.enabled, !menuState.checked);

        //menuStateChecked
        var menuState = _generator.getMenuState(menu.name);
        _menuState = menuState.checked;
        console.log("_menuState: " + _menuState);
	}
	

	//imageChanged
	function handleImageChanged(document){

		console.log("Image " + document.id + " was changed:");

		console.log(_menuState);
		if(_menuState == false){
		 	console.log('handleImageChanged : canceled');
		 	return;
		}
		else{
			eventCount();
			getshotthumb(this);
		}
	}


	/*********** CALLS ***********/

	//eventCount
	function eventCount(){
		_eventCnt++;
		console.log("_eventCnt:"+_eventCnt);
		if(_eventCnt%_psdExportCnt == 0) _exportPsd = true;
		else _exportPsd = false;

		return _exportPsd;
	} 

	//getshotthumbLog
	function getshotthumb(object){
		
		//generatorObj
		var self = object;
		//console.log("slefPhotoshopPath: "+ self._photoshop._applicationPath);

		//debugbuild generatorshotthumbpath
		//var shotthumbfile = '../../generator-shotthumb/Generator/shotthumb.generate/runShotThumb.jsx'
		var shotthumbfile = self._photoshop._applicationPath+'/Plug-ins/Generator/shotthumb.generate/runShotThumb.jsx';
		
		console.log(_exportPsd);
		
		evalJsxFile(shotthumbfile, { exportPsd : _exportPsd });
	}

	function getFirstLayerBitmapAndSaveWithOptions(document){
	    _document = document;
	 
	    console.log(_document.id,_document.layers[0].id);
	    _generator.getPixmap(_document.id,_document.layers[0].id,{}).then(
	    function(pixmap){
	        console.log("got Pixmap: "+pixmap.width+" x "+pixmap.height);
	        _generator.savePixmap(pixmap,path.resolve(__dirname, 'out.png'),{format:"jpg",quality:100,ppi:72});
	    },
	    function(err){
	        console.error("err pixmap:",err);
	    }).done();
	}

	//recuestDocuments
    function requestEntireDocument(documentId) {
        if (!documentId) {
            console.log("Determining the current document ID");
        }
        _generator.getDocumentInfo(documentId).then(
            function (document) {
                console.log("Received complete document:", stringify(document));
            },
            function (err) {
                console.error("[Tutorial] Error in getDocumentInfo:", err);
            }
        ).done();
    }


	/*********** HELPERS ***********/

	//JSX(file)を読み込む機構
	function evalJsxFile(file,params){

		_generator.evaluateJSXFile(file,params).then(
        function(result){
        	console.log(result);
        },
        function(err){
            console.log(err);
        });
	}

	//JSX(str)をPSに送る機構
    function doJsxScript(str){
    	console.log("[HELPER]:doJsxScript");
		_generator.evaluateJSXString(str).then(
	        function(result){
	            var obj = result.split(",");
	 			console.log(obj[0]);
	        },
	        function(err){
	            console.log(err);
	        });
    }

    //ドキュメントIDを定義
    function setCurrentDocumentId(id) {
        if (_currentDocumentId === id) {
            return;
        }
        console.log("Current document ID:", id);
        _currentDocumentId = id;
    }

    //JSON stringify
    function stringify(object) {
        try {
            return JSON.stringify(object, null, "	");
        } catch (e) {
            console.error(e);
        }
        return String(object);
    }

	exports.init = init;
 	// Unit test function exports
    exports._setConfig = function (config) { _config = config; };

}());