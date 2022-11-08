import locationsData from './locations.json' assert {type: 'json'};
// import icon from './cluster-icon.svg';

var locations = [];
var coordinates = {};

var map = null;
var markers = [];
var bounds = new Map();

var isLocated = false

var windowWidth;
var filterShowingInfo;
var showAllFilterBtn;
var emptyState;

const getCurrentPosition = () => {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject);
  });
};

window.onload = async (event) => {
  // locations = await fetch('./locations.json').then(async response => await response.json())
  locations = locationsData.locations;
  initMap()

  // console.log(icon, 'icon');

  filterShowingInfo = document.getElementById('filter-showing');
  showAllFilterBtn = document.getElementById('filter-show-all');
  emptyState = document.getElementById('empty-state');

  const searchbar = document.getElementById("search-bar");
  searchbar.addEventListener("keyup", function (event) {
    search();
  });

  try {
    const position = await getCurrentPosition();
    coordinates = {
      lat: await position.coords.latitude,
      lng: await position.coords.longitude
    }
    isLocated = true
  } catch (error) {
    isLocated = false
    console.log('not located');
  }

  if (isLocated) {
    map.setCenter(coordinates);
    map.setZoom(12);

    const marker = new google.maps.Marker({
      position: coordinates,
      map: map,
      title: "You are here",
      label: {
        text: "\ue815", // codepoint from https://fonts.google.com/icons
        fontFamily: "Material Icons",
        color: "#ffffff",
        fontSize: "18px",
      },
    });
  }

  await showLocations();
  console.log(coordinates, 'coordinates');

  window.addEventListener('resize', () => {
    const prev = windowWidth;
    const viewport_width = document.documentElement.clientWidth;
    windowWidth = viewport_width;
    console.log('resize', viewport_width);
    if(viewport_width < 660) {
      map.setZoom(2);
    }else if(prev < 660 && viewport_width > 660) {
      map.setZoom(3);
    }
  });
};
 
const initMap = async () => {
  console.log(locations, 'initMap');

  map = new google.maps.Map(document.getElementById("map"), {
    mapId: "28da2cd6acf940c3",
    zoom: document.documentElement.clientWidth < 660 ? 2 : 3,
    minZoom: 2,
    center: { lat: 30, lng: 310},
  });

  locations.forEach((loc) => {
    const coordinates = loc.coordinates;
    const marker = new google.maps.Marker({
      position: coordinates,
      map: map,
      label: {
        text: "\ue544", // codepoint from https://fonts.google.com/icons
        fontFamily: "Material Icons",
        color: "#ffffff",
        fontSize: "18px",
      },
      title: loc.name,

      stote_id: loc.id,
    });
    markers.push(marker);
    marker.addListener("click", () => {
      map.setZoom(12);
      map.setCenter(marker.getPosition());
    });
  })

  console.log(markers[0].title, 'markers');
  // new markerClusterer.MarkerClusterer({ map, markers });
  await new markerClusterer.MarkerClusterer({
    map,
    markers,
    renderer: {
      render: ({ markers, _position: position }) => {
        return new google.maps.Marker({
          position: {
            lat: position.lat(),
            lng: position.lng(),
          },
          icon: {
            url: './cluster-icon.svg',
            scaledSize: new google.maps.Size(35, 35),
          },
          label: {
            text: markers.length.toString(),
            color: "#ffffff",
          },
        });
      },
    },
  });

  google.maps.event.addListener(map, 'idle', getMapBounds);
}

const getMapBounds = async () => {
  const b = await map.getBounds();
  const ne = await b.getNorthEast();
  const sw = await b.getSouthWest();

  const neLat = ne.lat();
  const neLng = ne.lng();
  const swLat = sw.lat();
  const swLng = sw.lng();

  console.log(neLat, swLat);
  console.log(neLng, swLng);

  bounds.set('neLat', neLat);
  bounds.set('neLng', neLng);
  bounds.set('swLat', swLat);
  bounds.set('swLng', swLng);

  const filteredLocations = locations.filter((loc) => {
    const val = b.contains(loc.coordinates);
    displayListItem(val, loc.id);
    return val;
  });
  console.log(filteredLocations, 'filteredLocations2')
  changeFilterInfo(filteredLocations.length);
}

const changeFilterInfo = (filteredLength) => {
  if (filterShowingInfo) {
    filterShowingInfo.innerHTML = `Mostrando <strong>${filteredLength}</strong> de ${locations.length} tiendas.`;
    emptyState.style.display = 'none';
  }
  if (filteredLength === locations.length) {
    showAllFilterBtn.style.display = 'none';
  } else if (filteredLength > 0) {
    showAllFilterBtn.style.display = 'inline';
  } else {
    filterShowingInfo.innerHTML = '';
    showAllFilterBtn.style.display = 'none';
    emptyState.style.display = 'block';
  }

}

const showAllListItems = async () => {
  const items = document.getElementsByClassName('list-item');
  console.log(items, 'items');
  for (let i = 0; i < items.length; i++) {
    items[i].style.display = 'block';
  }
  filterShowingInfo.innerHTML = `Mostrando <strong>${items.length}</strong> de ${items.length} tiendas.`;
  map.setCenter({ lat: 30, lng: 310 });
  map.setZoom(document.documentElement.clientWidth < 660 ? 2 : 3);
}
window.showAllListItems = showAllListItems;

const search = async () => {
  const input = document.getElementsByClassName('input-search')[0].value;
  const regex = new RegExp(input, 'i');
  const filteredLocations = locations.filter((loc) => {
    const val = regex.test(loc.name);
    displayListItem(val, loc.id);
    return val;
  });
  console.log(filteredLocations, 'filtered');
  changeFilterInfo(filteredLocations.length);
}

window.search = search

const displayListItem = (value, id) => {
  const item = document.getElementById(`list-item-${id}`);
  if (!value && item) {
    item.style.display = 'none';
  } else if (item) {
    item.style.display = 'block';
  }
}

const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
  const deg2rad = (deg) => {
    return deg * (Math.PI / 180)
  }
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);  // deg2rad below
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
    ;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

const openSchedule = (e) => {
  const id = e.target.attributes.id.nodeValue.split('-')[2];
  const toggle = document.getElementById(`open-schedule-${id}`);
  const schedule = document.getElementById(`schedule-${id}`);

  if (e.target.innerHTML === 'Ver Horario') {
    toggle.innerHTML = 'Cerrar Horario';
    schedule.style.display = 'block';
  } else {
    toggle.innerHTML = 'Ver Horario';
    schedule.style.display = 'none';
  }
}

const showLocations = async () => {
  const currentDay = new Date().toLocaleDateString('es-MX', { weekday: 'long' });
  console.log(currentDay, 'dayName');

  const days = new Map();
  days.set('monday', 'lunes');
  days.set('tuesday', 'martes');
  days.set('wednesday', 'miercoles');
  days.set('thursday', 'jueves');
  days.set('friday', 'viernes');

  const list = document.getElementById('locations-list');
  const items = document.createElement('div');
  items.className = 'items';

  locations.forEach((loc) => {

    const div = document.createElement('div');
    div.className = 'list-item';
    div.id = `list-item-${loc.id}`;

    const listItemHeader = document.createElement('div');
    listItemHeader.className = 'list-item-header';

    const listHeaderInfo = document.createElement('div');
    listHeaderInfo.className = 'list-header-info';

    const title = document.createElement('div');
    title.className = 'list-item-title';
    title.appendChild(document.createTextNode(loc.name));
    title.addEventListener('mouseover', () => {
      const marker = markers.find((m) => m.title === loc.name);
      console.log('hover', loc.id, markers.find((m) => m.title === loc.name));
      marker.setAnimation(google.maps.Animation.BOUNCE);
      setTimeout(() => {
        marker.setAnimation(null);
      }
      , 750);
    });
    title.addEventListener('click', () => {
      const marker = markers.find((m) => m.title === loc.name);
      map.getZoom() >= 12 ? null : map.setZoom(12);
      map.setCenter(marker.getPosition());
    });
    listHeaderInfo.appendChild(title);

    const address = document.createElement('div');
    address.className = 'list-item-address'
    address.appendChild(document.createTextNode(loc.address));
    listHeaderInfo.appendChild(address);

    listItemHeader.appendChild(listHeaderInfo);

    const listHeaderImg = document.createElement('div');
    listHeaderImg.className = 'list-header-img';

    const img = document.createElement('img');
    img.className = 'location-img';
    img.src = loc.img;
    img.width = 100;
    listHeaderImg.appendChild(img);

    listItemHeader.appendChild(listHeaderImg);
    div.appendChild(listItemHeader);

    if (isLocated) {
      const distance = document.createElement('div');
      distance.className = 'distance-value';
      const d = getDistanceFromLatLonInKm(coordinates.lat, coordinates.lng, loc.coordinates.lat, loc.coordinates.lng).toFixed(2);
      console.log(d, 'distance');
      distance.appendChild(document.createTextNode(d + ' km'));
      div.appendChild(distance);
    }

    const link = document.createElement('a');
    link.className = 'marker-link'
    link.appendChild(document.createTextNode('Como llegar'));
    // link.href = `https://www.google.com/maps/search/?api=1&query=${loc.coordinates.lat}%2C${loc.coordinates.lng}`;
    // link.href = loc.mapUrl;
    link.href = 'https://www.google.com/maps/search/?api=1&query=' + loc.name.replace(' ', '+');
    link.target = '_blank';
    div.appendChild(link);

    const openScheduleDiv = document.createElement('div');
    openScheduleDiv.className = 'open-schedule-btn';
    openScheduleDiv.id = `open-schedule-${loc.id}`;
    openScheduleDiv.appendChild(document.createTextNode('Ver Horario'));
    openScheduleDiv.addEventListener('click', openSchedule)

    const schedule = document.createElement('div');
    schedule.className = 'list-item-schedule';
    schedule.id = `schedule-${loc.id}`;

    loc.schedule.forEach((d) => {
      const dayItem = document.createElement('div');
      days.get(d.day) === currentDay ? dayItem.className = 'active-day day' : dayItem.className = 'day';

      const day = document.createElement('div');
      day.appendChild(document.createTextNode(days.get(d.day)));
      dayItem.appendChild(day);

      const hours = document.createElement('div');
      hours.appendChild(document.createTextNode(d.hours));
      dayItem.appendChild(hours);

      schedule.appendChild(dayItem);
    });

    div.appendChild(openScheduleDiv);
    div.appendChild(schedule);

    items.append(div)
  })
  list.append(items)
}
