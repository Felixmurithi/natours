/* eslint-disable*/

export const displayMap = (locations) => {
  mapboxgl.accessToken =
    'pk.eyJ1Ijoic2lrMjAiLCJhIjoiY2xycmt3emk1MDA5MTJrbzNtY2dnMjNsYiJ9.M7TF_-ioHQ5qJB5tOElmxA';
  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/sik20/clrrm8a9300fu01r4bw2566o6',
    scrollZoom: false,
    //   center: [-118.4131058, 34.020479],
    //   zoom: 7,
    //   interactive: false,
  });

  // we get these variables from the mapbox scripts in tour
  const bounds = new mapboxgl.LngLatBounds();
  locations.forEach((loc) => {
    // create marker
    const el = document.createElement('div');
    el.className = 'marker';

    //add marker
    // anchor sets the postion of te image against the corrdinate
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    //add pop
    new mapboxgl.Popup({ offset: 30 })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day} ${loc.description} </p>`)
      .addTo(map);

    //extend the map bounds to fit the current location
    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: { top: 200, bottom: 200, left: 100, right: 100 },
  });
};
