import 'zone.js/dist/zone-node';

import { ngExpressEngine } from '@nguniversal/express-engine';
import * as express from 'express';
import { join } from 'path';

import { AppServerModule } from './src/main.server';
import { APP_BASE_HREF } from '@angular/common';
import { existsSync } from 'fs';

// The Express app is exported so that it can be used by serverless Functions.
export function app(): express.Express {
  const server = express();
  const distFolder = join(process.cwd(), 'dist/browser');
  const indexHtml = existsSync(join(distFolder, 'index.original.html')) ? 'index.original.html' : 'index';

  // Our Universal express-engine (found @ https://github.com/angular/universal/tree/master/modules/express-engine)
  server.engine('html', ngExpressEngine({
    bootstrap: AppServerModule,
  }));

  server.set('view engine', 'html');
  server.set('views', distFolder);

  // Example Express Rest API endpoints
  // server.get('/api/**', (req, res) => { });
  // Serve static files from /browser
  server.get('*.*', express.static(distFolder, {
    maxAge: '1y'
  }));

  // All regular routes use the Universal engine
  server.get('*', (req, res) => {
    res.render(indexHtml, { req, providers: [{ provide: APP_BASE_HREF, useValue: req.baseUrl }] });
  });

  return server;
}

function run(): void {
  const PORT = process.env.PORT || 4000;

  // Start up the Node server
  const server = app();


  // All regular routes use the Universal engine
  server.get('/blog/the-best-canadian-online-sneaker-stores', (req, res) => {
    res.redirect(301, '/news/the-best-canadian-online-sneaker-stores');
  });

  server.get('/blog/nxtdrop-the-canadian-stockx-is-finally-here', (req, res) => {
    res.redirect(301, '/news/nxtdrop-the-canadian-stockx-is-finally-here');
  });

  server.get('/blog/tag/*', (req, res) => {
    res.redirect(301, '/news');
  });

  server.get('/blog/streetwear/*', (req, res) => {
    res.redirect(301, '/news');
  })

  server.get('/blog', (req, res) => {
    res.redirect(301, '/news');
  });

  server.get('/welcome', (req, res) => {
    res.redirect(301, '/how-it-works?source=sms');
  });

  server.get('/404', (req, res) => {
    res.render('index', { req });
    res.status(404);
  });

  server.get('*', (req, res) => {
    console.log(req.url);
    res.render('index', { req });
  });

  // Start up the Node server
  server.listen(PORT, () => {
    console.log(`Node Express server listening on http://localhost:${PORT}`);
  });
}

// Webpack will replace 'require' with '__webpack_require__'
// '__non_webpack_require__' is a proxy to Node 'require'
// The below code is to ensure that the server is run only when not requiring the bundle.
declare const __non_webpack_require__: NodeRequire;
const mainModule = __non_webpack_require__.main;
const moduleFilename = mainModule && mainModule.filename || '';
if (moduleFilename === __filename || moduleFilename.includes('iisnode')) {
  run();
}

export * from './src/main.server';
