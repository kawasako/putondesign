window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;

class ImageList
  target: document.getElementById('thumbnail')

  constructor: (obj)->
    @data = obj.split(':=>')
    @src = @data[0]
    @name = @data[1]
    @create()
    @setEvent()
    @append()

  create: ->
    @container = document.createElement('li')
    @img = document.createElement('img')
    @img.src = @src
    @deleteBtn = document.createElement('i')
    @deleteBtn.innerText = '×'
    @nameText = document.createElement('p')
    @nameText.innerText = @name

  setEvent: ->
    _this = @
    #send image
    _this.container.addEventListener 'click', (e)->
      chrome.tabs.getSelected null, (tab)->
        chrome.tabs.sendRequest tab.id, {image: _this.src}, (response)->
          _this.container.className = 'hover'
    ,false
    document.addEventListener 'mousedown', (e)->
      _this.container.className = ''
    #delete image
    _this.deleteBtn.addEventListener 'click', (e)->
      e.stopPropagation()
      e.preventDefault()
      chrome.tabs.getSelected null, (tab)->
        chrome.tabs.sendRequest tab.id, {remove: _this.name}, (response)->
          _this.target.removeChild(_this.container)
    ,false

  append: ->
    @container.appendChild(@img)
    @container.appendChild(@deleteBtn)
    @container.appendChild(@nameText)
    @target.appendChild(@container)


# retinaMode
btnDelete = document.getElementById('retinaMode')
btnDelete.addEventListener 'click', (e)->
  chrome.tabs.getSelected null, (tab)->
    chrome.tabs.sendRequest tab.id, {retina: "yoro"}, (response)->

, false

# btnDelete
btnDelete = document.getElementById('btnDelete')
btnDelete.addEventListener 'click', (e)->
  chrome.tabs.getSelected null, (tab)->
    chrome.tabs.sendRequest tab.id, {clear: "yoro"}, (response)->

, false

# btnOff
btnOff = document.getElementById('btnOff')
btnOff.addEventListener 'click', (e)->
  chrome.tabs.getSelected null, (tab)->
    chrome.tabs.sendRequest tab.id, {imageoff: "yoro"}, (response)->

, false

# onLoad
chrome.tabs.getSelected null, (tab)->
  chrome.tabs.sendRequest tab.id, {on: "yoro"}, (response)->
    chrome.tabs.getSelected null, (tab)->
      chrome.tabs.sendRequest tab.id, {greeting: "hello"}, (response)->
        unless response.farewell == ''
          obj = response.farewell.split(',')
          i = 0
          while obj.length > i
            new ImageList(obj[i])
            i++

