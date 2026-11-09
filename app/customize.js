/* Customize Infiniti TV Home: ES5, Chromium 38, LG remote arrow/OK/Back.
 * Only changes launcher visibility, never uninstalls real TV applications.
 */
(function (root) {
  'use strict';
  var VISIBILITY_KEY = 'tvhome.visibility.v1', APPEARANCE_KEY = 'tvhome.appearance.v1';
  var cache = {};
  var defaults = {theme:'midnight', font:'lexend', largeText:false, showWeek:true};
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
    cache[key] = data;
    try { if (typeof localStorage !== 'undefined') localStorage.setItem(key, JSON.stringify(data)); }
    catch (e) { return false; }
    return true;
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
      showWeek: data.showWeek !== false
    };
  }
  function saveAppearance(newData) {
    var current = getAppearance(), key;
    for (key in newData) {
      if (Object.prototype.hasOwnProperty.call(newData, key)) current[key] = newData[key];
    }
    current.theme = THEMES.indexOf(current.theme) < 0 ? 'midnight' : current.theme;
    current.font = FONTS.indexOf(current.font) < 0 ? 'lexend' : current.font;
    current.largeText = current.largeText === true;
    current.showWeek = current.showWeek !== false;
    safeWrite(APPEARANCE_KEY, current);
    return current;
  }
  var api = {
    isVisible:isVisible, setVisible:setVisible, resetVisible:resetVisible,
    getAppearance:getAppearance, saveAppearance:saveAppearance, isProtected:isProtected
  };
  root.INFINITI_PREFS = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof document === 'undefined') return;

  var panel = document.getElementById('customizePanel');
  if (!panel) return;
  var appTab = document.getElementById('customizeAppsTab');
  var styleTab = document.getElementById('customizeStyleTab');
  var appsView = document.getElementById('customizeAppsView');
  var styleView = document.getElementById('customizeStyleView');
  var appsList = document.getElementById('customizeAppList');
  var themeBox = document.getElementById('customizeThemes');
  var fontBox = document.getElementById('customizeFonts');
  var status = document.getElementById('customizeStatus');
  var opened = false, tab = 'apps';

  function applyAppearance() {
    var a = getAppearance(), body = document.body;
    ['theme-ocean','theme-amber','font-sans','font-serif','font-large','forecast-hidden'].forEach(function (name) {
      body.classList.remove(name);
    });
    if (a.theme !== 'midnight') body.classList.add('theme-' + a.theme);
    if (a.font !== 'lexend') body.classList.add('font-' + a.font);
    if (a.largeText) body.classList.add('font-large');
    if (!a.showWeek) body.classList.add('forecast-hidden');
  }
  function text(v) { status.textContent = v; }
  function focusFirst() { appTab.focus(); }
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
    var all = (root.TV_APPS && root.TV_APPS.apps) || [];
    var installed = [];
    all.forEach(function (a) {
      if (a && a.id && !isProtected(a.id)) installed.push(a);
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
        if (!setVisible(app.id, !visible)) {
          text('Không thể thay đổi ứng dụng hệ thống.'); return;
        }
        visible = !visible;
        toggle.textContent = visible ? 'Ẩn khỏi Home' : 'Thêm vào Home';
        toggle.className = visible ? 'selected' : '';
        refreshLauncher();
        text((visible ? 'Đã thêm: ' : 'Đã ẩn: ') + (app.title || app.id));
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
      addButton(themeBox, entry[1], function () {
        saveAppearance({theme:entry[0]});
        applyAppearance(); renderStyle();
        text('Đã đổi giao diện: ' + entry[1]);
      }, a.theme === entry[0]);
    });
    [
      ['lexend','Lexend tiếng Việt'],['sans','Arial hiện đại'],['serif','Georgia cổ điển']
    ].forEach(function (entry) {
      addButton(fontBox, entry[1], function () {
        saveAppearance({font:entry[0]});
        applyAppearance(); renderStyle();
        text('Đã đổi phông chữ: ' + entry[1]);
      }, a.font === entry[0]);
    });
    document.getElementById('customizeLargeText').textContent =
      a.largeText ? 'Cỡ chữ lớn: Bật' : 'Cỡ chữ lớn: Tắt';
    document.getElementById('customizeShowWeek').textContent =
      a.showWeek ? 'Dự báo 7 ngày: Hiện' : 'Dự báo 7 ngày: Ẩn';
  }
  function activateTab(name) {
    tab = name;
    if (name === 'apps') {
      appsView.classList.remove('hidden');
      styleView.classList.add('hidden');
      renderApps();
    } else {
      appsView.classList.add('hidden');
      styleView.classList.remove('hidden');
      renderStyle();
    }
    appTab.className = name === 'apps' ? 'selected' : '';
    styleTab.className = name === 'style' ? 'selected' : '';
    text('');
  }
  function show() {
    opened = true;
    panel.classList.remove('hidden');
    activateTab('apps');
    focusFirst();
  }
  function hide() {
    opened = false;
    panel.classList.add('hidden');
    if (typeof root.INFINITI_CUSTOMIZE_CLOSED === 'function') root.INFINITI_CUSTOMIZE_CLOSED();
  }
  function visibleButtons() {
    var all = panel.querySelectorAll('button'), result = [];
    for (var i = 0; i < all.length; i++) {
      // Hidden tabs' buttons have no offsetParent (except a fixed-position ancestor).
      if (all[i].offsetWidth > 0 && all[i].offsetHeight > 0) result.push(all[i]);
    }
    return result;
  }
  function keyHandler(e) {
    var code = e.keyCode || e.which;
    if (!opened) {
      if (e.type === 'keydown' && code === 403) {
        e.preventDefault();
        e.stopPropagation();
        if (e.stopImmediatePropagation) e.stopImmediatePropagation();
        show();
      }
      return;
    }
    // Prevent launcher OK-key long-press and arrow navigation while the dialog is open.
    e.preventDefault();
    e.stopPropagation();
    if (e.stopImmediatePropagation) e.stopImmediatePropagation();
    if (e.type === 'keyup') return;
    if (code === 461 || code === 27) { hide(); return; }
    var buttons = visibleButtons(), active = document.activeElement;
    var i = buttons.indexOf(active);
    if (code === 13) {
      if (active && typeof active.click === 'function') active.click();
      return;
    }
    if (code === 37 || code === 38 || code === 39 || code === 40) {
      var next = i + (code === 37 || code === 38 ? -1 : 1);
      next = Math.max(0, Math.min(buttons.length - 1, next));
      if (buttons[next]) {
        buttons[next].focus();
        if (buttons[next].scrollIntoView) buttons[next].scrollIntoView(false);
      }
    }
  }
  document.addEventListener('keydown', keyHandler, true);
  document.addEventListener('keyup', keyHandler, true);
  appTab.addEventListener('click', function () { activateTab('apps'); appTab.focus(); });
  styleTab.addEventListener('click', function () { activateTab('style'); styleTab.focus(); });
  document.getElementById('customizeClose').addEventListener('click', hide);
  document.getElementById('customizeResetApps').addEventListener('click', function () {
    resetVisible();
    refreshLauncher();
    renderApps();
    text('Đã khôi phục danh sách ứng dụng mặc định.');
  });
  document.getElementById('customizeLargeText').addEventListener('click', function () {
    saveAppearance({largeText:!getAppearance().largeText});
    applyAppearance(); renderStyle();
  });
  document.getElementById('customizeShowWeek').addEventListener('click', function () {
    saveAppearance({showWeek:!getAppearance().showWeek});
    applyAppearance(); renderStyle();
  });
  document.getElementById('customizeResetStyle').addEventListener('click', function () {
    saveAppearance(defaults);
    applyAppearance(); renderStyle();
    text('Đã khôi phục giao diện mặc định.');
  });
  root.INFINITI_CUSTOMIZE_OPEN = show;
  root.INFINITI_CUSTOMIZE_IS_OPEN = function () { return opened; };
  applyAppearance();
})(typeof window !== 'undefined' ? window : this);
