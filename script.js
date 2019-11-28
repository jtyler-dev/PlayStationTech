(function () {
  // set up constants we will use in the application 
  const CLIENT_ID = "zcose6j4p4mcf7zfhm20b8mvrcusl6"
  const RESULTS_PER_PAGE = 10
  const INCREMENT_PAGE = 1
  const DECREMENT_PAGE = -1

  // we are using the V5 version of the API as per the project requirements, but
  // twitch is recommending to their new API. The new API does not have 
  // feature parity as of yet and they recommend using the v5 api for the data/features
  // the new api does not have yet.
  const SEARCH_URL_V5 = "https://api.twitch.tv/kraken/search/streams"

  // grab the common dom elements we will be working with in the app
  const resultsDomEl = document.getElementById('results')
  const navBar = document.getElementById('searchResultsNav')
  const navControlsDom = document.getElementById('searchResultsNav-controls')
  const prevBtnDom = document.getElementById('searchResultsNav-prevBtn')
  const nextBtnDom = document.getElementById('searchResultsNav-nextBtn')

  // set up our state variables here
  // current uri encoded search terms
  let currentSearchTerms = ""

  // current page offset. Defaults to 1
  let currentPageOffset = 1

  // current total pages. defaults to 1
  let currentTotalPages = 1

  // current total search results
  let totalSearchResults = 0

  // client side search cache to cache result data
  let searchCache = {}

  /**
  * helper method to update the total search results in the nav bar
  */
  function updateTotalResultsDisplay() {
    const totalResultsInfoDom = document.getElementById('searchResultsNav-total')
    totalResultsInfoDom.innerHTML = `Total Results: ${totalSearchResults}`
  }

  /**
  * helper method to update what page the user is on in the nav bar
  */
  function updatePageLocation() {
    const pageInfoDom = document.getElementById('searchResultsNav-currentPageInfo')
    pageInfoDom.innerHTML=`${currentPageOffset}/${currentTotalPages}`
  }

   /**
   * helper method to build and append search results to the DOM
   * 
   * @param {Array Object} streamArray - an array of stream data objects to display
   */
  function displayResults(streamArray) {
    streamArray.forEach(stream => {
      // create the li to contain the stream information
      const streamInformation = document.createElement('li')
      streamInformation.setAttribute('class', 'streamInfo')

      // assuming that the information we get back from the api has already
      // been properly sanitized so we can use a html template and set the inner
      //  html safely
      const streamInformationMarkup = `
        <a href="${stream.channel.url}" target="_blank">
          <div class="streamInfo-container">
            <img class="streamInfo-image" src="${stream.preview.medium}" alt="${stream.channel.display_name}'s stream preview image"></img>
            <div class="streamInfo-info">
              <h1>${stream.channel.display_name}</h1>
              <p>${stream.channel.game ?  stream.channel.game + " - " : ""} ${stream.channel.views} viewers</p>
              <p>${stream.channel.description}</p>
            </div>
          </div>
        </a>
      `
      
      streamInformation.innerHTML = streamInformationMarkup

      // append the stream information to the results dom element
      resultsDomEl.appendChild(streamInformation)
    })
  }

  /**
   * helper method used to display an error message
   * if one of our api calls fail
   * 
   * @param {string} errorMessage - error message to display
   */
  function displayErrorMessage(error) {
    // we have an error, display the error message
    // hide the navBar if we have an error
    if(!navBar.classList.contains('displayNone')) {
      navBar.classList.add('displayNone')
    } 

    resultsDomEl.innerHTML = `
      <div class="error">
        <h1>Error</h1>
        <p>Message: ${error.message}</p>
      </div>
    `
  }

  /**
   * Helper function that creates an xhr request to query the twitch v5 search endpoint.
   * Takes in a url encoded search string and an onDataLoad callback function that is
   * called when the xhr function returns successful. If the search is not successful
   * it will write the error to the user
   * 
   * Note from the docs : A stream is returned if the query parameter is matched entirely 
   * or partially, in the channel description or game name. This means that a search for a game
   * like 'starcraft' will return results for both starcraft and starcraft 2
   * 
   * @param {string} searchString - url encoded search strings
   * @param {function} onDataLoad - callback function when the request is successful 
   * @param {function} onError - callback function when the request is a failure 
   */
  function searchTwitchApi (searchString, onDataLoad, onError) {

    // pop some kind of loading info
    resultsDomEl.innerHTML = "LOADING..."

    // create a new XHR request
    const request = new XMLHttpRequest()

    // set up and open our request, this must be opened first before we setup
    // the rest of the request
    // XHR.open(method, url, async)

    // note from the docs: when we actually use the offset and the limit params 
    // with the search, limit just tells the api endpoint the possible maximum number of results to return
    // the api may not return the limit every time. This is a behavior I noticed when playing pagination: ex total results 93, 
    // I page to page 3/10 and was only given back 8 stream results. This quirk is also confirmed in the dev discord.
    request.open('GET', SEARCH_URL_V5 + "?query=" + searchString + "&limit=" + RESULTS_PER_PAGE + "&offset=" + ((currentPageOffset - 1) * RESULTS_PER_PAGE ), true)

    // set the request headers as per the V5 api docs
    // https://dev.twitch.tv/docs/v5/reference/search
    request.setRequestHeader("Accept", "application/vnd.twitchtv.v5+json")
    request.setRequestHeader("Client-ID", CLIENT_ID)

    // set up what we do when we get a response back from the api
    request.onload = function () {
      // clear the loading state
      resultsDomEl.innerHTML = ""
      // check the status of the request, if its 200 we have a valid response
      if(this.status === 200) {
        const data = JSON.parse(this.response)
        onDataLoad(data)
      } else {
        const error = JSON.parse(this.response)
        onError(error)
      }
    }

    // fire off the request
    request.send()
  }

  // setup eventListeners for our search bar
  document.getElementById('searchBar').addEventListener('submit', event => {
    // stop the normal onSubmit behavior of the form element.
    event.preventDefault()

    // clear the old results
    resultsDomEl.innerHTML = ""

    // clear the search cache
    searchCache = {}

    // reset our current page offset to 1 since we are starting a new search
    currentPageOffset = 1
    currentTotalPages = 1
    totalSearchResults = 0

    if(!navBar.classList.contains('displayNone')) {
      navBar.classList.add('displayNone')
    }

    if(!navControlsDom.classList.contains("displayNone")) {
      navControlsDom.classList.add("displayNone")
    } 

    // get the input value and trim any whitespace
    const searchTerm = document.getElementById('searchBar-input').value.trim()
    
    // sanitize the user input to work with the twitch api
    const urlEncodedSearchTerms = encodeURI(searchTerm)

    // store the current search terms to be used later
    currentSearchTerms = urlEncodedSearchTerms

    // if our search term is not an empty string, we fire off a search
    if(currentSearchTerms !== "") {
      // query search api endpoint
      searchTwitchApi (currentSearchTerms, (data) => {
        totalSearchResults = data._total

        // calculate the number of pages we will have based on the results per page const
        currentTotalPages = Math.ceil(data._total/RESULTS_PER_PAGE)

        if(currentTotalPages > 1) {
          navControlsDom.classList.remove("displayNone")
        } 

        // if we dont have the current page info cached, add it to the cache
        if(searchCache[currentPageOffset] === undefined) {
          searchCache[currentPageOffset] = data.streams
        }

        updateTotalResultsDisplay()
        updatePageLocation()

        if(navBar.classList.contains('displayNone')) {
          navBar.classList.remove('displayNone')
        } 

        displayResults(data.streams)
      })
    }
  }, displayErrorMessage)


  /**
   * helper function to help with changing pages.
   * 
   * @param {int} numberOfPages - number of pages to move 
   */
  function changePage(numberOfPages) {
    // clear the current results
    resultsDomEl.innerHTML = ""

    const tempCurrentPage = currentPageOffset + numberOfPages

    if( tempCurrentPage <= 1) {
      // check to see if the page count goes negative,
      // if it does reset the offset to 1
      currentPageOffset = 1

      // add the is-disabled class to the prev button
      prevBtnDom.classList.add('is-disabled')

    } else if(tempCurrentPage >= currentTotalPages) {
      // check to see if the page count is bigger then the total number of pages,
      // if it is, then reset to the total pages
      currentPageOffset = currentTotalPages

      // add the is-disabled class to the next button
      nextBtnDom.classList.add('is-disabled')

    } else {
      // the page change is within the correct range, so we can just set it here
      currentPageOffset = tempCurrentPage

      // remove the is-disabled class to the prev and next button
      if(prevBtnDom.classList.contains('is-disabled')) {
        prevBtnDom.classList.remove('is-disabled')
      }

      if(nextBtnDom.classList.contains('is-disabled')) {
        nextBtnDom.classList.remove('is-disabled')
      }
    }

    // check to see if the local cache has page information in it
    if(searchCache[currentPageOffset] !== undefined) {
      // change what page is displayed
      updatePageLocation()

      // if we have cached information, then render that
      displayResults(searchCache[currentPageOffset])
    } else {
      // search with the new page offset
      searchTwitchApi (currentSearchTerms, (data) => {
        // change what page is displayed
        updatePageLocation()

        // if we dont have the current page info cached, add it to the cache
        if(searchCache[currentPageOffset] === undefined) {
          searchCache[currentPageOffset] = data.streams
        }

        // display the results
        displayResults(data.streams)
      }, displayErrorMessage)
    }
  }

  // setup event listeners for the next/prev buttons
  prevBtnDom.addEventListener('click', () => {
    if(currentPageOffset !== 1) {
      // decrement the page count by 1
      changePage(DECREMENT_PAGE)
    }
  })

  nextBtnDom.addEventListener('click', () => {
    if(currentPageOffset !== currentTotalPages) {
      // increment the page count by one
      changePage(INCREMENT_PAGE)
    }
  })
})()
