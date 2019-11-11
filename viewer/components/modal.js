Vue.component('modal',{
  data: function() {
    return {
      enabled: false
    }
  },
  props: ['title','behavior'],
  mounted: function() {

  },
  methods: {
    close: function(data){
      this.enabled = false;
      this.$emit('dismiss',{ submit: false  });
    },
    submit: function(){
      this.enabled = false;
      this.$emit('dismiss',{ submit: true });
    },
    show: function(){
      this.enabled = true;
    }
  },
  template: `<div v-bind:class="{ 'modal-wrap': true, panel: (behavior == 'panel') }" v-if="enabled">
              <div class="modal-bg" v-on:click="close"></div>
              <div class="modal-box">
                <div class="modal-title">
                  <h1>{{ title }}</h1>
                  <a href="#" class="modal-close" v-on:click="close"></a>
                </div>
                <div class="modal-content"><slot></slot></div>
                <div class="modal-bottom" v-if="behavior != 'panel'">
                  <button v-on:click="submit">Done</button>
                </div>
              </div>
            </div>`
});
