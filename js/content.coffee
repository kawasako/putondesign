# Swich
active = false
chrome.extension.onRequest.addListener (request, sender, sendResponse)->
  if request.on
    unless active
      new Main
      active = true
    sendResponse({message: 'ok'})

class Main

  constructor: ->
    window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem
    @File = new FileHandler()
    @ComparisonImage = new ComparisonImage()
    @requestListener()
    @dropArea = document.createElement('div')
    @dropAreaSet()
    @noEdit()
    document.addEventListener 'click', (e)->
      e.stopPropagation()
      e.preventDefault()
      unless e.toElement.dataNoedit
        if e.toElement.editer
          e.toElement.editer.active()
        else
          e.toElement.editer = new Editer(e.toElement)
    # location change cancel
    window.addEventListener 'beforeunload', ->
      return false

  requestListener: ->
    chrome.extension.onRequest.addListener (request, sender, sendResponse)=>
      if request.image
        @ComparisonImage.change(request.image)
        sendResponse({message: 'ok'})
      if request.imageoff
        @ComparisonImage.hide()
      # retina mode
      if request.retina
        @ComparisonImage.retina()
        sendResponse({message: 'ok'})
      if request.greeting
        sendResponse({farewell: @File.json})
      if request.remove
        @File.remove(request.remove)
        sendResponse({message: 'ok'})
      if request.clear
        @File.clear()
        sendResponse({message: 'ok'})

  noEdit: ->
    document.documentElement.dataNoedit = true
    document.body.dataNoedit = true

  dropAreaSet: ->
    @dropArea.dataNoedit = true
    @dropArea.style.paddingRight = '1%'
    @dropArea.style.position = 'fixed'
    @dropArea.style.top = 0
    @dropArea.style.bottom = 0
    @dropArea.style.right = 0
    @dropArea.style.zIndex = '99999'
    @dropArea.style.width = '49%'
    @dropArea.style.height = '100%'
    @dropArea.style.background = 'rgba(0, 0, 0, 0.8)'
    @dropArea.style.lineHeight = '30px'
    @dropArea.style.color = '#555'
    @dropArea.style.textAlign = 'right'
    @dropArea.style.fontSize = '12px'
    @dropArea.innerText = 'Drop image'
    @dropArea.addEventListener('dragover', (e)=>
      e.stopPropagation()
      e.preventDefault()
      e.dataTransfer.dropEffect = 'copy'
    , false)
    @dropArea.addEventListener('click', (e)=>
      document.documentElement.removeChild(@dropArea)
    , false)
    @dropArea.addEventListener('drop', (e)=>
      e.stopPropagation()
      e.preventDefault()
      i = 0
      while e.dataTransfer.files.length > i
        @File.save(e.dataTransfer.files[i])
        i++
      document.documentElement.removeChild(@dropArea)
    , false)
    document.addEventListener('dragover', (e)=>
      document.documentElement.appendChild(@dropArea)
    , false)

class UI

  constructor: ->
    @container = document.createElement('div')
    @container.id = 'uiMenu'
    @container.style.padding = '10px 0 0 0'
    @container.style.border = '1px solid #999'
    @container.style.position = 'fixed'
    @container.style.top = '10px'
    @container.style.left = '10px'
    @container.style.background = '#cfcfcf'
    @container.style.zIndex = '99999'
    document.documentElement.appendChild(@container)

  create: (name, fn)->
    elm = document.createElement('div')
    elm.addEventListener('click', fn)
    elm.style.width = '30px'
    elm.style.height = '30px'
    elm.style.background = ''
    @container.appendChild(elm)

# UI = new UI()
# UI.create 'cursor', ->
#   alert 'oge'

class FileHandler

  constructor: ->
    _this = @
    @files = []
    @json = ''
    window.requestFileSystem window.TEMPORARY, 1024*1024, (filesystem)->
      _this.fs = filesystem
      _this.reload()

  reload: ->
    _this = @
    reader = @fs.root.createReader()
    reader.readEntries (entries)->
      _this.files = entries
      _this.json = ''
      i = 0
      while _this.files.length > i
        _this.json += _this.files[i].toURL() + ':=>' + _this.files[i].name + ','
        i++
      _this.json = _this.json.slice(0, -1)

  save: (file)->
    _this = @
    @fs.root.getFile(file.name, {create: true, exclusive: false}, (fileEntry)->
      fileEntry.createWriter((fileWriter)->
        fileWriter.onwriteend = ->
          _this.reload()
        fileWriter.write(file)
      ,_this.error)
    ,_this.error)
    console.log file.name + " -> save"

  remove: (file)->
    _this = @
    @fs.root.getFile file, {}, (file)->
      file.remove ->
        console.log file.name + ' -> delete'
        _this.reload()

  clear: ->
    i = 0
    while @files.length > i
      @remove(@files[i].name)
      i++

  error: (err)->
    console.log "ERROR:" + err

class Editer
  outline: '1px dotted rgba(0, 0, 0, 0.8)'

  constructor: (target)->
    @target = target
    @name = @target.tagName
    @name += '#' + @target.id if @target.id
    @name += '.' + @target.className if @target.className
    @style = document.defaultView.getComputedStyle(@target, null)
    @type = @style.position
    @pos = {
      top: (if(@style.top == 'auto') then 0 else parseInt(@style.top))
      left: (if(@style.left == 'auto') then 0 else parseInt(@style.left))
    }
    @relative = {
      top: 0
      left: 0
    }
    @resultBox = document.createElement('div')
    @resultBox.dataNoedit = true
    @key = {
      37: {
        name: 'left',
        value: -1 },
      38: {
        name: 'top',
        value: -1 },
      39: {
        name: 'left',
        value: 1 },
      40: {
        name: 'top',
        value: 1 }
    }
    @edit = true
    @set()

  set: ->
    @target.style.outline = @outline
    if @type == 'static'
      @target.style.position = "relative"
    document.addEventListener 'mousedown', (e)=>
      @stop()
    document.addEventListener 'keydown', (e)=>
      if(@edit)
        point = (if(e.shiftKey) then 10 else 1)
        if(@key[e.keyCode])
          e.preventDefault()
          @moov(@key[e.keyCode].name, @key[e.keyCode].value * point)
    @resultBox.className = 'resultBox'
    @resultBox.style.visibility = 'hidden'
    @resultBox.style.padding = '5px'
    if @type == 'fixed'
      @resultBox.style.position = 'fixed'
    else
      @resultBox.style.position = 'absolute'
    @resultBox.style.lineHeight = '1.2'
    @resultBox.style.letterSpacing = '0'
    @resultBox.style.background = 'rgba(0, 0, 0, 0.8)'
    @resultBox.style.borderRadius = '3px'
    @resultBox.style.textAlign = 'left'
    @resultBox.style.color = 'white'
    @resultBox.style.fontSize = '10px'
    @target.parentElement.appendChild(@resultBox)

  active: ->
    @target.style.outline = @outline
    @edit = true

  stop: ->
    @target.style.outline = 'none'
    @edit = false

  moov: (vector, value)->
    @relative[vector] += value
    @pos[vector] += value
    @target.style.top = @pos['top'] + 'px'
    @target.style.left = @pos['left'] + 'px'
    @result()

  result: ->
    if 'hidden' == @resultBox.style.visibility
      @resultBox.style.visibility = 'visible'
    @resultBox.innerHTML = @name + '<br>top : ' + @relative.top + ' px<br>left : ' + @relative.left + ' px'
    top = @target.offsetTop + @target.offsetHeight - @resultBox.offsetHeight
    left = @target.offsetLeft + @target.offsetWidth - @resultBox.offsetWidth
    @resultBox.style.top = top + 'px'
    @resultBox.style.left = left + 'px'

  @resultHide: ->
    target = document.getElementsByClassName('resultBox')
    i = 0
    while target.length > i
      target[i].style.display = 'none'
      i++

  @resultShow: ->
    target = document.getElementsByClassName('resultBox')
    i = 0
    while target.length > i
      target[i].style.display = 'block'
      i++

class ComparisonImage

  constructor: ->
    @img = document.createElement('img')
    @img.dataNoedit = true
    @event = document.createEvent("MouseEvents")
    @event.initMouseEvent("mousedown", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null)
    @init()

  init: ->
    @img.style.position = 'absolute'
    @img.style.top = 0
    @img.style.left = 0
    @img.style.zIndex = -1
    document.body.style.opacity = 0.8
    document.documentElement.appendChild(@img)
    @Editer = new Editer(@img)
    @Editer.resultBox.style.display = 'none'
    @active()

  active: ->
    document.addEventListener 'keydown', (e)=>
      if e.altKey
        unless @Editer.edit
          document.dispatchEvent(@event)
          @Editer.active()

  change: (src)->
    @img.style.display = 'block'
    @img.src = src

  retina: ->
    @img.width = @img.offsetWidth * 0.5

  hide: ->
    @img.style.display = 'none'