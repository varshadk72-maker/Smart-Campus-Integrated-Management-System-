(function () {
  const S = window.SCMS, $ = id => document.getElementById(id), roles = ['student', 'faculty', 'admin'];
  const u = S.auth.user(); if (u && roles.includes(u.role)) return location.replace(S.auth.home(u.role));
  if (new URLSearchParams(location.search).has('expired')) $('expired').hidden = false;
  $('toggle-pw').onclick = e => { const p = $('password'), show = p.type === 'password'; p.type = show ? 'text' : 'password'; e.target.textContent = show ? 'Hide' : 'Show'; e.target.setAttribute('aria-label', show ? 'Hide password' : 'Show password'); };
  const setErr = (n, m) => { $(n + '-err').textContent = m || ''; m ? $(n).setAttribute('aria-invalid', 'true') : $(n).removeAttribute('aria-invalid'); };
  $('login-form').addEventListener('submit', async ev => {
    ev.preventDefault(); $('form-error').hidden = true;
    const username = $('username').value.trim(), password = $('password').value;
    setErr('username', username ? '' : 'Enter your email or ID.'); setErr('password', password ? '' : 'Enter your password.');
    if (!username || !password) return $(username ? 'password' : 'username').focus();
    const btn = $('submit'); btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Signing in…';
    try {
      const d = await S.api.post(S.config.E.login, { username, password }, { auth: false });
      let user = d && (d.user || d), token = d && d.token;
      if (!user || !user.role) { sessionStorage.setItem('scms.session', JSON.stringify({ token, user: {} })); user = await S.api.get(S.config.E.me); }
      user = S.auth.save(token, user);
      if (!roles.includes(user.role)) { S.auth.clear(); throw new Error('Your account role is not recognised. Contact the administrator.'); }
      location.replace(S.auth.home(user.role));
    } catch (e) {
      S.auth.clear(); $('form-error').textContent = e.message; $('form-error').hidden = false;
      btn.disabled = false; btn.textContent = 'Sign in';
    }
  });
})();
