# Patterns & Conventions

> How we write code. Every agent follows these.

## Language & Compatibility
- **ES5-compatible JavaScript** — no arrow functions, no `let`/`const`, no template literals, no destructuring
- Use `var`, `function`, and string concatenation
- No build tools, no transpilation — code runs directly in browser

## Naming
- CSS classes: kebab-case (`hero-video-wrap`, `review-card--text-only`)
- HTML IDs: camelCase (`heroVideoPoster`, `reviewsCarousel`)
- JS functions: camelCase (`getSupabase`, `whenSupabaseReady`, `getGeoData`)
- JS constants: UPPER_SNAKE_CASE (`SUPABASE_URL`, `SUPABASE_KEY`)
- CSS variables: kebab-case with `--` prefix (`--bg`, `--brand`, `--stroke`)
- Files: kebab-case (`script.js`, `go.html`)

## JavaScript Patterns

### IIFE Encapsulation
Each feature is wrapped in an immediately-invoked function expression:
```javascript
(function() {
  var wrap = document.getElementById('heroVideoWrap');
  var poster = document.getElementById('heroVideoPoster');
  var iframe = document.getElementById('heroYoutubeIframe');

  function play() {
    wrap.classList.add('played');
    var src = iframe.getAttribute('data-src');
    if (src && !iframe.src) {
      iframe.src = src + (src.indexOf('?') >= 0 ? '&' : '?') + 'autoplay=1';
    }
  }

  poster.addEventListener('click', play);
  poster.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      play();
    }
  });
})();
```

### Supabase API Calls
Insert-first, then async enrich pattern:
```javascript
// Insert immediately on page load
client.from('attribution_logs').insert([row]).then(function(res) {
  if (res && res.error) {
    logErr('[Attribution] insert error:', res.error.message);
  } else {
    log('[Attribution] insert SUCCESS');
  }
}).catch(function(e) {
  logErr('[Attribution] insert catch:', e.message);
});

// Update asynchronously with geo data
client.from('attribution_logs').update({
  ip_address: geo.ip_address || '',
  city: geo.city || '',
  state: geo.state || ''
}).eq('id', id);
```

### External API Calls (with timeout + fallback)
```javascript
function getGeoData() {
  return new Promise(function(resolve) {
    var timeout = setTimeout(function() {
      resolve({ ip_address: '', city: '', state: '' });
    }, 5000);

    fetch('https://get.geojs.io/v1/ip/geo.json')
      .then(function(r) { return r.json(); })
      .then(function(data) {
        clearTimeout(timeout);
        resolve({
          ip_address: data.ip || '',
          city: data.city || '',
          state: data.region || ''
        });
      })
      .catch(function(err) {
        clearTimeout(timeout);
        resolve({ ip_address: '', city: '', state: '' });
      });
  });
}
```

### Debug Logging
```javascript
function log() { console.log.apply(console, arguments); }
function logErr() { console.error.apply(console, arguments); }
```

## CSS Patterns

### Design System Variables
```css
:root {
  --bg: #0f0b14;
  --card: #16121f;
  --text: #f2eef8;
  --muted: #a89cc4;
  --brand: #a78bfa;
  --brand2: #c084fc;
  --stroke: #2a2340;
  --accent: #fbbf24;
  --radius: 16px;
}
```

### Gradient Buttons (Primary CTA)
```css
background: linear-gradient(90deg, var(--brand), var(--brand2));
```

### Glassmorphism Cards
```css
background: rgba(15,11,20,.82);
backdrop-filter: blur(6px);
```

### Responsive Typography
```css
font-size: clamp(24px, 6vw, 34px);
```

### Mobile-First Responsive
```css
@media (min-width: 560px) {
  .poster { min-width: 46%; }
}
```

### Safe Area Insets (notch-aware)
```css
.safe { padding-bottom: calc(env(safe-area-inset-bottom, 0) + 8px); }
```

## HTML Patterns

### Semantic Structure
Use `<main>`, `<section>`, `<figure>`, `<details>` elements

### Lazy-Load Media
```html
<iframe id="heroYoutubeIframe" data-src="https://www.youtube.com/embed/..."></iframe>
```
Load `src` via JS only on user interaction.

### Accessibility
- Add `aria-label` on interactive elements
- Support keyboard navigation (`Enter`/`Space` on custom buttons)
- Use `loading="lazy"` on images

## Things We DON'T Do
- No frameworks or libraries (except Supabase CDN)
- No build tools, bundlers, or transpilers
- No `let`/`const` — use `var` only
- No arrow functions — use `function` keyword
- No template literals — use string concatenation
- No CSS preprocessors — pure CSS only
- No inline JavaScript in HTML (all JS in `script.js`)
- No server-side code — everything is client-side
