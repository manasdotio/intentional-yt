class ModalController {
  constructor() {
    this.buttonsElement = document.getElementById('modal-buttons');
    this.init();
  }

  init() {
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type') || 'info';
    const title = params.get('title') || 'Intentional YT';
    const message = params.get('message') || 'Modal message';

    this.renderModal(type, title, message);
    this.setupActions();
  }

  renderModal(type, title, message) {
    const titleElement = document.getElementById('modal-title');
    const messageElement = document.getElementById('modal-message');

    if (titleElement) {
      titleElement.textContent = title;
    }

    if (messageElement) {
      messageElement.textContent = decodeURIComponent(message);
    }

    if (!this.buttonsElement) {
      return;
    }

    switch (type) {
      case 'confirm':
        this.buttonsElement.innerHTML = `
          <button class="yfg-btn yfg-btn-primary" data-action="confirm" type="button">
            Confirm
          </button>
          <button class="yfg-btn yfg-btn-secondary" data-action="close" type="button">
            Cancel
          </button>
        `;
        break;
      case 'warning':
        this.buttonsElement.innerHTML = `
          <button class="yfg-btn yfg-btn-warning" data-action="close" type="button">
            Understood
          </button>
        `;
        break;
      case 'error':
        this.buttonsElement.innerHTML = `
          <button class="yfg-btn yfg-btn-danger" data-action="close" type="button">
            Close
          </button>
        `;
        break;
      default:
        this.buttonsElement.innerHTML = `
          <button class="yfg-btn yfg-btn-primary" data-action="close" type="button">
            Close
          </button>
        `;
        break;
    }
  }

  setupActions() {
    if (!this.buttonsElement) {
      return;
    }

    this.buttonsElement.addEventListener('click', (event) => {
      const target = event.target;
      const action = target && target.getAttribute ? target.getAttribute('data-action') : null;

      if (action === 'confirm') {
        this.confirm();
        return;
      }

      if (action === 'close') {
        window.close();
      }
    });
  }

  confirm() {
    if (window.opener) {
      window.opener.postMessage({ type: 'modal-confirm' }, '*');
    }

    window.close();
  }
}

window._modalController = new ModalController();