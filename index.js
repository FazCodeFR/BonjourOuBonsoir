let today = new Date();
let bonText = "Bonjour"
let sunset = 0
let sunrise = 0

const bonTextEnum = {
  Bonjour: "Bonjour",
  Bonsoir: "Bonsoir"
}

// Init 
document.getElementById("bonText").innerHTML = bonText;
getMeteo();

if (today.getHours() >= sunset && today.getHours() <= sunrise) {
  bonText = bonTextEnum.Bonsoir
}

document.getElementById("bonText").innerHTML = bonText;

function getMeteo() {
  const urlApiMeteo = 'https://api.open-meteo.com/v1/meteofrance?latitude=48.85&longitude=2.35&hourly=temperature_2m&daily=sunrise,sunset&timezone=auto'

  fetch(urlApiMeteo)
    .then(response => response.json())
    .then(data => {
      sunset = data.daily.sunset[0]
      sunrise = data.daily.sunrise[0]
    })
    .catch(error => alert("Erreur : " + error));
}

