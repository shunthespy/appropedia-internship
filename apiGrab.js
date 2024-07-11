const botIDs = [116268, 119543, 120737, 120901]; 
const wikiSite = "http://appropedia.org/"; //this is a temporary default and will be removed to make code more open to other sites
let excludeBots = true; //gonna make this toggleable
let currentCat = "";
var continuing = false;
let continueString = "";
let timeFrame = 0; // ms back determined by buttons

let apiLink = "";
let proxy = "https://cors-anywhere-2mlo.onrender.com/";

let totalContribs = 0;
let topContribPage = "";
let topContribCount = 0;
let totalUnique = 0; //not really needed
let allUnique = [];
let topUserPage = "";
let topUserPageCount = 0;

var hashParams = window.location.hash.substring(1).split('&'); // substr(1) to remove the `#`
for(var i = 0; i < hashParams.length; i++){
    var p = hashParams[i].split('=');
    if(hashParams != "") document.getElementById(p[0]).value = decodeURIComponent(p[1]);;
}

function fetchWikiExtract(catGrab){ //builds api link with category as input
    console.log("FETCHED");
    let wikiParams = 'w/api.php?action=query'
    + '&generator=categorymembers'
    + '&gcmlimit=100'
    + '&gcmtitle=Category:'
    + catGrab
    + '&prop=id'
    + "&format=json"
    + '&origin=*'
    if(continuing) wikiParams += continueString += gsmContinueString;
    return wikiSite + wikiParams;
}

//todo
//add some metric for recency on contrib
//^this is very easy to do through the rest api that checks edits for a page, not for individual contributors tho
//grab all contributions in terms of both number and size, add up, display for category
//as a bonus feature, display top contributed page
//also display total users contributed (unique users) and maybe top unique user page

//100 page fix DONE
//remove bot edits (currently cant)
//url parameter DONE
//turn into object with functions to wrap (probably will do this at end)
//list for users and pages (maybe like top users 10, show all button if over 10 total?)
//push down old data, compare?
//start date end date and predetermined buttons 1month 3month etc
//check for unique users in a timeframe (most likely not doable?)
//fix subpages in edit count DONE
//fix href DONE
async function setDisplay(){
    //console.log(apiLink);
    fetch(proxy + apiLink).then(response => response.json()).then(//get data for category
        data => {
            console.log(data);
            if (data.continue != null) { //this sets up continue at end of promise chain
                continueString = "&continue=" + data.continue.continue;
                gsmContinueString = "&gcmcontinue=" + data.continue.gcmcontinue;
                continuing = true;
                apiLink = fetchWikiExtract(currentCat);
            } else {
                continuing = false
            }
            let bar = Object.keys(data.query.pages);//100x coder
            for(i = 0; i < bar.length; i++){
                //get data for contributers
                fetch(genIDBasedAPILinkContributors(bar[i])).then(response => response.json()).then(//get data for page
                    data => {
                        // console.log(data);
                        let allPages = data.query.pages;
                        for (let page in allPages) {
                            let tempUnique = 0
                            let currentTitle = allPages[page].title
                            let contributors = allPages[page].contributors;
                            if(contributors[0].userid==120901) break; //translation (only) check
                            for(j = 0; j < contributors.length; j++){
                                let currentID = contributors[j].userid;
                                if(botIDs.indexOf(currentID) != -1) continue; //check not bot
                                tempUnique++; //add to unique user temp count if not bot
                                if(allUnique.indexOf(currentID) == -1){ //if current user not yet recorded
                                    allUnique.push(currentID);
                                    totalUnique++;
                                }
                            }
                            if (tempUnique > topUserPageCount) { //if this page is highest users
                                topUserPageCount = tempUnique; //save num
                                topUserPage = currentTitle; //save title
                            }
                            //needs to omit edits from bots
                            setEdits(currentTitle);
                        }; 
                        document.getElementById("totalUsers").innerText = "All unique users: " + totalUnique;
                        document.getElementById("highestUsers").innerText = "Top users in a page : " + topUserPageCount;
                        document.getElementById("highestUsersPage").innerText = "Top user page: " + topUserPage;
                        document.getElementById("highestUsersPageURL").href = wikiSite + encodeURI(topUserPage);
                        // document.getElementById("totalUsers").innerText = anime.desc;
                    }).catch(error => {console.error(error);})
                //get data for contribs
            }   
        }).then(function(){ //recur to continue
            if(continuing)setDisplay();
        })
        .catch(error => {console.error(error);})
}

async function getEdits(page){ //gets data for page edits
    let link = proxy + wikiSite + "w/rest.php/v1/page/" + encodeURIComponent(page) +"/history/counts/edits"
    if (timeFrame!=0) link += ("?from=" + timeFrame + "&to=" + Date.now())
    try {
        var response = await fetch(link, {
            method: "GET"
        });
        var data = await response.json();
        return data;
    } catch (error) {
        console.error("Error:", error);
        throw error;
    }
}

async function setEdits(page){ //gets page edits and then adds them to the counter
    let json = await getEdits(page);
    // console.log(json);
    // console.log(json.count)
    if(json.count>0)totalContribs+=json.count;
    if (topContribCount < json.count){
        topContribCount = json.count;
        topContribPage = page;
    };    
    document.getElementById("totalContribs").innerText = "Total page edits: " + totalContribs;
    document.getElementById("highestContribs").innerText = "Top edits in a page : " + topContribCount;
    document.getElementById("highestContribsPage").innerText = "Top edit page: " + topContribPage;
    document.getElementById("highestContribsPageURL").href = wikiSite + encodeURI(topContribPage);
}
//it appears as if bots aren't accurately labeled as such on the site
//for example: https://www.appropedia.org/Special:UserRights/StandardWikitext_bot seems to simply be a user whereas
//https://www.appropedia.org/Special:UserRights/Bot is labeled bot, this prevents (to my knowledge) the ability to filter from the api request
//rather i use my own bot list to do so 
function genIDBasedAPILinkContributors(id){ //finds all contributors in a page
    if (excludeBots) return proxy + wikiSite + "w/api.php?action=query&prop=contributors&pageids=" + id + "&format=json&pcexcludegroup=bot"
    return proxy + wikiSite + "w/api.php?action=query&prop=contributors&pageids=" + id + "&format=json"
}

async function setLinkToInput(){ //sets apiLink to inputted category, then dumps info on page
    totalContribs = 0;
    topContribPage = "";
    topContribCount = 0;
    currentCat = document.getElementById("category").value;
    apiLink = fetchWikiExtract(currentCat);
    continuing = await setDisplay(apiLink);
    console.log(continuing);
    while(continuing) await setDisplay(apiLink)
}

document.getElementById("test").onclick = function(){ //temporary test function
    currentCat = "Tolocar";
    apiLink = fetchWikiExtract(currentCat);
    setDisplay(apiLink);
}

document.getElementById("category").addEventListener("keypress", function(event) { //allows for enter to work on input box
    if (event.key === "Enter") {
      event.preventDefault();
      setLinkToInput();
    }
});
window.onload = function() {
    if (document.getElementById("category").value!="") setLinkToInput(); //if category put in from url, go
}