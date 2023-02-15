let today = new Date()
let bonText = "Bonjour"

const bonTextEnum = {
  Bonjour: "Bonjour",
  Bonsoir: "Bonsoir"
}

// Init 
document.getElementById("bonText").innerHTML = bonText



// futur Feature 
//getMeteo();

calcul(6, 18)

function getMeteo() {
  const urlApiMeteo = 'https://api.open-meteo.com/v1/meteofrance?latitude=48.85&longitude=2.35&hourly=temperature_2m&daily=sunrise,sunset&timezone=auto'

  fetch(urlApiMeteo)
    .then(response => response.json())
    .then(data => {
      calcul(new Date(data.daily.sunrise[0]).getHours(), new Date(data.daily.sunset[0]).getHours());
    })
    .catch(error =>
      calcul(6, 18)
    );
}

function calcul(heureMatin, heureSoir) {
  if (today.getHours() >= heureMatin && today.getHours() <= heureSoir) {
    bonText = bonTextEnum.Bonjour
  }
  else {
    bonText = bonTextEnum.Bonsoir
  }
  document.getElementById("bonText").innerHTML = bonText
}