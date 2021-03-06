(function($){
	// CLASS PROGRAMING IN JAVASCRIPT ES5
	SIAPER_L = new function(ARGS){
		// WE DEFINE THE STANDARD PROTOTYPE		
		// SETTINGS
		var _SETTINGS = {
			STATUS: false,
			STACK: [],
			CATEGORY:[],
			METADATA: {
				MAX_EMPLEADOS:0,
				MIN_EMPLEADOS:0
			},
			SCALE: ["#ffff00","#ffff00","#66ccff","#9966ff","#3366ff","#0000cc","#248f24","#cc0000","#0099cc","#006666","#993366"],
			DATA: {}
		};
		//DEPENDENCIES
		var _DEPENDENCIES = ["MAP","CARTOGRAPHY", "LAYERS"]
		// CONSTRUCTOR
		var _CONSTRUCTOR = function(){
			//ESPERAMOS LAS DEPENDENCIAS
			_AUX.WAIT_DEP(0, function(){
				MAP.wait_maps(_PRIVATE.INIT);
			});
		}
		// AUXILIARIA METHOD
		var _AUX = {
			WAIT_DEP: function(DEP,callback){
				if(typeof window[_DEPENDENCIES[DEP]] != "undefined"){
					if((DEP+1) == _DEPENDENCIES.length){
						callback();
					}
					else
					{
						_AUX.WAIT_DEP(++DEP,callback);
					}
				}
				else
				{
					setTimeout(function(){
						_AUX.WAIT_DEP(DEP,callback);
					},500);
				}
			},
			LOAD_DB: function(){
				$.getJSON('layers/siaper.json', function(data){
					_SETTINGS.DB = data;
					_AUX.LOADED_DB();
				});
			},
			LOADED_DB: function(){
				_SETTINGS.STATUS = true;
				for(i=0;i<_SETTINGS.STACK.length;i++){
					var callback = _SETTINGS.STACK[i];
					callback();
				}
			}
		};
		// PRIVATE METHODS
		var _PRIVATE = {
			INIT: function(){
				//CARGAMOS LA CARTOGRAFIA
				CARTOGRAPHY.cartography_load(function(){
					_SETTINGS.LAYERS = CARTOGRAPHY.get_layers("comunal");
					for(i=0; i<_SETTINGS.LAYERS.length;i++){
						if(typeof _SETTINGS.DATA[_SETTINGS.LAYERS[i].name] == "undefined"){
							_SETTINGS.DATA[_SETTINGS.LAYERS[i].name] = {
								ELEMENT: []
							};
						}
					}
					_AUX.LOAD_DB();
					// ESPERAMOS LA CARGA DE CARTOGRAFIA Y APLICAMOS EL ANALISIS
					_PUBLIC.DB_LOAD(_PRIVATE.ANALISIS);
				});
				
			},
			ANALISIS: function(){
				//PIVOTEAMOS LAS CATEGORIAS
				for(i=0;i<_SETTINGS.DB.length;i++){
					if(_SETTINGS.CATEGORY.indexOf(_SETTINGS.DB[i].TIPO) == -1) _SETTINGS.CATEGORY.push(_SETTINGS.DB[i].TIPO);
					if(typeof _SETTINGS.DATA[_SETTINGS.DB[i].COMUNA] != "undefined"){
						_SETTINGS.DATA[_SETTINGS.DB[i].COMUNA].ELEMENT.push({
							TIPO:_SETTINGS.DB[i].TIPO,
							CANTIDAD: _SETTINGS.DB[i].CANTIDAD
						});
					}
				}
				for(l=0;l<Object.keys(_SETTINGS.DATA).length;l++){
					var key = Object.keys(_SETTINGS.DATA)[l];
					var EMPLEADOS = 0;
					for(i=0;i<_SETTINGS.DATA[key].ELEMENT.length;i++){
						EMPLEADOS += parseInt(_SETTINGS.DATA[key].ELEMENT[i].CANTIDAD);
					}
					_SETTINGS.DATA[key].EMPLEADOS =EMPLEADOS;
					if(EMPLEADOS < _SETTINGS.METADATA.MIN_EMPLEADOS || _SETTINGS.METADATA.MIN_EMPLEADOS == 0) _SETTINGS.METADATA.MIN_EMPLEADOS = EMPLEADOS;
					if(EMPLEADOS > _SETTINGS.METADATA.MAX_EMPLEADOS || _SETTINGS.METADATA.MAX_EMPLEADOS == 0) _SETTINGS.METADATA.MAX_EMPLEADOS = EMPLEADOS;
				}
				_PRIVATE.MAKE();
			},
			MAKE: function(){

			}
		};
		//PUBLIC METHODS
		var _PUBLIC = {
			DB_LOAD: function(callback){
				if(!_SETTINGS.STATUS){
					_SETTINGS.STACK.push(callback);
				}
				else
				{
					callback();
				}
			},
			show: function(){
				for(num=0; num<_SETTINGS.LAYERS.length;num++){
					for(l=0; l<_SETTINGS.LAYERS[num].SPATIAL_OBJECT.length;l++){
						var call = function(num,l){
							_SETTINGS.LAYERS[num].LAYER_VIEW[l] = MAP.load_polygon(_SETTINGS.LAYERS[num].SPATIAL_OBJECT[l],{
								map:$("div[cartography]").attr("map-target"),
								rellenocolor: _SETTINGS.SCALE[Math.ceil((_SETTINGS.DATA[_SETTINGS.LAYERS[num].name].EMPLEADOS/ (_SETTINGS.METADATA.MAX_EMPLEADOS-_SETTINGS.METADATA.MIN_EMPLEADOS))*10)]
							});
							_SETTINGS.LAYERS[num].LAYER_VIEW[l].addListener('mouseover', function(e) {
								INFO.load(_SETTINGS.LAYERS[num].name+" - DISTRIBUCION EMPLEADOS", _SETTINGS.DATA[_SETTINGS.LAYERS[num].name].ELEMENT);
								$.each(e, function(key,value){
									console.log(key+"=>"+value);
								})
								if(typeof e.Ob != "undefined"){
									INFO.show(e.Ob.clientX, e.Ob.clientY);
								}
								else if(typeof e.Pb != "undefined"){
									INFO.show(e.Pb.clientX, e.Pb.clientY);
								} 
								
							});	
							_SETTINGS.LAYERS[num].LAYER_VIEW[l].addListener('mouseout', function(e) {
								INFO.hide();
							});	
						}
						call(num,l);			
					}
				}
				LEYENDA.load("Leyenda - Siaper Deciles de personal");
				LEYENDA.set(_SETTINGS.SCALE);
			},
			hide: function(){
				for(num=0; num<_SETTINGS.LAYERS.length;num++){
					for(l=0; l<_SETTINGS.LAYERS[num].SPATIAL_OBJECT.length;l++){
						_SETTINGS.LAYERS[num].LAYER_VIEW[l].setMap(null);
					}
				}
				LEYENDA.load("Leyenda - Sin capa de analisis");
				LEYENDA.clear();
			}
		};
		//CALL THE CONSTRUCTOR
		_CONSTRUCTOR(ARGS);
		//WE GENERATE THE INTERACTIONS
		for(key in _PUBLIC){
			this[key] = _PUBLIC[key];
		}
	};
})(jQuery);
