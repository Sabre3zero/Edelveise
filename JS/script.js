document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('card_container');
    const searchInput = document.getElementById('search');

    function createCard(product) {
        const card = document.createElement('div');
        card.className = 'card';

        const img = document.createElement('img');
        img.src = product.image;
        img.alt = product.name;
        img.loading = 'lazy';

        const textDiv = document.createElement('div');
        textDiv.className = 'card_text';

        const nameP = document.createElement('p');
        nameP.textContent = product.name;

        const priceP = document.createElement('p');
        priceP.textContent = `Цена: ${product.price} руб`;

        const cartBtn = document.createElement('div');
        cartBtn.className = 'add_to_cart';
        cartBtn.textContent = 'В корзину';

        textDiv.appendChild(nameP);
        textDiv.appendChild(priceP);
        textDiv.appendChild(cartBtn);

        card.appendChild(img);
        card.appendChild(textDiv);

        return card;
    }

    function renderProducts(filteredProducts) {
        container.innerHTML = '';
        if (filteredProducts.length === 0) {
            return;
        }
        filteredProducts.forEach(product => {
            container.appendChild(createCard(product));
        });
    }

    function filterProducts(searchTerm) {
        if (!searchTerm.trim()) {
            return products;
        }
        const lowerTerm = searchTerm.toLowerCase().trim();
        return products.filter(product =>
            product.name.toLowerCase().includes(lowerTerm)
        );
    }

    renderProducts(products);

    searchInput.addEventListener('input', (e) => {
        const filtered = filterProducts(e.target.value);
        renderProducts(filtered);
    });

    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            searchInput.value = '';
            renderProducts(products);
        }
    });
});