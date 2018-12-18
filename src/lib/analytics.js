const state = {
  lastPage: '',
};

let ga;
if(typeof window !== 'undefined') {
  ga = window.ga;
}

export default {
  sendRoute(page) {
    if(ga && page !== state.lastPage) {
      state.lastPage = page;
      ga('set', 'page', page);
      ga('send', 'pageview');
    }
  }
};