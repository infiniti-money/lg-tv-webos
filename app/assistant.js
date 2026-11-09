/* Infiniti TV Home Voice + AI: ES5 only, supported by Chromium 38. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var panel = $('aiPanel'), prompt = $('aiPrompt'), status = $('aiStatus');
  var answer = $('aiAnswer'), access = $('aiToken');
  var send = $('aiSend'), voice = $('aiVoice'), close = $('aiClose');
  var opened = false, busy = false, recognition = null, activeRequest = null;
  var languageVi = (window.CONFIG || {}).language !== 'en';

  function msg(v) { status.textContent = v; }
  function isOpen() { return opened; }
  function show() {
    panel.classList.remove('hidden');
    opened = true;
    msg(languageVi ? 'Có thể nói qua bàn phím LG hoặc nhập câu hỏi.' :
      'Use LG keyboard dictation or type your question.');
    window.setTimeout(function () { prompt.focus(); }, 50);
  }
  function hide() {
    panel.classList.add('hidden');
    opened = false;
    if (recognition) { try { recognition.stop(); } catch (e) {} recognition = null; }
    if (activeRequest) { activeRequest.abort(); activeRequest = null; }
    busy = false;
  }
  function submit() {
    var q = (prompt.value || '').replace(/^\s+|\s+$/g, '');
    var endpoint = (window.CONFIG || {}).aiEndpoint || '';
    var token = access.value;
    if (busy) return;
    if (!q) { msg(languageVi ? 'Nhập hoặc đọc câu hỏi trước.' : 'Enter a question first.'); return; }
    if (!/^https:\/\/[a-z0-9.-]+(?::\d+)?\/api\/chat$/i.test(endpoint)) {
      msg(languageVi ? 'Chưa cấu hình máy chủ AI HTTPS (CONFIG.aiEndpoint).' :
        'Configure your HTTPS AI endpoint in CONFIG.aiEndpoint.'); return;
    }
    if (!token || token.length < 24) {
      msg(languageVi ? 'Nhập mã truy cập AI do quản trị cấp.' : 'Enter your AI access token.'); return;
    }
    busy = true;
    send.disabled = true;
    msg(languageVi ? 'Đang hỏi AI…' : 'Asking AI…');
    answer.textContent = '';
    var x = new XMLHttpRequest();
    activeRequest = x;
    x.open('POST', endpoint, true);
    x.timeout = 30000;
    x.setRequestHeader('Content-Type', 'application/json');
    x.setRequestHeader('Authorization', 'Bearer ' + token);
    x.onreadystatechange = function () {
      if (x.readyState !== 4) return;
      activeRequest = null;
      busy = false;
      send.disabled = false;
      if (!opened) return;
      var d = {};
      try { d = JSON.parse(x.responseText || '{}'); } catch (e) {}
      if (x.status >= 200 && x.status < 300 && d.answer) {
        answer.textContent = d.answer;
        msg(languageVi ? 'Đã trả lời.' : 'Answered.');
      } else {
        msg((languageVi ? 'Lỗi AI: ' : 'AI error: ') +
          (d.error || (x.status === 0 ? 'Không kết nối được (CORS/TLS/mạng)' : 'HTTP ' + x.status)));
      }
    };
    x.ontimeout = function () { msg(languageVi ? 'Kết nối AI quá hạn.' : 'AI request timed out.'); };
    x.send(JSON.stringify({question:q, language:'vi'}));
  }
  function listen() {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      msg(languageVi ?
        'WebOS này không cung cấp API micro. Hãy chọn ô câu hỏi và dùng nút micro trên bàn phím LG (nếu có), hoặc nhập bằng remote.' :
        'Microphone API unavailable. Try LG on-screen keyboard dictation or type.');
      prompt.focus();
      return;
    }
    if (recognition) { try { recognition.stop(); } catch (e) {} recognition = null; return; }
    try {
      var r = new SR();
      recognition = r;
      r.lang = 'vi-VN';
      r.interimResults = false;
      r.maxAlternatives = 1;
      r.onresult = function (e) {
        try { prompt.value = e.results[e.resultIndex][0].transcript; }
        catch (x) { msg('Không đọc được kết quả nhận dạng.'); }
      };
      r.onerror = function (e) {
        msg('Nhận dạng giọng nói lỗi: ' + (e.error || 'không xác định') +
          '. Thử bàn phím LG.');
      };
      r.onend = function () {
        recognition = null;
        if (opened && status.textContent.indexOf('lỗi') === -1)
          msg('Đã kết thúc ghi âm. Kiểm tra câu hỏi rồi chọn Gửi AI.');
      };
      msg('Đang nghe tiếng Việt…');
      r.start();
    } catch (e) {
      recognition = null;
      msg('Không truy cập được micro: ' + e.message + '. Dùng bàn phím LG.');
    }
  }
  function shield(e) {
    if (!opened) return;
    var code = e.keyCode || e.which;
    // The launcher keyup handler can otherwise launch a tile while editing the AI dialog.
    if (code === 461 || code === 27) {
      e.preventDefault();
      e.stopPropagation();
      if (e.stopImmediatePropagation) e.stopImmediatePropagation();
      hide();
      return;
    }
    if (e.type === "keyup" && code === 13) return;
    e.stopPropagation();
    if (e.stopImmediatePropagation) e.stopImmediatePropagation();
    if (code === 13 && e.target === prompt) {
      e.preventDefault();
      submit();
    }
  }
  // Capture, before the main launcher's directional/OK handlers.
  document.addEventListener('keydown', shield, true);
  document.addEventListener('keyup', shield, true);
  send.addEventListener('click', submit);
  close.addEventListener('click', hide);
  voice.addEventListener('click', listen);
  window.INFINITI_AI_OPEN = show;
  window.INFINITI_AI_IS_OPEN = isOpen;
})();
