const wikiEndPoint = "http://appropedia.org/w/api.php" //make this just appropedia and include end in fetch
const botIDs = [116268, 119543, 120737, 120901];
const wikiSite = "http://appropedia.org/";

function fetchWikiExtract(catGrab){ //builds api link with category as input
    let wikiParams = '?action=query'
    + '&generator=categorymembers'
    + '&gcmlimit=100'
    + '&gcmtitle=Category:'
    + catGrab
    + '&prop=id'
    + "&format=json"
    + '&origin=*'
    return wikiEndPoint + wikiParams;
}

let apiLink = "";
let proxy = "https://cors-anywhere-2mlo.onrender.com/";

let totalContribs = 0;
let topContribPage = "";
let topContribCount = 0;

//todo
//add some metric for recency on contrib
//^this is very easy to do through the rest api that checks edits for a page, not for individual contributors tho
//grab all contributions in terms of both number and size, add up, display for category
//as a bonus feature, display top contributed page
//also display total users contributed (unique users) and maybe top unique user page
async function setDisplay(nothing){
    console.log(apiLink);
    apiLink = proxy + apiLink; //only needed for testing
    console.log(apiLink);
    let totalUnique = 0; //not really needed
    let allUnique = [];
    let topUserPage = "";
    let topUserPageCount = 0;
    let topDataPage = "";
    let topDataPageCount= 0;
    let totalContributed= 0; //data amount
    fetch(apiLink).then(response => response.json()).then(//get data for category
        data => {
            console.log(data);
            let bar = Object.keys(data.query.pages);//100x coder
            for(i = 0; i < bar.length; i++){
                //get data for contributers
                fetch(genIDBasedAPILinkContributors(bar[i])).then(response => response.json()).then(//get data for page
                    data => {
                        // console.log(data);
                        let foo = data.query.pages;
                        for (let page in foo) {
                            let tempUnique = 0
                            let contributors = foo[page].contributors;
                            console.log(contributors);
                            // console.log(contributors[0]);
                            // console.log(contributors[0].userid);
                            if(contributors[0].userid==120901) break; //translation (only) check
                            for(j = 0; j < contributors.length; j++){
                                let currentID = contributors[j].userid;
                                if(botIDs.indexOf(currentID) != -1) continue; //check not bot
                                tempUnique++; //add to unique user temp count if not bot
                                if(allUnique.indexOf(currentID) == -1){
                                    allUnique.push(currentID);
                                    totalUnique++;
                                }
                            }
                            if (tempUnique > topUserPageCount) { //if this page is highest users
                                topUserPageCount = tempUnique; //save num
                                topUserPage = foo[page].title; //save title
                            }
                            //needs to omit edits from bots
                            setEdits(foo[page].title);
                        };                        
                        console.log(totalUnique);
                        console.log(allUnique);
                        document.getElementById("totalUsers").innerText = "All unique users: " + totalUnique;
                        document.getElementById("highestUsers").innerText = "Top users in a page : " + topUserPageCount;
                        document.getElementById("highestUsersPage").innerText = "Top user page: " + topUserPage;
                        document.getElementById("highestUsersPage").href = "https://appropedia.org/" + topUserPage;
                        // document.getElementById("totalUsers").innerText = anime.desc;
                    }).catch(error => {console.error(error);})
                //get data for contribs
            }   
        }).catch(error => {console.error(error);})
}

async function getEdits(page){
    let link = proxy + wikiSite + "w/rest.php/v1/page/" +page +"/history/counts/edits"
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

async function setEdits(page){
    let json = await getEdits(page);
    console.log(json);
    console.log(json.count)
    if(json.count>0)totalContribs+=json.count;
    if (topContribCount < json.count){
        topContribCount = json.count;
        topContribPage = page;
    };
    document.getElementById("highestContribs").innerText = "Top edits in a page : " + topContribCount;
    document.getElementById("highestContribsPage").innerText = "Top edit page: " + topContribPage;
    document.getElementById("highestContribsPage").href = wikiSite + topContribPage;    
    document.getElementById("totalContribs").innerText = "Total page edits: " + totalContribs;

}
   
function genIDBasedAPILinkContributors(id){
    return proxy + wikiEndPoint + "?action=query&prop=contributors&pageids=" + id + "&format=json"
}

function genTitleBasedAPILink(title){ //currently unused
    return "action=query&prop=contributors&titles=" + title + "&format=json"
}

function setLinkToInput(){
    totalContribs = 0;
    topContribPage = "";
    topContribCount = 0;
    let newCat = document.getElementById("category").value;
    apiLink = fetchWikiExtract(newCat);
    setDisplay(apiLink);
}

document.getElementById("test").onclick = function(){
    apiLink = fetchWikiExtract("Tolocar");
    setDisplay(apiLink);
}

document.getElementById("category").addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      setLinkToInput();
    }
  });