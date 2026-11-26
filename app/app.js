/*
 * tvOS style home for webOS: black, a pinned dock row, an app grid, and one glass highlight that
 * springs between tiles. A port of the Android launcher in ../../launcher.
 *
 * webOS does not let third-party apps list installed apps, so sync-apps.py writes them into apps.js.
 */
(function () {
  'use strict';

  // Four landscape cards across a 1920x1080 logical stage.
  // Ignore legacy saved compact sizes so in-place upgrades get the new layout.
  var COLUMNS = 4, COLS_CHOICES = [4];
  var TILE_W = 380, TILE_H = 214, CELL_W = 420;
  var DOCK_TOP = 1030 - TILE_H - 46;
  var FOCUS_SCALE = 1.07, GLASS_PAD = 3;

  var KEY = { LEFT: 37, UP: 38, RIGHT: 39, DOWN: 40, OK: 13, BACK: 461, ESC: 27 };

  var LANG = {
    en: {
      greetings: [[5, 'Good night'], [12, 'Good morning'], [17, 'Good afternoon'], [22, 'Good evening'], [24, 'Good night']],
      days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      date: function (d) {
        var m = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September',
          'October', 'November', 'December'];
        return this.days[d.getDay()] + ', ' + d.getDate() + ' ' + m[d.getMonth()] + ' ' + d.getFullYear();
      },
      inputs: 'Inputs', settings: 'Settings', wired: 'Ethernet', offline: 'Offline', liveTv: 'Live TV',
      noInputs: 'No inputs found', cantOpen: "Can't open ", ampm: ['am', 'pm'],
      moveHint: 'Arrows or pointer to move  ·  OK to place  ·  Back to cancel',
      noApps: 'No apps were found on this TV. Run the installer again over SSH; if it keeps happening, ' +
        'please report your TV model and webOS version at github.com/infiniti-money/lg-tv-webos/issues',
      colsTitle: 'Layout: 4 apps per screen', arrange: 'Rearrange apps', done: 'Done',
      arrangeHint: 'Click an app to pick it up, point where it should go, click again to drop it.',
      wallTitle: 'Change wallpaper',
      wallScan: 'Scan this code with your phone camera, then pick a photo.',
      wallOff: 'The wallpaper page is not running. Reboot the TV and try again.'
    },
    vi: {
      greetings: [[5, 'Chúc ngủ ngon'], [11, 'Chào buổi sáng'], [13, 'Chào buổi trưa'], [18, 'Chào buổi chiều'], [22, 'Chào buổi tối'], [24, 'Chúc ngủ ngon']],
      days: ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'],
      date: function (d) { return this.days[d.getDay()] + ', ' + d.getDate() + '/' + (d.getMonth() + 1) + '/' + d.getFullYear(); },
      inputs: 'Nguồn vào', settings: 'Cài đặt', wired: 'Wi-Fi', offline: 'Mất mạng', liveTv: 'Truyền hình',
      noInputs: 'Không tìm thấy nguồn vào', cantOpen: 'Không mở được ', ampm: ['SA', 'CH'],
      moveHint: 'Mũi tên hoặc con trỏ để di chuyển  ·  OK để đặt  ·  Back để huỷ',
      noApps: 'Không tìm thấy ứng dụng nào trên TV này. Chạy lại lệnh cài qua SSH; nếu vẫn vậy, ' +
        'báo giúp model TV và phiên bản webOS tại github.com/infiniti-money/lg-tv-webos/issues',
      colsTitle: 'Bố cục: 4 ứng dụng trên màn hình', arrange: 'Sắp xếp ứng dụng', done: 'Xong',
      arrangeHint: 'Bấm vào app để nhấc lên, trỏ tới chỗ mới rồi bấm lần nữa để đặt.',
      wallTitle: 'Đổi hình nền',
      wallScan: 'Quét mã này bằng camera điện thoại rồi chọn ảnh.',
      wallOff: 'Trang đổi hình nền chưa chạy. Khởi động lại TV rồi thử lại.'
    }
  };
  var L = LANG[CONFIG.language] || LANG.en;
  var GREETINGS = L.greetings;

  var ICON_INPUT = 'M18,7V4c0,-1.1 -0.9,-2 -2,-2H8C6.9,2 6,2.9 6,4v3H5v6l3,6v3h8v-3l3,-6V7H18zM8,4h8v3h-2V5h-1v2h-2V5h-1v2H8V4z';
  var ICON_MOVE = 'M10,9h4V6h3l-5,-5 -5,5h3v3zM9,10H6V7l-5,5 5,5v-3h3v-4zM23,12l-5,-5v3h-3v4h3v3l5,-5zM14,15h-4v3H7l5,5 5,-5h-3v-3z';
  var ICON_LIVETV = 'M21,6h-7.59l3.29,-3.29L16,2l-4,4l-4,-4l-0.71,0.71L10.59,6H3c-1.1,0 -2,0.89 -2,2v12c0,1.1 0.9,2 2,2h18c1.1,0 2,-0.89 2,-2V8C23,6.89 22.1,6 21,6zM21,20H3V8h18V20zM9,10v8l7,-4L9,10z';

  var $ = function (id) { return document.getElementById(id); };
  var stage = $('stage'), tilesEl = $('tiles'), glass = $('glass'), hero = $('hero');
  // webOS 3.x runs Chromium 38 and has no CSS custom property support.
  // Set sizing directly on elements rather than relying on var(--tile-...).
  glass.style.borderRadius = Math.round(TILE_W * 74 / 360) + 'px';
  var ambients = [$('ambientA'), $('ambientB')], ambientFront = 0, ambientColor = null;
  var pills = [$('btnInputs'), $('btnWifi'), $('btnSettings'), $('btnCustomize')];
  var panel = $('inputsPanel'), pen = $('penBtn'), colsPanel = $('colsPanel');

  var items = [];               // {app, el, color}
  var zone = 'grid';            // 'grid' | 'top' | 'inputs' | 'wall' | 'pen' | 'cols'
  var colFocus = 0, colCells = [], colRow = 0, arrangeBtn = null;
  var arranging = false;        // "Rearrange apps" mode from the pencil: every tile wiggles
  var focused = 0, pillFocus = 0, inputFocus = 0, inputRows = [];
  var offset = 0, heroShown = false, glassShown = false;
  var cachedHeaderBottom = null, lastArrowAt = 0;
  var editing = null;           // {item, snapshot} while a tile is being moved
  var pressTimer = null, pressedLong = false;   // long press with the pointer
  var lifecycle = window.INFINITI_LIFECYCLE || null;
  function launcherCovered() {
    return lifecycle ? lifecycle.isCovered() : !!document.hidden;
  }
  var idleTimer=null, idleActive=false, idleWakeKey=0, idleClickUntil=0, idleMouseX=null,idleMouseY=null,idleEffectClass='',idleMouseAt=0;
  function idlePrefs(){return window.INFINITI_PREFS?window.INFINITI_PREFS.getAppearance():{idleSeconds:60,idleRain:true};}
  function idleEligible(){return !launcherCovered()&&!editing&&!arranging&&!okDown&&!pressTimer&&(zone==='grid'||zone==='top'||zone==='pen')&&!(window.INFINITI_CUSTOMIZE_IS_OPEN&&window.INFINITI_CUSTOMIZE_IS_OPEN());}
  function idleClear(){if(idleTimer!==null){clearTimeout(idleTimer);idleTimer=null;}}
  function idleShow(){if(idleActive&&window.INFINITI_IDLE_ALBUM_STOP)window.INFINITI_IDLE_ALBUM_STOP();idleActive=false;document.body.classList.remove('idle-home');if(idleEffectClass)document.body.classList.remove(idleEffectClass);idleEffectClass='';}
  function idleSchedule(){
    idleClear();var p=idlePrefs();if(!p.idleSeconds||launcherCovered()||idleActive)return;
    idleTimer=setTimeout(function(){idleTimer=null;if(!idleEligible()){idleSchedule();return;}idleActive=true;document.body.classList.add('idle-home');if(window.INFINITI_IDLE_ALBUM_START)window.INFINITI_IDLE_ALBUM_START();var effect=window.INFINITI_PREFS&&window.INFINITI_PREFS.resolveIdleEffect?window.INFINITI_PREFS.resolveIdleEffect(p,Math.random()):(p.idleRain&&!p.reduceMotion?'rain':'');if(effect){idleEffectClass='idle-'+effect;document.body.classList.add(idleEffectClass);}},p.idleSeconds*1000);
  }
  function idleReset(){idleShow();idleSchedule();}
  function idleStopEvent(e){e.preventDefault();e.stopPropagation();if(e.stopImmediatePropagation)e.stopImmediatePropagation();}
  function idleInput(e){
    if(launcherCovered())return;
    if(e.type==='keyup'&&idleWakeKey&&e.keyCode===idleWakeKey){idleWakeKey=0;idleStopEvent(e);return;}
    if(e.type==='keydown'&&idleWakeKey&&e.keyCode===idleWakeKey){idleStopEvent(e);return;}
    if(e.type==='mousemove'){
      var moved=idleMouseX===null||Math.abs(e.clientX-idleMouseX)+Math.abs(e.clientY-idleMouseY)>=4;
      if(!moved)return;idleMouseX=e.clientX;idleMouseY=e.clientY;
    }
    if(e.type==='click'&&Date.now()<idleClickUntil){idleStopEvent(e);return;}
    if(idleActive){
      idleReset();
      if(e.type==='keydown'){idleWakeKey=e.keyCode;idleStopEvent(e);}
      else if(e.type==='mousedown'||e.type==='touchstart'||e.type==='wheel'){idleClickUntil=Date.now()+700;idleStopEvent(e);}
      else if(e.type==='click')idleStopEvent(e);
    }else if(e.type!=='keyup'){
      if(e.type==='mousemove'){var now=Date.now();if(now-idleMouseAt<500)return;idleMouseAt=now;}
      idleSchedule();
    }
  }
  ['keydown','keyup','mousemove','mousedown','click','touchstart','wheel'].forEach(function(type){document.addEventListener(type,idleInput,true);});
  window.INFINITI_IDLE_REFRESH=idleReset;
  window.INFINITI_REMOTE_CAN_APPLY=function(){return !launcherCovered()&&!editing&&!arranging&&!okDown&&!pressTimer&&(zone==='grid'||zone==='top'||zone==='pen');};
  var entranceTimers = [];
  function clearEntranceTimers() {
    while (entranceTimers.length) clearTimeout(entranceTimers.pop());
  }

  // ---- luna bus ------------------------------------------------------------------------------

  var bridges = [];   // keep a reference: a collected bridge drops its callback

  function luna(uri, params, cb) {
    try {
      var b = new PalmServiceBridge();
      b.onservicecallback = function (msg) {
        var res;
        try { res = JSON.parse(msg); } catch (e) { res = { returnValue: false }; }
        if (cb) cb(res);
        if (!params || !params.subscribe) bridges.splice(bridges.indexOf(b), 1);
      };
      bridges.push(b);
      b.call(uri, JSON.stringify(params || {}));
    } catch (e) {
      if (cb) cb({ returnValue: false, errorText: String(e) });   // not on a TV (desktop preview)
    }
  }

  function launch(id, title, params) {
    // In a Glasshouse-hosted launcher, app launches must go through its
    // catalogue/open API. Native IPK installs continue to use Luna.
    var gh = window.INFINITI_GLASSHOUSE;
    if (gh && gh.enabled) {
      gh.openApp(id, function (err) {
        if (err) toast(L.cantOpen + (title || id));
      });
      return;
    }
    luna('luna://com.webos.applicationManager/launch', { id: id, params: params || {} }, function (res) {
      if (res.returnValue === false) toast(L.cantOpen + (title || id));
    });
  }

  var toastTimer;
  function toast(text) {
    var t = $('toast');
    t.textContent = text;
    t.classList.add('shown');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('shown'); }, 2200);
  }

  // ---- apps ----------------------------------------------------------------------------------

  window.INFINITI_OPEN_APP=function(id,title){if(!launcherCovered())launch(id,title);};
  function orderedApps() {
    var all = (window.TV_APPS && TV_APPS.apps) || [];
    if(window.INFINITI_PREFS && INFINITI_PREFS.styledApp) all=all.map(INFINITI_PREFS.styledApp);
    var byId = {};
    all.forEach(function (a) { byId[a.id] = a; });
    var hidden = {};
    (CONFIG.hiddenApps || []).forEach(function (id) { hidden[id] = true; });
    // User's in-launcher editor overrides defaults without touching installed apps.
    if (window.INFINITI_PREFS) {
      all.forEach(function (a) {
        if (INFINITI_PREFS.isVisible(a.id, CONFIG.hiddenApps || [])) delete hidden[a.id];
        else hidden[a.id] = true;
      });
    }
    var byTitle = function (a, b) { return a.title.toLowerCase() < b.title.toLowerCase() ? -1 : 1; };

    var pinned=[];if(window.INFINITI_PREFS&&INFINITI_PREFS.getPinned)INFINITI_PREFS.getPinned().forEach(function(id){if(byId[id]&&!hidden[id]){pinned.push(byId[id]);hidden[id]=true;}});
    // An order arranged on the TV wins, until dockApps in config.js changes.
    var saved = loadOrder();
    if (saved) {
      var placed = [];
      saved.forEach(function (id) {
        if (byId[id] && !hidden[id]) { placed.push(byId[id]); hidden[id] = true; }
      });
      return pinned.concat(placed,all.filter(function (a) { return !hidden[a.id]; }).sort(byTitle));
    }

    var dock = [];
    (CONFIG.dockApps || []).forEach(function (id) {
      if (byId[id] && !hidden[id] && dock.length + pinned.length < COLUMNS) { dock.push(byId[id]); hidden[id] = true; }
    });
    var rest = all.filter(function (a) { return !hidden[a.id]; });
    rest.sort(byTitle);
    return pinned.concat(dock,rest);
  }

  var ORDER_KEY = 'tvhome.order';

  function loadOrder() {
    try {
      var s = JSON.parse(localStorage.getItem(ORDER_KEY));
      return s && s.dock === (CONFIG.dockApps || []).join(',') ? s.ids : null;
    } catch (e) {
      return null;
    }
  }

  function saveOrder() {
    try {
      localStorage.setItem(ORDER_KEY, JSON.stringify({
        dock: (CONFIG.dockApps || []).join(','),
        ids: items.map(function (it) { return it.app.id; })
      }));
    } catch (e) { /* storage unavailable: the order lasts until the app restarts */ }
  }

  // One horizontal app row. COLUMNS sets visible tile size; never creates another row.
  function rowOf(i) { return 0; }
  function tileLeft(i) { return 130 + i * CELL_W; }
  function dockOffset(index, current, total) {
    var first = Math.round(current / CELL_W);
    if (index < first) first = index;
    else if (index >= first + COLUMNS) first = index - COLUMNS + 1;
    return Math.max(0, Math.min(first, Math.max(0, total - COLUMNS))) * CELL_W;
  }
  function tileTop(i) { return DOCK_TOP; }

  var iconCache = {};
  function build() {
    tilesEl.innerHTML = '';
    items = orderedApps().map(function (app) {
      var el = document.createElement('div');
      el.className = 'item';
      el.style.width = TILE_W + 'px';
      var card = document.createElement('div');
      card.className = 'card';
      card.style.width = TILE_W + 'px';
      card.style.height = TILE_H + 'px';
      card.style.borderRadius = Math.round(TILE_W * 68 / 360) + 'px';
      var img = document.createElement('img');
      var item = { app: app, el: el, card: card, color: null };
      var iconKey = app.id + ':' + app.icon + ':' + (app.iconColor || '');
      img.onload = function () {
        var key = img.infinitiFallback ? app.id + ':fallback:' + app.originalIcon : iconKey;
        var cached = iconCache[key];
        if (cached) {
          item.color = cached.color;
          applyIconLayout(item,cached.layout);
          if (items[focused] === item) setAmbient(item.color);
        } else {
          paintTile(item, img);
          if (Object.keys(iconCache).length >= 128) iconCache = {};
          iconCache[key] = {color:item.color,layout:item.iconLayout};
        }
      };
      img.onerror = function(){if(app.originalIcon && img.src!==app.originalIcon && !img.infinitiFallback){img.infinitiFallback=true;img.src=app.originalIcon;}};
      img.src = app.icon;
      card.appendChild(img);
      el.appendChild(card);
      var name = document.createElement('div');
      name.className = 'name';
      name.textContent = app.title;
      el.appendChild(name);
      el.addEventListener('mouseover', function () {
        if (editing) { if (item !== editing.item) moveTo(items.indexOf(item)); }   // pointer drags the tile
        else if (zone !== 'inputs' && zone !== 'wall' && zone !== 'cols') focusTile(items.indexOf(item));
      });
      // With the Magic Remote pointer, holding OK sends mousedown ... mouseup + click (no OK key),
      // so a long press is timed here too, and the click that ends it is ignored.
      el.addEventListener('mousedown', function () {
        if (editing || arranging || zone === 'inputs' || zone === 'wall' || zone === 'cols') return;
        clearTimeout(pressTimer);
        pressTimer = setTimeout(function () {
          pressTimer = null;
          pressedLong = true;
          focusTile(items.indexOf(item));
          startEdit();
        }, LONG_PRESS_MS);
      });
      el.addEventListener('mouseup', function () { clearTimeout(pressTimer); pressTimer = null; });
      el.addEventListener('mouseleave', function () { clearTimeout(pressTimer); pressTimer = null; });
      el.addEventListener('click', function () {
        if (pressedLong) { pressedLong = false; return; }
        if (editing) finishEdit(true);
        else if (arranging) { focusTile(items.indexOf(item)); startEdit(); }
        else launch(app.id, app.title);
      });
      tilesEl.appendChild(el);
      return item;
    });
    // apps.js could not be filled in: say so instead of showing an empty screen.
    if (!items.length) {
      var msg = document.createElement('div');
      msg.id = 'noApps';
      var gh = window.INFINITI_GLASSHOUSE;
      msg.textContent = gh && gh.enabled ?
        (gh.lastError ? 'Không thể lấy ứng dụng từ Glasshouse: ' + gh.lastError :
          'Đang lấy danh sách ứng dụng từ Glasshouse…') : L.noApps;
      tilesEl.appendChild(msg);
    }
    layout();
  }

  /** Places every tile by its position in items; tiles glide when the order changes. */
  function layout() {
    offset = dockOffset(Math.max(0, Math.min(focused, items.length - 1)), offset, items.length);
    stage.style.transform = 'translateX(' + (-offset) + 'px)';
    items.forEach(function (it, i) {
      it.el.style.left = tileLeft(i) + 'px';
      it.el.style.top = tileTop(i) + 'px';
      it.el.classList.toggle('dock', rowOf(i) === 0);   // the dock has no labels: the top shelf names it
    });

    var band = $('dockBand');
    var n = items.length;
    band.style.display = 'none'; // transparent dock: never draw an opaque strip
    band.style.left = (tileLeft(0) - 28) + 'px';
    band.style.top = (DOCK_TOP - 28) + 'px';
    band.style.width = ((n - 1) * CELL_W + TILE_W + 56) + 'px';
    band.style.height = (TILE_H + 56) + 'px';

    // A fixed edit button never takes one of the four app slots.
    pen.style.display = n ? 'flex' : 'none';
    pen.style.left = '1824px';
    pen.style.top = (DOCK_TOP + TILE_H / 2 - 26) + 'px';
  }

  /** Index of the last tile in the dock row. */
  function lastDock() { return items.length - 1; }

  function animateIn() {
    clearEntranceTimers();
    if (launcherCovered()) return;
    items.forEach(function (it) { it.el.classList.add('shown'); });
  }

  // Select a layout without distorting the source image.
  // Match a solid square icon's side colours only if several edge samples agree.
  function iconLayout(w,h,edges) {
    var ratio=h>0?w/h:0;
    if(ratio>=1.50 && ratio<=1.95) return {kind:'landscape',background:''};
    var solid=edges.length===4, first=edges[0];
    for(var i=0;i<edges.length;i++){
      var p=edges[i];
      if(p[3]<245 || Math.abs(p[0]-first[0])>18 ||
         Math.abs(p[1]-first[1])>18 || Math.abs(p[2]-first[2])>18)solid=false;
    }
    return {kind:'contained',background:solid?'rgb('+[first[0],first[1],first[2]].join(',')+')':''};
  }
  function applyIconLayout(item,layout){
    item.iconLayout=layout;
    item.card.classList.remove('glyph');
    item.card.classList.remove('icon-landscape');
    item.card.classList.remove('icon-contained');
    item.card.classList.add('icon-'+layout.kind);
    item.card.style.background = '';
    if(layout.background)item.card.style.backgroundColor=layout.background;
  }
  function paintTile(item, img) {
    var px = null, edges = [];
    try {
      var c = document.createElement('canvas');
      c.width = 12; c.height = 12;
      var g = c.getContext('2d');
      g.drawImage(img, 0, 0, 12, 12);
      px = g.getImageData(0, 0, 12, 12).data;
      edges = edgeSamples(img);
    } catch(e) { /* retain a neutral card if canvas is unavailable */ }
    applyIconLayout(item,iconLayout(img.naturalWidth,img.naturalHeight,edges));
    item.color=px?vividColor(px):parseColor(item.app.iconColor);
    if(items[focused]===item)setAmbient(item.color);
  }
  function edgeSamples(img) {
    var w=img.naturalWidth,h=img.naturalHeight;
    if(!w||!h)return [];
    var c=document.createElement('canvas');
    c.width = 1; c.height = 1;
    var g=c.getContext('2d'),x=Math.min(2,w-1),y=Math.min(2,h-1);
    var points=[[x,Math.floor(h/2)],[w-1-x,Math.floor(h/2)],
      [Math.floor(w/2),y],[Math.floor(w/2),h-1-y]];
    return points.map(function(p){
      g.clearRect(0,0,1,1);
      g.drawImage(img,p[0],p[1],1,1,0,0,1,1);
      return g.getImageData(0,0,1,1).data;
    });
  }

  function glyphBackground(hex) {
    var c = parseColor(hex);
    if (!c) return '#2c2c2e';
    var hsv = rgbToHsv(c);
    if (hsv[1] < 0.15 && (hsv[2] > 0.85 || hsv[2] < 0.1)) return '#2c2c2e';   // white or black glyph colour
    return 'rgb(' + c.join(',') + ')';
  }

  /** A vivid colour from the icon: the most saturated, not too dark pixel, or the lifted average. */
  function vividColor(px) {
    var best = null, bestScore = -1, sum = [0, 0, 0], n = 0;
    for (var i = 0; i < px.length; i += 4) {
      if (px[i + 3] < 128) continue;
      var p = [px[i], px[i + 1], px[i + 2]];
      sum[0] += p[0]; sum[1] += p[1]; sum[2] += p[2]; n++;
      var hsv = rgbToHsv(p);
      var score = hsv[1] * Math.min(1, hsv[2] * 1.4);
      if (score > bestScore) { bestScore = score; best = p; }
    }
    if (!n) return [68, 68, 68];
    if (bestScore < 0.25) {   // nearly monochrome icon (e.g. white): its average, lifted
      var avg = rgbToHsv([sum[0] / n, sum[1] / n, sum[2] / n]);
      avg[2] = Math.max(avg[2], 0.55);
      return hsvToRgb(avg);
    }
    var h = rgbToHsv(best);
    h[1] = Math.min(1, h[1] * 1.1);
    h[2] = Math.max(0.5, h[2]);
    return hsvToRgb(h);
  }

  function parseColor(hex) {
    var m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
    if (!m) return null;
    var v = parseInt(m[1], 16);
    return [v >> 16 & 255, v >> 8 & 255, v & 255];
  }

  function rgbToHsv(c) {
    var r = c[0] / 255, g = c[1] / 255, b = c[2] / 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min, h = 0;
    if (d) {
      if (max === r) h = ((g - b) / d) % 6;
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60;
      if (h < 0) h += 360;
    }
    return [h, max ? d / max : 0, max];
  }

  function hsvToRgb(hsv) {
    var h = hsv[0], s = hsv[1], v = hsv[2];
    var c = v * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = v - c, rgb;
    if (h < 60) rgb = [c, x, 0];
    else if (h < 120) rgb = [x, c, 0];
    else if (h < 180) rgb = [0, c, x];
    else if (h < 240) rgb = [0, x, c];
    else if (h < 300) rgb = [x, 0, c];
    else rgb = [c, 0, x];
    return rgb.map(function (k) { return Math.round((k + m) * 255); });
  }

  // ---- focus & glass -------------------------------------------------------------------------

  function focusTile(i) {
    if (!items.length) return;
    i = Math.max(0, Math.min(i, items.length - 1));
    setZone('grid');
    if (items[focused]) items[focused].el.classList.remove('focused');
    focused = i;
    items[i].el.classList.add('focused');

    var top = tileTop(i), left = tileLeft(i);
    // Slide the one app row horizontally, keeping the selected tile within the TV safe area.
    // No expensive layout reads on each remote press.
    offset = dockOffset(i, offset, items.length);
    stage.style.transform = 'translateX(' + (-offset) + 'px)';
    document.body.classList.remove('scrolled');

    var w = TILE_W * FOCUS_SCALE + 2 * GLASS_PAD, h = TILE_H * FOCUS_SCALE + 2 * GLASS_PAD;
    var x = tileLeft(i) + TILE_W / 2 - w / 2, y = top + TILE_H / 2 - h / 2;
    glass.style.width = w + 'px';
    glass.style.height = h + 'px';
    glass.style.transform = 'translate(' + x + 'px,' + y + 'px)';
    if (!glassShown) {
      // First show: jump there without the spring, then fade in.
      glass.style.transition = 'none';
      glass.offsetWidth;   // flush the jump before restoring the transition
      glass.style.transition = '';
      glass.style.opacity = '1';
      glassShown = true;
    }

    showHero(items[i]);
    setAmbient(items[i].color);   // the glow follows the focused tile in every row
  }

  function hideGlass() {
    glassShown = false;
    glass.style.opacity = '0';
  }

  function showHero(item) {
    var label = item.app.title;
    hero.style.top = (DOCK_TOP - 110) + 'px';
    if (!heroShown) {
      hero.textContent = label;
      hero.style.transform = 'none';
      hero.style.opacity = '1';
      heroShown = true;
    } else if (hero.textContent !== label) {
      hero.style.opacity = '0';
      hero.style.transform = 'translateX(-24px)';
      clearTimeout(hero.swap);
      hero.swap = setTimeout(function () {
        hero.textContent = label;
        hero.style.transition = 'none';
        hero.style.transform = 'translateX(24px)';
        hero.offsetWidth;
        hero.style.transition = '';
        hero.style.transform = 'none';
        hero.style.opacity = '1';
      }, 120);
    }
    setAmbient(item.color);
  }

  function hideHero() {
    if (!heroShown) return;
    heroShown = false;
    hero.style.opacity = '0';
  }

  /** Crossfades the glow to a new colour by swapping between two layers. */
  function setAmbient(color) {
    if (!color) return;
    var key = color.join(',');
    if (key === ambientColor) return;
    ambientColor = key;
    var back = ambients[1 - ambientFront];
    back.style.background = 'radial-gradient(circle 1190px at 32% 42%, rgba(' + key + ',0.36) 0%, rgba(' +
      key + ',0.15) 50%, rgba(' + key + ',0) 100%)';
    back.style.opacity = '1';
    ambients[ambientFront].style.opacity = '0';
    ambientFront = 1 - ambientFront;
  }

  function focusPill(i) {
    setZone('top');
    document.body.classList.remove('scrolled');
    pills[pillFocus].classList.remove('focused');
    var next = Math.max(0, Math.min(i, pills.length - 1));
    pillFocus = next;
    pills[pillFocus].classList.add('focused');
  }

  function setZone(z) {
    if (zone === z) return;
    if (zone === 'top') pills[pillFocus].classList.remove('focused');
    if (zone === 'pen') pen.classList.remove('focused');
    if (zone === 'grid') {
      if (items[focused]) items[focused].el.classList.remove('focused');
      hideGlass();
    }
    zone = z;
  }

  /** The pill straight above a dock tile, by horizontal distance. */
  function pillAbove(i) {
    var cx = tileLeft(i) - offset + TILE_W / 2, best = 0, bestD = Infinity;
    pills.forEach(function (p, k) {
      var r = p.getBoundingClientRect();
      var d = Math.abs(r.left + r.width / 2 - cx);
      if (d < bestD) { bestD = d; best = k; }
    });
    return best;
  }

  // ---- top bar -------------------------------------------------------------------------------

  function updateClock() {
    var now = new Date(), h = now.getHours();
    for (var k = 0; k < GREETINGS.length; k++) {
      if (h < GREETINGS[k][0]) { $('greeting').textContent = GREETINGS[k][1]; break; }
    }
    var m = now.getMinutes();
    if (CONFIG.clock24) {
      $('clock').textContent = (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
      $('ampm').textContent = '';
    } else {
      $('clock').textContent = ((h % 12) || 12) + ':' + (m < 10 ? '0' : '') + m;
      $('ampm').textContent = h < 12 ? L.ampm[0] : L.ampm[1];
    }
    $('date').textContent = L.date(now);
    if (window.INFINITI_LUNAR && window.INFINITI_LUNAR.render) window.INFINITI_LUNAR.render();
  }

  /** Shows the Wi-Fi network name when the TV reports it, otherwise the connection type. */
  function watchNetwork() {
    luna('luna://com.palm.connectionmanager/getStatus', { subscribe: true }, function (res) {
      if (res.returnValue === false && !res.wifi && !res.wired) return;
      var text = 'Wi-Fi';
      if (res.wired && res.wired.state === 'connected') text = L.wired;
      else if (res.wifi && res.wifi.state === 'connected') text = res.wifi.ssid || 'Wi-Fi';
      else if (res.isInternetConnectionAvailable === false) text = L.offline;
      $('wifiLabel').textContent = text;
    });
  }

  function activatePill(i) {
    if (i === 0) showInputs();
    else if (i === 1) launch('com.palm.app.settings', 'Settings', { target: 'network' });
    else if (i === 2) launch('com.palm.app.settings', 'Settings');
    else if (i === 3 && window.INFINITI_CUSTOMIZE_OPEN) window.INFINITI_CUSTOMIZE_OPEN();
  }

  // Wallpaper is configured inside Customize > Giao diện, not as a top-row pill.
  // The optional root service writes wall.js with the authenticated phone URL.
  function loadWallUrl(cb) {
    var old = $('wallJs');
    if (old && old.parentNode) old.parentNode.removeChild(old);
    window.WALL_URL = '';
    window.WALL_EXPIRES = 0;
    var sc = document.createElement('script');
    sc.id = 'wallJs';
    sc.src = 'wall.js?ts=' + Date.now();
    sc.onload = function () {
      // Expired heartbeat means a stopped root service, not a valid QR.
      if ($('wallJs') !== sc) return;
      cb(window.WALL_EXPIRES > Date.now() ? (window.WALL_URL || '') : '');
    };
    sc.onerror = function () { if ($('wallJs') === sc) cb(''); };
    document.body.appendChild(sc);
  }
  window.INFINITI_WALLPAPER_GET_URL = loadWallUrl;

  // ---- tiles-per-row picker (the pencil next to the dock) ------------------------------------

  function focusPen() {
    setZone('pen');
    hideHero();
    // The pencil is fixed outside the scrolling viewport.
    pen.classList.add('focused');
  }

  function showCols() {
    colsPanel.innerHTML = '';
    var title = document.createElement('div');
    title.className = 'colsTitle';
    title.textContent = L.colsTitle;
    colsPanel.appendChild(title);
    var row = document.createElement('div');
    row.className = 'colsRow';
    colCells = COLS_CHOICES.map(function (n, k) {
      var c = document.createElement('div');
      c.className = 'colCell' + (n === COLUMNS ? ' current' : '');
      c.textContent = n;
      c.addEventListener('mouseover', function () { focusCol(k); });
      c.addEventListener('click', function () { applyCols(n); });
      row.appendChild(c);
      return c;
    });
    colsPanel.appendChild(row);
    arrangeBtn = document.createElement('div');
    arrangeBtn.className = 'arrangeBtn';
    arrangeBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="' + ICON_MOVE + '"/></svg>';
    arrangeBtn.appendChild(document.createTextNode(L.arrange));
    arrangeBtn.addEventListener('mouseover', function () { focusArrangeBtn(); });
    arrangeBtn.addEventListener('click', function () { startArrange(); });
    colsPanel.appendChild(arrangeBtn);

    // Above the dock, right-aligned with the pencil.
    colsPanel.style.right = '44px';
    colsPanel.style.bottom = Math.round(1080 - (DOCK_TOP - 28 - 24)) + 'px';
    colsPanel.classList.remove('hidden');
    pen.classList.remove('focused');
    zone = 'cols';
    focusCol(Math.max(0, COLS_CHOICES.indexOf(COLUMNS)));
  }

  function focusCol(i) {
    if (colCells[colFocus]) colCells[colFocus].classList.remove('focused');
    arrangeBtn.classList.remove('focused');
    colRow = 0;
    colFocus = Math.max(0, Math.min(i, colCells.length - 1));
    colCells[colFocus].classList.add('focused');
  }

  function focusArrangeBtn() {
    if (colCells[colFocus]) colCells[colFocus].classList.remove('focused');
    colRow = 1;
    arrangeBtn.classList.add('focused');
  }

  // ---- "Rearrange apps": click an app to pick it up, point, click to drop; Done or Back ends ----

  function startArrange() {
    colsPanel.classList.add('hidden');
    arranging = true;
    document.body.classList.add('arranging');
    $('arrangeText').textContent = L.arrangeHint;
    $('arrangeDone').textContent = L.done;
    zone = 'none';
    focusTile(Math.min(focused, items.length - 1));
  }

  function stopArrange() {
    if (editing) finishEdit(true);
    arranging = false;
    document.body.classList.remove('arranging');
    focusTile(focused);
  }

  function hideCols() {
    colsPanel.classList.add('hidden');
    zone = 'none';
    focusPen();
  }

  function applyCols(n) { hideCols(); }

  // ---- inputs dropdown -----------------------------------------------------------------------

  function showInputs() {
    panel.innerHTML = '';
    inputRows = [];
    var inputs = (window.TV_APPS && TV_APPS.inputs) || [];
    var gh = window.INFINITI_GLASSHOUSE;
    var hasTuner = false;
    inputs.forEach(function (inp) {
      if (inp.tuner) hasTuner = true;
      addInputRow(ICON_INPUT, inp.label, inp.appId, inp.kind);
    });
    // The Glasshouse catalogue already includes Live TV as a tuner input.
    if (CONFIG.liveTvApp && !(gh && gh.enabled && hasTuner)) {
      if (inputRows.length) {
        var separator = document.createElement('div');
        separator.className = 'separator';
        panel.appendChild(separator);
      }
      addInputRow(ICON_LIVETV, L.liveTv, CONFIG.liveTvApp);
    }
    if (!inputRows.length) { toast(L.noInputs); return; }

    // Hang right below the Inputs pill, at least as wide as it.
    var r = pills[0].getBoundingClientRect();
    panel.style.left = r.left + 'px';
    panel.style.top = (r.bottom + 20) + 'px';
    panel.style.minWidth = Math.max(r.width, 300) + 'px';
    panel.classList.remove('hidden');
    pills[pillFocus].classList.remove('focused');
    zone = 'inputs';
    focusInput(0);
  }

  function addInputRow(icon, label, appId, kind) {
    var row = document.createElement('div');
    row.className = 'inputRow';
    row.innerHTML = '<svg viewBox="0 0 24 24"><path d="' + icon + '"/></svg>';
    row.appendChild(document.createTextNode(label));
    var idx = inputRows.length;
    row.addEventListener('mouseover', function () { focusInput(idx); });
    row.addEventListener('click', function () { hideInputs(); openInputRow(row); });
    row.appId = appId;
    row.label = label;
    row.kind = kind || 'app';
    inputRows.push(row);
    panel.appendChild(row);
  }

  function openInputRow(row) {
    if (!row) return;
    var gh = window.INFINITI_GLASSHOUSE;
    if (row.kind === 'input' && gh && gh.enabled) {
      gh.openInput(row.appId, function (err) {
        if (err) toast(L.cantOpen + row.label);
      });
      return;
    }
    launch(row.appId, row.label);
  }

  function focusInput(i) {
    if (inputRows[inputFocus]) inputRows[inputFocus].classList.remove('focused');
    inputFocus = Math.max(0, Math.min(i, inputRows.length - 1));
    inputRows[inputFocus].classList.add('focused');
  }

  function hideInputs() {
    panel.classList.add('hidden');
    zone = 'none';
    focusPill(0);
  }

  // ---- rearranging ---------------------------------------------------------------------------

  /** Hold OK on a tile: it wiggles, the arrows move it, OK places it, Back puts everything back. */
  function startEdit() {
    var it = items[focused];
    if (!it) return;
    editing = { item: it, snapshot: items.slice() };
    it.el.classList.add('moving');
    document.body.classList.add('editing');
    if (!arranging) toast(L.moveHint);
  }

  function moveTo(to) {
    if (to < 0 || to >= items.length || to === focused) return;
    items.splice(to, 0, items.splice(focused, 1)[0]);
    focused = to;
    layout();
    focusTile(to);
  }

  function finishEdit(keep) {
    var it = editing.item;
    if (!keep) {
      items = editing.snapshot;
      layout();
    }
    editing = null;
    it.el.classList.remove('moving');
    document.body.classList.remove('editing');
    if (keep) saveOrder();
    focused = items.indexOf(it);
    focusTile(focused);
  }

  // ---- keys ----------------------------------------------------------------------------------

  var LONG_PRESS_MS = 600;
  var okDown = false, okTimer = null;

  // On tiles OK acts on release, so a held OK can start rearranging instead of opening the app.
  document.addEventListener('keyup', function (e) {
    if (launcherCovered()) return;
    // Leave remote and LG keyboard events to the active settings dialog.
    if (window.INFINITI_CUSTOMIZE_IS_OPEN && window.INFINITI_CUSTOMIZE_IS_OPEN()) return;
    if (e.keyCode !== KEY.OK) return;
    okDown = false;
    if (!okTimer) return;
    clearTimeout(okTimer);
    okTimer = null;
    var it = items[focused];
    if (zone === 'grid' && it && !editing) launch(it.app.id, it.app.title);
  });

  document.addEventListener('keydown', function (e) {
    if (launcherCovered()) return;
    // Leave remote and LG keyboard events to the active settings/AI dialog.
    if (window.INFINITI_CUSTOMIZE_IS_OPEN && window.INFINITI_CUSTOMIZE_IS_OPEN()) return;
    var k = e.keyCode;
    if (k >= KEY.LEFT && k <= KEY.DOWN) {
      var now = Date.now();
      if (now - lastArrowAt < 48) { e.preventDefault(); return; }
      lastArrowAt = now;
    }
    if (k === KEY.OK && okDown) { e.preventDefault(); return; }   // key repeat while held
    if (k === KEY.OK) okDown = true;
    if (editing) {
      if (k === KEY.LEFT) moveTo(focused - 1);
      else if (k === KEY.RIGHT) moveTo(focused + 1);
      else if (k === KEY.OK) finishEdit(true);
      else if (k === KEY.BACK || k === KEY.ESC) finishEdit(false);
      else return;
    } else if (zone === 'inputs') {
      if (k === KEY.UP) focusInput(inputFocus - 1);
      else if (k === KEY.DOWN) focusInput(inputFocus + 1);
      else if (k === KEY.OK) { var row = inputRows[inputFocus]; hideInputs(); openInputRow(row); }
      else if (k === KEY.BACK || k === KEY.ESC || k === KEY.LEFT || k === KEY.RIGHT) hideInputs();
      else return;
    } else if (zone === 'cols') {
      if (k === KEY.LEFT && colRow === 0) focusCol(colFocus - 1);
      else if (k === KEY.RIGHT && colRow === 0) focusCol(colFocus + 1);
      else if (k === KEY.DOWN && colRow === 0) focusArrangeBtn();
      else if (k === KEY.UP && colRow === 1) focusCol(colFocus);
      else if (k === KEY.OK) { if (colRow === 1) startArrange(); else applyCols(COLS_CHOICES[colFocus]); }
      else if (k === KEY.BACK || k === KEY.ESC || k === KEY.UP || k === KEY.DOWN) hideCols();
      else if (k !== KEY.LEFT && k !== KEY.RIGHT) return;
    } else if (zone === 'pen') {
      if (k === KEY.LEFT) focusTile(lastDock());
      else if (k === KEY.UP) focusPill(pills.length - 1);
      else if (k === KEY.DOWN) focusTile(lastDock());
      else if (k === KEY.OK) showCols();
      else if (k === KEY.BACK) { /* home screen: Back goes nowhere */ }
      else return;
    } else if (zone === 'top') {
      if (k === KEY.LEFT) focusPill(pillFocus - 1);
      else if (k === KEY.RIGHT) focusPill(pillFocus + 1);
      else if (k === KEY.DOWN) focusTile(Math.max(0, focused));
      else if (k === KEY.OK) activatePill(pillFocus);
      else if (k === KEY.BACK) { /* home screen: Back goes nowhere */ }
      else return;
    } else {
      var last = items.length - 1;
      if (arranging && k === KEY.OK) { startEdit(); e.preventDefault(); return; }
      if (arranging && (k === KEY.BACK || k === KEY.ESC)) { stopArrange(); e.preventDefault(); return; }
      if (k === KEY.LEFT) { if (focused > 0) focusTile(focused - 1); }
      else if (k === KEY.RIGHT) {
        if (focused < last) focusTile(focused + 1);
        else if (!arranging) focusPen();
      }
      else if (k === KEY.UP) {
        if (!arranging) focusPill(pillAbove(focused));
      } else if (k === KEY.DOWN) {
        // There is no second row of apps.
      } else if (k === KEY.OK) {
        okTimer = setTimeout(function () { okTimer = null; startEdit(); }, LONG_PRESS_MS);
      } else if (k === KEY.BACK) { /* home screen: Back goes nowhere */ }
      else return;
    }
    e.preventDefault();
  });

  var lastWheelAt = 0;
  $('viewport').addEventListener('wheel', function(e) {
    if (launcherCovered() || editing || arranging || (zone !== 'grid' && zone !== 'pen')) return;
    var delta = Math.abs(e.deltaX || 0) > Math.abs(e.deltaY || 0) ? e.deltaX : e.deltaY;
    if (!delta) return;
    e.preventDefault();
    var now = Date.now();
    if (now-lastWheelAt < 160) return;
    lastWheelAt=now;
    focusTile(focused+(delta>0?1:-1));
  });
  pen.addEventListener('mouseover', function () { if (zone !== 'inputs' && zone !== 'wall' && zone !== 'cols' && !editing && !arranging) focusPen(); });
  pen.addEventListener('click', function () { if (!editing && !arranging) showCols(); });
  $('arrangeDone').addEventListener('click', stopArrange);

  pills.forEach(function (p, i) {
    p.addEventListener('mouseover', function () { if (zone !== 'inputs' && zone !== 'wall' && zone !== 'cols') focusPill(i); });
    p.addEventListener('click', function () { activatePill(i); });
  });

  // ---- lifecycle -----------------------------------------------------------------------------

  /** Back from another app (or opened again from the shortcut): replay the entrance, keep the tile. */
  var lastResumeAt = 0;
  function resume() {
    if (launcherCovered()) return;
    var now = Date.now();
    if (now - lastResumeAt < 850) return; // one repaint per Home/wake burst
    lastResumeAt = now;
    if (editing) finishEdit(false);
    if (arranging) { arranging = false; document.body.classList.remove('arranging'); }
    updateClock();
    if (zone === 'inputs') panel.classList.add('hidden');
    if (zone === 'cols') colsPanel.classList.add('hidden');
    pen.classList.remove('focused');
    pills.forEach(function (p) { p.classList.remove('focused'); });
    zone = 'none';
    refreshApps(function (changed) {
      if (launcherCovered()) return;
      if (!changed) {
        animateIn();
        if (items.length) focusTile(Math.max(0, Math.min(focused, items.length - 1)));
      }
    });
  }

  /**
   * Re-reads apps.js, which sync.js rewrites whenever an app is installed or removed. A page on
   * webOS 6 cannot fetch a local file with XHR, so the script is simply added again.
   */
  function appsFingerprint() {
    var all = (window.TV_APPS && TV_APPS.apps) || [];
    return JSON.stringify(all.map(function (a) { return [a.id,a.title,a.icon,a.iconColor]; }).sort()) + JSON.stringify((window.TV_APPS && TV_APPS.inputs) || []);
  }
  var appsSeen = appsFingerprint();

  function refreshApps(cb) {
    if (launcherCovered()) { cb(false); return; }
    var gh = window.INFINITI_GLASSHOUSE;
    if (gh && gh.enabled) {
      gh.refresh(function (changed) {
        if (launcherCovered()) { cb(false); return; }
        if (!changed) { cb(false); return; }
        appsSeen = appsFingerprint();
        build();
        focused = Math.max(0, Math.min(focused, items.length - 1));
        animateIn();
        if (items.length) focusTile(focused);
        cb(true);
      });
      return;
    }
    var old = $('appsJs');
    if (old) old.parentNode.removeChild(old);
    var sc = document.createElement('script');
    sc.id = 'appsJs';
    sc.src = 'apps.js?t=' + Date.now();
    sc.onload = function () {
      if (launcherCovered()) { cb(false); return; }
      var now = appsFingerprint();
      if (now === appsSeen) { cb(false); return; }   // nothing installed or removed
      appsSeen = now;
      build();
      focused = Math.max(0, Math.min(focused, items.length - 1));
      animateIn();
      focusTile(focused);
      cb(true);
    };
    sc.onerror = function () { cb(false); };
    document.body.appendChild(sc);
  }

  // V8.4: only a fresh launch challenge may acknowledge browser-side render.
  var renderRequest=0;
  function acknowledgeRender(params) {
    if (!params || typeof params.infinitiRenderToken!=='string' ||
        !/^[a-f0-9]{48}$/.test(params.infinitiRenderToken) ||
        typeof params.infinitiRenderPort!=='number' ||
        params.infinitiRenderPort%1!==0 || params.infinitiRenderPort<1024 ||
        params.infinitiRenderPort>65535) return;
    var id=++renderRequest, until=Date.now()+12000;
    var frame=window.requestAnimationFrame || function(cb){setTimeout(cb,32);};
    function check(){
      if(id!==renderRequest || Date.now()>until)return;
      var tiles=tilesEl.querySelectorAll('.item.shown');
      var anchor=tiles.length?tiles[0]:$('noApps');
      if (items.length && tiles.length!==items.length) {setTimeout(check,100);return;}
      var rect=anchor && anchor.getBoundingClientRect();
      if(launcherCovered() || !rect || rect.width<=0 || rect.height<=0 ||
          !document.body || !document.body.clientWidth || !document.body.clientHeight){
        setTimeout(check,100);return;
      }
      frame(function(){frame(function(){
        if(id!==renderRequest || launcherCovered()){setTimeout(check,100);return;}
        var image=new Image();
        image.src='http://127.0.0.1:'+params.infinitiRenderPort+'/render/'+params.infinitiRenderToken+'/'+tiles.length;
        // Image beacon needs no CORS privileges. Server checks the random token.
        window.INFINITI_RENDER_BEACON=image;
      });});
    }
    check();
  }
  function readLaunchParams(){
    try {return window.PalmSystem?JSON.parse(PalmSystem.launchParams||'{}'):{};}
    catch(e){return {};}
  }

  // The wallpaper page relaunches us with {reload: true} after changing the wallpaper.
  document.addEventListener('webOSRelaunch', function (e) {
    var p = (e && e.detail) || {};
    if (!p.reload && window.PalmSystem) { try { p = JSON.parse(PalmSystem.launchParams || '{}'); } catch (x) { p = {}; } }
    if (p.reload) { location.reload(); return; }
    idleReset();resume();
    acknowledgeRender(p.infinitiRenderToken?p:readLaunchParams());
  });
  // Glasshouse owns Home and wake; this app never launches itself on resume.
  var clockTicker = null, appsTicker = null;
  function pauseForeground() {
    idleClear();idleShow();idleWakeKey=0;idleClickUntil=0;
    if (clockTicker !== null) { clearInterval(clockTicker); clockTicker = null; }
    if (appsTicker !== null) { clearInterval(appsTicker); appsTicker = null; }
    clearEntranceTimers();
    clearTimeout(hero.swap);
    if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; }
    resetDialogOk();
    document.body.classList.add('launcher-covered');
  }
  function startForeground() {
    if (launcherCovered()) return;
    idleReset();
    document.body.classList.remove('launcher-covered');
    if (clockTicker === null) clockTicker = setInterval(updateClock, 10000);
    if (appsTicker === null) appsTicker = setInterval(function () {
      if (!launcherCovered() &&
          !(window.INFINITI_CUSTOMIZE_IS_OPEN && window.INFINITI_CUSTOMIZE_IS_OPEN()))
        refreshApps(function () {});
    }, 30000);
  }
  function onLauncherVisible() {
    startForeground();
    resume();
  }
  if (lifecycle) {
    lifecycle.subscribe(function (covered) {
      if (covered) pauseForeground();
      else onLauncherVisible();
    });
    lifecycle.onHome(function () {
      if (launcherCovered()) return;
      if (window.INFINITI_CUSTOMIZE_CLOSE) window.INFINITI_CUSTOMIZE_CLOSE();
      onLauncherVisible();
    });
  } else {
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) pauseForeground();
      else onLauncherVisible();
    });
  }

  window.INFINITI_LAUNCHER_REFRESH = function () {
    if (editing) finishEdit(false);
    if (arranging) stopArrange();
    var oldIndex = focused;
    build();
    appsSeen = appsFingerprint();
    focused = Math.max(0, Math.min(oldIndex, items.length - 1));
    animateIn();
    if (items.length) focusTile(focused);
    else focusPill(pills.length - 1);
  };
  window.INFINITI_LAUNCHER_LAYOUT_REFRESH = function () {
    cachedHeaderBottom = null;
  };
  function resetDialogOk() {
    // The dialog captures the OK keyup, so do not leave the launcher stuck in key-repeat mode.
    okDown = false;
    if (okTimer) { clearTimeout(okTimer); okTimer = null; }
  }
  window.INFINITI_CUSTOMIZE_CLOSED = function () {
    resetDialogOk(); focusPill(pills.length - 1);idleReset();
  };
  // Wallpaper settings now open within the Customize panel.
  build();
  updateClock();
  // Foreground timers are started below and suspended while Glasshouse covers the launcher.
  document.documentElement.lang = CONFIG.language === 'vi' ? 'vi' : 'en';
  pills[0].querySelector('span').textContent = L.inputs;
  pills[2].querySelector('span').textContent = L.settings;
  watchNetwork();
  if (launcherCovered()) pauseForeground();
  else startForeground();
  animateIn();
  zone = 'none';
  if (items.length) focusTile(0);
  else focusPill(pills.length - 1);
  acknowledgeRender(readLaunchParams());
})();
