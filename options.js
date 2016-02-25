var form = document.getElementById('options'),
  blockedSites = document.getElementById('blocked-sites'),
  background = chrome.extension.getBackgroundPage(),
  startCallbacks = {}, durationElements = {};

durationElements['work'] = document.getElementById('work-duration');
durationElements['rest'] = document.getElementById('rest-duration');

var TIME_REGEX = /^([0-9]+)$/;

form.onsubmit = function () {
  var durations = {}, duration, durationStr, durationMatch;
  if(background.disableSettings())
  {
    alert("No cheating. Get back to work");
    return false;
  }
  for(var key in durationElements) {
    durationMatch = durationElements[key].value.match(TIME_REGEX);
    if(durationMatch) {
      durations[key] = durationElements[key].value;
    } else {
      alert("Time format Error");
      return false;
    } 
  }
    
  background.setSettings({
    blockedSites:       blockedSites.value.split(/\r?\n/),
    durations:          durations
  })
  alert("Succesful");
  return false;
}


blockedSites.value = background.SETTINGS.blockedSites.join("\n");
durationElements["work"].value = background.SETTINGS.durations.work;
durationElements["rest"].value = background.SETTINGS.durations.rest;