<template>
  <ul class="mdl-list">
    <li v-for="(comp,index) in competitions" :key="index" class="mdl-list__item">
      <span class="mdl-list__item-primary-content">
      <a :href="comp.id">{{comp.name}}</a>
      </span>
    </li>
  </ul>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  name: 'Home',
  data () {
    return {
    }
  },
  created () {
    if (this.$store.getters.isLoggedIn) {
      this.$store.dispatch('fetchCompetitions')
    }
  },
  computed: {
    ...mapGetters(['competitions'])
  }
}
</script>

<style scoped>
</style>
