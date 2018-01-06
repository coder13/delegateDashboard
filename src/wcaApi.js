import qs from 'qs'

console.log(process.env)
export const APP_ID = process.env.app_id
export const BASE_URL = `https://${process.env.staging ? 'staging' : 'www'}.worldcubeassociation.org`

const getHashParameter = name => qs.parse(window.location.hash.slice(1))[name]
const toWcaUrl = path => `${BASE_URL}${path}`

let wcaAccessToken = getHashParameter('access_token')
if (wcaAccessToken) {
  window.location.has = ''
  localStorage['groups.accessToken'] = wcaAccessToken
  gotoPreLoginPath()
} else {
  wcaAccessToken = getAccessToken()
}

export function isLoggedIn () {
  return !!getAccessToken()
}

export function getAccessToken () {
  return localStorage['groups.accessToken']
}

export function login () {
  let redirectUri = window.location.origin + '/oauth/wca'
  let logInUrl = toWcaUrl(`/oauth/authorize?${qs.stringify({
    client_id: APP_ID,
    redirect_uri: redirectUri,
    response_type: 'token',
    scope: process.env.scopes
  }, {
    format: 'RFC1738'
  })}`)

  localStorage['groups.preLoginHref'] = window.location.href
  window.location = logInUrl
}

export function logout () {
  delete localStorage['groups.accessToken']
  // wcaAccessToken = null
  window.location.reload()
}

export function getCompetitionJson (competitionId) {
  return wcaApiFetch(`/competitions/${competitionId}/wcif`).then(response => response.json())
}

export function getUpcomingManageableCompetitions () {
  let oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  return wcaApiFetch(
    `/competitions?managed_by_me=true&start=${oneWeekAgo.toISOString()}`
  ).then(response => response.json())
}

export function gotoPreLoginPath () {
  let preLoginHref = localStorage['groups.preLoginHref'] || '/'
  delete localStorage['groups.preLoginHref']
  window.location.replace(preLoginHref)
}

function wcaApiFetch (path, fetchOptions) {
  var baseApiUrl = toWcaUrl('/api/v0')
  fetchOptions = Object.assign({}, fetchOptions, {
    headers: new Headers({
      'Authorization': `Bearer ${wcaAccessToken}`,
      'Content-Type': 'application/json'
    })
  })

  return fetch(`${baseApiUrl}${path}`, fetchOptions).then(response => {
    if (!response.ok) {
      throw new Error(`${response.status}: ${response.statusText}`)
    }

    return response
  })
}
