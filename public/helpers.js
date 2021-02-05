const createVenueHTML = (name, location, iconSource) => {
    return `<h2>${name}</h2>
    <img class="venueimage" src="${iconSource}"/>
    <h3>Address:</h3>
    <p>${location.address}</p>
    <p>${location.city}</p>
    <p>${location.country}</p>`;
  }
  
  const createWeatherHTML = (currentDay) => {
    console.log(currentDay)
    return `<h2>${weekDays[(new Date()).getDay()]}</h2>
          <h2>Temperature: ${kelvinToCelcius(currentDay.main.temp)}&deg;C / ${kelvinToFahrenheit(currentDay.main.temp)}&deg;F</h2>
          <h2>Condition: ${currentDay.weather[0].description}</h2>
        <img src="https://openweathermap.org/img/wn/${currentDay.weather[0].icon}@2x.png">`;
  }
  
  const generateRandomIndexes = end => {
      let randomIndexes = [];
  
      while(randomIndexes.length < 3)  {
        let randomNum = Math.floor(Math.random()*end);
  
        if(randomIndexes.indexOf(randomNum) === -1) {
          randomIndexes.push(randomNum);
        }
      }
      console.log(randomIndexes);
      return randomIndexes;
  }
  
  
  const kelvinToFahrenheit = k => ((k - 273.15) * 9 / 5 + 32).toFixed(0);
  const kelvinToCelcius = k => (k - 273.15).toFixed(0);