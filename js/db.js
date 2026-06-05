// Storage module for persisting state
window.Storage = (function() {
  const STORE_KEY = 'annamalai_calc_data';

  return {
    saveData: function(data) {
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify(data));
      } catch (e) {
        console.warn('Could not save to localStorage', e);
      }
    },
    loadData: function() {
      try {
        const item = localStorage.getItem(STORE_KEY);
        return item ? JSON.parse(item) : null;
      } catch (e) {
        console.warn('Could not load from localStorage', e);
        return null;
      }
    },
    clearData: function() {
      try {
        localStorage.removeItem(STORE_KEY);
      } catch (e) {}
    }
  };
})();