const puppeteer = require('puppeteer');
const fs = require('fs');
const { marked } = require('marked');

(async () => {
  try {
    console.log('Reading markdown...');
    const markdown = fs.readFileSync('project_documentation.md', 'utf-8');
    
    // Convert absolute generic paths to local valid file paths so Puppeteer can load them
    const fixedMarkdown = markdown.replace(/file:\/\/\/C:\/Users\/schha\/\.gemini\/antigravity\/brain\/f98ac30b-0b02-4fbd-a588-3ee29c81ad70\/(media__[0-9]+\.(jpg|png))/g, 'ml/$1');
    // Wait, the images are in the brain artifact directory. I should copy them or just use the absolute path without file:/// for Windows. 
    // Actually, puppeteer handles file:/// correctly if formatted well, but let's just use exactly what is in the markdown.

    console.log('Parsing markdown to HTML...');
    let html = marked.parse(markdown);
    
    html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                line-height: 1.6; 
                color: #222; 
                margin: 0; 
                padding: 0; 
                font-size: 14px;
            }
            .container {
                max-width: 100%;
            }
            h1 { color: #1e3a8a; border-bottom: 3px solid #1e3a8a; padding-bottom: 10px; font-size: 28px; margin-top: 0; }
            h2 { color: #2563eb; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-top: 30px; }
            h3 { color: #3b82f6; margin-top: 20px; }
            p { margin-bottom: 15px; }
            img { 
                max-width: 100%; 
                border-radius: 12px; 
                box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); 
                margin: 25px 0; 
                display: block;
                page-break-inside: avoid;
            }
            pre { 
                background: #f1f5f9; 
                padding: 15px; 
                border-radius: 8px; 
                overflow-x: auto; 
                border: 1px solid #e2e8f0;
                page-break-inside: avoid;
            }
            code { font-family: Consolas, Monaco, monospace; font-size: 12px; color: #db2777; }
            pre code { color: #333; }
            ul, ol { margin-bottom: 15px; padding-left: 20px; }
            li { margin-bottom: 5px; }
            hr { border: 0; border-top: 1px solid #e5e7eb; margin: 30px 0; }
          </style>
        </head>
        <body>
            <div class="container">
                ${html}
            </div>
        </body>
      </html>
    `;
    
    console.log('Launching browser...');
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    console.log('Setting HTML content...');
    await page.setContent(html, { waitUntil: ['load', 'networkidle0'] });
    
    console.log('Generating PDF...');
    await page.pdf({ 
        path: 'Attendify_Technical_Documentation.pdf', 
        format: 'A4', 
        printBackground: true, 
        margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' } 
    });
    
    await browser.close();
    console.log('PDF generated successfully at Attendify_Technical_Documentation.pdf!');
  } catch (error) {
    console.error('Error generating PDF:', error);
  }
})();
