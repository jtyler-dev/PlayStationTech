# PlayStationTech
Technical homework assignment for PlayStation

# Instructions
Open the `index.html` and type search you want to look for in the search bar at the top of the page.
Clicking the search button or pressing the enter key will trigger a search to twitches `search/streams` endpoint.

Clicking the next / previous will go out and get the next set of results.

Clicking on a search result will open the selected twitch stream in a new window

# Project enhancements
Here a brief overview of the things I added to this project:

### Responsive app layout
Added in a simple version of of a possible mobile version of the application. Resizing the 
screen to a small size will rearrange the results flow to be a single column.

### Simple results caching
Added in simple search result caching. When we make a query out to the api endpoint we store that information with the page as the key.
That way when we move to/from that page we can just use the cached result to display instead of making another query out the api.
