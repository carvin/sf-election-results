Vue.component('dropdown',{
  data: function() {
    return {
      id: null,
      internal: null
    }
  },
  props: {
    options: { type: Array },
    title: { type: String },
    field: { type: String },
    value: { type: null }
  },
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
  watch: {
    "options": function(val){
      if(val && (this.internal == null || this.options.indexOf(this.internal) < 0)) {
        this.internal = this.options[0].value ? this.options[0].value : this.options[0];
        this.$emit('input', this.internal);
      }
    },
    "value": function(val){
      this.internal = val;
    }
  },
  template: `<div class="dropdown form-field">
    <label v-bind:for="id">{{ title }}</label>
    <div class="dropdown-select">
      <select v-bind:id="id" v-model="internal" v-on:change="onChange($event)">
        <option v-for="option in options" v-bind:value="option.value ? option.value : option">
          {{ option.title ? option.title : option }}
        </option>
      </select>
    </div>
  </div>`
});
