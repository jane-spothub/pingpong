document.addEventListener('DOMContentLoaded', function() {
    const purchaseButtons = document.querySelectorAll('.btn-purchase, .item-btn');
    const notification = document.getElementById('rewardNotification');
    const kshBtn = document.getElementById('kshBtn');
    const usdBtn = document.getElementById('usdBtn');
    const eurBtn = document.getElementById('eurBtn');

    // Currency switching
    function setCurrency(currency) {
        kshBtn.classList.remove('active');
        usdBtn.classList.remove('active');
        eurBtn.classList.remove('active');

        if (currency === 'ksh') {
            kshBtn.classList.add('active');
            // In a real app, you would update all prices to KSH
        } else if (currency === 'usd') {
            usdBtn.classList.add('active');
            // In a real app, you would update all prices to USD
        } else if (currency === 'eur') {
            eurBtn.classList.add('active');
            // In a real app, you would update all prices to EUR
        }
    }

    kshBtn.addEventListener('click', () => setCurrency('ksh'));
    usdBtn.addEventListener('click', () => setCurrency('usd'));
    eurBtn.addEventListener('click', () => setCurrency('eur'));

    // Purchase handling
    purchaseButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Show notification
            notification.querySelector('div').textContent =
                this.classList.contains('item-btn')
                    ? 'Item purchased successfully!'
                    : 'VIP package activated!';

            notification.classList.add('show');

            // Hide notification after 3 seconds
            setTimeout(() => {
                notification.classList.remove('show');
            }, 3000);

            // In a real app, you would process the payment here
            // and update the user's account accordingly
        });
    });
});