// ui/nlpComponent.js

class NLPComponent {
  constructor(parsedOutput) {
    this.parsedOutput = parsedOutput;
  }

  render() {
    const container = document.createElement('div');
    container.className = 'nlp-component';

    this.parsedOutput.forEach(item => {
      const itemElement = document.createElement('div');
      itemElement.className = 'nlp-item';
      itemElement.textContent = `${item.label}: ${item.value}`;
      container.appendChild(itemElement);
    });

    return container;
  }
}

export default NLPComponent;
