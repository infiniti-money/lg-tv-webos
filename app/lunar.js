/* Vietnamese lunar calendar calculated for UTC+7 (astronomical method).
 * ES5-compatible for webOS 3.4.0 / Chromium 38. Does not require network access.
 * Based on published astronomical formulae for the Vietnamese lunisolar calendar.
 */
(function (root) {
  'use strict';
  var PI = Math.PI;
  function INT(n) { return Math.floor(n); }
  function jdFromDate(dd, mm, yy) {
    var a = INT((14 - mm) / 12), y = yy + 4800 - a, m = mm + 12 * a - 3;
    var jd = dd + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) -
      INT(y / 100) + INT(y / 400) - 32045;
    if (jd < 2299161) jd = dd + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) - 32083;
    return jd;
  }
  function getNewMoonDay(k, tz) {
    var T = k / 1236.85, T2 = T * T, T3 = T2 * T, dr = PI / 180;
    var jd = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
    jd += 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
    var M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
    var Mp = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
    var F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
    var correction = (0.1734 - 0.000393 * T) * Math.sin(M * dr) +
      0.0021 * Math.sin(2 * M * dr) - 0.4068 * Math.sin(Mp * dr) +
      0.0161 * Math.sin(2 * Mp * dr) - 0.0004 * Math.sin(3 * Mp * dr) +
      0.0104 * Math.sin(2 * F * dr) - 0.0051 * Math.sin((M + Mp) * dr) -
      0.0074 * Math.sin((M - Mp) * dr) + 0.0004 * Math.sin((2 * F + M) * dr) -
      0.0004 * Math.sin((2 * F - M) * dr) - 0.0006 * Math.sin((2 * F + Mp) * dr) +
      0.0010 * Math.sin((2 * F - Mp) * dr) + 0.0005 * Math.sin((2 * Mp + M) * dr);
    var delta = T < -11 ? 0.001 + 0.000839 * T + 0.0002261 * T2 -
      0.00000845 * T3 - 0.000000081 * T * T3 :
      -0.000278 + 0.000265 * T + 0.000262 * T2;
    return INT(jd + correction - delta + 0.5 + tz / 24);
  }
  function sunLongitude(jdn) {
    var T = (jdn - 2451545) / 36525, T2 = T * T, dr = PI / 180;
    var M = 357.52910 + 35999.05030 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
    var L = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
    L += (1.914600 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M) +
      (0.019993 - 0.000101 * T) * Math.sin(2 * dr * M) +
      0.000290 * Math.sin(3 * dr * M);
    L *= dr;
    return L - 2 * PI * INT(L / (2 * PI));
  }
  function getSunLongitude(jd, tz) {
    return INT(sunLongitude(jd - 0.5 - tz / 24) / PI * 6);
  }
  function getLunarMonth11(yy, tz) {
    var off = jdFromDate(31, 12, yy) - 2415021;
    var k = INT(off / 29.530588853), nm = getNewMoonDay(k, tz);
    if (getSunLongitude(nm, tz) >= 9) nm = getNewMoonDay(k - 1, tz);
    return nm;
  }
  function getLeapMonthOffset(a11, tz) {
    var k = INT(0.5 + (a11 - 2415021.076998695) / 29.530588853);
    var i = 1, arc = getSunLongitude(getNewMoonDay(k + i, tz), tz), last;
    do {
      last = arc; i++;
      arc = getSunLongitude(getNewMoonDay(k + i, tz), tz);
    } while (arc !== last && i < 14);
    return i - 1;
  }
  function convert(dd, mm, yy) {
    if (yy < 1900 || yy > 2100) return null;
    var jd = jdFromDate(dd, mm, yy);
    var k = INT((jd - 2415021.076998695) / 29.530588853);
    var start = getNewMoonDay(k + 1, 7);
    if (start > jd) start = getNewMoonDay(k, 7);
    var a11 = getLunarMonth11(yy, 7), b11 = a11, lunarYear;
    if (a11 >= start) {
      lunarYear = yy;
      a11 = getLunarMonth11(yy - 1, 7);
    } else {
      lunarYear = yy + 1;
      b11 = getLunarMonth11(yy + 1, 7);
    }
    var ld = jd - start + 1, diff = INT((start - a11) / 29);
    var lm = diff + 11, leap = 0;
    if (b11 - a11 > 365) {
      var leapDiff = getLeapMonthOffset(a11, 7);
      if (diff >= leapDiff) {
        lm = diff + 10;
        if (diff === leapDiff) leap = 1;
      }
    }
    if (lm > 12) lm -= 12;
    if (lm >= 11 && diff < 4) lunarYear--;
    return {day: ld, month: lm, year: lunarYear, leap: !!leap};
  }
  function yearName(yy) {
    var can = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'];
    var chi = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];
    return can[(yy + 6) % 10] + ' ' + chi[(yy + 8) % 12];
  }
  function render() {
    if (typeof document === 'undefined') return;
    var target = document.getElementById('lunarDate');
    if (!target) return;
    // The Vietnamese calendar date is determined in UTC+7, not by the TV's time zone.
    var vn = new Date(Date.now() + 7 * 3600000);
    var date = convert(vn.getUTCDate(), vn.getUTCMonth() + 1, vn.getUTCFullYear());
    if (!date) { target.textContent = ''; return; }
    target.textContent = 'Âm lịch: ' + date.day + '/' + date.month + '/' + date.year +
      (date.leap ? ' (tháng nhuận)' : '') + ' · ' + yearName(date.year);
  }
  root.INFINITI_LUNAR = {convert: convert, yearName: yearName};
  if (typeof module !== 'undefined' && module.exports) module.exports = root.INFINITI_LUNAR;
  if (typeof document !== 'undefined') {
    var lifecycle = root.INFINITI_LIFECYCLE || null, lunarTimer = null;
    function covered() { return lifecycle ? lifecycle.isCovered() : !!document.hidden; }
    function stopLunar() {
      if (lunarTimer !== null) { clearInterval(lunarTimer); lunarTimer = null; }
    }
    function startLunar() {
      if (covered()) return;
      render();
      if (lunarTimer === null) lunarTimer = setInterval(render, 30 * 60 * 1000);
    }
    if (lifecycle) {
      lifecycle.subscribe(function (hidden) {
        if (hidden) stopLunar();
        else startLunar();
      });
    } else {
      document.addEventListener('visibilitychange', function () {
        if (document.hidden) stopLunar();
        else startLunar();
      });
    }
    if (!covered()) startLunar();
  }
})(typeof window !== 'undefined' ? window : this);
