
onmessage = (e) => {
  //console.log(watch)
  if (e.data == 'hi')
    postMessage('Hi from web worker')

  (e.data)()

  
}