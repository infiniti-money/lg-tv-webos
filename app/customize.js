/* Designed by Tân Dev settings: ES5 for LG webOS 3.x / Chromium 38.
 * Local changes affect only launcher appearance and weather, not TV system settings.
 */
(function (root) {
  'use strict';
  var VISIBILITY_KEY = 'tvhome.visibility.v1';
  var APPEARANCE_KEY = 'tvhome.appearance.v1';
  var WEATHER_KEY = 'tvhome.weather.v1';
  var cache = {};
  var APP_STYLE_KEY = 'tvhome.appstyle.v1';
  var MAX_ICON = 48000, MAX_STYLE = 900000;
  var defaults = {
    theme:'midnight', font:'lexend', largeText:false, showWeek:true,
    reduceMotion:false, showSolar:true, showLunar:true, idleSeconds:60, idleRain:true, idleEffect:'rain'
  };
  var THEMES = ['midnight','ocean','amber'];
  var FONTS = ['lexend','sans','serif'];
  function safeRead(key) {
    var obj = null;
    try {
      if (typeof localStorage !== 'undefined') obj = JSON.parse(localStorage.getItem(key) || 'null');
    } catch (e) {}
    if (!obj && cache[key]) obj = cache[key];
    return obj && typeof obj === 'object' && !Array.isArray(obj) ? obj : {};
  }
  function safeWrite(key, data) {
    try { if (typeof localStorage !== 'undefined') localStorage.setItem(key, JSON.stringify(data)); }
    catch (e) { return false; }
    cache[key]=data;
    return true;
  }
  function validCoords(lat, lon) {
    return typeof lat === 'number' && isFinite(lat) && lat >= -90 && lat <= 90 &&
      typeof lon === 'number' && isFinite(lon) && lon >= -180 && lon <= 180;
  }
  function isProtected(id) {
    return id === 'com.infinitimoney.tvhome' || id === 'com.webos.app.livetv' ||
      /^com\.webos\.app\.hdmi[0-9]+$/.test(id || '');
  }
  // Hide only icons INSIDE Infiniti; never uninstall/disable LG packages.
  // Homebrew, Input Hook, external streaming apps, Live TV and inputs are
  // deliberately outside this preset. Users can individually restore icons.
  function isLGDefaultApp(id) {
    if (!id || isProtected(id)) return false;
    return /^com\.(webos|palm)\.app\./.test(id) ||
      /^com\.lge\./.test(id) ||
      id === 'tv.amasian.webos.vn1.channels';
  }
  function hideLGDefaultApps() {
    var apps = (root.TV_APPS && root.TV_APPS.apps) || [];
    var hidden = 0;
    apps.forEach(function (app) {
      if (app && isLGDefaultApp(app.id) && isVisible(app.id, (root.CONFIG || {}).hiddenApps)) {
        if (setVisible(app.id, false)) hidden++;
      }
    });
    return hidden;
  }
  function isVisible(id, hiddenDefaults) {
    if (isProtected(id)) return false;
    var map = safeRead(VISIBILITY_KEY);
    if (Object.prototype.hasOwnProperty.call(map, id) && typeof map[id] === 'boolean') return map[id];
    return (hiddenDefaults || []).indexOf(id) === -1;
  }
  function setVisible(id, visible) {
    if (!id || typeof id !== 'string' || id.length > 160 || isProtected(id)) return false;
    var map = safeRead(VISIBILITY_KEY), clean = {}, k, count = 0;
    for (k in map) {
      if (Object.prototype.hasOwnProperty.call(map, k) &&
          typeof map[k] === 'boolean' && count < 250) { clean[k] = map[k]; count++; }
    }
    clean[id] = !!visible;
    return safeWrite(VISIBILITY_KEY, clean);
  }
  function resetVisible() { safeWrite(VISIBILITY_KEY, {}); }
  var IDLE_CHOICES=[0,30,60,120,300];
  var IDLE_EFFECTS=["rain","snow","petals","stars","fireflies","bubbles","mist","leaves","sparkles","meteor","aurora","embers","waves","hearts","random","random-light"];
  var IDLE_LABELS=["Mưa rơi","Tuyết rơi","Cánh hoa","Bầu trời sao","Đom đóm","Bong bóng","Sương mờ","Lá bay","Ánh kim","Sao băng","Cực quang","Tàn lửa","Sóng ánh sáng","Trái tim","Ngẫu nhiên","Ngẫu nhiên nhẹ"];
  function idleEffectValue(v){return IDLE_EFFECTS.indexOf(v)>=0?v:defaults.idleEffect;}
  function resolveIdleEffect(p,random){
    if(!p.idleRain||p.reduceMotion)return '';
    var effect=idleEffectValue(p.idleEffect);
    if(effect!=='random'&&effect!=='random-light')return effect;
    var n=Number(random);
    if(!isFinite(n)||n<0||n>=1)n=0;
    var pool=effect==='random-light'?['snow','petals','stars','mist','leaves','sparkles']:IDLE_EFFECTS.slice(0,14);return pool[Math.floor(n*pool.length)];
  }
  function idleValue(v){return IDLE_CHOICES.indexOf(v)>=0?v:defaults.idleSeconds;}
  function getAppearance() {
    var data = safeRead(APPEARANCE_KEY);
    return {
      theme: THEMES.indexOf(data.theme) < 0 ? defaults.theme : data.theme,
      font: FONTS.indexOf(data.font) < 0 ? defaults.font : data.font,
      largeText: data.largeText === true,
      showWeek: data.showWeek !== false,
      reduceMotion: data.reduceMotion === true,
      showSolar: data.showSolar !== false,
      showLunar: data.showLunar !== false,
      idleSeconds:idleValue(data.idleSeconds), idleRain:data.idleRain!==false, idleEffect:idleEffectValue(data.idleEffect)
    };
  }
  function saveAppearance(newData) {
    var current = getAppearance(), key;
    for (key in newData || {}) {
      if (Object.prototype.hasOwnProperty.call(newData, key)) current[key] = newData[key];
    }
    current.theme = THEMES.indexOf(current.theme) < 0 ? defaults.theme : current.theme;
    current.font = FONTS.indexOf(current.font) < 0 ? defaults.font : current.font;
    current.largeText = current.largeText === true;
    current.showWeek = current.showWeek !== false;
    current.reduceMotion = current.reduceMotion === true;
    current.showSolar = current.showSolar !== false;
    current.showLunar = current.showLunar !== false;
    current.idleSeconds=idleValue(current.idleSeconds);current.idleRain=current.idleRain!==false;current.idleEffect=idleEffectValue(current.idleEffect);
    safeWrite(APPEARANCE_KEY, current);
    return current;
  }
  function getWeather() {
    var saved = safeRead(WEATHER_KEY);
    var original = (root.CONFIG || {}).weather || {};
    var selected = typeof saved.enabled === 'boolean' ? saved : original;
    var lat = Number(selected.latitude), lon = Number(selected.longitude);
    return {
      enabled: selected.enabled === true && validCoords(lat, lon),
      latitude: validCoords(lat, lon) ? lat : 0,
      longitude: validCoords(lat, lon) ? lon : 0,
      place: typeof selected.place === 'string' ? selected.place.slice(0, 90) : '',
      unit: selected.unit === 'fahrenheit' ? 'fahrenheit' : 'celsius'
    };
  }
  function saveWeather(newData) {
    var current = getWeather(), key;
    for (key in newData || {}) {
      if (Object.prototype.hasOwnProperty.call(newData, key)) current[key] = newData[key];
    }
    var lat = Number(current.latitude), lon = Number(current.longitude);
    if (!validCoords(lat, lon)) return false;
    current.latitude = lat;
    current.longitude = lon;
    current.place = String(current.place || '').slice(0, 90);
    current.enabled = current.enabled === true;
    current.unit = current.unit === 'fahrenheit' ? 'fahrenheit' : 'celsius';
    return safeWrite(WEATHER_KEY,current)?current:false;
  }
  function validAppId(id) {
    return typeof id === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,159}$/.test(id) &&
      id !== 'constructor' && id !== 'prototype' && !isProtected(id);
  }
  var PACKS=['minimal','neon','glass','pastel','gold'];
  var GLYPHS=['video','music','web','tv','game','settings','home','photo','apps','youtube','netflix','prime','disney','tiktok','jellyfin','spotify','radio','hdmi','store','files','network'];
  var GLYPH_NAMES=['Video','Nhạc','Web','TV','Game','Cài đặt','Home','Ảnh','Ứng dụng',"YouTube","Netflix","Prime Video","Disney+","TikTok","Jellyfin","Spotify","Radio","HDMI","Cửa hàng","Tệp / USB","Mạng"];
  function iconCategory(app) {
    var s=String(app.id||'')+' '+String(app.title||'');
    if(/youtube/i.test(s))return 'youtube';
    if(/netflix/i.test(s))return 'netflix';
    if(/prime.video|amazon|primevideo/i.test(s))return 'prime';
    if(/disney/i.test(s))return 'disney';
    if(/tiktok/i.test(s))return 'tiktok';
    if(/jellyfin/i.test(s))return 'jellyfin';
    if(/spotify/i.test(s))return 'spotify';
    if(/radio/i.test(s))return 'radio';
    if(/hdmi/i.test(s))return 'hdmi';
    if(/contentstore|content.store|app.store|cửa hàng/i.test(s))return 'store';
    if(/file.manager|usb|tệp/i.test(s))return 'files';
    if(/network|wifi|wi-fi|kết nối mạng/i.test(s))return 'network';
    if(/video|kodi|plex|hbo/i.test(s))return 'video';
    if(/music|soundcloud|nhạc/i.test(s))return 'music';
    if(/browser|chromium|trình duyệt|web browser/i.test(s))return 'web';
    if(/game|gaming|trò chơi/i.test(s))return 'game';
    if(/setting|cài đặt/i.test(s))return 'settings';
    if(/photo|gallery|hình ảnh|album/i.test(s))return 'photo';
    if(/homebrew|launcher|home channel/i.test(s))return 'home';
    if(/livetv|channels|truyền hình|television/i.test(s))return 'tv';
    return 'apps';
  }
  function packIcon(pack,glyph) {
    return PACKS.indexOf(pack)>=0 && GLYPHS.indexOf(glyph)>=0 ? 'pack:'+pack+':'+glyph : '';
  }
  function iconSource(icon,original) {
    if(icon==='original')return original||'';
    var p=typeof icon==='string'?icon.split(':'):[];
    if(p.length===3 && p[0]==='pack' && packIcon(p[1],p[2]))return 'icons/packs/'+p[1]+'-'+p[2]+'.svg';
    return validIcon(icon)?icon:original||'';
  }
  function getIconPack(){
    var p=safeRead('tvhome.iconpack.v1').pack;
    return PACKS.indexOf(p)>=0?p:'original';
  }
  function setIconPack(p){
    if(p!=='original' && PACKS.indexOf(p)<0)return false;
    return safeWrite('tvhome.iconpack.v1',{pack:p});
  }
  function validIcon(icon) {
    if(icon==='original')return true;
    if(typeof icon==='string' && /^pack:/.test(icon)){var p=icon.split(':');return p.length===3 && !!packIcon(p[1],p[2]);}
    return typeof icon === 'string' && icon.length <= MAX_ICON &&
      /^data:image\/(?:png|jpeg);base64,[A-Za-z0-9+/]+={0,2}$/.test(icon);
  }
  function readAppStyle(map,id) {
    var v = validAppId(id) && Object.prototype.hasOwnProperty.call(map,id) ? map[id] : null;
    return {title:v && typeof v.title==='string' ? v.title.slice(0,48) : '',
      icon:v && validIcon(v.icon) ? v.icon : ''};
  }
  function getAppStyle(id) { return readAppStyle(safeRead(APP_STYLE_KEY),id); }
  function saveAppStyle(id, title, icon) {
    if (!validAppId(id) || typeof title !== 'string' || typeof icon !== 'string' ||
        (icon && !validIcon(icon))) return false;
    title = title.replace(/[\x00-\x1f\x7f]/g,' ').replace(/^\s+|\s+$/g,'').slice(0,48);
    var old = safeRead(APP_STYLE_KEY), map = {}, count = 0;
    Object.keys(old).forEach(function(k) {
      if (k !== id && validAppId(k) && count < 250) {
        var v = readAppStyle(old,k);
        if (v.title || v.icon) { map[k]=v; count++; }
      }
    });
    if (title || icon) {
      if (count >= 250) return false;
      map[id] = {title:title,icon:icon};
    }
    var serialized = JSON.stringify(map);
    if (serialized.length > MAX_STYLE) return false;
    try {
      if (typeof localStorage !== 'undefined') localStorage.setItem(APP_STYLE_KEY,serialized);
    } catch(e) { return false; }
    cache[APP_STYLE_KEY]=map;
    return true;
  }
  function getPinned(){var v=safeRead('tvhome.pinned.v1').ids;return Array.isArray(v)?v.filter(validAppId).slice(0,250):[];}
  function setPinned(id,on){if(!validAppId(id))return false;var list=getPinned().filter(function(x){return x!==id;});if(on)list.unshift(id);return safeWrite('tvhome.pinned.v1',{ids:list});}
  function getRecent(){var v=safeRead('tvhome.recent.v1').ids;return Array.isArray(v)?v.filter(validAppId).slice(0,20):[];}
  function recordRecent(id){if(!validAppId(id))return false;var ids=getRecent().filter(function(x){return x!==id;});ids.unshift(id);return safeWrite('tvhome.recent.v1',{ids:ids.slice(0,20)});}
  function matchesApp(app,query){var s=styledApp(app);query=String(query||'').toLowerCase().trim();return !query||String(s.title||'').toLowerCase().indexOf(query)>=0||String(app.title||'').toLowerCase().indexOf(query)>=0||String(app.id||'').toLowerCase().indexOf(query)>=0;}
  function styledApp(app) {
    var style = getAppStyle(app.id), out = {};
    Object.keys(app).forEach(function(k){out[k]=app[k];});
    out.title = style.title || app.title || app.id;
    out.originalIcon = app.icon || '';
    var pack=getIconPack();
    out.icon=iconSource(style.icon || (pack==='original'?'':packIcon(pack,iconCategory(app))),app.icon);
    return out;
  }
  function directionalIndex(rects,index,code) {
    if(index<0 || !rects[index])return 0;
    var r=rects[index],x=(r.left+r.right)/2,y=(r.top+r.bottom)/2;
    var best=-1,score=Infinity,vertical=code===38||code===40;
    for(var j=0;j<rects.length;j++){
      if(j===index || !rects[j])continue;
      var b=rects[j],dx=(b.left+b.right)/2-x,dy=(b.top+b.bottom)/2-y;
      var primary=vertical?dy:dx,side=vertical?Math.abs(dx):Math.abs(dy);
      if(code===37||code===38)primary=-primary;
      if(primary<=3)continue;
      var overlap=vertical?Math.min(r.right,b.right)-Math.max(r.left,b.left):Math.min(r.bottom,b.bottom)-Math.max(r.top,b.top);
      var cost=primary+side*(overlap>0?0.25:3)+(overlap>0?0:120);
      if(cost<score){score=cost;best=j;}
    }
    return best;
  }
  var api = {
    directionalIndex:directionalIndex,
    getAppStyle:getAppStyle, saveAppStyle:saveAppStyle, styledApp:styledApp,getPinned:getPinned,setPinned:setPinned,getRecent:getRecent,recordRecent:recordRecent,matchesApp:matchesApp,
    iconCategory:iconCategory,packIcon:packIcon,iconSource:iconSource,getIconPack:getIconPack,setIconPack:setIconPack,
    isVisible:isVisible, setVisible:setVisible, resetVisible:resetVisible,
    getAppearance:getAppearance, saveAppearance:saveAppearance, resolveIdleEffect:resolveIdleEffect,
    getWeather:getWeather, saveWeather:saveWeather,
    validCoords:validCoords, isProtected:isProtected,
    isLGDefaultApp:isLGDefaultApp, hideLGDefaultApps:hideLGDefaultApps
  };
  root.INFINITI_PREFS = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof document === 'undefined') return;

  var $ = function (id) { return document.getElementById(id); };
  var panel = $('customizePanel');
  if (!panel) return;
  var tabs = {
    apps:$('customizeAppsTab'), style:$('customizeStyleTab'),
    weather:$('customizeWeatherTab'), calendar:$('customizeCalendarTab'),
    privacy:$('customizePrivacyTab'), wallpaper:$('customizeWallpaperTab'), idle:$('customizeIdleTab'), album:$('customizeAlbumTab')
  };
  var views = {
    apps:$('customizeAppsView'), style:$('customizeStyleView'),
    weather:$('customizeWeatherView'), calendar:$('customizeCalendarView'),
    privacy:$('customizePrivacyView'), wallpaper:$('customizeWallpaperView'), idle:$('customizeIdleView'), album:$('customizeAlbumView')
  };
  var appsList = $('customizeAppList'), themeBox = $('customizeThemes');
  var fontBox = $('customizeFonts'), status = $('customizeStatus');
  var opened = false, activeTab = 'style', searchRequest = null;
  var appPage=0, glyphPage=0, currentGlyphPack='minimal', APP_PAGE_SIZE=4, GLYPH_PAGE_SIZE=6;
  var appFilter=0,appSort=0;

  function applyAppearance() {
    var a = getAppearance(), body = document.body;
    ['theme-ocean','theme-amber','font-sans','font-serif','font-large',
      'forecast-hidden','motion-reduced','solar-hidden','lunar-hidden'].forEach(function (name) {
      body.classList.remove(name);
    });
    if (a.theme !== 'midnight') body.classList.add('theme-' + a.theme);
    if (a.font !== 'lexend') body.classList.add('font-' + a.font);
    if (a.largeText) body.classList.add('font-large');
    if (!a.showWeek) body.classList.add('forecast-hidden');
    if (a.reduceMotion) body.classList.add('motion-reduced');
    if (!a.showSolar) body.classList.add('solar-hidden');
    if (!a.showLunar) body.classList.add('lunar-hidden');
    else if (root.INFINITI_LUNAR && root.INFINITI_LUNAR.render) root.INFINITI_LUNAR.render();
    if(typeof root.INFINITI_IDLE_REFRESH==='function')root.INFINITI_IDLE_REFRESH();
    if (typeof root.INFINITI_LAUNCHER_LAYOUT_REFRESH === 'function')
      root.INFINITI_LAUNCHER_LAYOUT_REFRESH();
  }
  function message(v) { status.textContent = v || ''; }
  function refreshLauncher() {
    if (typeof root.INFINITI_LAUNCHER_REFRESH === 'function') root.INFINITI_LAUNCHER_REFRESH();
  }
  function addButton(parent, label, onClick, selected) {
    var button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    if (selected) button.className = 'selected';
    button.addEventListener('click', onClick);
    parent.appendChild(button);
    return button;
  }
  var editingApp = null, pendingIcon = '', uploadSequence = 0, iconBusy = false;
  function closeAppEditor() {
    uploadSequence++; iconBusy=false; editingApp=null; pendingIcon='';
    $('customizeAppEditor').classList.add('hidden');
    $('customizeAppList').classList.remove('hidden');
    $('customizeAppBrowse').classList.remove('hidden');
    $('customizeAppOptions').classList.remove('hidden');
    $('customizeResetApps').classList.remove('hidden');
    $('customizeAppFile').value='';
  }
  function previewAppIcon() {
    if (!editingApp) return;
    var pack=getIconPack();
    $('customizeAppPreview').src = iconSource(pendingIcon || (pack==='original'?'':packIcon(pack,iconCategory(editingApp))),editingApp.icon);
  }
  function openAppEditor(app) {
    var style=getAppStyle(app.id);
    uploadSequence++; iconBusy=false; editingApp=app; pendingIcon=style.icon;
    glyphPage=0;
    $('customizeAppPin').textContent=getPinned().indexOf(app.id)>=0?'Bỏ ghim':'Ghim đầu Home';
    $('customizeAppEditorTitle').textContent='Tùy chỉnh: '+(app.title || app.id);
    $('customizeAppName').value=style.title || app.title || app.id;
    $('customizeAppFile').value='';
    $('customizeAppList').classList.add('hidden');
    $('customizeAppBrowse').classList.add('hidden');
    $('customizeAppOptions').classList.add('hidden');
    $('customizeResetApps').classList.add('hidden');
    $('customizeAppEditor').classList.remove('hidden');
    previewAppIcon();
    renderIconChoices();
    $('customizeAppName').focus();
  }
  function applyAppEditor(reset) {
    if (!editingApp) return;
    if (iconBusy && !reset) { message('Đang xử lý ảnh, chưa thể lưu.'); return; }
    var id=editingApp.id;
    var title=reset?'':String($('customizeAppName').value || '').replace(/^\s+|\s+$/g,'').slice(0,48);
    if (!reset && title===editingApp.title) title='';
    if (!saveAppStyle(id,title,reset?(getIconPack()==='original'?'':'original'):pendingIcon)) {
      message('Không lưu được. Bộ nhớ có thể đã đầy; hãy thử ảnh nhỏ hơn.'); return;
    }
    closeAppEditor(); refreshLauncher(); renderApps();
    tabs.apps.focus();
    message(reset?'Đã khôi phục tên và icon gốc.':'Đã lưu tên và icon trong Launcher.');
  }
  function renderIconChoices(){
    var box=$('customizeAppPackChoices');box.innerHTML='';
    PACKS.forEach(function(pack){
      var btn=addButton(box,pack.charAt(0).toUpperCase()+pack.slice(1),function(){
        uploadSequence++;iconBusy=false;pendingIcon=packIcon(pack,iconCategory(editingApp));
        previewAppIcon();glyphPage=0;renderGlyphChoices(pack);
        message('Đã chọn bộ icon '+pack+'. Có thể chọn biểu tượng khác bên dưới.');
      },false);
    });
    renderGlyphChoices(getIconPack()==='original'?'minimal':getIconPack());
  }
  function renderGlyphChoices(pack){
    var box=$('customizeAppGlyphChoices');box.innerHTML='';
    currentGlyphPack=pack;
    var pages=Math.max(1,Math.ceil(GLYPHS.length/GLYPH_PAGE_SIZE));
    glyphPage=Math.max(0,Math.min(glyphPage,pages-1));
    $('customizeGlyphPage').textContent='Trang '+(glyphPage+1)+' / '+pages;
    $('customizeGlyphPrev').disabled=glyphPage===0;
    $('customizeGlyphNext').disabled=glyphPage>=pages-1;
    GLYPHS.slice(glyphPage*GLYPH_PAGE_SIZE,(glyphPage+1)*GLYPH_PAGE_SIZE).forEach(function(g){
      var btn=addButton(box,GLYPH_NAMES[GLYPHS.indexOf(g)],function(){
        uploadSequence++;iconBusy=false;pendingIcon=packIcon(pack,g);previewAppIcon();
      },false);
      var img=document.createElement('img');img.src=iconSource(packIcon(pack,g),'');img.alt='';btn.appendChild(img);
    });
  }
  function renderGlobalPacks(){
    var box=$('customizeGlobalPacks');box.innerHTML='';
    ['original'].concat(PACKS).forEach(function(p){
      var btn=addButton(box,p==='original'?'Gốc':p.charAt(0).toUpperCase()+p.slice(1),function(){
        if(!setIconPack(p)){message('Không lưu được bộ icon.');return;}
        refreshLauncher();renderApps();renderGlobalPacks();
        var buttons=box.querySelectorAll('button');var index=['original'].concat(PACKS).indexOf(p);
        if(buttons[index])buttons[index].focus();
        message('Đã áp dụng bộ icon. Icon riêng từng app vẫn được giữ.');
      },getIconPack()===p);
    });
  }
  function makeColorIcon(color) {
    if (!editingApp) return;
    uploadSequence++;iconBusy=false;
    try {
      var canvas=document.createElement('canvas');canvas.width=256;canvas.height=144;
      var ctx=canvas.getContext('2d');
      ctx.fillStyle=color;ctx.fillRect(0,0,256,144);
      ctx.fillStyle='#fff';ctx.font='bold 78px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
      var name=String($('customizeAppName').value || editingApp.title || editingApp.id).replace(/^\s+/,'');
      ctx.fillText(name.slice(0,1).toUpperCase() || '?',128,76);
      var result=canvas.toDataURL('image/png');
      if(!validIcon(result)) throw new Error('invalid icon');
      pendingIcon=result;previewAppIcon();message('Đã chọn icon màu; nhấn Lưu để áp dụng.');
    }catch(e){message('TV không tạo được icon màu.');}
  }
  function importAppIcon(file) {
    if (!editingApp || !file) return;
    if (file.size>8*1024*1024 || !/^image\/(?:png|jpeg|webp)$/i.test(file.type || '')) {
      message('Chọn ảnh JPG, PNG hoặc WebP dưới 8 MB.');return;
    }
    if (!root.FileReader || !root.Image) {message('TV không hỗ trợ chọn ảnh; dùng icon màu.');return;}
    var seq=++uploadSequence, reader=new root.FileReader();
    iconBusy=true;message('Đang xử lý icon…');
    function fail(){if(seq===uploadSequence){iconBusy=false;message('Không đọc được ảnh. Thử JPG/PNG hoặc icon màu.');}}
    reader.onerror=reader.onabort=fail;
    reader.onload=function(){
      if(seq!==uploadSequence || !editingApp)return;
      var img=new root.Image();
      img.onerror=fail;
      img.onload=function(){
        if(seq!==uploadSequence || !editingApp)return;
        try{
          if(!img.width || !img.height || img.width*img.height>24000000)throw new Error('image too large');
          var canvas=document.createElement('canvas');canvas.width=256;canvas.height=144;
          var ctx=canvas.getContext('2d'), scale=Math.min(256/img.width,144/img.height);
          ctx.fillStyle='#202b3b';ctx.fillRect(0,0,256,144);
          var w=img.width*scale,h=img.height*scale;
          ctx.drawImage(img,(256-w)/2,(144-h)/2,w,h);
          var data=canvas.toDataURL('image/jpeg',0.82);
          if(!validIcon(data))throw new Error('icon too large');
          pendingIcon=data;iconBusy=false;previewAppIcon();message('Ảnh sẵn sàng. Nhấn Lưu để áp dụng.');
        }catch(e){fail();}
      };
      img.src=reader.result;
    };
    try{reader.readAsDataURL(file);}catch(e){fail();}
  }
  function renderApps() {
    appsList.innerHTML = '';
    var all = (root.TV_APPS && root.TV_APPS.apps) || [], installed = [];
    all.forEach(function (app) {
      if (app && app.id && !isProtected(app.id)) installed.push(app);
    });
    var pins=getPinned(),recent=getRecent(),query=$('customizeAppSearch').value,shown=installed.filter(function(app){return isVisible(app.id,(root.CONFIG||{}).hiddenApps);}).length;
    $('customizeAppSummary').textContent=installed.length+' ứng dụng · '+shown+' hiện · '+(installed.length-shown)+' ẩn';
    $('customizeAppFilter').textContent='Lọc: '+['Tất cả','Đang hiện','Đang ẩn','Đã ghim','Gần đây'][appFilter];
    $('customizeAppSort').textContent='Sắp xếp: '+['A–Z','Z–A','Đã ghim trước'][appSort];
    installed=installed.filter(function(app){var v=isVisible(app.id,(root.CONFIG||{}).hiddenApps);return matchesApp(app,query)&&(appFilter===0||(appFilter===1&&v)||(appFilter===2&&!v)||(appFilter===3&&pins.indexOf(app.id)>=0)||(appFilter===4&&recent.indexOf(app.id)>=0));});
    installed.sort(function (a, b) {
      if(appFilter===4)return recent.indexOf(a.id)-recent.indexOf(b.id);
      if(appSort===2){var pa=pins.indexOf(a.id),pb=pins.indexOf(b.id);if(pa!==pb){if(pa<0)return 1;if(pb<0)return -1;return pa-pb;}}
      var aa = String(a.title || a.id).toLowerCase();
      var bb = String(b.title || b.id).toLowerCase();
      return (aa < bb ? -1 : aa > bb ? 1 : 0)*(appSort===1?-1:1);
    });
    var pages=Math.max(1,Math.ceil(installed.length/APP_PAGE_SIZE));
    appPage=Math.max(0,Math.min(appPage,pages-1));
    $('customizeAppPage').textContent='Trang '+(appPage+1)+' / '+pages+' · '+installed.length+' ứng dụng';
    $('customizeAppPrev').disabled=appPage===0;
    $('customizeAppNext').disabled=appPage>=pages-1;
    if (!installed.length) {
      var empty = document.createElement('p');
      empty.textContent = query||appFilter?'Không có ứng dụng phù hợp.':'Chưa có danh sách ứng dụng. Chạy đồng bộ ứng dụng trên TV.';
      appsList.appendChild(empty);
      return;
    }
    installed.slice(appPage*APP_PAGE_SIZE,(appPage+1)*APP_PAGE_SIZE).forEach(function (app) {
      var row = document.createElement('div');
      row.className = 'customizeApp';
      var name = document.createElement('span');
      var styled=styledApp(app);
      var thumb=document.createElement('img');thumb.className='customizeAppThumb';thumb.src=styled.icon || '';row.appendChild(thumb);
      name.textContent = String(styled.title || app.id);
      name.title = app.id;
      row.appendChild(name);
      var visible = isVisible(app.id, (root.CONFIG || {}).hiddenApps);
      var toggle = addButton(row, visible ? 'Ẩn khỏi Home' : 'Thêm vào Home', function () {
        if (!setVisible(app.id, !visible)) { message('Không thể thay đổi ứng dụng hệ thống.'); return; }
        visible = !visible;
        toggle.textContent = visible ? 'Ẩn khỏi Home' : 'Thêm vào Home';
        toggle.className = visible ? 'selected' : '';
        refreshLauncher();
        message((visible ? 'Đã thêm: ' : 'Đã ẩn: ') + (app.title || app.id));
      }, visible);
      toggle.setAttribute('aria-label', (visible ? 'Ẩn ' : 'Thêm ') + (app.title || app.id));
      addButton(row,'Sửa tên / icon',function(){openAppEditor(app);},false);
      appsList.appendChild(row);
    });
  }
  function renderWallpaperQR() {
    var code = $('customizeWallQr'), state = $('customizeWallState');
    var host = $('customizeWallHost');
    if (!code || !state || !host) return;
    code.innerHTML = '';
    host.textContent = '';
    state.textContent = 'Đang lấy địa chỉ dịch vụ hình nền…';
    if (typeof root.INFINITI_WALLPAPER_GET_URL !== 'function') {
      state.textContent = 'Dịch vụ hình nền chưa sẵn sàng. Mở lại Tùy chỉnh.';
      return;
    }
    root.INFINITI_WALLPAPER_GET_URL(function (url,mdnsState) {
      // The QR links to a TV-local, secret-authenticated phone service.
      // Only display a valid local IP:9090 URL written by the root helper.
      if (!/^http:\/\/(?:[0-9]{1,3}\.){3}[0-9]{1,3}:9090\/\?k=[A-Za-z0-9_-]{8,64}$/.test(url || '')) {
        state.textContent = 'Chưa có địa chỉ dịch vụ hình nền. Qua SSH chạy legacy-home.sh wallpaper-on, sau đó bấm Lấy mã QR lại.';
        return;
      }
      try {
        var qr = qrcode(0, 'M');
        qr.addData(url);
        qr.make();
        code.innerHTML = '<img alt="Quét để đổi hình nền" src="' + qr.createDataURL(6, 24) + '">';
        state.textContent = 'Quét QR hoặc mở địa chỉ bên dưới và nhập khóa riêng để chỉnh TV.';
        host.textContent = (mdnsState==='ready'?'http://tan-dev.local:9090/ · ':'')+url.split('?')[0];
        if(mdnsState==='conflict')state.textContent+=' Tên tan-dev.local đã được dùng; hãy truy cập IP.';
      } catch (err) {
        state.textContent = 'Không tạo được mã QR. Hãy kiểm tra bộ cài và thử lại.';
      }
    });
  }
  function renderStyle() {
    var a = getAppearance();
    themeBox.innerHTML = '';
    fontBox.innerHTML = '';
    [
      ['midnight','Đêm đen'],['ocean','Đại dương'],['amber','Ánh vàng']
    ].forEach(function (entry) {
      var button = addButton(themeBox, entry[1], function () {
        saveAppearance({theme:entry[0]});
        applyAppearance();
        markChoice(themeBox, button);
        message('Đã đổi chủ đề: ' + entry[1]);
      }, a.theme === entry[0]);
    });
    [
      ['lexend','Lexend tiếng Việt'],['sans','Arial'],['serif','Georgia']
    ].forEach(function (entry) {
      var button = addButton(fontBox, entry[1], function () {
        saveAppearance({font:entry[0]});
        applyAppearance();
        markChoice(fontBox, button);
        message('Đã đổi phông chữ: ' + entry[1]);
      }, a.font === entry[0]);
    });
    refreshToggles();
  }
  function markChoice(parent, selected) {
    var list = parent.querySelectorAll('button');
    for (var i=0; i<list.length; i++) list[i].className = list[i] === selected ? 'selected' : '';
  }
  function renderIdle(){var a=getAppearance(),box=$('customizeIdleChoices');box.innerHTML='';IDLE_EFFECTS.forEach(function(e,i){var b=addButton(box,IDLE_LABELS[i],function(){saveAppearance({idleEffect:e});applyAppearance();refreshToggles();markChoice(box,b);},a.idleEffect===e);});refreshToggles();}
  var albumReadSeq=0,albumData=null,albumSelected='',albumDeleteId='',albumDeleteAt=0,albumBusy=false;
  var albumTimes=[0,15,20,30,60,120,300,600,1800,3600,7200,21600,43200,86400,172800,604800];
  function albumTime(t){return t===0?'Mỗi lần bật TV':t>=86400?(t/86400)+' ngày':t>=3600?(t/3600)+' giờ':t+' giây';}
  function albumControls(){
    var p=albumData,ids=p?p.photos:[],i=ids.indexOf(albumSelected),ready=!!(p&&/^[a-f0-9]{48}$/.test(p.localToken||''))&&!albumBusy;
    var thumb=$('customizeAlbumSelectedPhoto');if(i>=0){var src='idle-photo-'+albumSelected+'.jpg';if(thumb.getAttribute('src')!==src)thumb.setAttribute('src',src);thumb.style.display='block';}else{thumb.removeAttribute('src');thumb.style.display='none';}
    $('customizeAlbumSelect').textContent=i<0?'Chọn ảnh':'Ảnh '+(i+1)+'/'+ids.length;
    $('customizeAlbumEnabled').textContent='Album: '+(p?(p.enabled?'Bật':'Tắt'):'—');
    $('customizeAlbumSeconds').textContent='Lịch: '+(p?albumTime(p.seconds):'—');
    $('customizeAlbumRandom').textContent='Thứ tự: '+(p?(p.random?'Ngẫu nhiên':'Tuần tự'):'—');
    $('customizeAlbumIntensity').textContent='Cường độ: '+(p?(p.intensity==='medium'?'Vừa':'Nhẹ'):'—');
    $('customizeAlbumDelete').textContent=albumDeleteId===albumSelected&&albumSelected&&Date.now()-albumDeleteAt<10000?'Xác nhận xóa':'Xóa ảnh';
    ['customizeAlbumEnabled','customizeAlbumSeconds','customizeAlbumRandom','customizeAlbumIntensity'].forEach(function(k){$(k).disabled=!ready;});
    $('customizeAlbumSelect').disabled=albumBusy||!ids.length;
    $('customizeAlbumUp').disabled=!ready||i<=0;
    $('customizeAlbumDown').disabled=!ready||i<0||i>=ids.length-1;
    $('customizeAlbumDelete').disabled=!ready||i<0;
  }
  function renderAlbumState(){var target=$('customizeAlbumState'),n=++albumReadSeq,sc=document.createElement('script'),done=false,timer;albumData=null;albumDeleteId='';albumControls();target.textContent='Đang đọc album…';function finish(ok){if(done)return;done=true;clearTimeout(timer);if(sc.parentNode)sc.parentNode.removeChild(sc);if(n!==albumReadSeq||!opened||activeTab!=='album')return;var p=ok?root.INFINITI_IDLE_ALBUM:null;if(!p||!Array.isArray(p.photos)){target.textContent='Chưa có album đồng bộ. Bật dịch vụ web và tải ảnh.';return;}p.photos=p.photos.filter(function(id){return typeof id==='string'&&/^[a-f0-9]{24}$/.test(id);}).slice(0,20);albumData=p;if(p.photos.indexOf(albumSelected)<0)albumSelected=p.photos[0]||'';target.textContent=(p.enabled?'Đang bật':'Đang tắt')+' · '+p.photos.length+' ảnh · '+albumTime(p.seconds)+' · '+(p.random?'Ngẫu nhiên':'Tuần tự');albumControls();}
    sc.onload=function(){finish(true);};sc.onerror=function(){finish(false);};sc.src='idle-album.js?t='+Date.now();timer=setTimeout(function(){finish(false);},4000);document.body.appendChild(sc);}
  function albumAction(v){
    if(albumBusy||!albumData||!/^[a-f0-9]{48}$/.test(albumData.localToken||''))return;
    v.token=albumData.localToken;albumBusy=true;albumDeleteId='';albumControls();
    var x=new XMLHttpRequest(),done=false;
    function finish(ok,published){if(done)return;done=true;albumBusy=false;if(opened&&activeTab==='album'){message(ok?(published?'Đã lưu và đồng bộ album.':'Đã lưu, đang chờ đồng bộ album.'):'Không thể lưu album. Hãy đọc lại hoặc kiểm tra Root Tools.');renderAlbumState();}}
    try{x.open('POST','http://127.0.0.1:9090/api/album-local',true);x.timeout=5000;x.setRequestHeader('Content-Type','text/plain;charset=UTF-8');x.onload=function(){var v;try{v=JSON.parse(x.responseText);}catch(e){}finish(x.status===200&&v&&v.ok===true,v&&v.published);};x.onerror=x.ontimeout=function(){finish(false);};x.send(JSON.stringify(v));}catch(e){finish(false);}
  }
  function albumSetting(k,v){albumAction({action:'settings',field:k,value:v});}
  function refreshToggles() {
    var a = getAppearance();
    $('customizeIdleTime').textContent='Tự ẩn: '+(a.idleSeconds?a.idleSeconds+' giây':'Tắt');
    $('customizeIdleRain').textContent='Hiệu ứng: '+(a.idleRain?'Bật':'Tắt');
    $('customizeIdleEffect').textContent='Kiểu: '+IDLE_LABELS[IDLE_EFFECTS.indexOf(a.idleEffect)];
    $('customizeLargeText').textContent = 'Cỡ chữ lớn: ' + (a.largeText ? 'Bật' : 'Tắt');
    $('customizeShowWeek').textContent = 'Thời tiết 3 ngày: ' + (a.showWeek ? 'Hiện' : 'Ẩn');
    $('customizeMotion').textContent = 'Hiệu ứng chuyển động: ' + (a.reduceMotion ? 'Giảm' : 'Mượt');
    $('customizeSolar').textContent = 'Dương lịch đầy đủ: ' + (a.showSolar ? 'Hiện' : 'Ẩn');
    $('customizeLunar').textContent = 'Âm lịch Việt Nam: ' + (a.showLunar ? 'Hiện' : 'Ẩn');
  }
  function reloadWeather() {
    if (typeof root.INFINITI_WEATHER_RELOAD === 'function') root.INFINITI_WEATHER_RELOAD();
  }
  function renderWeather() {
    var w = getWeather();
    $('customizeWeatherChoice').textContent = w.place ?
      'Khu vực đang chọn: ' + w.place : 'Chưa chọn khu vực';
    $('customizeWeatherEnable').textContent = w.enabled ? 'Đang bật thời tiết · Tắt' : 'Đang tắt thời tiết · Bật';
    $('customizeWeatherUnit').textContent = w.unit === 'fahrenheit' ? 'Đơn vị: °F' : 'Đơn vị: °C';
  }
  function selectRegion(city) {
    var lat = Number(city.latitude), lon = Number(city.longitude);
    if (!validCoords(lat, lon)) { message('Tọa độ khu vực không hợp lệ.'); return; }
    var result = saveWeather({place:String(city.place || '').slice(0, 90),
      latitude:lat, longitude:lon, enabled:true});
    if (!result) { message('Không lưu được khu vực.'); return; }
    renderWeather();
    $('customizeWeatherEnable').focus();
    $('customizeWeatherResults').innerHTML = '';
    message('Đã chọn ' + result.place + '. Thời tiết 3 ngày đang cập nhật.');
    reloadWeather();
  }
  function searchRegion() {
    var input = $('customizeWeatherSearch');
    var query = String(input.value || '').replace(/^\s+|\s+$/g, '').slice(0, 90);
    if (query.length < 2) { message('Nhập ít nhất 2 ký tự của tỉnh, thành phố hoặc khu vực.'); return; }
    if (searchRequest) { searchRequest.abort(); searchRequest = null; }
    var output = $('customizeWeatherResults'), x = new XMLHttpRequest();
    output.innerHTML = '';
    searchRequest = x;
    message('Đang tìm khu vực: ' + query + '…');
    var url = 'https://geocoding-api.open-meteo.com/v1/search?name=' +
      encodeURIComponent(query) + '&count=6&language=vi&format=json';
    x.open('GET', url, true);
    x.timeout = 12000;
    x.onload = function () {
      if (searchRequest !== x) return;
      searchRequest = null;
      if (x.status < 200 || x.status >= 300) { message('Không tìm được khu vực (mạng hoặc dịch vụ đang lỗi).'); return; }
      var list = [];
      try { list = JSON.parse(x.responseText).results || []; } catch (e) {}
      list.forEach(function (city) {
        if (!city || !validCoords(Number(city.latitude), Number(city.longitude))) return;
        var name = String(city.name || '');
        var region = String(city.admin1 || ''), country = String(city.country || '');
        var label = name + (region && region !== name ? ' · ' + region : '') +
          (country ? ' · ' + country : '');
        addButton(output, label, function () {
          selectRegion({place:label, latitude:city.latitude, longitude:city.longitude});
        }, false);
      });
      message(output.querySelectorAll('button').length ?
        'Chọn một kết quả bằng remote hoặc chuột.' : 'Không có kết quả. Thử tên khu vực khác.');
      var first = output.querySelector('button');
      if (first) first.focus();
    };
    x.onerror = x.ontimeout = function () {
      if (searchRequest !== x) return;
      searchRequest = null;
      message('Không thể tra cứu khu vực. Kiểm tra kết nối Internet.');
    };
    x.send();
  }
  function renderCalendar() {
    refreshToggles();
    var d = new Date();
    $('customizeCalendarNote').textContent = 'Dương lịch dùng ngày giờ TV; âm lịch tính theo múi giờ Việt Nam (UTC+7).';
  }
  function activateTab(name) {
    closeAppEditor();
    if(searchRequest){var oldSearch=searchRequest;searchRequest=null;oldSearch.abort();}
    activeTab = name;
    var key;
    for (key in tabs) {
      if (!Object.prototype.hasOwnProperty.call(tabs, key)) continue;
      tabs[key].className = key === name ? 'selected' : '';
      if (key === name) views[key].classList.remove('hidden');
      else views[key].classList.add('hidden');
    }
    if (name === 'apps') {appPage=0;appFilter=0;appSort=0;$('customizeAppSearch').value='';renderGlobalPacks();renderApps();}
    else if (name === 'style') renderStyle();
    else if (name === 'idle') renderIdle();
    else if (name === 'album') renderAlbumState();
    else if (name === 'weather') renderWeather();
    else if (name === 'calendar') renderCalendar();
    else if (name === 'wallpaper') renderWallpaperQR();
    message('');
  }
  function show() {
    opened = true;
    if(typeof root.INFINITI_IDLE_REFRESH==='function')root.INFINITI_IDLE_REFRESH();
    panel.classList.remove('hidden');
    document.body.classList.add('customize-open');
    activateTab('style');
    tabs.style.focus();
  }
  function hide() {
    albumDeleteId='';albumReadSeq++;albumData=null;albumControls();
    closeAppEditor();
    if (searchRequest) { searchRequest.abort(); searchRequest = null; }
    opened = false;
    panel.classList.add('hidden');
    document.body.classList.remove('customize-open');
    if (typeof root.INFINITI_CUSTOMIZE_CLOSED === 'function') root.INFINITI_CUSTOMIZE_CLOSED();
  }
  function visibleControls() {
    // Inputs must participate in remote navigation, not only Magic Remote pointer clicks.
    var all = panel.querySelectorAll('button, input'), result = [];
    for (var i = 0; i < all.length; i++) {
      if (!all[i].disabled && all[i].offsetWidth > 0 && all[i].offsetHeight > 0) result.push(all[i]);
    }
    return result;
  }
  // Directional focus based on actual visible button geometry; no CSS spatial-navigation dependency.
  function moveFocus(buttons,i,code){
    var active=buttons[i], menu=['style','idle','wallpaper','album','weather','calendar','apps','privacy'];
    var selected=menu.filter(function(k){return tabs[k]===active;})[0];
    if(selected && (code===38||code===40)){
      var index=menu.indexOf(selected)+(code===38?-1:1);
      if(menu[index])tabs[menu[index]].focus();
      return;
    }
    if(selected && code===39){
      if(selected!==activeTab)activateTab(selected);
      var controls=visibleControls(), targets=views[selected].querySelectorAll('button, input');
      for(var k=0;k<targets.length;k++)if(controls.indexOf(targets[k])>=0){targets[k].focus();return;}
      return;
    }
    var rects=buttons.map(function(el){return el.getBoundingClientRect?el.getBoundingClientRect():null;});
    var next=rects[i]?directionalIndex(rects,i,code):-1;
    if(next<0 && (!rects[i] || code===37 || code===39)){
      var step=code===37||code===38?-1:1;
      next=Math.max(0,Math.min(buttons.length-1,i+step));
    }
    if(i<0)next=0;
    if(buttons[next]){
      buttons[next].focus();

    }
  }
  function stopKey(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.stopImmediatePropagation) e.stopImmediatePropagation();
  }
  function keyHandler(e) {
    var code = e.keyCode || e.which;
    if (!opened) {
      if (e.type === 'keydown' && code === 403) { stopKey(e); show(); }
      return;
    }
    var active = document.activeElement, search = $('customizeWeatherSearch');
    if (editingApp && (code === 461 || code === 27)) {
      stopKey(e);if(e.type==='keydown'){closeAppEditor();renderApps();tabs.apps.focus();}return;
    }
    if(active===$('customizeAppSearch')){if(code===13&&e.type==='keydown'){stopKey(e);$('customizeAppSearchBtn').click();$('customizeAppSearchBtn').focus();return;}if(code!==38&&code!==40&&code!==461&&code!==27)return;}
    if (active === $('customizeAppName')) {
      if (code===13 && e.type==='keydown') {stopKey(e);$('customizeAppSave').focus();return;}
      if(code!==38 && code!==40)return;
    }
    // Let the LG on-screen keyboard enter characters and use Backspace naturally.
    if (active === search) {
      if (code === 461 || code === 27) { stopKey(e); if (e.type === 'keydown') hide(); return; }
      if (code === 13) { stopKey(e); if (e.type === 'keydown') searchRegion(); return; }
      if ((code === 40 || code === 38) && e.type === 'keydown') {
        stopKey(e);
        var controls=visibleControls();
        if(search.getBoundingClientRect)moveFocus(controls,controls.indexOf(search),code);
        else {var target=$('customizeWeatherSearchBtn');if(target)target.focus();}
        return;
      }
      // Normal characters, Backspace and left/right caret movement must reach
      // the LG keyboard input. The launcher ignores them while this dialog is open.
      return;
    }
    stopKey(e);
    if (e.type === 'keyup') return;
    if (code === 461 || code === 27) { hide(); return; }
    var buttons = visibleControls(), i = buttons.indexOf(active);
    if (code === 13) {
      if (e.repeat) return; // Holding OK must never auto-confirm a reboot-capable app.
      if (active && typeof active.click === 'function') active.click();
      return;
    }
    if (code === 37 || code === 38 || code === 39 || code === 40) {
      moveFocus(buttons,i,code);
    }
  }
  document.addEventListener('keydown', keyHandler, true);
  document.addEventListener('keyup', keyHandler, true);
  Object.keys(tabs).forEach(function (name) {
    tabs[name].addEventListener('click', function () { activateTab(name); tabs[name].focus(); });
  });
  $('customizeClose').addEventListener('click', hide);
  function pageApps(delta){appPage+=delta;renderApps();var b=$('customizeAppList').querySelector('button');if(b)b.focus();}
  function pageGlyphs(delta){glyphPage+=delta;renderGlyphChoices(currentGlyphPack);var b=$('customizeAppGlyphChoices').querySelector('button');if(b)b.focus();}
  $('customizeAppPrev').addEventListener('click',function(){pageApps(-1);});
  $('customizeAppNext').addEventListener('click',function(){pageApps(1);});
  $('customizeGlyphPrev').addEventListener('click',function(){pageGlyphs(-1);});
  $('customizeGlyphNext').addEventListener('click',function(){pageGlyphs(1);});
  $('customizeAppSave').addEventListener('click',function(){applyAppEditor(false);});
  $('customizeAppRestore').addEventListener('click',function(){applyAppEditor(true);});
  $('customizeAppCancel').addEventListener('click',function(){closeAppEditor();renderApps();tabs.apps.focus();});
  $('customizeAppOriginalIcon').addEventListener('click',function(){uploadSequence++;iconBusy=false;pendingIcon='original';previewAppIcon();});
  $('customizeAppPickFile').addEventListener('click',function(){$('customizeAppFile').click();});
  $('customizeAppFile').addEventListener('change',function(){importAppIcon(this.files && this.files[0]);});
  [['customizeAppBlue','#234d89'],['customizeAppGreen','#245b42'],['customizeAppRed','#813448'],['customizeAppDark','#262c3a']].forEach(function(choice){
    $(choice[0]).addEventListener('click',function(){makeColorIcon(choice[1]);});
  });
  $('customizeHideLGApps').addEventListener('click', function () {
    var count = hideLGDefaultApps();
    refreshLauncher();
    renderApps();
    message(count ? 'Đã ẩn ' + count + ' biểu tượng ứng dụng LG trong Infiniti.' :
      'Không còn biểu tượng LG mặc định nào cần ẩn.');
  });
  $('customizeAppSearchBtn').addEventListener('click',function(){appPage=0;renderApps();});
  $('customizeAppSearch').addEventListener('input',function(){appPage=0;renderApps();});
  $('customizeAppFilter').addEventListener('click',function(){appFilter=(appFilter+1)%5;appPage=0;renderApps();});
  $('customizeAppSort').addEventListener('click',function(){appSort=(appSort+1)%3;appPage=0;renderApps();});
  $('customizeShowAllApps').addEventListener('click',function(){((root.TV_APPS||{}).apps||[]).forEach(function(a){if(a&&validAppId(a.id))setVisible(a.id,true);});refreshLauncher();renderApps();message('Đã hiện các ứng dụng có thể chỉnh sửa.');});
  $('customizeAppPin').addEventListener('click',function(){if(!editingApp)return;var on=getPinned().indexOf(editingApp.id)<0;if(setPinned(editingApp.id,on)){if(on)setVisible(editingApp.id,true);refreshLauncher();$('customizeAppPin').textContent=on?'Bỏ ghim':'Ghim đầu Home';message(on?'Đã ghim':'Đã bỏ ghim');}});
  $('customizeAppLaunch').addEventListener('click',function(){if(!editingApp||!root.INFINITI_OPEN_APP)return;var id=editingApp.id,title=styledApp(editingApp).title;hide();root.INFINITI_OPEN_APP(id,title);});
  $('customizeResetApps').addEventListener('click', function () {
    resetVisible(); refreshLauncher(); renderApps();
    message('Đã khôi phục danh sách ứng dụng mặc định.');
  });
  function appearanceToggle(id, property) {
    $(id).addEventListener('click', function () {
      var change = {}; change[property] = !getAppearance()[property];
      saveAppearance(change); applyAppearance(); refreshToggles();
    });
  }
  appearanceToggle('customizeLargeText','largeText');
  appearanceToggle('customizeShowWeek','showWeek');
  appearanceToggle('customizeMotion','reduceMotion');
  appearanceToggle('customizeIdleRain','idleRain');
  $('customizeAlbumSelect').addEventListener('click',function(){if(!albumData||!albumData.photos.length)return;albumSelected=albumData.photos[(albumData.photos.indexOf(albumSelected)+1)%albumData.photos.length];albumDeleteId='';albumControls();});
  $('customizeAlbumUp').addEventListener('click',function(){albumAction({action:'move',id:albumSelected,direction:'up'});});
  $('customizeAlbumDown').addEventListener('click',function(){albumAction({action:'move',id:albumSelected,direction:'down'});});
  $('customizeAlbumDelete').addEventListener('click',function(){if(!albumSelected)return;if(albumDeleteId===albumSelected&&Date.now()-albumDeleteAt<10000){albumAction({action:'delete',id:albumSelected,confirm:true});return;}albumDeleteId=albumSelected;albumDeleteAt=Date.now();albumControls();message('Nhấn Xác nhận xóa lần nữa trong 10 giây.');});
  $('customizeAlbumEnabled').addEventListener('click',function(){if(albumData)albumSetting('enabled',!albumData.enabled);});
  $('customizeAlbumSeconds').addEventListener('click',function(){if(albumData)albumSetting('seconds',albumTimes[(albumTimes.indexOf(albumData.seconds)+1)%albumTimes.length]);});
  $('customizeAlbumRandom').addEventListener('click',function(){if(albumData)albumSetting('random',!albumData.random);});
  $('customizeAlbumIntensity').addEventListener('click',function(){if(albumData)albumSetting('intensity',albumData.intensity==='medium'?'light':'medium');});
  $('customizeAlbumBrowse').addEventListener('click',function(){hide();if(root.INFINITI_IDLE_PREVIEW)root.INFINITI_IDLE_PREVIEW(true,{motion:'still',manual:true});});
  $('customizeAlbumRefresh').addEventListener('click',renderAlbumState);
  $('customizeAlbumWeb').addEventListener('click',function(){activateTab('wallpaper');tabs.wallpaper.focus();});
  var previewTransition='',previewMotion='',previewIntensity='';
  function cyclePreview(id,values,current,label){var choices=[''].concat(values),next=choices[(choices.indexOf(current)+1)%choices.length];$(id).textContent=label+': '+(next||'cấu hình');return next;}
  $('customizeAlbumTransitionPreview').addEventListener('click',function(){previewTransition=cyclePreview('customizeAlbumTransitionPreview',root.INFINITI_IDLE_ALBUM_STYLES?root.INFINITI_IDLE_ALBUM_STYLES():[],previewTransition,'Chuyển cảnh');});
  $('customizeAlbumMotionPreview').addEventListener('click',function(){previewMotion=cyclePreview('customizeAlbumMotionPreview',root.INFINITI_IDLE_ALBUM_MOTIONS?['still'].concat(root.INFINITI_IDLE_ALBUM_MOTIONS()):[],previewMotion,'Chuyển động');});
  $('customizeAlbumIntensityPreview').addEventListener('click',function(){previewIntensity=cyclePreview('customizeAlbumIntensityPreview',['light','medium'],previewIntensity,'Cường độ');});
  $('customizeAlbumPreview').addEventListener('click',function(){hide();if(root.INFINITI_IDLE_PREVIEW)root.INFINITI_IDLE_PREVIEW(true,{transition:previewTransition,motion:previewMotion,intensity:previewIntensity});});
  $('customizeIdlePreview').addEventListener('click',function(){var a=getAppearance();if(!a.idleRain||a.reduceMotion){message('Bật hiệu ứng và tắt Giảm chuyển động để thử chuyển động.');return;}hide();if(root.INFINITI_IDLE_PREVIEW)root.INFINITI_IDLE_PREVIEW();});
  $('customizeIdleEffect').addEventListener('click',function(){var a=getAppearance();saveAppearance({idleEffect:IDLE_EFFECTS[(IDLE_EFFECTS.indexOf(a.idleEffect)+1)%IDLE_EFFECTS.length]});applyAppearance();refreshToggles();renderIdle();});
  $('customizeIdleTime').addEventListener('click',function(){var a=getAppearance();saveAppearance({idleSeconds:IDLE_CHOICES[(IDLE_CHOICES.indexOf(a.idleSeconds)+1)%IDLE_CHOICES.length]});applyAppearance();refreshToggles();});
  appearanceToggle('customizeSolar','showSolar');
  appearanceToggle('customizeLunar','showLunar');
  $('customizeWallpaper').addEventListener('click', function () {
    renderWallpaperQR();
    message('Mã QR nằm trong phần Hình nền của Tùy chỉnh.');
  });
  $('customizeResetStyle').addEventListener('click', function () {
    saveAppearance(defaults); applyAppearance(); renderStyle();
    message('Đã khôi phục giao diện mặc định.');
  });
  $('customizeWeatherSearchBtn').addEventListener('click', searchRegion);
  $('customizeWeatherEnable').addEventListener('click', function () {
    var w = getWeather();
    if (!w.enabled && !w.place) {
      message('Vui lòng chọn khu vực hoặc tìm thành phố trước khi bật.'); return;
    }
    saveWeather({enabled:!w.enabled});
    renderWeather(); reloadWeather();
  });
  $('customizeWeatherUnit').addEventListener('click', function () {
    saveWeather({unit:getWeather().unit === 'fahrenheit' ? 'celsius' : 'fahrenheit'});
    renderWeather(); reloadWeather();
  });
  root.INFINITI_REMOTE_REFRESH = function(appearance,apps){if(appearance)applyAppearance();if(apps)refreshLauncher();};
  root.INFINITI_CUSTOMIZE_OPEN = show;
  root.INFINITI_CUSTOMIZE_CLOSE = function () { if (opened) hide(); };
  root.INFINITI_CUSTOMIZE_IS_OPEN = function () { return opened; };
  applyAppearance();
})(typeof window !== 'undefined' ? window : this);
