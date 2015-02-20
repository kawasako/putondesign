(function() {
  var ImageList, btnDelete, btnOff;

  window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;

  ImageList = (function() {
    ImageList.prototype.target = document.getElementById('thumbnail');

    function ImageList(obj) {
      this.data = obj.split(':=>');
      this.src = this.data[0];
      this.name = this.data[1];
      this.create();
      this.setEvent();
      this.append();
    }

    ImageList.prototype.create = function() {
      this.container = document.createElement('li');
      this.img = document.createElement('img');
      this.img.src = this.src;
      this.deleteBtn = document.createElement('i');
      this.deleteBtn.innerText = '×';
      this.nameText = document.createElement('p');
      return this.nameText.innerText = this.name;
    };

    ImageList.prototype.setEvent = function() {
      var _this;
      _this = this;
      _this.container.addEventListener('click', function(e) {
        return chrome.tabs.getSelected(null, function(tab) {
          return chrome.tabs.sendRequest(tab.id, {
            image: _this.src
          }, function(response) {
            return _this.container.className = 'hover';
          });
        });
      }, false);
      document.addEventListener('mousedown', function(e) {
        return _this.container.className = '';
      });
      return _this.deleteBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        e.preventDefault();
        return chrome.tabs.getSelected(null, function(tab) {
          return chrome.tabs.sendRequest(tab.id, {
            remove: _this.name
          }, function(response) {
            return _this.target.removeChild(_this.container);
          });
        });
      }, false);
    };

    ImageList.prototype.append = function() {
      this.container.appendChild(this.img);
      this.container.appendChild(this.deleteBtn);
      this.container.appendChild(this.nameText);
      return this.target.appendChild(this.container);
    };

    return ImageList;

  })();

  btnDelete = document.getElementById('retinaMode');

  btnDelete.addEventListener('click', function(e) {
    return chrome.tabs.getSelected(null, function(tab) {
      return chrome.tabs.sendRequest(tab.id, {
        retina: "yoro"
      }, function(response) {});
    });
  }, false);

  btnDelete = document.getElementById('btnDelete');

  btnDelete.addEventListener('click', function(e) {
    return chrome.tabs.getSelected(null, function(tab) {
      return chrome.tabs.sendRequest(tab.id, {
        clear: "yoro"
      }, function(response) {});
    });
  }, false);

  btnOff = document.getElementById('btnOff');

  btnOff.addEventListener('click', function(e) {
    return chrome.tabs.getSelected(null, function(tab) {
      return chrome.tabs.sendRequest(tab.id, {
        imageoff: "yoro"
      }, function(response) {});
    });
  }, false);

  chrome.tabs.getSelected(null, function(tab) {
    return chrome.tabs.sendRequest(tab.id, {
      on: "yoro"
    }, function(response) {
      return chrome.tabs.getSelected(null, function(tab) {
        return chrome.tabs.sendRequest(tab.id, {
          greeting: "hello"
        }, function(response) {
          var i, obj, _results;
          if (response.farewell !== '') {
            obj = response.farewell.split(',');
            i = 0;
            _results = [];
            while (obj.length > i) {
              new ImageList(obj[i]);
              _results.push(i++);
            }
            return _results;
          }
        });
      });
    });
  });

}).call(this);
