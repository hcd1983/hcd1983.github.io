/* Load data from spreadsheet */
Tabletop.init({ key: '1gSvNgNEw7tvGnILvzhBXriAeyJmzkzErj4GCr1f2K9E',
  callback: processData,
  simpleSheet: true })

const ls = checkLS()
const mainContent = document.getElementById('main')
const synth = window.speechSynthesis
var formattedData = (ls && JSON.parse(localStorage.getItem('GE_data'))) || {}
var listings = (ls && JSON.parse(localStorage.getItem('GE_listings'))) || {}
var favs = (ls && JSON.parse(localStorage.getItem('GE_favs'))) || []
var renderedFromLocalStorage = false

if (Object.keys(formattedData).length > 0 && Object.keys(listings).length > 0) {
  console.log('Good Eye Taipei: First render from localStorage.')
  renderedFromLocalStorage = true
  navigate()
}

document.addEventListener('click', function (e) {
  if (synth && e.target.classList && e.target.classList.contains('js-tts')) {
    const sayThis = new SpeechSynthesisUtterance(e.target.getAttribute('data-name'))
    sayThis.lang = 'zh-Hant-TW'
    synth.speak(sayThis)
  }

  if (e.target.classList && e.target.classList.contains('js-refresh-geo')) {
    renderGeoSearch(true)
  }
})

function processData (data) {
  const updatedformattedData = {}
  const updatedListings = {}
  data.forEach(function (item) {
    const chapter = item["Chapter_no"]
    const category = [item["Category_no"], item["Category"],item["Category_en"]].join("-")
    const code = chapter + item["No"]

    if (!updatedformattedData[chapter]) {
      updatedformattedData[chapter] = {
        name: item["Chapter"],
        name_en: item["Chapter_en"],
        categories: [],
        data: []
      }
    }

    if (updatedformattedData[chapter]["categories"].indexOf(category) < 0) {
      updatedformattedData[chapter]["categories"].push(category)
    }

    updatedformattedData[chapter]["data"].push(code)
    updatedListings[code] = item
  })

  console.log('Good Eye Taipei: Data updated.')
  formattedData = updatedformattedData
  listings = updatedListings

  if (!renderedFromLocalStorage) navigate()

  if (ls) {
    localStorage.setItem('GE_data', JSON.stringify(updatedformattedData))
    localStorage.setItem('GE_listings', JSON.stringify(updatedListings))
  }
}

window.onhashchange = navigate
function navigate () {
  if (!location.hash || location.hash === '#') { /* empty or # */
    renderChapters()
  } else if (location.hash.length === 2 || location.hash.length === 3) { /* #4 or #4D */
    renderChapterListings(location.hash[1])
  } else if (location.hash.match(/^#\d\w\d$/)) { /* #4D3 */
    renderListing(location.hash.slice(1, 4))
  } else if (location.hash === '#favs') {
    renderFavs()
  } else if (location.hash === '#nearby') {
    renderGeoSearch(false)
  }
  ga('set', 'page', location.hash)
  ga('send', 'pageview', {})
}

function renderChapters () {
  var html = Object.keys(formattedData).map(function (no) {
    link = `
      <a href='#${no}' class='link pv3 blue hover-dark-blue db'>
        <h2 class='mv0 fw7'>
          ${formattedData[no].name}
          <span class="f6 db normal dark-gray">${formattedData[no].name_en}</span>
        </h2>
      </a>`
    return link
  }).join("")
  html += `<a href='#nearby' class='link pv2 dark-gray hover-dark-blue db lh-solid'>${icon('geo')} <span class='fw7 blue'>附近地點</span> Nearby listings</a>`
  if (favs.length > 0) html += `<a href='#favs' class='link pv2 dark-gray hover-dark-blue db lh-solid'>${icon('saves')} <span class='fw7 blue'>儲存地點</span> Saved listings</a>`
  mainContent.innerHTML = html
  ga('set', 'title', 'Home')
}

// INTEGER chapter, 3
function renderChapterListings (chapter) {
  // {1B1: {}, 1B2: {}}
  const chap = formattedData[chapter]
  const codes = formattedData[chapter]["data"]
  const cs = []
  var html = `<nav aria-label='breadcrumb' class='lh-copy silver mb3'><a href='#' class='f6 link fw5 dark-gray'>Home</a>&nbsp;\\ `
  html += `<span class='f6 gray nowrap'>${chap["name"]} ${chap["name_en"]}</nav>`
  html += codes.map(function (code) {
    const listing = listings[code]
    var item = ""
    if (cs.indexOf(listing["Category"]) < 0) {
      cs.push(listing["Category"])
      item += `<h3 class='f4 pv3 mv0 fw7 lh-title' id='${code.slice(0, 2)}'>${listing["Category"]} <span class='fw5'>${listing["Category_en"]}</span></h3>`
    }
    item += `<a href='#${code}' class='lh-title link blue hover-dark-blue pv1 db'>${listing["Name"]} ${listing["Name_en"]}</a>`
    return item
  }).join('')
  mainContent.innerHTML = html

  const header = document.getElementById(location.hash.slice(1, 3))
  if (header) header.scrollIntoView()
  ga('set', 'title', chap["name"])
}

// STRING code, 2B3
function renderListing (code) {
  const listing = listings[code]
  const primaryName = listing["Name"] || listing["Name_en"]

  var html = `<nav aria-label='breadcrumb' class='lh-copy silver mb3 relative pl4'>`
  html += `<a class='f6 link dark-gray hover-dark-blue tc ph2 h-100 absolute left-0 dib bg-light-gray pointer flex' onclick='history.back()'><span class='self-center'>&lt;</span></a> `
  html += `<a class='f6 nowrap link dark-gray fw5 hover-dark-blue' href="#">Home</a>&nbsp;\\ `
  html += `<a class='f6 nowrap link dark-gray fw7 hover-dark-blue' href="#${listing["Chapter_no"]}">${listing["Chapter"]} <span class='fw5'>${listing["Chapter_en"]}</span></a>&nbsp;\\ `
  html += `<a class='f6 link dark-gray fw7 hover-dark-blue' href="#${listing["Chapter_no"]}${listing["Category_no"]}"><span class='nowrap'>${listing["Category"]}</span>&nbsp;<span class='fw5'>${listing["Category_en"]}</span></a>`
  html += `</nav>`
  html += `<h2 class='f2 mb0 dark-gray fw7'>${primaryName}`
  if (primaryName === listing["Name_en"]) {
    html += `</h2>`
  } else {
    if (synth) html += `<button type='button' class='js-tts di bg-transparent bn pa0' data-name='${primaryName}'>${icon('speak')}</button>`
    html += `<br><span class='f4 normal gray'>${listing["Name_en"]}</span></h1>`
  }
  if (listing["Image"]) {
    html += `<img src='./data/${listing["Image"]}' alt='' class='mv4'>`
  } else {
    html += `<div class='tc bg-light-gray mv4 pa4'>${icon('camera')}</div>`
  }
  html += `<p class='lh-copy mb4 empty-filler'>${listing["Subtitle"]}`
  if (listing["Subtitle_en"]) html += `<br>${listing["Subtitle_en"]}`
  html += `</p>`

  html += `<div class='lh-copy pv2 ph2 ba b--light-silver relative'>`
  if (listing["Add"])    html += `<a class='pl4 db pv2 link dark-gray f6 pr2' href='${googm(listing["Google map"]) || "javascript://"}'>${icon("map")}${listing["Add"]}<br>${listing["Add_en"]}</a>`
  if (listing["Number"]) html += `<a class='pl4 link dark-gray f6 db pv2 pr2' href='tel://${listing["Number"].replace(/\s/g, "")}'>${icon("phone")}${listing["Number"]}</a>`
  if (listing["Web"])    html += `<a class='pl4 link dark-gray f6 db pv2 pr2' href='${listing["Web"]}'>${icon("web")}${listing["Web"]}</a>`
  if (listing["Hours"])  html += `<div class='pl4 gray f6 pv2 pr2'>${icon("hours")}${listing["Hours"]}</div>`
  if (ls) {
    if (favs.indexOf(code) < 0) {
      html += `<button type='button' onclick='toggleFav("${code}")' class='pointer bg-transparent w-100 bn tl pl4 link dark-gray f6 db pv2 pr2'>${icon("fav")} Save</a>`
    } else {
      html += `<button type='button' onclick='toggleFav("${code}")' class='pointer bg-transparent w-100 bn tl pl4 link dark-red f6 db pv2 pr2'>${icon("unfav")} Saved</a>`
    }
  }
  html += `</div>`

  mainContent.innerHTML = html
  window.scrollTo(0, 0)
  ga('set', 'title', primaryName)
}

function renderFavs () {
  var html = `<nav aria-label='breadcrumb' class='lh-copy silver mb3'><a href='/#' class='f6 link fw5 dark-gray'>Home</a> `
  html += `\\ <span class='f6 gray'>儲存地點 Saved listings</nav>`
  html += favs.map(function (code) {
    const listing = listings[code]
    return `<a href='/#${code}' class='lh-title link blue hover-dark-blue pv1 db mb3'>${listing["Name"]} ${listing["Name_en"]}<br><span class='db mt1 f6 gray'>${listing["Category"]} ${listing["Category_en"]}</span></a>`
  }).join('')
  mainContent.innerHTML = html
  ga('set', 'title', '儲存地點')
}

function icon (type) {
  if (type === 'map') {
    return '<svg fill="#777777" class="absolute pl2 ml2 left-0" height="18" viewBox="0 0 24 24" width="18" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/><path d="M0 0h24v24H0z" fill="none"/></svg>'
  } else if (type === 'phone') {
    return '<svg fill="#777777" class="absolute pl2 ml2 left-0" height="18" viewBox="0 0 24 24" width="18" xmlns="http://www.w3.org/2000/svg"><path d="M0 0h24v24H0z" fill="none"/><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>'
  } else if (type === 'web') {
    return '<svg fill="#777777" class="absolute pl2 ml2 left-0" height="18" viewBox="0 0 24 24" width="18" xmlns="http://www.w3.org/2000/svg"><path d="M0 0h24v24H0z" fill="none"/><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm6.93 6h-2.95c-.32-1.25-.78-2.45-1.38-3.56 1.84.63 3.37 1.91 4.33 3.56zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2 0 .68.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56-1.84-.63-3.37-1.9-4.33-3.56zm2.95-8H5.08c.96-1.66 2.49-2.93 4.33-3.56C8.81 5.55 8.35 6.75 8.03 8zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66c-.09-.66-.16-1.32-.16-2 0-.68.07-1.35.16-2h4.68c.09.65.16 1.32.16 2 0 .68-.07 1.34-.16 2zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95c-.96 1.65-2.49 2.93-4.33 3.56zM16.36 14c.08-.66.14-1.32.14-2 0-.68-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z"/></svg>'
  } else if (type === 'hours') {
    return '<svg fill="#777777" class="absolute pl2 ml2 left-0" height="18" viewBox="0 0 24 24" width="18" xmlns="http://www.w3.org/2000/svg"><path d="M0 0h24v24H0z" fill="none"/><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg>'
  } else if (type === 'fav') {
    return '<svg fill="#777777" class="absolute pl2 ml2 left-0" height="18" viewBox="0 0 24 24" width="18" xmlns="http://www.w3.org/2000/svg"><path d="M0 0h24v24H0z" fill="none"/><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>'
  } else if (type === 'unfav') {
    return '<svg fill="#e7040f" class="absolute pl2 ml2 left-0" height="18" viewBox="0 0 24 24" width="18" xmlns="http://www.w3.org/2000/svg"><path d="M0 0h24v24H0z" fill="none"/><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>'
  } else if (type === 'saves') {
    return '<svg fill="#777777" class="mr1 v-btm" height="18" viewBox="0 0 24 24" width="18" xmlns="http://www.w3.org/2000/svg"><path d="M0 0h24v24H0z" fill="none"/><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>'
  } else if (type === 'geo') {
    return '<svg fill="#777777" class="mr1 v-btm" height="18" viewBox="0 0 24 24" width="18" xmlns="http://www.w3.org/2000/svg"><path d="M0 0h24v24H0z" fill="none"/><path d="M12 8c-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/></svg>'
  } else if (type === 'camera') {
    return '<svg fill="#cccccc" height="40" viewBox="0 0 24 24" width="36" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="3.2"/><path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/><path d="M0 0h24v24H0z" fill="none"/></svg>'
  } else if (type === 'speak') {
    return '<svg fill="#777777" height="18" viewBox="0 0 24 24" width="18" style="pointer-events: none;" xmlns="http://www.w3.org/2000/svg"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/><path d="M0 0h24v24H0z" fill="none"/></svg>'
  }
}

function checkLS () {
  try {
    return localStorage
  } catch(e) {
    return false
  }
}

function toggleFav (code) {
  if (favs.indexOf(code) < 0) {
    favs.push(code)
  } else {
    favs.splice(favs.indexOf(code), 1)
  }

  renderListing(code)
  localStorage.setItem('GE_favs', JSON.stringify(favs))
}

/* Turn google map URL into using iOS schema, need to check what works for Andriod */
/* GSA matches for iOS Google App (not Chrome) */
function googm (url) {
  /* Remove @ center latlong so it doesn't shift left (result from web map sidebar) */
  url = url.replace(/@.+\dz\//, '')

  if ((navigator.userAgent.match(/iPhone/) || navigator.userAgent.match(/Andriod/)) && !navigator.userAgent.match(/GSA/)) {
    return url.replace('https://', 'comgooglemapsurl://')
  } else {
    return url
  }
}

function renderGeoSearch (refreshGeo) {
  if (refreshGeo || !("geoData" in window)) {
    var html = `<nav aria-label='breadcrumb' class='lh-copy silver mb3'><a href='/#' class='f6 link fw5 dark-gray'>Home</a> `
    html += `\\ <span class='f6 gray'>附近地點 Nearby listings</nav>`
    html += '<div class="eye"><div class="eyeball"></div></div><div class="eye"><div class="eyeball"></div></div><br>Looking for you...'
    mainContent.innerHTML = html

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(function (geo) {
        window.geoData = geo.coords
        renderNearby()
      }, function (error) {
        mainContent.innerHTML = mainContent.innerHTML + "<br>Failed. This app doesn't have access to your location."
      })
    } else {
      mainContent.innerHTML = mainContent.innerHTML + "<br>Geolocation is not supported in this browser."
    }
  } else {
    renderNearby()
  }

  ga('set', 'title', '附近地點')
}

function renderNearby () {
  const listingsByDistance = []
  const start = {latitude: geoData.latitude, longitude: geoData.longitude}
  for (const key of Object.keys(listings)) {
    const match = listings[key]["Google map"].match(/@([\d\.]+),([\d\.]+),\d+z/)
    if (match) {
      listings[key].distance = geolib.getDistance(start, { latitude: match[1], longitude: match[2] })
      if (listings[key].distance < 1000) {
        listingsByDistance.push(listings[key])
      }
    }
  }

  listingsByDistance.sort(function (a, b) { return a.distance - b.distance })

  var html = `<nav aria-label='breadcrumb' class='lh-copy silver mb3'><a href='/#' class='f6 link fw5 dark-gray'>Home</a> `
  html += `\\ <span class='f6 gray'>附近地點 Nearby listings — <button type='button' class='js-refresh-geo f6 dark-gray bg-transparent bn pa0'>Refresh</button></nav>`
  html += listingsByDistance.map(function (listing) {
    const code = listing["Chapter_no"] + listing["No"]
    var item = `<a href='#${code}' class='lh-title link blue hover-dark-blue pv1 db mb3'><span class='db mb1 f6 gray'>`
    if (favs.indexOf(code) >= 0) item += `${icon('saves')}`
    item += `${listing["Category"]} ${listing["Category_en"]}</span>`
    item += `${listing["Name"]} ${listing["Name_en"]}`
    item += `<span class='f6 gray'>— ${listing["distance"]} meters away</span></a>`
    return item
  }).join('')
  if (listingsByDistance.length === 0) html += '<p class="lh-copy">😱 找不到你附近的地點。<br>We couldn\'t find anything near you.</p>'
  mainContent.innerHTML = html
}
