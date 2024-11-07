
function ajaxcall(options) {
    return new Promise(function (resolve, reject) {
      fetch(options.url, {
        method: options.method,
        headers: options.headers,
        body: options.body
      }).then(function (response) {
        response.json().then(function (json) {
          resolve(json);
        }).catch(err => reject(err));
      }).catch(err => reject(err));
    });
  }

  //TODO: make this pretty
  function spinner(message) {
    return `<div class='mpmtspinner'>${message}</div>`;
  }