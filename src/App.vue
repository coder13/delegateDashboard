<template>
  <div id="app">
    <button @click="login">Login</button>
    <button @click="logout">Logout</button>
    <button @click="fetchData">Fetch</button>
    <ul v-if="competitions">
      <li v-for="(comp,index) in competitions" :key="index">{{comp.name}}</li>
    </ul>
    <router-view/>
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
    this.fetchData()
  },
  computed: {
    ...mapGetters({
      competitions: 'getCompetitions'
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
