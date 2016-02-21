var pomoStartFunction;
var pomoIntervalFunction;
var pomoCurrentState = "atRest";
var pomoWorkCompleted = false;
var pomoRestCompleted = true;
var pomoIsIdle = true;
var pomoStartAudio = new Audio("sullivan_roar.ogg");
var pomoRestAudio = new Audio("boo_laugh.ogg")
var SETTINGS = defaultSettings();

function defaultSettings() {
  return {
    blockedSites: [
      'facebook.com',
      'youtube.com',
      'twitter.com',
      'tumblr.com',
      'reddit.com'
    ]
  }
}

function blockSites() {
  var windows = chrome.windows.getAll({populate: true}, function (windows) {
    var tabs;
    for(var i in windows) {
      tabs = windows[i].tabs;
      for(var j in tabs) {
        blockSite(tabs[j]);
      }
    }
  });
}

function blockSite(tab) {
  var siteUrl = tab.url.split('://');
  var siteUrlComponents = getDomainAndPath(siteUrl[1]);
  if(isSiteBlocked(siteUrlComponents)){
    chrome.tabs.executeScript(tab.id, {file: "scripts/block_site.js"});
  }
}

function unBlockSites() {
  var windows = chrome.windows.getAll({populate: true}, function (windows) {
    var tabs;
    for(var i in windows) {
      tabs = windows[i].tabs;
      for(var j in tabs) {
        unBlockSite(tabs[j]);
      }
    }
  });
}

function unBlockSite(tab) {
  var siteUrl = tab.url.split('://');
  var siteUrlComponents = getDomainAndPath(siteUrl[1]);
  if(isSiteBlocked(siteUrlComponents)){
    chrome.tabs.executeScript(tab.id, {file: "scripts/unblock_site.js"});
  }
}


function getDomainAndPath(url){
  var urlComponents = url.split('/');
  return {domain: urlComponents.shift(), path: urlComponents.join('/')};
}

function isSiteBlocked(siteUrlComponents) {
  for(var k in SETTINGS.blockedSites) {
    listedPattern = getDomainAndPath(SETTINGS.blockedSites[k]);
    if(locationsMatch(siteUrlComponents, listedPattern)) {
      return true;
    }
  }
  return false;
}

function locationsMatch(location, listedPattern) {
  return domainsMatch(location.domain, listedPattern.domain) &&
    pathsMatch(location.path, listedPattern.path);
}

function pathsMatch(givenValue, against) {
  /*
    index.php ~> [null]: pass
    index.php ~> index: pass
    index.php ~> index.php: pass
    index.php ~> index.phpa: fail
    /path/to/location ~> /path/to: pass
    /path/to ~> /path/to: pass
    /path/to/ ~> /path/to/location: fail
  */

  return !against || givenValue.substr(0, against.length) == against;
}

function domainsMatch(givenValue, against) {
  /*
    google.com ~> google.com: case 1, pass
    www.google.com ~> google.com: case 3, pass
    google.com ~> www.google.com: case 2, fail
    google.com ~> yahoo.com: case 3, fail
    yahoo.com ~> google.com: case 2, fail
    bit.ly ~> goo.gl: case 2, fail
    mail.com ~> gmail.com: case 2, fail
    gmail.com ~> mail.com: case 3, fail
  */

  // Case 1: if the two strings match, pass
  if(givenValue === against) {
    return true;
  } else {
    var givenValueFrom = givenValue.length - against.length - 1;

    // Case 2: if the second string is longer than first, or they are the same
    // length and do not match (as indicated by case 1 failing), fail
    if(givenValueFrom < 0) {
      return false;
    } else {
      // Case 3: if and only if the first string is longer than the second and
      // the first string ends with a period followed by the second string,
      // pass
      return givenValue.substr(givenValueFrom) === '.' + against;
    }
  }
}

function initializePomoStart(callback, completeCallback) {
  pomoIsIdle = false;
  chrome.browserAction.setBadgeText({text: "25m"});
  chrome.browserAction.setBadgeBackgroundColor({color: "#FF00FF"});
  pomoStartFunction = setInterval(callback, 1000, completeCallback);
  pomoCurrentState = "atWork";
  pomoWorkCompleted = false;
  pomoRestCompleted = true;
  chrome.browserAction.setIcon({path : {"19" : "james_sullivan.png"}});
  blockSites();
}

function completePomoWork(){
  badgeText = '';
  pomoCurrentState = "atRest";
  pomoWorkCompleted = true;
  pomoRestCompleted = false;
  pomoIsIdle = true;
  chrome.browserAction.setIcon({path : {"19" : "boo.png"}});
  clearInterval(pomoStartFunction);
  pomoRestAudio.currentTime = 3;
  pomoRestAudio.play();
  return badgeText;
}

function initializePomoRest(callback, completeCallback) {
  pomoIsIdle = false;
  chrome.browserAction.setBadgeText({text: "5m"});
  chrome.browserAction.setBadgeBackgroundColor({color: "#FF00FF"});
  pomoIntervalFunction = setInterval(callback, 1000, completeCallback);
  pomoCurrentState = "atRest";
  pomoWorkCompleted = false;
  pomoRestCompleted = true;
  chrome.browserAction.setIcon({path : {"19" : "boo.png"}});
  unBlockSites();
}

function completePomoRest(){
  badgeText = '';
  pomoCurrentState = "atWork";
  pomoWorkCompleted = false;
  pomoRestCompleted = true;
  pomoIsIdle = true;
  chrome.browserAction.setIcon({path : {"19" : "james_sullivan.png"}});
  clearInterval(pomoIntervalFunction);
  pomoStartAudio.currentTime = 3;
  pomoStartAudio.play();
  return badgeText;
}

function pomoJob(completeCallback){
  chrome.browserAction.getBadgeText({}, function(result) {
    var badgeText = result;
    badgeText = (parseInt(badgeText.slice(0, badgeText.length - 1)) - 1) + "m";
    if(badgeText == "0m")
      badgeText = completeCallback();
    chrome.browserAction.setBadgeText({text: badgeText});
  });
}

function pomoAtWork(){
  initializePomoStart(pomoJob, completePomoWork);
}

function pomoAtRest(){
  initializePomoRest(pomoJob, completePomoRest);
}

function pomoStart(){
  if(!pomoIsIdle)
    return;
  if((pomoCurrentState == "atRest" && pomoRestCompleted) || (pomoCurrentState == "atWork" && !pomoWorkCompleted))
    pomoAtWork();
  else if(pomoCurrentState == "atRest" && !pomoRestCompleted)
    pomoAtRest();
}

chrome.browserAction.onClicked.addListener(function(tab) {
  pomoStart();
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if((!pomoIsIdle && pomoCurrentState == "atWork") || (pomoCurrentState == "atRest" && !pomoRestCompleted)) {
    blockSite(tab);
  }
});
