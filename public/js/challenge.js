// Simple notification system
document.querySelectorAll('.btn-claim').forEach(button => {
    if (!button.disabled && button.textContent === 'Claim') {
        button.addEventListener('click', function() {
            this.textContent = 'Claimed';
            this.disabled = true;

            // Show notification
            const notification = document.getElementById('rewardNotification');
            notification.classList.add('show');

            // Hide notification after 3 seconds
            setTimeout(() => {
                notification.classList.remove('show');
            }, 3000);

            // Update stats (in a real app, this would update the backend)
            const xpElement = document.querySelector('.stat-item:nth-child(1) .stat-value');
            const coinsElement = document.querySelector('.stat-item:nth-child(2) .stat-value');

            xpElement.textContent = (parseInt(xpElement.textContent) + 75).toLocaleString();
            coinsElement.textContent = (parseInt(coinsElement.textContent) + 35).toLocaleString();
        });
    }
});