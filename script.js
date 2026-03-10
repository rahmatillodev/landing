(function() {
    'use strict';
  
    function log() {
      if (typeof console !== 'undefined' && console.log) console.log.apply(console, arguments);
    }
    function logErr() {
      if (typeof console !== 'undefined' && console.error) console.error.apply(console, arguments);
    }
  
    function run() {
      log('[App] run() started, readyState=', document.readyState);
  
    var SUPABASE_URL = "https://miyoovimtupziuehtcxi.supabase.co";
    var SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1peW9vdmltdHVweml1ZWh0Y3hpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMzkwNzMsImV4cCI6MjA4MzYxNTA3M30.aaCqOF-_s5s5AN-_ElrWZWch8nSVHNmQ1fvC4hi2OoY";
  
    function getSupabase() {
      return typeof window !== 'undefined' && window.supabase && window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    }
    function whenSupabaseReady(cb, maxWait) {
      maxWait = maxWait || 2000;
      var start = Date.now();
      log('[Supabase] waiting for client (maxWait=', maxWait, 'ms), window.supabase=', typeof (window && window.supabase));
      function tryOnce() {
        var client = getSupabase();
        if (client) {
          log('[Supabase] client ready');
          cb(client);
          return;
        }
        if (Date.now() - start >= maxWait) {
          logErr('[Supabase] client NOT ready after', maxWait, 'ms — check Supabase script loaded and URL/KEY');
          return;
        }
        setTimeout(tryOnce, 150);
      }
      tryOnce();
    }
  
    // ——— Meta Pixel _fbp cookie: read or create ———
    function getFbpCookie() {
      var cookies = document.cookie;
      if (!cookies) return null;
      var start = cookies.indexOf('_fbp=');
      if (start === -1) return null;
      start += 5;
      var end = cookies.indexOf(';', start);
      if (end === -1) end = cookies.length;
      var value = cookies.slice(start, end).trim();
      return value || null;
    }
    function createFbpFallback() {
      var ts = Math.floor(Date.now() / 1000);
      var r = '';
      for (var i = 0; i < 10; i++) r += Math.floor(Math.random() * 10);
      return 'fb.1.' + ts + '.' + r;
    }
    function setFbpCookie(value) {
      var maxAge = 90 * 24 * 60 * 60;
      document.cookie = '_fbp=' + encodeURIComponent(value) + '; path=/; max-age=' + maxAge + '; SameSite=Lax';
    }
    (function() {
      log('[Fbp] reading _fbp cookie');
      var fbp = getFbpCookie();
      if (!fbp) {
        log('[Fbp] no cookie, creating fallback');
        fbp = createFbpFallback();
        setFbpCookie(fbp);
        log('[Fbp] fallback set:', fbp);
      } else {
        log('[Fbp] existing _fbp:', fbp);
      }
    })();
  
    // ——— Get attribution data from current page URL (always return object; empty if no params) ———
    function getUrlAttributionData() {
      log('[Attribution] getUrlAttributionData, href=', window.location.href);
      var search = typeof window !== 'undefined' && window.location && window.location.search;
      var params = (search && search.length >= 2) ? new URLSearchParams(search) : null;
      var data = {
        utm_source: params ? (params.get('utm_source') || '') : '',
        utm_medium: params ? (params.get('utm_medium') || '') : '',
        utm_campaign: params ? (params.get('utm_campaign') || '') : '',
        utm_term: params ? (params.get('utm_term') || '') : '',
        utm_content: params ? (params.get('utm_content') || '') : '',
        fbclid: params ? (params.get('fbclid') || '') : ''
      };
      var hasAny = data.utm_source || data.utm_medium || data.utm_campaign || data.utm_term || data.utm_content || data.fbclid;
      log('[Attribution] urlData=', data, 'hasAny=', !!hasAny);
      return data;
    }
  
    // ——— Landing attribution (save every visit to attribution_logs) ———
    (function() {
      log('[Attribution] starting landing attribution flow');
      var urlData = getUrlAttributionData();
  
      function randId() {
        var s = '';
        for (var i = 0; i < 16; i++) s += Math.floor(Math.random() * 10);
        return s;
      }
  
      // Generate id and set /go links NOW (before Supabase) so bot always gets this id
      var id = randId();
      log('[Attribution] id generated', id);
      try {
        sessionStorage.setItem('attribution_id', id);
        log('[Attribution] attribution_id saved to sessionStorage');
      } catch (e) {
        logErr('[Attribution] sessionStorage setItem failed', e);
      }
      var goLinks = document.querySelectorAll('a[href="go.html"], a[href="/go"], a[href="go"], a[href^="go.html"], a[href^="/go?"]');
      for (var i = 0; i < goLinks.length; i++) goLinks[i].href = '/go?id=' + id;
      log('[Attribution] go links updated, count=', goLinks.length);
  
      whenSupabaseReady(function(client) {
        log('[Attribution] Supabase ready, will save to attribution_logs, id=', id);
  
      function getC(name) {
        var v = '; ' + document.cookie;
        var p = v.split('; ' + name + '=');
        return p.length === 2 ? p.pop().split(';').shift() : '';
      }
      function getFbpWait(t) {
        t = t || 2000;
        return new Promise(function(r) {
          var start = Date.now();
          if (getC('_fbp')) { r(getC('_fbp')); return; }
          var iv = setInterval(function() {
  
            var x = getC('_fbp');
            if (x) { clearInterval(iv); r(x); }
            else if (Date.now() - start > t) { clearInterval(iv); r(''); }
          }, 100);
        });
      }
  
      var fbclid = urlData.fbclid;
      var fbc = fbclid ? 'fb.1.' + Math.floor(Date.now() / 1000) + '.' + fbclid : '';
      function getDeviceInfo() {
        var ua = navigator.userAgent || '';
        var os = 'Unknown';
        if (/Android/i.test(ua)) os = 'Android';
        else if (/iPhone|iPod/i.test(ua)) os = 'iOS';
        else if (/iPad/i.test(ua)) os = 'iPadOS';
        else if (/Mac OS X|Macintosh/i.test(ua)) os = 'macOS';
        else if (/Windows/i.test(ua)) os = 'Windows';
        else if (/Linux/i.test(ua)) os = 'Linux';
        var browser = 'Unknown';
        if (/Edg\/|Edge/i.test(ua)) browser = 'Edge';
        else if (/OPR|Opera/i.test(ua)) browser = 'Opera';
        else if (/Chrome/i.test(ua) && !/Edg|OPR/i.test(ua)) browser = 'Chrome';
        else if (/Safari/i.test(ua) && !/Chrome|Chromium/i.test(ua)) browser = 'Safari';
        else if (/Firefox|FxiOS/i.test(ua)) browser = 'Firefox';
        return os + ' ' + browser;
      }
      var utms = {
        source: urlData.utm_source,
        medium: urlData.utm_medium,
        campaign: urlData.utm_campaign,
        term: urlData.utm_term,
        content: urlData.utm_content
      };
  
      function saveRow(row) {
        log('[Attribution] saveRow: calling insert attribution_logs, row keys=', Object.keys(row));
        return client.from('attribution_logs').insert([row]).then(function(res) {
          log('[Attribution] insert then: res=', res, 'res.error=', res && res.error, 'res.data=', res && res.data);
          if (res && res.error) {
            logErr('[Attribution] insert Supabase error:', res.error.message || res.error, 'code=', res.error.code, 'details=', res.error.details);
            return;
          }
          log('[Attribution] insert SUCCESS, id=', id);
        }).catch(function(e) {
          logErr('[Attribution] insert catch:', e && e.message, e);
        });
      }
  
      function getGeoData() {
        log('[Geo] request start');
        return new Promise(function(resolve) {
          var timeout = setTimeout(function() {
            log('[Geo] timeout, returning empty');
            resolve({ ip_address: '', city: '', state: '' });
          }, 5000);
          // geojs.io: free, CORS-enabled; fallback if rate-limited
          fetch('https://get.geojs.io/v1/ip/geo.json')
            .then(function(r) {
              if (!r.ok) {
                log('[Geo] fetch not ok', r.status, r.status === 429 ? '(rate limit)' : '');
                return Promise.reject(new Error(r.status));
              }
              return r.json();
            })
            .then(function(data) {
              clearTimeout(timeout);
              var geo = {
                ip_address: (data && data.ip) ? String(data.ip) : '',
                city: (data && data.city) ? String(data.city) : '',
                state: (data && data.region) ? String(data.region) : ''
              };
              log('[Geo] success', geo);
              resolve(geo);
            })
            .catch(function(err) {
              clearTimeout(timeout);
              log('[Geo] request failed, using empty geo', err && err.message);
              resolve({ ip_address: '', city: '', state: '' });
            });
        });
      }
  
      // 1) Insert row immediately (so it's always saved), then optionally enrich with geo
      function buildRow(geo) {
        return {
          id: id,
          ip_address: (geo && geo.ip_address) || '',
          city: (geo && geo.city) || '',
          state: (geo && geo.state) || '',
          device: getDeviceInfo(),
          fbp: getC('_fbp') || '',
          fbc: fbc,
          fbclid: fbclid,
          user_agent: navigator.userAgent || '',
          utm_source: utms.source,
          utm_medium: utms.medium,
          utm_campaign: utms.campaign,
          utm_term: utms.term,
          utm_content: utms.content
        };
      }
  
      log('[Attribution] step 1: insert now (geo empty), then fetch geo');
      var row = buildRow({});
      saveRow(row);
  
      getGeoData().then(function(geo) {
        log('[Attribution] geo received, optional update (may be blocked by RLS)', geo);
        if (geo && (geo.ip_address || geo.city || geo.state)) {
          client.from('attribution_logs').update({
            ip_address: geo.ip_address || '',
            city: geo.city || '',
            state: geo.state || ''
          }).eq('id', id).then(function(up) {
            if (up && up.error) logErr('[Attribution] geo update error:', up.error.message);
            else log('[Attribution] geo update done');
          });
        }
      });
  
      // 2) Enrich with _fbp from browser cookie when ready (no external API)
      log('[Attribution] step 3: waiting for _fbp cookie');
      getFbpWait(1500).then(function(fbp) {
        if (fbp) {
          log('[Attribution] fbp received, updating row');
          client.from('attribution_logs').update({ fbp: fbp }).eq('id', id).then(function(up) {
            log('[Attribution] fbp update then: up.error=', up && up.error);
            if (up && up.error) {
              logErr('[Attribution] fbp update error:', up.error.message || up.error, 'details=', up.error.details);
            } else {
              log('[Attribution] fbp update done');
            }
          });
        } else {
          log('[Attribution] no fbp after wait, skip update');
        }
      });
      }, 2500);
    })();
  
    // ——— Reviews carousel ———
    (function() {
      log('[Carousel] init');
      var reviewCarousel = document.getElementById('reviewsCarousel');
      var reviewsPrev = document.getElementById('reviewsPrev');
      var reviewsNext = document.getElementById('reviewsNext');
      if (!reviewCarousel || !reviewsPrev || !reviewsNext) {
        log('[Carousel] elements missing, skip');
        return;
      }
  
      function getScrollAmount() {
        var card = reviewCarousel.querySelector('.review-card');
        if (!card) return reviewCarousel.clientWidth;
        var style = getComputedStyle(reviewCarousel);
        var gap = parseInt(style.columnGap || style.gap || '0', 10) || 0;
        return card.getBoundingClientRect().width + gap;
      }
      function updateButtons() {
        var maxScroll = Math.max(reviewCarousel.scrollWidth - reviewCarousel.clientWidth, 0);
        var left = reviewCarousel.scrollLeft;
        reviewsPrev.disabled = left <= 1;
        reviewsNext.disabled = left >= maxScroll - 1;
      }
      reviewsPrev.addEventListener('click', function() {
        log('[Carousel] prev clicked');
        reviewCarousel.scrollBy({ left: -getScrollAmount(), behavior: 'smooth' });
      });
      reviewsNext.addEventListener('click', function() {
        log('[Carousel] next clicked');
        reviewCarousel.scrollBy({ left: getScrollAmount(), behavior: 'smooth' });
      });
      reviewCarousel.addEventListener('scroll', function() { requestAnimationFrame(updateButtons); });
      window.addEventListener('resize', function() {
        log('[Carousel] resize');
        updateButtons();
      });
      updateButtons();
      log('[Carousel] ready');
    })();
  
      log('[App] run() finished');
    }
  
    if (document.readyState === 'loading') {
      log('[App] waiting for DOMContentLoaded');
      document.addEventListener('DOMContentLoaded', run);
    } else {
      run();
    }
  })();
  