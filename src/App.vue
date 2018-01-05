<template>
  <div id="app" class="mdl-layout mdl-js-layout mdl-layout--fixed-header">
    <header class="mdl-layout__header">
      <div class="mdl-layout__header-row">
        <span class="mdl-layout-title">Groups</span>
        <div class="mdl-layout-spacer"></div>

        <div class="mdl-navigation">
          <button v-if="isLoggedIn" @click="logout" href="/" class="mdl-button" style="color: white">Logout</button>
          <button v-else @click="login" href="/" class="mdl-button" style="color: white">Login</button>

          <button v-if="isLoggedIn" id="demo-menu-lower-right" class="mdl-button mdl-js-button mdl-button--icon">
            <i class="material-icons">more_vert</i>
          </button>

          <ul class="mdl-menu mdl-menu--bottom-right mdl-js-menu mdl-js-ripple-effect" for="demo-menu-lower-right">
            <li class="mdl-menu__item" @click="fetchData">Refresh</li>
          </ul>
        </div>
      </div>
    </header>
    <main class="mdl-layout__content">
      <ul class="mdl-list">
        <li v-for="(comp,index) in competitions" :key="index" class="mdl-list__item">{{comp.name}}</li>
      </ul>
      <router-view/>
    </main>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'

export default {
  name: 'app',
  data () {
    return {
    }
  },
  created () {
    if (this.$store.getters.isLoggedIn) {
      this.fetchData()
    }
  },
  computed: {
    ...mapGetters({
      competitions: 'getCompetitions',
      isLoggedIn: 'isLoggedIn'
    })
  },
  methods: {
    ...mapActions(['login', 'logout']),
    fetchData () {
      this.$store.dispatch('fetchCompetitions')
    }
  }
}
</script>

<style>
</style>
