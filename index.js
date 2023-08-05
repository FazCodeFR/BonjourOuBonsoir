const bonTextEnum = {
  Bonjour: "Bonjour",
  Bonsoir: "Bonsoir"
};
const heureMatin = 6;
const heureSoir = 18;
const today = new Date();
let bonText = bonTextEnum.Bonjour;

updateBonText(heureMatin, heureSoir);

// Call updateBonText every 3 minutes
setInterval(() => {
  updateBonText(heureMatin, heureSoir);
}, 3 * 60 * 1000); // 3 minutes in milliseconds


function updateBonText(heureMatin, heureSoir) {
  bonText = (today.getHours() >= heureMatin && today.getHours() <= heureSoir)
    ? bonTextEnum.Bonjour
    : bonTextEnum.Bonsoir;

  document.getElementById("bonText").textContent = bonText;
}



// Register service worker
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