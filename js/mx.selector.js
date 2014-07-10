var $mx = $mx ? $mx : {};
/**
 * mxSelector v 0.1.0 Beta
 */
(function($mx){
	$mx.selector = function(query){
		var allElementsDo = function(job){
			var doType = typeof(job);
			switch(doType){
				case 'string':
					for (var i = 0;i < mxSelector.all.length;i++){
						if (typeof(mxSelector.all[i][job]) === 'function'){
							mxSelector.all[i][job](arguments);
						}
					}		
					break;
				case 'function':
					for (var i = 0;i < mxSelector.all.length;i++){
						$this = mxSelector.all[i];
						job($this);
					}
					break;
			}
		}

		var mxSelector = {};
		if (query && query.nodeName){
			mxSelector.first = query;
			mxSelector.all = [query];
		}else{
			mxSelector.first = query ? document.querySelectorAll(query)[0] : undefined;
			mxSelector.all = query ? document.querySelectorAll(query) : undefined;
		}
		mxSelector.call = function(methodName){
			allElementsDo(methodName);
		}
		mxSelector.show = function(){
			allElementsDo(function($this){
				$this.style.display = 'block';
			});
		}
		mxSelector.hide = function(){
			allElementsDo(function($this){
				$this.style.display = 'none';
			});
		}
		mxSelector.remove = function(){
			allElementsDo(function($this){
				$this.remove();
			});
		}
		mxSelector.append = function(element){
			if (!element.nodeName){
				var content = element;
				element = document.createElement('div');
				element.innerHTML = content;
			}
			allElementsDo(function($this){
				$this.appendChild(element.cloneNode(true));
			});
		}
		mxSelector.prepend = function(element){
			if (!element.nodeName){
				var content = element;
				element = document.createElement('div');
				element.innerHTML = content;
			}
			allElementsDo(function($this){
				$this.insertBefore(element.cloneNode(true),$this.childNodes[0]);
			});
		}
		mxSelector.before = function(element){
			if (!element.nodeName){
				var content = element;
				element = document.createElement('div');
				element.innerHTML = content;
			}
			allElementsDo(function($this){
				$this.parentNode.insertBefore(element.cloneNode(true),$this);
			});				
		}
		mxSelector.after = function(element){
			if (!element.nodeName){
				var content = element;
				element = document.createElement('div');
				element.innerHTML = content;
			}
			allElementsDo(function($this){
				$this.parentNode.appendChild(element.cloneNode(true),$this);
			});				
		}
		mxSelector.html = function(content){
			if (content){
				allElementsDo(function($this){
					$this.innerHTML = content;
				});
			}else{
				return mxSelector.first.innerHTML;
			}
		}
		mxSelector.class = function(classArray){
			if (classArray){
				allElementsDo(function($this){
					$this.className = classArray.join(' ');
				});
			}else{
				return mxSelector.first.className ? mxSelector.className.split(' ') : null;
			}
		}
		mxSelector.addClass = function(className){
			allElementsDo(function($this){
				var classArray = $this.className ? $this.className.split(' ') : [];
				if (classArray.indexOf(className) < 0){
					classArray.push(className);
					$this.className = classArray.join(' ');
				}
			});
		},
		mxSelector.removeClass = function(className){
			allElementsDo(function($this){
				var classArray = $this.className ? $this.className.split(' ') : [],
					i = classArray.indexOf(className);
				if (classArray.indexOf(className) > -1){
					classArray.splice(i,1);
					$this.className = classArray.join(' ');
					if (!$this.className){
						$this.removeAttribute('class');
					}
				}
			});
		},
		mxSelector[0] = mxSelector.first;
		if (mxSelector.first){
			return mxSelector;
		}else{
			return undefined;
		}
	}
})($mx)
var $$ = $$ ? $$ : $mx.selector,
	$ = $ ? $ : function(query){
		return $mx.selector(query) ? $mx.selector(query).first : undefined;
	};