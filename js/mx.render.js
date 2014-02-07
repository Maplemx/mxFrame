/**
 * mxRender v 0.1.1 Beta
 */
 	if (typeof($mx) != 'object'){var $mx = {};}
	if (typeof($mx.render) != 'object'){$mx.render = {};}
	if (typeof($mx.render.configures) != 'object'){$mx.render.configures = {};}
	
 	/**
 	 * Configure
	 */
	//Auto Start
	$mx.render.configures.autoStartSwitcher = true;

	//Console Information For Debugging
	$mx.render.configures.logSwitcher = false;

	//Item XML Path
	$mx.render.configures.itemsXmlPath = 'items/default.xml';

	//Angular JS
	$mx.render.configures.loadAngularJS = true;
	$mx.render.configures.angularPath = 'js/angular.min.js';
	$mx.render.configures.angularModuleName = 'default';
	
	//jQuery/Zepto
	$mx.render.configures.loadJQuery = false;
	$mx.render.configures.jQueryPath = 'js/jQuery.min.js';
	//$mx.render.configures.jQueryPath = 'js/zepto.min.js';

	//Item CSS
	$mx.render.configures.loadItemsCss = true;
	$mx.render.configures.itemsCssPath = 'items/default.css';
	
 	/**
 	 * Main
 	 */
	(function($mx){
		$mx.autoSetIdCounter = 0;
		$mx.publicCSS = document.createElement('style');
		$mx.addedCSS = [];
		$mx.runPreloadOnce = [];
		$mx.runCallbackOnce = [];

		$mx.autoStart = function(){
			$mx.preload();
			$mx.renderItems(document.body,1);
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
				document.getElementsByTagName('html')[0].setAttribute('ng-app',confs.angularModuleName);
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

			//create public CSS area
			$mx.publicCSS.setAttribute('type','text/css');
			document.getElementsByTagName('head')[0].appendChild($mx.publicCSS);
		}

		$mx.renderItem = function(renderElement){
			//prepare information
			var renderElementAttrs = elementAttributes(renderElement);
				itemTemplateName = renderElementAttrs['mx-name'],
				itemId = renderElementAttrs['id'],
				itemClass = renderElementAttrs['class'];
			if (typeof(itemTemplateName) == 'undefined'){
				log([renderElement,'has no attribute "mx-name".'],2);
				return false;
			}
			if (typeof(itemId) == 'undefined'){
				renderElement.setAttribute('id',itemTemplateName + '_' + $mx.autoSetIdCounter);
				$mx.autoSetIdCounter++;
			}
			if (typeof(itemClass) == 'undefined'){
				renderElement.setAttribute('class',itemTemplateName);
			}

			//load template
			var itemTemplate = $mx.itemTemplates.getElementsByTagName(itemTemplateName)[0];
			if (typeof(itemTemplate) == 'undefined'){
				log(renderElement + 'has no template.',2);
				return false;
			}
			var	itemTemplateCSS = itemTemplate.getElementsByTagName('css')[0],
				itemTemplatePreloadOnce = itemTemplate.getElementsByTagName('preload-once')[0],
				itemTemplatePreload = itemTemplate.getElementsByTagName('preload')[0],
				itemTemplateHTML = itemTemplate.getElementsByTagName('html')[0],
				itemTemplateCallback = itemTemplate.getElementsByTagName('callback-once')[0],
				itemTemplateCallback = itemTemplate.getElementsByTagName('callback')[0],
				renderingItemHTML = renderElement.innerHTML;

			//add additional CSS
			if (typeof(itemTemplateCSS) != 'undefined' && !inArray(itemTemplateName,$mx.addedCSS)){
				$mx.publicCSS.innerHTML += itemTemplateCSS.textContent;
				$mx.addedCSS.push(itemTemplateName);
			}

			//do preload-once JS job
			if (typeof(itemTemplatePreloadOnce) != 'undefined' && !inArray(itemTemplateName,$mx.runPreloadOnce)){
				eval(itemTemplatePreloadOnce.textContent);
				$mx.runPreloadOnce.push(itemTemplateName);
			}

			//do preload JS job
			if (typeof(itemTemplatePreload) != 'undefined'){
				eval(itemTemplatePreload.textContent);
			}

			//render item
			if (typeof(itemTemplateHTML) != 'undefined'){
				if (renderingItemHTML != null){
					var itemReplacementHTML = itemTemplateHTML.textContent.replace(/\{\$html\}/gm,renderingItemHTML);
				}else{
					var itemReplacementHTML = itemTemplateHTML.textContent;
				}
				for (var attributeName in renderElementAttrs){
					var reg = new RegExp('\\\{\\\$' + attributeName + '\\\}','gm');
					itemReplacementHTML = itemReplacementHTML.replace(reg,renderElementAttrs[attributeName]);
				}
				renderElement.innerHTML = itemReplacementHTML;
			}

			//do callback-once JS job
			if (typeof(itemTemplateCallbackOnce) != 'undefined' && !inArray(itemTemplateName,$mx.runCallbackOnce)){
				eval(itemTemplateCallbackOnce.textContent);
				$mx.runCallbackOnce.push(itemTemplateName);
			}

			//do callback JS job
			if (typeof(itemTemplateCallback) != 'undefined'){
				eval(itemTemplateCallback.textContent);
			}

			renderElement.setAttribute('mx-render','true');

			$mx.renderItems(renderElement);
		}

		$mx.renderItems = function(renderElement,isRoot){
			if (typeof(renderElement) == 'object' && renderElement.hasOwnProperty('childNodes')){
				var childReplacers = renderElement.getElementsByTagName('item');
				if (typeof(childReplacers) == 'undefined'){
					return false;
				}
				if (childReplacers.length > 0){
					for (var i = 0;i < childReplacers.length;i++){
						$mx.renderItems(childReplacers[i],0);
					}
					return;
				}else{
					if (isRoot == 1){
						log('Can\'t find any item replacer in ' + renderElement);
						return false;
					}else{
						if (renderElement.nodeName == 'ITEM' && typeof(renderElement.attributes['mx-render']) == 'undefined'){
							$mx.renderItem(renderElement);
						}
					}
				}
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
	 * Useful Functions
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

	function inArray(item,container){
		for (var i = 0;i < container.length;i++){
			if (item == container[i]){
				return true;
			}
		}
		return false;
	}

	function elementAttributes(element){
		var elementAttrs = element.attributes,
			elementAttrsResult = {};

		for(var i = 0;i < elementAttrs.length;i++){
			elementAttrsResult[elementAttrs[i].name.toLowerCase()] = elementAttrs[i].value;
		}

		return elementAttrsResult;
	}