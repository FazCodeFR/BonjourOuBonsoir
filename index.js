let today = new Date();

console.log("Date d'aurjoudui : ",today);

console.log('saison',getCurrentSeason());

 

/**

 * Retrieves the current season: 1) summer, 2) winter, 3) fall or 4) spring

 *

 * Winter:  22 Dec - 21 Mar

 * Spring:  22 Mar - 21 Jun

 * Summer:  22 Jun - 21 Sep

 * Fall:    22 Sep - 21 Dec

 */

 function getCurrentSeason() {

    // It's plus one because January is index 0

    const now = new Date();

    const month = now.getMonth() + 1;

 

    if (month > 3 && month < 6) {

      return 'printemps';

    }

 

    if (month > 6 && month < 9) {

      return 'été';

    }

 

    if (month > 9 && month < 12) {

      return 'automne';

    }

 

    if (month >= 1 && month < 3) {

      return 'hiver';

    }

 

    const day = now.getDate();

    if (month === 3) {

      return day < 22 ? 'hiver' : 'printemps';

    }

 

    if (month === 6) {

      return day < 22 ? 'printemps' : 'été';

    }

 

    if (month === 9) {

      return day < 22 ? 'été' : 'automne';

    }

 

    if (month === 12) {

      return day < 22 ? 'automne' : 'hiver';

    }

 

    console.error('Unable to calculate current season');

  }

 

//   https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&daily=sunrise,sunset&timezone=auto