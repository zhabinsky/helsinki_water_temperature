const {
  compareAsc,
  subDays,
  compareDesc,
  differenceInSeconds,
  differenceInDays,
  formatDistanceToNow,
} = require("date-fns");

const { sortBy } = require("lodash");

function distance(lat1, lon1, lat2, lon2, unit) {
  if (lat1 == lat2 && lon1 == lon2) {
    return 0;
  } else {
    var radlat1 = (Math.PI * lat1) / 180;
    var radlat2 = (Math.PI * lat2) / 180;
    var theta = lon1 - lon2;
    var radtheta = (Math.PI * theta) / 180;
    var dist =
      Math.sin(radlat1) * Math.sin(radlat2) +
      Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    if (dist > 1) {
      dist = 1;
    }
    dist = Math.acos(dist);
    dist = (dist * 180) / Math.PI;
    dist = dist * 60 * 1.1515;
    if (unit == "K") {
      dist = dist * 1.609344;
    }
    if (unit == "N") {
      dist = dist * 0.8684;
    }
    return dist;
  }
}

const main = async () => {
  const result = await fetch(
    "https://api.hel.fi/servicemap/v2/unit/?service=731%2C730%2C426%2C365%2C698%2C586%2C734&only=id%2Cname%2Clocation%2Cstreet_address%2Caddress_zip%2Cextensions%2Cservices%2Cmunicipality%2Cphone%2Cwww%2Cdescription%2Cpicture_url%2Cextra&include=observations%2Cconnections&geometry=true&page_size=1000",
    {
      headers: {
        accept: "*/*",
        "accept-language": "und,en;q=0.9,lt;q=0.8,ru;q=0.7",
        "cache-control": "no-cache",
        pragma: "no-cache",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "cross-site",
        Referer: "https://ulkoliikunta.fi/",
        "Referrer-Policy": "strict-origin-when-cross-origin",
      },
      body: null,
      method: "GET",
    }
  ).then((e) => e.json());

  const m = result.results
    .map(({ observations, ...e }) => {
      return {
        ...e,
        observations: sortBy(
          observations
            .map((o) => {
              const when = new Date(o.time);

              return {
                ...o,
                when,
                diff: differenceInDays(new Date(), when),
              };
            })
            .filter((o) => o.diff <= 10)
            .filter((o) => o.property === "swimming_water_temperature"),
          "time"
        ).reverse(),
      };
    })

    .filter((e) => e.observations.length > 0);

  console.log(m[0]);
  //   console.log(m.length);

  console.log(
    m.filter(({ observations }) => {
      return observations.length > 0;
    }).length
  );

  console.table(
    m
      .map(({ name, observations, location }) => [
        name.en ?? name.fi,

        observations[0].value + " C",

        formatDistanceToNow(observations[0].time, {
          addSuffix: true,
        }),

        Math.floor(distance(...location.coordinates, ...[24.9798, 60.1855])),
      ])
      .sort((a, b) => {
        return a[3] - b[3];
      })
      .map((e) => {
        return [e[0], e[1], e[2], e[3] + " km"];
      })
  );
};

main();
