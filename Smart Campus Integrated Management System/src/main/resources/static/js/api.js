(function () {
  const S = window.SCMS;
  class ApiError extends Error { constructor(status, message, fieldErrors) { super(message); this.status = status; this.fieldErrors = fieldErrors || null; } }
  function fieldErrors(b) {
    const e = b && (b.errors || b.fieldErrors); if (!e) return null;
    if (Array.isArray(e)) return Object.fromEntries(e.filter(x => x.field).map(x => [x.field, x.message || x.defaultMessage]));
    return typeof e === 'object' ? e : null;
  }
  async function request(method, path, body, opts = {}) {
    const headers = { Accept: 'application/json' };
    const t = S.auth.token(); if (t) headers.Authorization = 'Bearer ' + t;
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    let res;
    try { res = await fetch(S.config.API_BASE + path, { method, headers, credentials: 'include', body: body !== undefined ? JSON.stringify(body) : undefined }); }
    catch { throw new ApiError(0, 'Cannot reach the server. Check your connection and that the backend is running.'); }
    let data = null; const txt = await res.text();
    if (txt) { try { data = JSON.parse(txt); } catch { data = null; } }
    if (res.ok) return data;
    if (res.status === 401 && opts.auth !== false) { S.auth.clear(); location.replace('login.html?expired=1'); throw new ApiError(401, 'Session expired.'); }
    const msg = (data && (data.message || data.error)) || ({
      400: 'Please check the highlighted fields.', 401: 'Incorrect username or password.', 403: 'You do not have permission to perform this action.',
      404: 'The requested record was not found.', 409: 'This conflicts with an existing record.', 422: 'Please check the highlighted fields.' }[res.status])
      || 'The server encountered an error. Please try again.';
    throw new ApiError(res.status, msg, fieldErrors(data));
  }
  const rows = d => Array.isArray(d) ? d : (d && (d.content || d.data || d.items)) || [];
  S.api = {
    ApiError,
    get: (p, o) => request('GET', p, undefined, o), post: (p, b, o) => request('POST', p, b, o),
    put: (p, b, o) => request('PUT', p, b, o), patch: (p, b, o) => request('PATCH', p, b, o), del: (p, o) => request('DELETE', p, undefined, o),
    list: async p => rows(await request('GET', p))
  };
})();
