/**
 * mxRender v 0.1 Beta
 */
 	if (typeof($mx) != 'object'){var $mx = {};}
	if (typeof($mx.render) != 'object'){$mx.render = {};}
	if (typeof($mx.render.configures) != 'object'){$mx.render.configures = {};}
	
 	/**
 	 * Configure
	 */
	//Genral Control Switcher
	$mx.render.configures.logSwitcher = true;
	$mx.render.configures.autoStartSwitcher = true;

	//Item XML Path
	$mx.render.configures.itemsXmlPath = 'items/default.xml';

	//Angular JS
	$mx.render.configures.loadAngularJS = true;
	$mx.render.configures.angularPath = 'js/angular.min.js';
	
	//jQuery/Zepto
	$mx.render.configures.loadJQuery = false;
	$mx.render.configures.jQueryPath = 'js/jQuery.min.js';
	//$mx.render.configures.jQueryPath = 'js/zepto.min.js';

	//Item CSS
	$mx.render.configures.loadItemsCss = true;
	$mx.render.configures.itemsCssPath = 'items/default.css';
	
	//Global Variables
	$mx.render.configures.autoSetIdCounter = 0;

 	/**
 	 * Main
 	 */
	(function($mx){
		$mx.autoStart = function(){
			$mx.preload();
			$mx.renderItems(document.getElementsByTagName('body')[0],1);
			return;
		}

		$mx.loadXML = function(XMLLocation,warn){
			if (window.XMLHttpRequest){
				var XMLObject = new XMLHttpRequest();
			}else{
				var XMLObject = new ActiveXObject('Microsoft.XMLHTTP');
			}
			XMLObject.open('GET',XMLLocation,false);
			XMLObject.send();
			XMLDoc = XMLObject.responseXML;
			if(XMLDoc == null){
				log(warn,2);
				return false;
			}else{
				return XMLDoc;
			}
		}

		$mx.preload = function(){
			var confs = $mx.configures;
			//load XML
			$mx.itemTemplates = $mx.loadXML(confs.itemsXmlPath,'Can\'t find item templates XML file or the file is empty.');
			
			//load Angular JS
			if (confs.loadAngularJS){
				var angularLoader = document.createElement('script');
				angularLoader.setAttribute('src',confs.angularPath);
				document.getElementsByTagName('html')[0].appendChild(angularLoader);
			}

			//load jQuery/Zepto
			if (confs.loadJQuery){
				var jQueryLoader = document.createElement('script');
				jQueryLoader.setAttribute('src',confs.jQueryPath);
				document.getElementsByTagName('html')[0].appendChild(jQueryLoader);
			}

			//load CSS
			if (confs.loadItemsCss){
				var itemsCssLoader = document.createElement('link');
				itemsCssLoader.setAttribute('rel','stylesheet');
				itemsCssLoader.setAttribute('href',confs.itemsCssPath);
				document.getElementsByTagName('head')[0].appendChild(itemsCssLoader);
			}
		}

		$mx.renderItem = function(renderElement){
			
		}

		$mx.renderItems = function(renderElement,isRoot){
			if (typeof(renderElement) == 'object' && renderElement.hasOwnProperty('childNodes')){
				var childReplacers = renderElement.childNodes;
				if (childReplacers.length > 0){
					for (var i = 0;i < childReplacers.length;i++){
						if (childReplacers[i].nodeName == 'ITEM'){
							$mx.renderItems(childReplacers[i],0);
						}
					}
					return;
				}else{
					if (isRoot == 1){
						log('Can\'t find any item replacer in ' + renderElement);
						return false;
					}else{
						$mx.renderItem(renderElement);
					}
				}
			}else{
				log(renderElement + ' is not a HTML element.');
			}
		}
	})($mx.render);

	/**
	 * Auto Start
	 */
	if ($mx.render.configures.autoStartSwitcher){
		$mx.render.autoStart();
	}

	/**
	 * Log Tool
	 */
	function log(content,type){
		if ($mx.render.configures.logSwitcher){
			switch(type){
				case 0:
				default:
					console.log(content);
					break;
				case 1:
					console.info(content);
					break;
				case 2:
					console.warn(content);
					break;
				case 3:
					console.error(content);
					break;
			}
		}
		return;
	}
