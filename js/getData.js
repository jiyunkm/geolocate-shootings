var test;
$(function(){    
  
  // Function exectued when form is submitted
  var getData = function(apiKey) {

    // Use crossorigin.me to gain access to the .csv file
    var filepath = 'https://crossorigin.me/http://www.gunviolencearchive.org/export-finished/download?uuid=2bde9dc6-f32c-46b2-b091-cefb1073fae5&filename=public%3A//export-06d8dd3b-26e6-4c22-9e9f-142cfb6bfa35.csv'
    var promises = []
    
    // Read data in with Papa.parse
    Papa.parse(filepath, {
      download: true,
      header: true,
      complete: function(results) {
        test = results;
        // Calculate lat/long for each data-point
        results.data.forEach(function(d, i){
          var keys = Object.keys(d)
          // Get city / state
          d.date = d['Incident Date']
          d.city = d['City Or County']
          d.state = d['State']
          d.injured = d['# Injured']
          d.killed = d['# Killed']

          // Delete unnecessary keys
          keys.forEach(function(key){
            delete d[key]
          })

          // Pass to getLatLong function to set object properties: push into promises array
          promises.push(getLatLong(d, apiKey))

        })
        
        // Download results once requests have returned
        $.when.apply($, promises).then(function() {
          download(results.data)                
        }, function() {
            // error occurred
        });        
      }
    })

  }
  

  // Function to get lat/long based on these data objects using openCageData
  var getLatLong = function(obj, apiKey) {
    var q = encodeURI(obj.city + ',' + obj.state + ', United States')
    
    // Return a promise in order to wait for all requests to finish
    return $.ajax({
        url:'http://api.opencagedata.com/geocode/v1/json?q=' + q + '&key=' + apiKey,
        type: "get",
        success:function(response) {

          // Set lat/lng of each data-point
          if(response.results == undefined) return
          obj.lat = response.results[0].geometry.lat
          obj.lng = response.results[0].geometry.lng
        }, 
        error:function(error) {
          console.log('error ', error)
        },
       dataType:"json"
    }) 
  }

  // Function to download the data to the client syntax from https://github.com/mholt/PapaParse/issues/175
  var download = function(data) {
      var blob = new Blob([Papa.unparse(data)]);
      if (window.navigator.msSaveOrOpenBlob)  // IE hack; see http://msdn.microsoft.com/en-us/library/ie/hh779016.aspx
          window.navigator.msSaveBlob(blob, "filename.csv");
      else
      {
          var a = window.document.createElement("a");
          a.href = window.URL.createObjectURL(blob, {type: "text/plain"});
          a.download = "Mass-Shooting-Data.csv";
          document.body.appendChild(a);
          a.click();  // IE: "Access is denied"; see: https://connect.microsoft.com/IE/feedback/details/797361/ie-10-treats-blob-url-as-cross-origin-and-denies-access
          document.body.removeChild(a);
      }

      // Change button
      $('#download').find('span').css('display', 'none')
      $('#download').find('text').text('Download')
      
    }
  
  // Assign event listener to button
  $("form").on('submit', function(){
      
      // Change button
      $('#download').find('span').css('display', 'inline')      
      $('#download').find('text').text('Calculating lat/lng...')

      // Get api key
      var input = $(this).find('input')      
      var apiKey = input.val()
      input.val('')
      getData(apiKey)
      return false
  })
})
