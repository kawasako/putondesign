(function() {
  var ComparisonImage, Editer, FileHandler, Main, UI, active;

  active = false;

  chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
    if (request.on) {
      if (!active) {
        new Main;
        active = true;
      }
      return sendResponse({
        message: 'ok'
      });
    }
  });

  Main = (function() {
    function Main() {
      window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
      this.File = new FileHandler();
      this.ComparisonImage = new ComparisonImage();
      this.requestListener();
      this.dropArea = document.createElement('div');
      this.dropAreaSet();
      this.noEdit();
      document.addEventListener('click', function(e) {
        e.stopPropagation();
        e.preventDefault();
        if (!e.toElement.dataNoedit) {
          if (e.toElement.editer) {
            return e.toElement.editer.active();
          } else {
            return e.toElement.editer = new Editer(e.toElement);
          }
        }
      });
      window.addEventListener('beforeunload', function() {
        return false;
      });
    }

    Main.prototype.requestListener = function() {
      var _this = this;
      return chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
        if (request.image) {
          _this.ComparisonImage.change(request.image);
          sendResponse({
            message: 'ok'
          });
        }
        if (request.imageoff) {
          _this.ComparisonImage.hide();
        }
        if (request.retina) {
          _this.ComparisonImage.retina();
          sendResponse({
            message: 'ok'
          });
        }
        if (request.greeting) {
          sendResponse({
            farewell: _this.File.json
          });
        }
        if (request.remove) {
          _this.File.remove(request.remove);
          sendResponse({
            message: 'ok'
          });
        }
        if (request.clear) {
          _this.File.clear();
          return sendResponse({
            message: 'ok'
          });
        }
      });
    };

    Main.prototype.noEdit = function() {
      document.documentElement.dataNoedit = true;
      return document.body.dataNoedit = true;
    };

    Main.prototype.dropAreaSet = function() {
      var _this = this;
      this.dropArea.dataNoedit = true;
      this.dropArea.style.paddingRight = '1%';
      this.dropArea.style.position = 'fixed';
      this.dropArea.style.top = 0;
      this.dropArea.style.bottom = 0;
      this.dropArea.style.right = 0;
      this.dropArea.style.zIndex = '99999';
      this.dropArea.style.width = '49%';
      this.dropArea.style.height = '100%';
      this.dropArea.style.background = 'rgba(0, 0, 0, 0.8)';
      this.dropArea.style.lineHeight = '30px';
      this.dropArea.style.color = '#555';
      this.dropArea.style.textAlign = 'right';
      this.dropArea.style.fontSize = '12px';
      this.dropArea.innerText = 'Drop image';
      this.dropArea.addEventListener('dragover', function(e) {
        e.stopPropagation();
        e.preventDefault();
        return e.dataTransfer.dropEffect = 'copy';
      }, false);
      this.dropArea.addEventListener('click', function(e) {
        return document.documentElement.removeChild(_this.dropArea);
      }, false);
      this.dropArea.addEventListener('drop', function(e) {
        var i;
        e.stopPropagation();
        e.preventDefault();
        i = 0;
        while (e.dataTransfer.files.length > i) {
          _this.File.save(e.dataTransfer.files[i]);
          i++;
        }
        return document.documentElement.removeChild(_this.dropArea);
      }, false);
      return document.addEventListener('dragover', function(e) {
        return document.documentElement.appendChild(_this.dropArea);
      }, false);
    };

    return Main;

  })();

  UI = (function() {
    function UI() {
      this.container = document.createElement('div');
      this.container.id = 'uiMenu';
      this.container.style.padding = '10px 0 0 0';
      this.container.style.border = '1px solid #999';
      this.container.style.position = 'fixed';
      this.container.style.top = '10px';
      this.container.style.left = '10px';
      this.container.style.background = '#cfcfcf';
      this.container.style.zIndex = '99999';
      document.documentElement.appendChild(this.container);
    }

    UI.prototype.create = function(name, fn) {
      var elm;
      elm = document.createElement('div');
      elm.addEventListener('click', fn);
      elm.style.width = '30px';
      elm.style.height = '30px';
      elm.style.background = '';
      return this.container.appendChild(elm);
    };

    return UI;

  })();

  FileHandler = (function() {
    function FileHandler() {
      var _this;
      _this = this;
      this.files = [];
      this.json = '';
      window.requestFileSystem(window.TEMPORARY, 1024 * 1024, function(filesystem) {
        _this.fs = filesystem;
        return _this.reload();
      });
    }

    FileHandler.prototype.reload = function() {
      var reader, _this;
      _this = this;
      reader = this.fs.root.createReader();
      return reader.readEntries(function(entries) {
        var i;
        _this.files = entries;
        _this.json = '';
        i = 0;
        while (_this.files.length > i) {
          _this.json += _this.files[i].toURL() + ':=>' + _this.files[i].name + ',';
          i++;
        }
        return _this.json = _this.json.slice(0, -1);
      });
    };

    FileHandler.prototype.save = function(file) {
      var _this;
      _this = this;
      this.fs.root.getFile(file.name, {
        create: true,
        exclusive: false
      }, function(fileEntry) {
        return fileEntry.createWriter(function(fileWriter) {
          fileWriter.onwriteend = function() {
            return _this.reload();
          };
          return fileWriter.write(file);
        }, _this.error);
      }, _this.error);
      return console.log(file.name + " -> save");
    };

    FileHandler.prototype.remove = function(file) {
      var _this;
      _this = this;
      return this.fs.root.getFile(file, {}, function(file) {
        return file.remove(function() {
          console.log(file.name + ' -> delete');
          return _this.reload();
        });
      });
    };

    FileHandler.prototype.clear = function() {
      var i, _results;
      i = 0;
      _results = [];
      while (this.files.length > i) {
        this.remove(this.files[i].name);
        _results.push(i++);
      }
      return _results;
    };

    FileHandler.prototype.error = function(err) {
      return console.log("ERROR:" + err);
    };

    return FileHandler;

  })();

  Editer = (function() {
    Editer.prototype.outline = '1px dotted rgba(0, 0, 0, 0.8)';

    function Editer(target) {
      this.target = target;
      this.name = this.target.tagName;
      if (this.target.id) {
        this.name += '#' + this.target.id;
      }
      if (this.target.className) {
        this.name += '.' + this.target.className;
      }
      this.style = document.defaultView.getComputedStyle(this.target, null);
      this.type = this.style.position;
      this.pos = {
        top: (this.style.top === 'auto' ? 0 : parseInt(this.style.top)),
        left: (this.style.left === 'auto' ? 0 : parseInt(this.style.left))
      };
      this.relative = {
        top: 0,
        left: 0
      };
      this.resultBox = document.createElement('div');
      this.resultBox.dataNoedit = true;
      this.key = {
        37: {
          name: 'left',
          value: -1
        },
        38: {
          name: 'top',
          value: -1
        },
        39: {
          name: 'left',
          value: 1
        },
        40: {
          name: 'top',
          value: 1
        }
      };
      this.edit = true;
      this.set();
    }

    Editer.prototype.set = function() {
      var _this = this;
      this.target.style.outline = this.outline;
      if (this.type === 'static') {
        this.target.style.position = "relative";
      }
      document.addEventListener('mousedown', function(e) {
        return _this.stop();
      });
      document.addEventListener('keydown', function(e) {
        var point;
        if (_this.edit) {
          point = (e.shiftKey ? 10 : 1);
          if (_this.key[e.keyCode]) {
            e.preventDefault();
            return _this.moov(_this.key[e.keyCode].name, _this.key[e.keyCode].value * point);
          }
        }
      });
      this.resultBox.className = 'resultBox';
      this.resultBox.style.visibility = 'hidden';
      this.resultBox.style.padding = '5px';
      if (this.type === 'fixed') {
        this.resultBox.style.position = 'fixed';
      } else {
        this.resultBox.style.position = 'absolute';
      }
      this.resultBox.style.lineHeight = '1.2';
      this.resultBox.style.letterSpacing = '0';
      this.resultBox.style.background = 'rgba(0, 0, 0, 0.8)';
      this.resultBox.style.borderRadius = '3px';
      this.resultBox.style.textAlign = 'left';
      this.resultBox.style.color = 'white';
      this.resultBox.style.fontSize = '10px';
      return this.target.parentElement.appendChild(this.resultBox);
    };

    Editer.prototype.active = function() {
      this.target.style.outline = this.outline;
      return this.edit = true;
    };

    Editer.prototype.stop = function() {
      this.target.style.outline = 'none';
      return this.edit = false;
    };

    Editer.prototype.moov = function(vector, value) {
      this.relative[vector] += value;
      this.pos[vector] += value;
      this.target.style.top = this.pos['top'] + 'px';
      this.target.style.left = this.pos['left'] + 'px';
      return this.result();
    };

    Editer.prototype.result = function() {
      var left, top;
      if ('hidden' === this.resultBox.style.visibility) {
        this.resultBox.style.visibility = 'visible';
      }
      this.resultBox.innerHTML = this.name + '<br>top : ' + this.relative.top + ' px<br>left : ' + this.relative.left + ' px';
      top = this.target.offsetTop + this.target.offsetHeight - this.resultBox.offsetHeight;
      left = this.target.offsetLeft + this.target.offsetWidth - this.resultBox.offsetWidth;
      this.resultBox.style.top = top + 'px';
      return this.resultBox.style.left = left + 'px';
    };

    Editer.resultHide = function() {
      var i, target, _results;
      target = document.getElementsByClassName('resultBox');
      i = 0;
      _results = [];
      while (target.length > i) {
        target[i].style.display = 'none';
        _results.push(i++);
      }
      return _results;
    };

    Editer.resultShow = function() {
      var i, target, _results;
      target = document.getElementsByClassName('resultBox');
      i = 0;
      _results = [];
      while (target.length > i) {
        target[i].style.display = 'block';
        _results.push(i++);
      }
      return _results;
    };

    return Editer;

  })();

  ComparisonImage = (function() {
    function ComparisonImage() {
      this.img = document.createElement('img');
      this.img.dataNoedit = true;
      this.event = document.createEvent("MouseEvents");
      this.event.initMouseEvent("mousedown", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
      this.init();
    }

    ComparisonImage.prototype.init = function() {
      this.img.style.position = 'absolute';
      this.img.style.top = 0;
      this.img.style.left = 0;
      this.img.style.zIndex = -1;
      document.body.style.opacity = 0.8;
      document.documentElement.appendChild(this.img);
      this.Editer = new Editer(this.img);
      this.Editer.resultBox.style.display = 'none';
      return this.active();
    };

    ComparisonImage.prototype.active = function() {
      var _this = this;
      return document.addEventListener('keydown', function(e) {
        if (e.altKey) {
          if (!_this.Editer.edit) {
            document.dispatchEvent(_this.event);
            return _this.Editer.active();
          }
        }
      });
    };

    ComparisonImage.prototype.change = function(src) {
      this.img.style.display = 'block';
      return this.img.src = src;
    };

    ComparisonImage.prototype.retina = function() {
      return this.img.width = this.img.offsetWidth * 0.5;
    };

    ComparisonImage.prototype.hide = function() {
      return this.img.style.display = 'none';
    };

    return ComparisonImage;

  })();

}).call(this);
