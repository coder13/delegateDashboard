import Vue from 'vue'
import Vuex from 'vuex'
import { login, logout, isLoggedIn, getUpcomingManageableCompetitions } from '@/wcaApi'

Vue.use(Vuex)

const store = new Vuex.Store({
  state: {
    user: null,
    competitions: []
  },
  getters: {
    isLoggedIn,
    getCompetitions: state => state.competitions,
    getCompetition (id) {
      return this.state.competitions[id]
    }
  },
  mutations: {
    setCompetitions (state, competitions) {
      state.competitions = competitions
    }
  },
  actions: {
    login,
    logout,
    fetchCompetitions ({ commit, state }) {
      getUpcomingManageableCompetitions().then(comps => {
        commit('setCompetitions', comps)
      })
    }
  }
})

export default store
