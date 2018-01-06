import Vue from 'vue'
import Vuex from 'vuex'
import { login, logout, isLoggedIn, getUpcomingManageableCompetitions, getCompetitionJson } from '@/wcaApi'

Vue.use(Vuex)

const store = new Vuex.Store({
  state: {
    user: null,
    competitions: {}
  },
  getters: {
    isLoggedIn,
    competitions: state => state.competitions,
    competitionById: (state) => (id) => state.competitions[id]
  },
  mutations: {
    setCompetitions (state, competitions) {
      state.competitions = competitions
    },
    setCompetition (state, wcif) {
      console.log(state)
      state.competitions[wcif.id] = wcif
    }
  },
  actions: {
    login,
    logout,
    fetchCompetitions ({ commit, state }) {
      return getUpcomingManageableCompetitions().then(comps => {
        commit('setCompetitions', comps)
        return comps
      })
    },
    fetchCompetition ({ commit, state }, competitionId) {
      return getCompetitionJson(competitionId).then(wcif => {
        commit('setCompetition', wcif)
        return wcif
      })
    }
  }
})

export default store
