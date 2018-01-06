<template>
  <div>
    <div v-if="this.loaded">
      <h1>{{comp.name}}</h1>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Competition',
  data () {
    return {
      id: this.$route.params.competitionId,
      comp: this.$store.getters.competitionById(this.$route.params.competitionId)
    }
  },
  watch: {
    '$route': 'fetchData'
  },
  created () {
    this.fetchData()
  },
  computed: {
    loaded () {
      return !!this.comp
    }
  },
  methods: {
    fetchData () {
      this.$store.dispatch('fetchCompetition', this.id).then((json) => {
        this.comp = json
      })
    }
  }
}
</script>

<style scoped>
</style>
