scheduleNotification() {
  if(this.notifEnabled && 'serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(reg => {
      // Register periodic sync for 9AM daily - Android only
      if ('periodicSync' in reg) {
        reg.periodicSync.register('payday-daily', {
          minInterval: 24 * 60 * 60 * 1000 // 24h
        });
      }
      // Fallback: show now for iOS
      reg.showNotification('Payday Countdown', {
        body: `${this.daysLeft} days left. Safe to spend: ${this.currency}${this.safeToday} today`,
        icon: 'icon-192.png',
        tag: 'payday-daily'
      });
    });
  }
},
