document.addEventListener('DOMContentLoaded', function() {
    const claimButton = document.getElementById('claimButton');
    const notification = document.getElementById('rewardNotification');

    claimButton.addEventListener('click', function() {
        // Disable the button after claiming
        this.disabled = true;
        this.textContent = 'Reward Claimed!';

        // Update the UI to show day 6 as claimed
        const day6 = document.querySelector('.reward-day.available');
        day6.classList.remove('available');
        day6.classList.add('claimed');

        // Update the streak count
        const streakCount = document.querySelector('.streak-count');
        streakCount.textContent = '6 days';

        // Show notification
        notification.classList.add('show');

        // Hide notification after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);

        // In a real app, you would send a request to your backend here
        // to update the user's rewards and streak
    });
});