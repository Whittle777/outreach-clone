const { JSDOM } = require('jsdom');
const assert = require('assert');

describe('UIComponent', function() {
  let dom;
  let document;

  beforeEach(function() {
    dom = new JSDOM(`
      <html>
        <body>
          <div id="app"></div>
        </body>
      </html>
    `);
    document = dom.window.document;
  });

  describe('render', function() {
    it('should render the UI component correctly', function() {
      const uiComponent = {
        render: function() {
          const appDiv = document.getElementById('app');
          appDiv.innerHTML = '<h1>Hello, World!</h1>';
        }
      };
      uiComponent.render();
      const h1 = document.querySelector('h1');
      assert.strictEqual(h1.textContent, 'Hello, World!');
    });
  });
});
