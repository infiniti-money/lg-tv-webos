/* Infiniti TV Home settings: ES5 for LG webOS 3.x / Chromium 38.
 * Local changes affect only launcher appearance and weather, not TV system settings.
 */
(function (root) {
  'use strict';
  var VISIBILITY_KEY = 'tvhome.visibility.v1';
  var APPEARANCE_KEY = 'tvhome.appearance.v1';
  var WEATHER_KEY = 'tvhome.weather.v1';
  var cache = {};
  var defaults = {
    theme:'midnight', font:'lexend', largeText:false, showWeek:true,
    reduceMotion:false, showSolar:true, showLunar:true
  };
  var THEMES = ['midnight','ocean','amber'];
  var FONTS = ['lexend','sans','serif'];
  // Offline quick picks; more provinces/districts can be found using Open-Meteo geocoding.
  var PRESETS = [
    {place:'Hà Nội',latitude:21.0285,longitude:105.8542},
    {place:'Hải Phòng',latitude:20.8449,longitude:106.6881},
    {place:'Hưng Yên',latitude:20.6464,longitude:106.0511},
    {place:'Đà Nẵng',latitude:16.0678,longitude:108.2208},
    {place:'Huế',latitude:16.4637,longitude:107.5909},
    {place:'TP. Hồ Chí Minh',latitude:10.8231,longitude:106.6297},
    {place:'Cần Thơ',latitude:10.0452,longitude:105.7469},
    {place:'Đà Lạt',latitude:11.9404,longitude:108.4583}
  ];
  function safeRead(key) {
    var obj = null;
    try {
      if (typeof localStorage !== 'undefined') obj = JSON.parse(localStorage.getItem(key) || 'null');
    } catch (e) {}
    if (!obj && cache[key]) obj = cache[key];
    return obj && typeof obj === 'object' && !Array.isArray(obj) ? obj : {};
  }
  function safeWrite(key, data) {
    cache[key] = data;
    try { if (typeof localStorage !== 'undefined') localStorage.setItem(key, JSON.stringify(data)); }
    catch (e) { return false; }
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
    safeWrite(VISIBILITY_KEY, clean);
    return true;
  }
  function resetVisible() { safeWrite(VISIBILITY_KEY, {}); }
  function getAppearance() {
    var data = safeRead(APPEARANCE_KEY);
    return {
      theme: THEMES.indexOf(data.theme) < 0 ? defaults.theme : data.theme,
      font: FONTS.indexOf(data.font) < 0 ? defaults.font : data.font,
      largeText: data.largeText === true,
      showWeek: data.showWeek !== false,
      reduceMotion: data.reduceMotion === true,
      showSolar: data.showSolar !== false,
      showLunar: data.showLunar !== false
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
    safeWrite(WEATHER_KEY, current);
    return current;
  }
  var api = {
    isVisible:isVisible, setVisible:setVisible, resetVisible:resetVisible,
    getAppearance:getAppearance, saveAppearance:saveAppearance,
    getWeather:getWeather, saveWeather:saveWeather,
    validCoords:validCoords, isProtected:isProtected
  };
  root.INFINITI_PREFS = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof document === 'undefined') return;

  var $ = function (id) { return document.getElementById(id); };
  var panel = $('customizePanel');
  if (!panel) return;
  var tabs = {
    apps:$('customizeAppsTab'), style:$('customizeStyleTab'),
    weather:$('customizeWeatherTab'), calendar:$('customizeCalendarTab')
  };
  var views = {
    apps:$('customizeAppsView'), style:$('customizeStyleView'),
    weather:$('customizeWeatherView'), calendar:$('customizeCalendarView')
  };
  var appsList = $('customizeAppList'), themeBox = $('customizeThemes');
  var fontBox = $('customizeFonts'), status = $('customizeStatus');
  var opened = false, activeTab = 'style', searchRequest = null;

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
  function renderApps() {
    appsList.innerHTML = '';
    var all = (root.TV_APPS && root.TV_APPS.apps) || [], installed = [];
    all.forEach(function (app) {
      if (app && app.id && !isProtected(app.id)) installed.push(app);
    });
    installed.sort(function (a, b) {
      var aa = String(a.title || a.id).toLowerCase();
      var bb = String(b.title || b.id).toLowerCase();
      return aa < bb ? -1 : aa > bb ? 1 : 0;
    });
    if (!installed.length) {
      var empty = document.createElement('p');
      empty.textContent = 'Chưa có danh sách ứng dụng. Chạy đồng bộ ứng dụng trên TV.';
      appsList.appendChild(empty);
      return;
    }
    installed.forEach(function (app) {
      var row = document.createElement('div');
      row.className = 'customizeApp';
      var name = document.createElement('span');
      name.textContent = String(app.title || app.id);
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
      appsList.appendChild(row);
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
  function refreshToggles() {
    var a = getAppearance();
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
    var w = getWeather(), presetBox = $('customizeWeatherPresets');
    $('customizeWeatherChoice').textContent = w.place ?
      'Khu vực đang chọn: ' + w.place : 'Chưa chọn khu vực';
    $('customizeWeatherEnable').textContent = w.enabled ? 'Đang bật thời tiết · Tắt' : 'Đang tắt thời tiết · Bật';
    $('customizeWeatherUnit').textContent = w.unit === 'fahrenheit' ? 'Đơn vị: °F' : 'Đơn vị: °C';
    presetBox.innerHTML = '';
    PRESETS.forEach(function (city) {
      addButton(presetBox, city.place, function () { selectRegion(city); },
        w.place === city.place);
    });
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
    activeTab = name;
    var key;
    for (key in tabs) {
      if (!Object.prototype.hasOwnProperty.call(tabs, key)) continue;
      tabs[key].className = key === name ? 'selected' : '';
      if (key === name) views[key].classList.remove('hidden');
      else views[key].classList.add('hidden');
    }
    if (name === 'apps') renderApps();
    else if (name === 'style') renderStyle();
    else if (name === 'weather') renderWeather();
    else renderCalendar();
    message('');
  }
  function show() {
    opened = true;
    panel.classList.remove('hidden');
    activateTab('style');
    tabs.style.focus();
  }
  function hide() {
    if (searchRequest) { searchRequest.abort(); searchRequest = null; }
    opened = false;
    panel.classList.add('hidden');
    if (typeof root.INFINITI_CUSTOMIZE_CLOSED === 'function') root.INFINITI_CUSTOMIZE_CLOSED();
  }
  function visibleControls() {
    // Inputs must participate in remote navigation, not only Magic Remote pointer clicks.
    var all = panel.querySelectorAll('button, input'), result = [];
    for (var i = 0; i < all.length; i++) {
      if (all[i].offsetWidth > 0 && all[i].offsetHeight > 0) result.push(all[i]);
    }
    return result;
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
    // Let the LG on-screen keyboard enter characters and use Backspace naturally.
    if (active === search) {
      if (code === 461 || code === 27) { stopKey(e); if (e.type === 'keydown') hide(); return; }
      if (code === 13) { stopKey(e); if (e.type === 'keydown') searchRegion(); return; }
      if ((code === 40 || code === 38) && e.type === 'keydown') {
        stopKey(e);
        var target = code === 40 ?
          ($('customizeWeatherResults').querySelector('button') || $('customizeWeatherSearchBtn')) :
          $('customizeWeatherSearchBtn');
        if (target) target.focus();
        return;
      }
      e.stopPropagation();
      if (e.stopImmediatePropagation) e.stopImmediatePropagation();
      return;
    }
    stopKey(e);
    if (e.type === 'keyup') return;
    if (code === 461 || code === 27) { hide(); return; }
    var buttons = visibleControls(), i = buttons.indexOf(active);
    if (code === 13) { if (active && typeof active.click === 'function') active.click(); return; }
    if (code === 37 || code === 38 || code === 39 || code === 40) {
      var step = code === 37 || code === 38 ? -1 : 1;
      var next = Math.max(0, Math.min(buttons.length - 1, i + step));
      if (buttons[next]) {
        buttons[next].focus();
        if (buttons[next].scrollIntoView) buttons[next].scrollIntoView(false);
      }
    }
  }
  document.addEventListener('keydown', keyHandler, true);
  document.addEventListener('keyup', keyHandler, true);
  Object.keys(tabs).forEach(function (name) {
    tabs[name].addEventListener('click', function () { activateTab(name); tabs[name].focus(); });
  });
  $('customizeClose').addEventListener('click', hide);
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
  appearanceToggle('customizeSolar','showSolar');
  appearanceToggle('customizeLunar','showLunar');
  $('customizeWallpaper').addEventListener('click', function () {
    hide();
    if (typeof root.INFINITI_WALLPAPER_OPEN === 'function') root.INFINITI_WALLPAPER_OPEN();
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
  root.INFINITI_CUSTOMIZE_OPEN = show;
  root.INFINITI_CUSTOMIZE_IS_OPEN = function () { return opened; };
  applyAppearance();
})(typeof window !== 'undefined' ? window : this);
