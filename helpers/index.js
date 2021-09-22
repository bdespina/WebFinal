const { query } = require('express');
const fs = require('fs');
const request = require('request-promise')


module.exports = {
  parseHarFile: function (file) {
    const harDataJson = fs.readFileSync(file.path);
    try {
      const harData = JSON.parse(harDataJson.toString());

      const data = [];
      harData.log.entries.forEach(entry => {
        data.push({
          startedDateTime: entry.startedDateTime,
          wait: entry.timings.wait,
          serverIPAddress: entry.serverIPAddress,
          request: {
            method: entry.request.method,
            url: new URL(entry.request.url).host,
            headers: {
              contentType: entry.request.headers.find(o => {
                return o.name.toLowerCase() === 'content-type';
              })?.value || null,
              cacheControl: entry.request.headers.find(o => {
                return o.name.toLowerCase() === 'cache-control';
              })?.value || null,
              pragma: entry.request.headers.find(o => {
                return o.name.toLowerCase() === 'pragma';
              })?.value || null,
              expires: entry.request.headers.find(o => {
                return o.name.toLowerCase() === 'expires';
              })?.value || null,
              age: entry.request.headers.find(o => {
                return o.name.toLowerCase() === 'age';
              })?.value || null,
              lastModified: entry.request.headers.find(o => {
                return o.name.toLowerCase() === 'last-modified';
              })?.value || null,
              host: entry.request.headers.find(o => {
                return o.name.toLowerCase() === 'host';
              })?.value
            }
          },
          response: {
            status: entry.response.status,
            statusText: entry.response.statusText,
            headers: {
              contentType: entry.response.headers.find(o => {
                return o.name.toLowerCase() === 'content-type';
              })?.value || null,
              cacheControl: entry.response.headers.find(o => {
                return o.name.toLowerCase() === 'cache-control';
              })?.value || null,
              pragma: entry.response.headers.find(o => {
                return o.name.toLowerCase() === 'pragma';
              })?.value || null,
              expires: entry.response.headers.find(o => {
                return o.name.toLowerCase() === 'expires';
              })?.value || null,
              age: entry.response.headers.find(o => {
                return o.name.toLowerCase() === 'age';
              })?.value || null,
              lastModified: entry.response.headers.find(o => {
                return o.name.toLowerCase() === 'last-modified';
              })?.value || null,
              host: entry.response.headers.find(o => {
                return o.name.toLowerCase() === 'host';
              })?.value
            }
          }
        })
      });

      return data;
    } catch(error) {
      console.error('Error parsing HAR file');
      return null;
    }
  },
  getGeoData: function (ip) {
    return new Promise((resolve, reject) => {
      let url = 'http://ip-api.com/json/';
      if (ip) {
        url = `http://ip-api.com/json/${ip}`
      }

      request({
        method: "GET",
        dataType: "json",
        url
      }).then(response => {
        try {
          const geoObj = JSON.parse(response.toString());
          resolve({
            status: 'ok',
            data: {
              userIpAddress: geoObj.query,
              city: geoObj.city,
              latitude: geoObj.lat,
              longtitude: geoObj.lon,
              isp: geoObj.isp
            }
          });
        } catch {
          reject({
            status: 'error',
            message: 'Error parsing Geo response'
          })
        }
      });
    });
  },
  findStats: function(hars){
    const contentTypes = [];
    const methods = {};
    const methodNames = [];
    const statuses = {};
    const domains = {};
    const ages = {};
    const geos = {};
    const geosNames = [];
    const wait = [];
    const startedDateTime = [];
    hars.forEach((o) => {
      const method = o.request.method;
      const status = o.response.status;
      if (!(method in methods)){
        methods[method] = 0;

      }
      methods[method] += 1;
      methodNames.push(method);

      if (!(status in statuses)){
        statuses[status] = 0;

      }

      statuses[status] += 1;
      domains[o.request.url] = true;

      if(o.response.headers.age){
        if(!(o.response.headers.contentType in ages)){
          ages[o.response.headers.contentType] = [];
        }
        ages[o.response.headers.contentType].push(o.response.headers.age);
      }

      contentTypes.push(o.response.headers.contentType);
      geos[o.geo.isp] = true;
      geosNames.push(o.geo.isp);
      wait.push(o.wait);
      startedDateTime.push(o.startedDateTime);
    });

    const domainsCount = Object.keys(domains).length;
    const meanAges = {};
    const geosCount = Object.keys(geos).length;
    Object.keys(ages).forEach((o) => {
      try{
        meanAges[o] = ages[o].reduce((a, b) => { return parseInt(a, 10) + parseInt(b, 10) }, 0) / ages[o].length;
      } catch {}
    })

    return {
      contentTypes,
      methods,
      methodNames,
      statuses,
      domainsCount,
      meanAges,
      geosCount,
      geosNames,
      geos,
      wait,
      startedDateTime,
    };

  }
};
