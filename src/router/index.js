import Vue from 'vue'
import Router from 'vue-router'
import Home from '@/components/Home'
import Competition from '@/components/Competition'

Vue.use(Router)

export default new Router({
  mode: 'history',
  routes: [{
    path: '/',
    name: 'Home',
    component: Home
  }, {
    path: '/:competitionId/',
    name: 'Competition',
    component: Competition
  }]
})
