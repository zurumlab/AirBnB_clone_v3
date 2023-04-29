'use strict';
$(() => {
  let amenitiesSelected = [];
  let locationsSelected = [];
  const LOCATION_TYPES = {
    state: 1,
    city: 2
  };
  const selectors = {
    amenitiesHeader: '.amenities > h4',
    amenityBox: '.amenities > .popover > ul > li > input[type="checkbox"]',
    amenityItem: '.amenities > .popover > ul > li',
    locationsHeader: '.locations > h4',
    stateBox: '.locations > .popover > ul > li > h2 > input[type="checkbox"]',
    stateItem: '.locations > .popover > ul > li > h2',
    cityBox:
      '.locations > .popover > ul > li > ul > li > input[type="checkbox"]',
    cityItem: '.locations > .popover > ul > li > ul > li'
  };
  const BASE_URL = 'http://localhost:5001/api/v1';

  const createPlace = place => {
    if (place) {
      const article = document.createElement('article');

      const titleBox = document.createElement('div');
      titleBox.className = 'title_box';
      const titleHTML = `<h2>${place.name}</h2>`;
      const priceByNightHTML = '<div class="price_by_night">' +
        `$${place.price_by_night}` +
        '</div>';
      titleBox.insertAdjacentHTML('beforeend', titleHTML);
      titleBox.insertAdjacentHTML('beforeend', priceByNightHTML);

      const informationBox = document.createElement('div');
      informationBox.className = 'information';
      const maxGuestHTML = '<div class="max_guest">' +
        `${place.max_guest}` +
        ` Guest${place.max_guest !== 1 ? 's' : ''}` +
        '</div>';
      const numberRoomsHTML = '<div class="number_rooms">' +
        `${place.number_rooms}` +
        ` Bedroom${place.number_rooms !== 1 ? 's' : ''}` +
        '</div>';
      const numberBathroomsHTML = '<div class="number_bathrooms">' +
        `${place.number_bathrooms}` +
        ` Bathroom${place.number_bathrooms !== 1 ? 's' : ''}` +
        '</div>';
      informationBox.insertAdjacentHTML('beforeend', maxGuestHTML);
      informationBox.insertAdjacentHTML('beforeend', numberRoomsHTML);
      informationBox.insertAdjacentHTML('beforeend', numberBathroomsHTML);

      const userBox = document.createElement('div');
      userBox.className = 'user';
      if (place.user) {
        const userHTML = '<b>Owner:</b>' +
          ` ${place.user.first_name} ${place.user.last_name}`;
        userBox.insertAdjacentHTML('beforeend', userHTML);
      }

      const descriptionBox = document.createElement('div');
      descriptionBox.className = 'description';
      descriptionBox.innerHTML = place.description;

      article.insertAdjacentElement('beforeend', titleBox);
      article.insertAdjacentElement('beforeend', informationBox);
      article.insertAdjacentElement('beforeend', userBox);
      article.insertAdjacentElement('beforeend', descriptionBox);
      return article;
    } else {
      return null;
    }
  };
  const getPlaces = filter => {
    const placesFetcher = new Promise((resolve, reject) => {
      $.ajax({
        url: `${BASE_URL}/places_search`,
        type: 'POST',
        data: JSON.stringify(filter || {}),
        contentType: 'application/json; charset=utf-8',
        dataType: 'json',
        success: data => {
          const placeOwnerPromises = data.map(place => new Promise((resolve, reject) => {
            $.get(`${BASE_URL}/users/${place.user_id}`, (data, status) => {
              const fullPlace = place;
              fullPlace.user = data;
              resolve(fullPlace);
            });
          }));
          Promise
            .all(placeOwnerPromises)
            .then(places => resolve(places))
            .catch(err => reject(err));
        }
      });
    });
    return placesFetcher;
  };
  const setPlaces = filter => {
    getPlaces(filter)
      .then(places => {
        $('section.places').empty();
        $('section.places').append('<h1>Places</h1>');
        for (let i = 0; i < places.length; i++) {
          $('section.places').append(createPlace(places[i]));
        }
      });
  };
  const clickChildInput = ev => {
    ev.target.getElementsByTagName('input')?.item(0)?.click();
  };

  $(selectors.amenityItem).on('mousedown', clickChildInput);
  $(selectors.stateItem).on('mousedown', clickChildInput);
  $(selectors.cityItem).on('mousedown', clickChildInput);

  $(selectors.amenityBox).change(ev => {
    const amenityId = ev.target.getAttribute('data-id');
    const amenityName = ev.target.getAttribute('data-name');

    if (ev.target.checked) {
      if (!amenitiesSelected.find(obj => obj.id === amenityId)) {
        amenitiesSelected.push({
          id: amenityId,
          name: amenityName
        });
      }
    } else {
      amenitiesSelected = amenitiesSelected.filter(
        obj => obj.id !== amenityId && obj.name !== amenityName
      );
    }
    const htmlContent = amenitiesSelected.map(obj => obj.name).join(', ');
    $(selectors.amenitiesHeader).html(
      amenitiesSelected.length > 0 ? htmlContent : '&nbsp;'
    );
  });

  $(selectors.stateBox).change(ev => {
    const stateId = ev.target.getAttribute('data-id');
    const stateName = ev.target.getAttribute('data-name');
    const statePred = obj => (
      (obj.id === stateId) && (obj.type === LOCATION_TYPES.state)
    );

    if (ev.target.checked) {
      if (!locationsSelected.find(statePred)) {
        const stateElement = ev.target.parentElement.parentElement;
        const citiesULElement = stateElement.getElementsByTagName('ul').item(0);
        const cityElements = citiesULElement.getElementsByTagName('li');
        const cityIdsToRemove = [];

        locationsSelected.push({
          type: LOCATION_TYPES.state,
          id: stateId,
          name: stateName
        });
        for (let i = 0; i < cityElements.length; i++) {
          const inputElements = cityElements[i].getElementsByTagName('input');

          if (inputElements) {
            const inputCheckBox = inputElements.item(0);
            if (!inputCheckBox.checked) {
              inputCheckBox.checked = true;
            } else {
              cityIdsToRemove.push(inputCheckBox.getAttribute('data-id'));
            }
          }
        }
        locationsSelected = locationsSelected
          .filter(
            obj => (!(
              cityIdsToRemove.includes(obj.id) &&
              (obj.type === LOCATION_TYPES.city)
            ))
          );
      }
    } else {
      const stateElement = ev.target.parentElement.parentElement;
      const citiesULElement = stateElement.getElementsByTagName('ul').item(0);
      const cityElements = citiesULElement.getElementsByTagName('li');
      const cityIdsToRemove = [];

      for (let i = 0; i < cityElements.length; i++) {
        const inputElements = cityElements[i].getElementsByTagName('input');

        if (inputElements) {
          const inputCheckBox = inputElements.item(0);
          if (inputCheckBox.checked) {
            inputCheckBox.checked = false;
            cityIdsToRemove.push(inputCheckBox.getAttribute('data-id'));
          }
        }
      }
      locationsSelected = locationsSelected
        .filter(obj => !statePred(obj))
        .filter(
          obj => (!(
            cityIdsToRemove.includes(obj.id) &&
            (obj.type === LOCATION_TYPES.city)
          ))
        );
    }
    const htmlContent = locationsSelected.map(obj => obj.name).join(', ');
    $(selectors.locationsHeader).html(
      locationsSelected.length > 0 ? htmlContent : '&nbsp;'
    );
  });

  $(selectors.cityBox).change(ev => {
    const cityId = ev.target.getAttribute('data-id');
    const cityName = ev.target.getAttribute('data-name');
    const cityPred = obj => (
      (obj.id === cityId) &&
      (obj.type === LOCATION_TYPES.city)
    );

    if (ev.target.checked) {
      if (!locationsSelected.find(cityPred)) {
        const stateElement =
          ev.target.parentElement.parentElement.parentElement;
        const stateHeader = stateElement.getElementsByTagName('h2').item(0);
        const stateCheckBox = stateHeader.getElementsByTagName('input').item(0);
        const citiesULElement = stateElement.getElementsByTagName('ul').item(0);
        const cityElements = citiesULElement.getElementsByTagName('li');
        const cityIdsSelected = [];

        for (let i = 0; i < cityElements.length; i++) {
          const inputElements = cityElements[i].getElementsByTagName('input');

          if (inputElements) {
            const inputCheckBox = inputElements.item(0);
            if (inputCheckBox.checked) {
              cityIdsSelected.push(inputCheckBox.getAttribute('data-id'));
            }
          }
        }
        if (cityIdsSelected.length === cityElements.length) {
          // change cities to state
          locationsSelected = locationsSelected
            .filter(
              obj => (!(
                cityIdsSelected.includes(obj.id) &&
                (obj.type === LOCATION_TYPES.city)
              ))
            );
          locationsSelected.push({
            type: LOCATION_TYPES.state,
            id: stateCheckBox.getAttribute('data-id'),
            name: stateCheckBox.getAttribute('data-name')
          });
          stateCheckBox.checked = true;
        } else {
          locationsSelected.push({
            type: LOCATION_TYPES.city,
            id: cityId,
            name: cityName
          });
        }
      }
    } else {
      const stateElement =
        ev.target.parentElement.parentElement.parentElement;
      const stateHeader = stateElement.getElementsByTagName('h2').item(0);
      const stateCheckBox = stateHeader.getElementsByTagName('input').item(0);
      const citiesULElement = stateElement.getElementsByTagName('ul').item(0);
      const cityElements = citiesULElement.getElementsByTagName('li');
      const citiesSelected = [];

      for (let i = 0; i < cityElements.length; i++) {
        const inputElements = cityElements[i].getElementsByTagName('input');

        if (inputElements) {
          const inputCheckBox = inputElements.item(0);
          if (inputCheckBox.checked) {
            citiesSelected.push({
              id: inputCheckBox.getAttribute('data-id'),
              name: inputCheckBox.getAttribute('data-name')
            });
          }
        }
      }
      if (stateCheckBox.checked) {
        const stateId = stateCheckBox.getAttribute('data-id');
        const statePred = obj => (
          (obj.id === stateId) && (obj.type === LOCATION_TYPES.state)
        );
        locationsSelected = locationsSelected
          .filter(obj => !statePred(obj));
        for (let i = 0; i < citiesSelected.length; i++) {
          locationsSelected.push({
            type: LOCATION_TYPES.city,
            id: citiesSelected[i].id,
            name: citiesSelected[i].name
          });
        }
        stateCheckBox.checked = false;
      } else {
        locationsSelected = locationsSelected.filter(obj => !cityPred(obj));
      }
    }
    const htmlContent = locationsSelected.map(obj => obj.name).join(', ');
    $(selectors.locationsHeader).html(
      locationsSelected.length > 0 ? htmlContent : '&nbsp;'
    );
  });

  $.get(`${BASE_URL}/status`, (data, status) => {
    if (status === 'success' && data.status === 'OK') {
      if (!$('div#api_status').hasClass('available')) {
        $('div#api_status').addClass('available');
      }
    } else {
      $('div#api_status').removeClass('available');
    }
  });

  setPlaces({});

  $('section.filters > button').click(() => {
    const filter = {
      states: locationsSelected
        .filter(obj => obj.type === LOCATION_TYPES.state)
        .map(obj => obj.id),
      cities: locationsSelected
        .filter(obj => obj.type === LOCATION_TYPES.city)
        .map(obj => obj.id),
      amenities: amenitiesSelected.map(obj => obj.id)
    };

    setPlaces(filter);
  });
});
