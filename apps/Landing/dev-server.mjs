// Servidor local para apps/Landing (el export estático de Framer que también se usa como landing
// de producción, ver ../../scripts/vercel-build.sh). En producción, Vercel sirve este mismo
// index.html en el MISMO origen que /auth/*, /admin/*, /workspace/* (ver ../../vercel.json), por
// eso el HTML usa enlaces relativos ("/auth/registro", "/auth/sa-login").
//
// En dev local esos mismos paths NO existen en este server (aquí solo vive el HTML estático) --
// viven en el dashboard (workspace "dashboard", puerto 3000). Por eso este script intercepta esas
// rutas y las redirige ahí antes de delegar todo lo demás a serve-handler.
//
// No usamos serve.json para esto porque serve-handler compila "destination" con path-to-regexp,
// que interpreta el ":" de "localhost:3000" como un parámetro de ruta y truena
// (TypeError: Expected "3000" to be a string).
import http from 'node:http';
import handler from 'serve-handler';

const PORT = 8099;
const DASHBOARD_ORIGIN = process.env.NEXXUS_DASHBOARD_ORIGIN || 'http://localhost:3000';

const REDIRECTS = {
  '/auth/registro': `${DASHBOARD_ORIGIN}/auth/registro`,
  '/auth/sa-login': `${DASHBOARD_ORIGIN}/auth/sa-login`,
};

const server = http.createServer((request, response) => {
  const target = REDIRECTS[request.url];
  if (target) {
    response.writeHead(302, { Location: target });
    response.end();
    return;
  }
  return handler(request, response, {
    public: '.',
    rewrites: [
      { source: '/contacto', destination: '/index.html' },
      { source: '/contacto/**', destination: '/index.html' },
      { source: '/faqs', destination: '/index.html' },
      { source: '/faqs/**', destination: '/index.html' },
      { source: '/legal/**', destination: '/index.html' },
    ],
  });
});

server.listen(PORT, () => {
  console.log(`Landing (dev) sirviendo en http://localhost:${PORT}`);
  console.log(`  /auth/registro y /auth/sa-login redirigen a ${DASHBOARD_ORIGIN}`);
});
