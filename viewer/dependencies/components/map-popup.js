Vue.component('map-popup',{
  data: function() {
    return {
      popupInstance: null
    }
  },
  props: {
    'map': { type: Object },
    'closeButton': { type: Boolean, default: false },
    'closeOnClick': { type: Boolean, default: true },
    'content': { type: Object },
    'location': { type: Array, default: [0, 0] }
  },
  mounted: function() {
    this.popupInstance = new mapboxgl.Popup({
      closeButton: this.closeButton,
      closeOnClick: this.closeOnClick
    });

    var container = document.createElement('div');
    var element = this.$el;
    if(element.parentNode){ element.parentNode.removeChild(element); }
    container.appendChild(element);

    this.popupInstance.setLngLat(this.location ? this.location : [0,0]).setDOMContent(this.$el);
  },
  methods: {
    hide: function(){
      this.popupInstance.remove();
    },
    show: function(){
      this.popupInstance.addTo(Global.map);
    }
  },
  watch: {
    location: function(newLocation){
      this.popupInstance.setLngLat(this.location ? this.location : [0,0]);
    },
    content: function(newContent){
      if(newContent){
        this.show();
        this.popupInstance.setDOMContent(this.$el);
      } else {
        this.hide();
      }
    }
  },
  template: `<div>
              <div class="popup-content" v-if="content">
                <slot v-bind:content="content"></slot>
              </div>
            </div>`
});
