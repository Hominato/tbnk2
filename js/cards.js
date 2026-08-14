/**
 * Horizon National Bank - Virtual Card Manager
 */
"use strict";

document.addEventListener("DOMContentLoaded", () => {
    SecurityEngine.verifySession();
    const cardContainer = document.getElementById("cards-render-wrapper");
    if (!cardContainer) return;

    const renderCards = () => {
        const cards = StorageEngine.get(DB_KEYS.CARDS);
        cardContainer.innerHTML = "";

        cards.forEach(card => {
            const cardEl = document.createElement("div");
            cardEl.className = `bank-card-widget ${card.isFrozen ? 'frozen' : ''}`;
            cardEl.innerHTML = `
        <div class="card-inner" id="card-inner-${card.id}">
          <!-- Front Face -->
          <div class="card-front">
            <div class="card-header">
              <span class="bank-brand">HORIZON</span>
              <span class="card-type">${card.type}</span>
            </div>
            <div class="card-chip"></div>
            <div class="card-number">${card.cardNumber.replace(/(.{4})/g, '$1 ').trim()}</div>
            <div class="card-footer">
              <div>
                <div class="card-label">CARD HOLDER</div>
                <div class="card-val">${card.holderName}</div>
              </div>
              <div>
                <div class="card-label">EXPIRES</div>
                <div class="card-val">${card.expiry}</div>
              </div>
            </div>
          </div>
          <!-- Back Face -->
          <div class="card-back">
            <div class="magnetic-strip"></div>
            <div class="cvv-strip">
              <span>CVV: ${card.cvv}</span>
            </div>
            <div class="card-back-text">
              Authorized Signature • Not valid unless signed. Issued by Horizon National Bank, N.A. Member FDIC.
            </div>
          </div>
        </div>
        <div class="card-controls">
          <button class="btn btn-secondary btn-sm" onclick="CardsManager.flipCard('${card.id}')">
            <i class="fa-solid fa-rotate"></i> Flip
          </button>
          <button class="btn ${card.isFrozen ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="CardsManager.toggleFreeze('${card.id}')">
            <i class="fa-solid ${card.isFrozen ? 'fa-lock-open' : 'fa-snowflake'}"></i> ${card.isFrozen ? 'Unfreeze' : 'Freeze'}
          </button>
        </div>
      `;
            cardContainer.appendChild(cardEl);
        });
    };

    window.CardsManager = {
        flipCard: (id) => {
            const cardInner = document.getElementById(`card-inner-${id}`);
            cardInner.classList.toggle("flipped");
        },
        toggleFreeze: (id) => {
            const cards = StorageEngine.get(DB_KEYS.CARDS);
            const card = cards.find(c => c.id === id);
            if (card) {
                card.isFrozen = !card.isFrozen;
                StorageEngine.updateItem(DB_KEYS.CARDS, id, card);
                Utils.showToast(`Card ${card.isFrozen ? 'frozen' : 'activated'} successfully.`, card.isFrozen ? 'warning' : 'success');
                renderCards();
            }
        }
    };

    renderCards();
});