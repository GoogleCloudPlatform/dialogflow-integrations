class FlightGridTemplate extends HTMLElement {
    constructor() {
      super();
      this.dfPayload = null;
      this.dfResponseId = null;
      this.renderRoot = this.attachShadow({mode: 'open'});
      this.placeholders = [
        'human_readable_times', 'date_offset', 'formatted_duration',
        'origin_airport_code', 'destination_airport_code', 'origin_city_name',
        'destination_city_name', 'stop_count_text', 'cost_usd', 'cost_class',
        'travel_date'
      ];
      this.dfPayload = {};
    }
  
    /**
     * Called when the custom element is connected to the document.
     * @override
     */
    connectedCallback() {
      Promise
          .all([
            fetch(
                'https://storage.googleapis.com/aiestaran-ccai-misc/travel-rich-content/flight-grid.html')
                .then((response) => response.text()),
            fetch(
                'https://storage.googleapis.com/aiestaran-ccai-misc/travel-rich-content/flight-grid-row.html')
                .then((response) => response.text()),
            fetch(
                'https://storage.googleapis.com/aiestaran-ccai-misc/travel-rich-content/flight-grid.css')
                .then((response) => response.text()),
          ])
          .then(([tableHtml, rowHtml, css]) => {
            console.log({tableHtml, rowHtml, css});
            const styles = document.createElement('style');
            styles.textContent = css;
            this.renderRoot.appendChild(styles);
  
            const template = document.createElement('template');
            const preparedHtml =
                this.prepareHtml(tableHtml, this.dfPayload.route);
            template.innerHTML = preparedHtml;
            const content = template.content.cloneNode(true);
            window.testcontent = content;
            const tbody = content.querySelector('tbody');
  
            const flights = this.dfPayload.flights;
  
            for (const flight of flights) {
              const formattedTimes = this.formatTimes(flight);
              flight.human_readable_times = formattedTimes.human_readable_times;
              flight.date_offset = formattedTimes.date_offset;
              flight.stop_count_text = `${flight.stop_count} stops`;
              if (flight.stop_count === 0) flight.stop_count_text = 'nonstop';
              if (flight.stop_count === 1) flight.stop_count_text = '1 stop';
              flight.cost_class = 'standard';
              if (flight.cost_tag === 'LOWEST') flight.cost_class = 'lowest';
              if (flight.cost_tag === 'HIGHEST') flight.cost_class = 'highest';
  
              flight.formatted_duration =
                  this.formatMinutesToHoursMinutes(flight.duration);
  
              const row = document.createElement('tr');
              const preparedRowHtml = this.prepareHtml(rowHtml, flight);
              row.innerHTML = preparedRowHtml;
              const rowContent = row.cloneNode(true);
              tbody.appendChild(rowContent);
            }
  
            this.renderRoot.appendChild(content);
          });
    };
    /**
     * Formats the departure and arrival times for display.
     * @param {?object} flight The flight object.
     * @return {?object} An object containing the formatted times and date offset.
     */
    formatTimes(flight) {
      return {
        human_readable_times: `${flight.departure_time} - ${flight.arrival_time}`,
        date_offset: flight.date_offset > 0 ? `+${flight.date_offset}` : ''
      };
    }
    /**
     * Prepares the HTML by replacing placeholders with actual values.
     * @param {string} html The HTML template string.
     * @param {?object} info The object containing the values to replace the
     *     placeholders with.
     * @return {string} The prepared HTML string.
     */
    prepareHtml(html, info) {
      let preparedHtml = html;
      for (const placeholder of this.placeholders) {
        preparedHtml =
            preparedHtml.replace(`{{ ${placeholder} }}`, info[placeholder]);
      }
      return preparedHtml;
    }
    /**
     * Formats minutes to hours and minutes.
     * @param {number} totalMinutes The total number of minutes.
     * @return {string} The formatted string in the format "XhYm".
     */
    formatMinutesToHoursMinutes(totalMinutes) {
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
  
      // Ensure two digits for minutes (e.g., "03" instead of "3")
      const formattedMinutes = minutes.toString().padStart(2, '0');
  
      return `${hours}h${formattedMinutes}m`;
    }
  }
  
  customElements.define('flight-grid-template', FlightGridTemplate);
  
  
  
  // End of custom rich template
  
  
  // Start agent-specific code to get available flights and render content using
  // the template
  
  
  
  const info = {
    'departureTimes': [
      '06:20', '07:05', '08:00', '09:15', '10:30', '11:00', '12:45', '13:50',
      '14:25', '15:10', '16:35', '17:00', '18:40', '19:15', '20:00', '21:25',
      '22:10', '23:05', '06:32', '07:17', '08:12', '09:27', '10:42', '11:17',
      '12:52', '13:57', '14:32', '15:17', '16:42', '17:17', '18:52', '19:27'
    ]
  };
  
  /**
   * Generates a random set of flight routes for the given origin, destination,
   * travel date, duration, and timezone difference.
   * @param {string} originCode The origin airport code.
   * @param {string} destinationCode The destination airport code.
   * @param {string} travelDate The travel date in YYYY-MM-DD format.
   * @param {number} durationMinutes The duration of the flight in minutes.
   * @param {number} timezoneDifferenceMinutes The timezone difference in minutes.
   * @return {!Array} An array of objects representing the flight routes.
   */
  function generateRandomFlightRoutes(
      originCode, destinationCode, travelDate, durationMinutes,
      timezoneDifferenceMinutes) {
    const flightCount = 5;
    const routes = [];
  
    for (let i = 0; i < flightCount; i++) {
      const stopCount = i > 3 ? getRandomInt(1, 2) : 0;
      const route = generateRoute(
          originCode, destinationCode, travelDate, stopCount, durationMinutes,
          timezoneDifferenceMinutes);
      if (!route) break;
      routes.push(route);
    }
  
    // add cost tags
    const prices = routes.map((route) => route.cost_usd);
    prices.sort((a, b) => a - b);
    const lowestPrice = prices[0];
    const highestPrice = prices[prices.length - 1];
    for (const route of routes) {
      route.cost_tag = 'NONE';
      if (route.cost_usd === lowestPrice) route.cost_tag = 'LOWEST';
      if (route.cost_usd === highestPrice) route.cost_tag = 'HIGHEST';
    }
  
  
    return routes;
  }
  
  /**
   * Generates a single flight route with random details.
   * @param {string} originCode The origin airport code.
   * @param {string} destinationCode The destination airport code.
   * @param {string} travelDate The travel date in YYYY-MM-DD format.
   * @param {number} stopCount The number of stops for the flight.
   * @param {number} durationMinutes The duration of the flight in minutes.
   * @param {number} timezoneDifferenceMinutes The timezone difference in minutes.
   * @return {?object} An object representing the flight route, or null if no route could be generated.
   */
  function generateRoute(
      originCode, destinationCode, travelDate, stopCount, durationMinutes,
      timezoneDifferenceMinutes) {
    let route = {
      flight_number: `CY${getRandomInt(100, 999)}`,
      origin_airport_code: originCode,
      destination_airport_code: destinationCode,
      departure_time: getRandomDepartureTime(),
      arrival_time: null,  // Calculated later
      duration: durationMinutes,
      stop_count: stopCount,
      cost_usd: getRandomInt(200, 1500),  // Placeholder cost
      date_offset: 0,                     // Initialize date offset to 0
      travel_date: travelDate
    };
  
    route.duration += stopCount * getRandomInt(30, 180);
  
    // Calculate arrival time considering time offsets
    route.arrival_time = calculateArrivalTime(
        route.departure_time, route.duration, timezoneDifferenceMinutes);
  
    // Calculate date offset
    const [departureHours, departureMinutes] =
        route.departure_time.split(':').map(Number);
  
    // Calculate total minutes elapsed since midnight at origin departure time
    const departureTotalMinutes = departureHours * 60 + departureMinutes;
  
    // Calculate total absolute duration
    const totalDurationMinutes = route.duration + timezoneDifferenceMinutes;
  
    // Calculate total minutes
    const totalMinutes = departureTotalMinutes + totalDurationMinutes;
  
    // Determine date offset
    route.date_offset = totalMinutes >= 1440 ? 1 : 0;
  
    return route;
  }
  
  /**
   * Returns a random integer between the given min and max values.
   * @param {number} min The minimum value.
   * @param {number} max The maximum value.
   * @return {number} The random integer.
   */
  function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  
  /**
   * Returns a random departure time from the given list of departure times.
   * @return {string} The random departure time in "HH:mm" format.
   */
  function getRandomDepartureTime() {
    const randomIndex = getRandomInt(0, info.departureTimes.length - 1);
    return info.departureTimes[randomIndex];
  }
  
  /**
   * Calculates the arrival time based on departure time, duration, and timezone
   * difference.
   * @param {string} departureTime The departure time in "HH:mm" format.
   * @param {number} duration The flight duration in minutes.
   * @param {number} timezoneDifferenceMinutes The timezone difference in minutes.
   * @return {string} The arrival time in "HH:mm" format.
   */
  function calculateArrivalTime(
      departureTime, duration, timezoneDifferenceMinutes) {
    const [hours, minutes] = departureTime.split(':').map(Number);
  
    // Convert duration to hours and minutes
    const durationHours = Math.floor(duration / 60);
    const durationMinutes = duration % 60;
  
    // Calculate initial arrival time in origin time
    let arrivalHours = hours + durationHours;
    let arrivalMinutes = minutes + durationMinutes;
  
    // Adjust arrival time based on time offsets
    arrivalMinutes += timezoneDifferenceMinutes;
  
    // Handle minutes exceeding 60 or going below 0
    while (arrivalMinutes >= 60) {
      arrivalHours += 1;
      arrivalMinutes -= 60;
    }
    while (arrivalMinutes < 0) {
      arrivalHours -= 1;
      arrivalMinutes += 60;
    }
  
    // Handle hours exceeding 24
    arrivalHours %= 24;
  
    return `${arrivalHours.toString().padStart(2, '0')}:${
        arrivalMinutes.toString().padStart(2, '0')}`;
  }
  
  
  /**
   * Define the getFlights tool
   * @param {!Object} input
   * @return {!Promise}
   */
  function getFlights(input) {
    const originAirportCode = input.origin_airport_code;
    const destinationAirportCode = input.destination_airport_code;
    const travelDate = input.travel_date;
    const durationMinutes = input.flight_duration_minutes;
    const timezoneDifferenceMinutes = input.timezone_difference_minutes;
    const flights = generateRandomFlightRoutes(
        originAirportCode, destinationAirportCode, travelDate, durationMinutes,
        timezoneDifferenceMinutes);
    const route = {
      origin_city_name: input.origin_city_name,
      destination_city_name: input.destination_city_name,
      travel_date: input.travel_date
    };
    console.log({flights, route});
    const customCardPayload = {
      richContent: [{
        name: 'flight-grid-template',
        payload: {flights, route},
        type: 'custom_template'
      }]
    };
    const simplifiedFlights = flights.map((flight) => {
      return `Flight ${flight.flight_number} leaves ${
          flight.origin_airport_code} at ${flight.departure_time}, arrives to ${
          flight.destination_airport_code} at ${
          flight.arrival_time} current day + ${flight.date_offset} with ${
          flight.stop_count} stops costing ${flight.cost_usd} dollars. ${
          flight.cost_tag === 'LOWEST' ? 'This is the cheapest option!' : ''}`;
    });
    console.log(
        'about to return to dfMes', {customCardPayload, simplifiedFlights});
    if (flights.length > 0) {
      dfMessenger.renderCustomCard(customCardPayload.richContent);
    }
    return Promise.resolve({'flights': simplifiedFlights});
  }
  
  // Register the tool
  const tool1Id = 'projects/dialogflow-prebuit-agents/locations/us-central1/agents/8cf89723-82af-4031-819a-97cb8caf3afb/tools/e85ff4ee-b135-47d8-b969-a59b87a3e429';
  dfMessenger.registerClientSideFunction(tool1Id, getFlights.name, getFlights);
  console.log('registered', {tool1Id, getFlights});
  
  /**
   * Retrieves the user's geolocation and current date.
   * @return {!Promise} An object containing the address and current date, or
   *     just the current date if geolocation fails.
   */
  async function getGeolocation() {
    dfMessenger.renderCustomText(
        'We\'re working on finding your location. This might take a moment.',
        true);
    const getPositionPromise = (options) => new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, options);
    });
    const currentDate = new Date().toLocaleDateString();
    try {
      const position = await getPositionPromise();
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      const result =
          await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${
              latitude}&lon=${longitude}&format=json`);
      const resultJson = await result.json();
  
      const geolocationOutput = {
        address: resultJson.address,
        currentDate: currentDate
      };
  
      // Return the combined geolocation info and current date
      return geolocationOutput;
    } catch (error) {
      // Handle errors (permission denied, etc.)
      console.error('Error getting geolocation:', error);
      return {currentDate: currentDate};
    }
  }
  
  // Register the tool
  const tool2Id = 'projects/dialogflow-prebuit-agents/locations/us-central1/agents/8cf89723-82af-4031-819a-97cb8caf3afb/tools/4f58a625-5ea6-4bf6-a1c1-cf22b9b55b40';
  dfMessenger.registerClientSideFunction(tool2Id, getGeolocation.name, getGeolocation);
  console.log('registered', {tool2Id, getGeolocation});