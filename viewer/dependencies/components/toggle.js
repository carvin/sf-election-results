Vue.component('toggle',{
  data: function() {
    return {
      id: null,
      internal: null
    }
  },
  props: ['options','title','field','value'],
  mounted: function() {
    this.id = this._uid;
    this.internal = this.value;
  },
  methods: {
    onChange(event){
      this.internal = event.target.value;
      this.$emit('input', event.target.value);
      this.$emit('change',event);
    }
  },
  template: `<div class="toggle form-field">
    <label>{{ title }}</label>
    <div class="toggle-options">
      <div class="toggle-option" v-for="(option, index) in options">
        <input  type="radio"
                v-bind:name="id"
                v-on:change="onChange($event)"
                v-bind:id="id + '-' + index"
                v-model="internal"
                v-bind:value="(option.value ? option.value : option)">
        <label v-bind:for="id + '-' + index">{{ option.title ? option.title : option }}</label>
      </div>
    </div>
  </div>`
});
