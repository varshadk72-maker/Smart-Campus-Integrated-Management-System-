(function () {
  const S = window.SCMS, KEY = 'scms.session';
  const read = () => { try { return JSON.parse(sessionStorage.getItem(KEY)); } catch { return null; } };
  S.auth = {
    session: read,
    token: () => (read() || {}).token,
    user: () => (read() || {}).user,
    home: role => `${role}.html`,
    normRole: r => String(r || '').replace(/^ROLE_/i, '').toLowerCase(),
    save(token, user) { user.role = this.normRole(user.role); sessionStorage.setItem(KEY, JSON.stringify({ token, user })); return user; },
    clear() { sessionStorage.removeItem(KEY); },
    requireRole(role) {
      const u = this.user();
      if (!u) { location.replace('login.html'); return null; }
      if (u.role !== role) { location.replace(['student','faculty','admin'].includes(u.role) ? this.home(u.role) : 'login.html'); return null; }
      return u;
    },
    async logout() { try { await S.api.post(S.config.E.logout, {}, { auth: false }); } catch (e) { /* cleared locally regardless */ } this.clear(); location.replace('login.html'); }
  };
})();
