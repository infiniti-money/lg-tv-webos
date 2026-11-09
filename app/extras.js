/*
 * Infiniti TV Home additions: wallpaper, ambient glow toggle and weather.
 * ES5 for webOS 3.x Chromium 38 compatibility.
 */
(function () {
  'use strict';
  var C = window.CONFIG || {};

  // ---- Wallpaper ----
  if (C.wallpaper) {
    var dim = typeof C.wallpaperDim === 'number' ? Math.max(0, Math.min(0.8, C.wallpaperDim)) : 0.35;
    var bg = 'linear-gradient(rgba(0,0,0,' + dim + '), rgba(0,0,0,' + dim + ')), url("' + C.wallpaper +
      '") center / cover no-repeat, #000';
    document.documentElement.style.background = bg;
    document.body.style.background = bg;
  }
  if (C.ambientGlow === false) document.body.className += ' no-glow';

  // ---- Weather (Open-Meteo, no API key) ----
  var W = C.weather || {};
  var el = document.getElementById('weather');
  var week = document.getElementById('weekWeather');
  if (!el || !W.enabled || !W.latitude || !W.longitude) {
    if (week) week.classList.add('hidden');
    return;
  }

  var vi = C.language === 'vi';
  var NAMES = vi ? {
    0: 'Trời quang', 1: 'Ít mây', 2: 'Có mây', 3: 'Nhiều mây', 45: 'Sương mù', 48: 'Sương mù',
    51: 'Mưa phùn nhẹ', 53: 'Mưa phùn', 55: 'Mưa phùn dày', 61: 'Mưa nhẹ', 63: 'Mưa vừa', 65: 'Mưa to',
    71: 'Tuyết nhẹ', 73: 'Tuyết', 75: 'Tuyết dày', 80: 'Mưa rào nhẹ', 81: 'Mưa rào', 82: 'Mưa rào lớn',
    95: 'Dông', 96: 'Dông, mưa đá', 99: 'Dông, mưa đá'
  } : {
    0: 'Clear', 1: 'Mostly clear', 2: 'Partly cloudy', 3: 'Cloudy', 45: 'Fog', 48: 'Fog',
    51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle', 61: 'Light rain', 63: 'Rain', 65: 'Heavy rain',
    71: 'Light snow', 73: 'Snow', 75: 'Heavy snow', 80: 'Light showers', 81: 'Showers', 82: 'Heavy showers',
    95: 'Thunderstorm', 96: 'Thunderstorm, hail', 99: 'Thunderstorm, hail'
  };
  var fahrenheit = W.unit === 'fahrenheit';


  function cell(parent, className, value) {
    var box = document.createElement('div');
    box.className = className;
    box.textContent = value;
    parent.appendChild(box);
  }
  function renderWeek(daily) {
    if (!week) return;
    var list = window.INFINITI_FORECAST ?
      window.INFINITI_FORECAST.prepare(daily, vi) : [];
    week.innerHTML = '';
    if (!list.length) {
      cell(week, 'weekEmpty', vi ? 'Chưa có dữ liệu dự báo 7 ngày.' : 'No weekly forecast available.');
    } else {
      for (var i=0; i<list.length; i++) {
        var d = list[i], box = document.createElement('div');
        box.className = 'weekDay';
        cell(box, 'weekLabel', d.label);
        cell(box, 'weekCondition', d.condition);
        cell(box, 'weekTemperature', d.high + '° / ' + d.low + '°');
        cell(box, 'weekRain', d.rain === null ? '—' : 'Mưa ' + d.rain + '%');
        week.appendChild(box);
      }
    }
    week.classList.remove('hidden');
  }
  function load() {
    var url = 'https://api.open-meteo.com/v1/forecast?latitude=' +
      encodeURIComponent(W.latitude) + '&longitude=' + encodeURIComponent(W.longitude) +
      '&current=temperature_2m,weather_code' +
      '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max' +
      '&timezone=auto&forecast_days=7' +
      (fahrenheit ? '&temperature_unit=fahrenheit' : '');
    var x = new XMLHttpRequest();
    x.open('GET', url, true);
    x.timeout = 13000;
    x.onload = function () {
      if (x.status < 200 || x.status >= 300) {
        if (week && !week.children.length) renderWeek(null);
        return;
      }
      try {
        var data = JSON.parse(x.responseText), current = data.current || {}, daily = data.daily || {};
        if (typeof current.temperature_2m === 'number') {
          var unit = fahrenheit ? '°F' : '°C';
          var str = Math.round(current.temperature_2m) + unit;
          if (NAMES[current.weather_code]) str += ' · ' + NAMES[current.weather_code];
          if (W.place) str += ' · ' + W.place;
          if (daily.temperature_2m_max && daily.temperature_2m_max.length &&
              daily.temperature_2m_min && daily.temperature_2m_min.length) {
            str += '   ↑' + Math.round(daily.temperature_2m_max[0]) +
              '° ↓' + Math.round(daily.temperature_2m_min[0]) + '°';
          }
          var rain = daily.precipitation_probability_max &&
            daily.precipitation_probability_max.length ? daily.precipitation_probability_max[0] : null;
          if (typeof rain === 'number') str += '  ☂ ' + rain + '%';
          el.textContent = str;
          el.className = 'shown';
        }
        renderWeek(daily);
      } catch (e) {
        if (week && !week.children.length) renderWeek(null);
      }
    };
    x.onerror = function () {
      if (week && !week.children.length) renderWeek(null);
    };
    x.ontimeout = x.onerror;
    x.send();
  }
  load();
  setInterval(load, 30 * 60 * 1000);
})();
