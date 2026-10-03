
fetch('https://walletobjects.googleapis.com//rest?version=v1')
  .then(r => r.json())
  .then(data => {
    const cls = data.schemas.LoyaltyClass.properties;
    console.log('LoyaltyClass has locations?', !!cls.locations);
    console.log('LoyaltyClass has merchantLocations?', !!cls.merchantLocations);
  });

