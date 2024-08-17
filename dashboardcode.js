// const botIDs = [116268, 119543, 120737, 120901]; 
const wikiSite = "http://appropedia.org/"; //this is a temporary default and will be removed to make code more open to other sites
let excludeBots = true; //gonna make this toggleable
let currentCat = "";
var continuing = false;
let continueString = "";
var siteArray = [];
var userArray = [];

let apiLink = "";
let proxy = "https://cors-anywhere-2mlo.onrender.com/";

let totalContribs = 0;
let totalUnique = 0;
let allUnique = [];
let topUserPage = "";
let topUserPageCount = 0;

var hashParams = window.location.hash.substring(1).split('&'); // substr(1) to remove the `#`
for(var i = 0; i < hashParams.length; i++){
    if(hashParams.length == 0) break;
    var p = hashParams[i].split('=');
    
    // if(p!=null) document.getElementById(p[0]).value = decodeURIComponent(p[1]);
    if(p!=null) currentCat = decodeURIComponent(p[1]);
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

//todo super current
//make top scoring edit page list with titles and link :)
//remove push down code

//add some metric for recency on contrib
//^found out this is not doable, at least not from anything i've seen (unless you call each user that has edited and cross-reference for each edit?)

//remove bot edits (currently cant) (can now maybe)
//turn into object with functions to wrap (probably will do this at end)
//list for users and pages (maybe like top users 10, show all button if over 10 total?)
//start date end date and predetermined buttons 1month 3month etc CURRENTLY CANT DO? to from parameters only work with revision ids
//check for unique users in a timeframe (most likely not doable?)
//fix href AGAIN
async function setDisplayTop(){
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
            let bar = Object.keys(data.query.pages);
            for(i = 0; i < bar.length; i++){
                //get data for contributers
                fetch(genIDBasedAPILinkContributors(bar[i])).then(response => response.json()).then(//get data for page
                    data => {
                        // console.log(data);
                        let allPages = data.query.pages;
                        for (let page in allPages) {
                            // let tempUnique = 0
                            let currentTitle = allPages[page].title
                            let contributors = allPages[page].contributors;
                            if (contributors!=null) {
                                for(j = 0; j < contributors.length; j++){
                                    let currentID = contributors[j].userid;
                                    if(allUnique.indexOf(currentID) == -1){ //if current user not yet recorded
                                        let currentName = contributors[j].name;
                                        userArray.push([currentName, 1, currentID]);
                                        allUnique.push(currentID); //more efficient than scanning complex array every time
                                    } else {
                                        userArray[indexOfUser(userArray, currentID)][1]++; //add 1 to count part of user data
                                    }
                                }
                            }                            
                            //needs to omit edits from bots
                            setEdits(currentTitle);
                            postUsers();
                        }; 
                        // document.getElementById("totalUsers").innerText = anime.desc;
                    }).catch(error => {console.error(error);})
                //get data for contribs
            }   
        }).then(function(){ //recur to continue
            if(continuing) setDisplayTop();
        })
        .catch(error => {console.error(error);})
}

function indexOfUser(arr, id){
    console.log(arr);
    for(let index = 0; index < arr.length; index++){
        console.log(arr[index]);
        console.log(arr[index][2]);
        if (arr[index][2] == id) return index;
    }
    return -1;
}

function postUsers(){ //takes all and puts onto site
    userArray.sort(function(a,b) {
        return a[1]-b[1]
    });
    userArray.reverse();
    let container = document.querySelector('#userlist')
    container.innerHTML = ''; //in case of refresh
    userArray.forEach(e => {
        let newListObject = document.createElement("a");
        let newListObject2 = document.createElement("a");
        let newText = document.createTextNode(e[0]);
        let newText2 = document.createTextNode(': ' + e[1]);
        newListObject.appendChild(newText);
        newListObject2.appendChild(newText2);
        newListObject.href = wikiSite + 'User:' + encodeURI(e[0]);
        container.appendChild(newListObject);
        container.appendChild(newListObject2);
        container.appendChild(document.createElement("br"));
    });
}

async function setEdits(page){ //gets page edits and pushes to array of them
    let json = await getEdits(page);
    if(json.count>0)totalContribs+=json.count; //keeping for now in case we want it
    let tempPage = page;
    let tempCount = json.count;
    siteArray.push([tempPage, tempCount]) //have to add href to each child with wikiSite + encodeURI(page or whatever nested page title);
    postEdits(); //this feels disgusting but ya gotta do it
}

async function getEdits(page){ //gets data for page edits (bots can't be filtered out according to documentation, could potentially do some subtraction by getting bot edits too)
    let link = proxy + wikiSite + "w/rest.php/v1/page/" + encodeURIComponent(page) +"/history/counts/edits"
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

function postEdits(){ //takes all and puts onto site
    siteArray.sort(function(a,b) {
        return a[1]-b[1]
    });
    siteArray.reverse();
    let container = document.querySelector('#articlelist')
    container.innerHTML = ''; //in case of refresh
    siteArray.forEach(e => {
        let newListObject = document.createElement("a");
        let newListObject2 = document.createElement("a");
        let newText = document.createTextNode(e[0]);
        let newText2 = document.createTextNode(': ' + e[1]);
        newListObject.appendChild(newText);
        newListObject2.appendChild(newText2);
        newListObject.href = wikiSite + encodeURI(e[0]);
        container.appendChild(newListObject);
        container.appendChild(newListObject2);
        container.appendChild(document.createElement("br"));
    });
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
    resetVals();
    // currentCat = document.getElementById("category").value;
    apiLink = fetchWikiExtract(currentCat);
    continuing = true; //set up to help stop double clicks\
    setDisplayTop(apiLink)
}

function resetVals(){
    totalContribs = 0;
    totalUnique = 0;
    allUnique = [];
    userArray = [];
    siteArray = [];
}

window.onload = function() {
    if (currentCat!="") setLinkToInput(); //if category put in from url, go
}