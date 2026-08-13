import scrape from 'website-scraper';
import PuppeteerPlugin from 'website-scraper-puppeteer';
import path from 'path';

console.log('Iniciando Chromium en macOS para renderizar el sitio de Framer...');

scrape({
  urls: ['https://nexxus-hr.framer.website/'],
  directory: path.resolve('./public/framer-site-completo'),
  plugins: [
    new PuppeteerPlugin({
      launchOptions: { 
        headless: true 
      },
      scrollToBottom: {
        timeout: 10000,
        viewportN: 10
      },
      blockNavigation: true
    })
  ],
  sources: [
    { tag: 'img', attr: 'src' },
    { tag: 'img', attr: 'srcset' },
    { tag: 'link', rel: 'stylesheet', attr: 'href' },
    { tag: 'script', attr: 'src' }
  ]
}).then(() => {
  console.log('¡Sitio descargado exitosamente en ./public/framer-site-completo!');
}).catch((err) => {
  console.error('Error durante la descarga:', err);
});