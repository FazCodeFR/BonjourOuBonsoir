let bonText = "Bonjour";

const bonTextEnum = {
  Bonjour: "Bonjour",
  Bonsoir: "Bonsoir"
};

// Init 
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./service-worker.js')
      .then(registration => {
        console.log('Service worker registered!', registration);
      })
      .catch(error => {
        console.error('Error registering service worker:', error);
      });
  });
}
document.getElementById("bonText").innerHTML = bonText;

calcul();

function calcul() {
  let heureMatin = 6;
  let heureSoir = 18;

  // Obtenir les heures de lever et de coucher du soleil depuis l'API météo
  // Ici, on utilise les valeurs par défaut pour heureMatin et heureSoir en cas d'erreur API
  // Dans une version future, vous pouvez implémenter la récupération des heures de lever et de coucher du soleil depuis l'API météo.
  // Pour le moment, on utilise les valeurs par défaut (6h et 18h) pour simuler le calcul.

  // getMeteo()
  //   .then(data => {
  //     heureMatin = new Date(data.daily.sunrise[0]).getHours();
  //     heureSoir = new Date(data.daily.sunset[0]).getHours();
  //     updateBonText(heureMatin, heureSoir);
  //   })
  //   .catch(error => {
  //     updateBonText(heureMatin, heureSoir);
  //   });

  // Utilisation des valeurs par défaut (6h et 18h) pour simuler le calcul sans API météo.
  updateBonText(heureMatin, heureSoir);
}

function updateBonText(heureMatin, heureSoir) {
  if (today.getHours() >= heureMatin && today.getHours() <= heureSoir) {
    bonText = bonTextEnum.Bonjour;
  } else {
    bonText = bonTextEnum.Bonsoir;
  }
  document.getElementById("bonText").innerHTML = bonText;
}
