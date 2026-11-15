/* Infiniti TV Home: lightweight wallpaper and changeable 3-day weather.
 * ES5 for Chromium 38; weather selection is saved locally by customize.js.
 */
(function () {
  'use strict';
  var C = window.CONFIG || {};
  if (C.wallpaper) {
    var dim = typeof C.wallpaperDim === 'number' ? Math.max(0, Math.min(0.8, C.wallpaperDim)) : 0.35;
    var bg = 'linear-gradient(rgba(0,0,0,' + dim + '), rgba(0,0,0,' + dim + ')), url("' + C.wallpaper +
      '") center / cover no-repeat, #000';
    document.documentElement.style.background = bg;
    document.body.style.background = bg;
  }
  if (C.ambientGlow === false) document.body.classList.add('no-glow');

  var el = document.getElementById('weather');
  var area = document.getElementById('forecastArea');
  var week = document.getElementById('weekWeather');
  var active = null, sequence = 0, lastRegion = '', retryPending = false;
  var weatherTimer = null, retryTimer = null;
  var lifecycle = window.INFINITI_LIFECYCLE || null;
  function covered() { return lifecycle ? lifecycle.isCovered() : !!document.hidden; }
  function pauseWeather() {
    sequence++;
    if (active) { try { active.abort(); } catch (e) {} active = null; }
    if (weatherTimer !== null) { clearInterval(weatherTimer); weatherTimer = null; }
    if (retryTimer !== null) { clearInterval(retryTimer); retryTimer = null; }
  }
  var vi = C.language !== 'en';
  var NAMES = vi ? {
    0:'Trời quang',1:'Ít mây',2:'Có mây',3:'Nhiều mây',45:'Sương mù',48:'Sương mù',
    51:'Mưa phùn',53:'Mưa phùn',55:'Mưa phùn dày',61:'Mưa nhẹ',63:'Mưa vừa',65:'Mưa to',
    71:'Tuyết nhẹ',73:'Tuyết',75:'Tuyết dày',80:'Mưa rào',81:'Mưa rào',82:'Mưa rào lớn',
    95:'Dông',96:'Dông, mưa đá',99:'Dông, mưa đá'
  } : {
    0:'Clear',1:'Mostly clear',2:'Partly cloudy',3:'Cloudy',45:'Fog',48:'Fog',
    51:'Drizzle',53:'Drizzle',55:'Heavy drizzle',61:'Light rain',63:'Rain',65:'Heavy rain',
    71:'Light snow',73:'Snow',75:'Heavy snow',80:'Showers',81:'Showers',82:'Heavy showers',
    95:'Storm',96:'Storm, hail',99:'Storm, hail'
  };
  function weather() {
    var p = window.INFINITI_PREFS;
    return p && p.getWeather ? p.getWeather() : C.weather || {};
  }
  function cell(parent, name, value) {
    var node = document.createElement('div');
    node.className = name;
    node.textContent = value;
    parent.appendChild(node);
  }
  function conditionIcon(text) {
    if (/Nắng|Clear/.test(text)) return '☀';
    if (/Mưa|Rain|Showers|Drizzle/.test(text)) return '☂';
    if (/Dông|Storm/.test(text)) return '⚡';
    return '☁';
  }
  function renderDays(daily) {
    if (!area || !week) return;
    var list = window.INFINITI_FORECAST ? window.INFINITI_FORECAST.prepare(daily, vi) : [];
    week.innerHTML = '';
    if (!list.length) {
      cell(week,'weekEmpty',vi ? 'Chưa có dữ liệu dự báo 3 ngày.' : 'Three-day forecast unavailable.');
    } else {
      for (var i=0; i<list.length; i++) {
        var d=list[i], box=document.createElement('div');
        box.className='weekDay';
        cell(box,'weekLabel',d.label);
        cell(box,'weekDate',d.dateLabel);
        cell(box,'weekCondition',conditionIcon(d.condition)+'  '+d.condition);
        cell(box,'weekTemperature',d.high+'° / '+d.low+'°');
        cell(box,'weekRain',d.rain === null ? '—' :
          (vi ? 'Khả năng mưa ' : 'Rain ') + d.rain + '%');
        week.appendChild(box);
      }
    }
    area.classList.remove('hidden');
  }
  function load() {
    if (covered() || !el || !area || !week) return;
    var w = weather(), valid = typeof w.latitude === 'number' && isFinite(w.latitude) &&
      typeof w.longitude === 'number' && isFinite(w.longitude) &&
      w.latitude >= -90 && w.latitude <= 90 && w.longitude >= -180 && w.longitude <= 180;
    sequence++;
    var serial=sequence;
    if (active) { active.abort(); active=null; }
    var region = w.enabled && valid ?
      [w.latitude,w.longitude,w.unit].join(',') : '';
    if (region !== lastRegion) {
      // Never show the previous city's cards beneath a newly selected city.
      week.innerHTML = '';
      area.classList.add('hidden');
      lastRegion = region;
    }
    if (!w.enabled || !valid) {
      // The old UI made #weather completely transparent when unset. In
      // Glasshouse Custom this looks like a broken feature because app
      // preferences are not shared with the separately installed IPK.
      el.textContent = !w.place ?
        (vi ? 'Chưa chọn khu vực thời tiết · Tùy chỉnh → Thời tiết' :
          'Choose a weather location · Customize → Weather') :
        (!w.enabled ?
          (vi ? 'Thời tiết đang tắt · Tùy chỉnh → Thời tiết' :
            'Weather is off · Customize → Weather') :
          (vi ? 'Khu vực thời tiết không hợp lệ · Vui lòng chọn lại' :
            'Invalid weather location · Please select again'));
      el.className = 'shown';
      retryPending = false;
      area.classList.add('hidden');
      week.innerHTML = '';
      return;
    }
    var fahrenheit=w.unit === 'fahrenheit';
    el.textContent=(w.place ? w.place+' · ' : '')+(vi ? 'Đang cập nhật thời tiết…' : 'Updating weather…');
    el.className='shown';
    var url='https://api.open-meteo.com/v1/forecast?latitude='+
      encodeURIComponent(w.latitude)+'&longitude='+encodeURIComponent(w.longitude)+
      '&current=temperature_2m,weather_code'+
      '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max'+
      '&timezone=auto&forecast_days=3'+(fahrenheit ? '&temperature_unit=fahrenheit' : '');
    var xhr=new XMLHttpRequest();
    active=xhr;
    xhr.open('GET',url,true);
    xhr.timeout=15000;
    xhr.onload=function () {
      if (serial!==sequence) return;
      active=null;
      if (xhr.status<200 || xhr.status>=300) {
        failure(w, 'HTTP ' + xhr.status);
        return;
      }
      try {
        var data=JSON.parse(xhr.responseText), current=data.current || {}, daily=data.daily || {};
        var line=w.place || (vi ? 'Thời tiết khu vực' : 'Local weather');
        if (typeof current.temperature_2m === 'number' && isFinite(current.temperature_2m)) {
          line+=' · '+Math.round(current.temperature_2m)+(fahrenheit?'°F':'°C');
          if (NAMES[current.weather_code]) line+=' · '+NAMES[current.weather_code];
        }
        el.textContent=line;
        retryPending = false;
        renderDays(daily);
      } catch (e) { failure(w, 'JSON'); }
    };
    xhr.onerror=xhr.ontimeout=function () {
      if (serial!==sequence) return;
      active=null;
      failure(w, 'TLS/mạng');
    };
    xhr.send();
  }
  function failure(w, reason) {
    // Show a readable error, including the HTTP/network class, rather than
    // leaving the previous location's result or a blank screen on a TV.
    retryPending = true;
    el.textContent = (w.place ? w.place + ' · ' : '') +
      (vi ? 'Không tải được thời tiết; kiểm tra Internet và ngày giờ TV' :
        'Weather unavailable; check Internet and TV clock') +
      (reason ? ' (' + reason + ')' : '');
    el.className = 'shown';
    if (!week.children.length) renderDays(null);
  }
  // Weather is only refreshed while Glasshouse Custom is visible.
  window.INFINITI_WEATHER_RELOAD = load;
  function resumeWeather() {
    if (covered()) return;
    load();
    if (retryTimer === null) retryTimer = setInterval(function () {
      if (!covered() && retryPending) load();
    }, 2 * 60 * 1000);
    if (weatherTimer === null) weatherTimer = setInterval(load, 30 * 60 * 1000);
  }
  if (lifecycle) {
    lifecycle.subscribe(function (hidden) {
      if (hidden) pauseWeather(); else resumeWeather();
    });
  } else {
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) pauseWeather(); else resumeWeather();
    });
  }
  if (!covered()) resumeWeather();
})();
