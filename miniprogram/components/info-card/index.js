const actions = require('../../utils/actions.js');

Component({
  options: { addGlobalClass: true },

  properties: {
    item: { type: Object, value: {} }
  },

  data: {
    icons: { web: '↗', tel: '☎', mail: '✉', file: '↓' }
  },

  methods: {
    onLink(e) {
      const d = e.currentTarget.dataset;
      actions.openLink(d.url, d.kind, d.name);
    },

    onSrc(e) {
      actions.openLink(e.currentTarget.dataset.url, 'web', '来源原文');
    }
  }
});
