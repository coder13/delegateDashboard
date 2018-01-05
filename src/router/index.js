import Vue from 'vue'
import Router from 'vue-router'
import qs from 'qs'
import {gotoPreLoginPath} from '@/wcaApi'
import Home from '@/components/Home'

Vue.use(Router)

const getHashParameter = name => qs.parse(window.location.hash.slice(1))[name]

let wcaAccessToken = getHashParameter('access_token')
if (wcaAccessToken) {
  window.location.has = ''
  localStorage['groups.accessToken'] = wcaAccessToken
  gotoPreLoginPath()
}

export default new Router({
  mode: 'history',
  routes: [{
    path: '/',
    name: 'Home',
    component: Home
  }]
})
