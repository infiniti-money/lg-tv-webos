/* Weather helpers for Infiniti TV Home. Pure ES5 for Chromium 38 / Node 0.12. */
(function (root) {
  'use strict';
  var VI_DAYS = ['CN','T2','T3','T4','T5','T6','T7'];
  var EN_DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  var VI_LABELS = ['Hôm nay','Ngày mai','Ngày kia'];
  var EN_LABELS = ['Today','Tomorrow','Day after'];
  function condition(code, vi) {
    var c = Number(code);
    if (c === 0) return vi ? 'Nắng' : 'Clear';
    if (c >= 1 && c <= 2) return vi ? 'Ít mây' : 'Partly cloudy';
    if (c === 3) return vi ? 'Nhiều mây' : 'Cloudy';
    if (c === 45 || c === 48) return vi ? 'Sương mù' : 'Fog';
    if (c >= 51 && c <= 57) return vi ? 'Mưa phùn' : 'Drizzle';
    if (c >= 61 && c <= 67) return vi ? 'Mưa' : 'Rain';
    if (c >= 71 && c <= 77) return vi ? 'Tuyết' : 'Snow';
    if (c >= 80 && c <= 82) return vi ? 'Mưa rào' : 'Showers';
    if (c >= 95) return vi ? 'Dông' : 'Storm';
    return vi ? 'Thay đổi' : 'Variable';
  }
  function prepare(daily, vi) {
    if (!daily || !daily.time || !daily.temperature_2m_max ||
        !daily.temperature_2m_min) return [];
    var result = [], len = Math.min(3, daily.time.length,
      daily.temperature_2m_max.length, daily.temperature_2m_min.length);
    for (var i = 0; i < len; i++) {
      var iso = String(daily.time[i] || '');
      var match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
      if (!match) continue;
      var date = new Date(+match[1], +match[2] - 1, +match[3], 12);
      if (date.getFullYear() !== +match[1] || date.getMonth() !== +match[2] - 1 ||
          date.getDate() !== +match[3]) continue;
      var hi = daily.temperature_2m_max[i], lo = daily.temperature_2m_min[i];
      if (typeof hi !== 'number' || typeof lo !== 'number' ||
          !isFinite(hi) || !isFinite(lo)) continue;
      var wmo = (daily.weather_code || [])[i];
      var rain = (daily.precipitation_probability_max || [])[i];
      result.push({
        label:(vi ? VI_LABELS : EN_LABELS)[i],
        dateLabel:(vi ? VI_DAYS : EN_DAYS)[date.getDay()] + ' ' + (+match[3]) + '/' + (+match[2]),
        condition:condition(wmo, vi),
        high:Math.round(hi),
        low:Math.round(lo),
        rain:typeof rain === 'number' && isFinite(rain) ? Math.max(0,Math.min(100,Math.round(rain))) : null
      });
    }
    return result;
  }
  var api = {condition:condition, prepare:prepare};
  root.INFINITI_FORECAST = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : this);
