function buildMetadata(sample) {

  // Use `d3.json` to fetch the metadata for a sample
  d3.json(`/metadata/${sample}`).then(function (response) {

  // Use d3 to select the panel with id of `#sample-metadata`
  let metadataPanel = d3.select('#sample-metadata');

  // Use `.html("") to clear any existing metadata
  d3.select('#sample-metadata').html("");

  // Use `Object.entries` to add each key and value pair to the panel
  Object.entries(response).forEach(([key, value]) => metadataPanel.append("ls").html(`<br>${key.toUpperCase()}: ${value}</br>`))

  // Build the Gauge Chart
  function buildGauge(frequency) {
    console.log(frequency);
    var frequency = +frequency;
    console.log(frequency);

    // Calculate angle of gauge needle (I decided to use 10 bins)
    var degrees = 180 - 180/10*(frequency+0.5),
        radius = 0.5;
    var radians = degrees * Math.PI/180;
    var x = radius * Math.cos(radians);
    var y = radius * Math.sin(radians);

    var mainPath = 'M -.0 -0.025 L .0 0.025 L ',
    pathX = String(x),
    space = ' ',
    pathY = String(y),
    pathEnd = ' Z';
    var path = mainPath.concat(pathX,space,pathY,pathEnd);

    var data = [{ 
      //Needle
      type: 'scatter',
      x: [0], y:[0],
      marker: {size: 20, color:'green'},
      showlegend: false,
      name: `${sample}`,
      text: frequency,
      hoverinfo: `Sample: ${name}`,
      },

      //Gauge
      { values: [50/10, 50/10, 50/10, 50/10, 50/10, 50/10, 50/10, 50/10, 50/10, 50/10, 50],
      rotation: 90,
      text: ['9', '8', '7', '6', '5', '4', '3', '2', '1', '0', ''],
      textinfo: 'text',
      textposition:'inside',
      marker: {colors:[
      'rgba(167, 204,  64, .5)', 
      'rgba(174, 209,  80, .5)',
      'rgba(182, 213,  95, .5)', 
      'rgba(189, 217, 111, .5)',
      'rgba(196, 221, 126, .5)', 
      'rgba(203, 225, 142, .5)',
      'rgba(210, 229, 158, .5)',
      'rgba(217, 233, 173, .5)',
      'rgba(224, 237, 189, .5)',
      'rgba(232, 241, 204, .5)',
      'rgba(255, 255, 255, 0)']},
      labels: ['9', '8', '7', '6', '5', '4', '3', '2', '1', '0', ''],
      hoverinfo: 'label',
      hole: .5,
      type: 'pie',
      showlegend: false
    }];

    var layout = {
    shapes:[{
        type: 'path',
        path: path,
        fillcolor: 'green',
        line: {
          color: 'green'
        }
      }],
    title: '<b>Belly Button Washing Frequency</b> <br> Scrubs per Week',
    height: 500,
    width: 500,
    xaxis: {zeroline:false, showticklabels:false,
                showgrid: false, range: [-1, 1]},
    yaxis: {zeroline:false, showticklabels:false,
                showgrid: false, range: [-1, 1]}
    };

    Plotly.newPlot('gauge', data, layout);



  }

  buildGauge(response.WFREQ);

  }); //metadata call end
} //buildMetaData() end

function buildCharts(sample) {

  // Use `d3.json` to fetch the sample data for the plots
  d3.json(`/samples/${sample}`).then(function (response) { console.log(response);
    // Build a Pie Chart
    // To grab top 10 sample_values, make an array of samples JS objects

    let samplesObjArr = [];

    for (let i=0; i<response.sample_values.length; i++) {
      let obj = {
        otu_id: response.otu_ids[i],
        otu_label: response.otu_labels[i],
        sample_value: response.sample_values[i]
      }
      samplesObjArr.push(obj);
    }

    // Sort the array of samples objects in descending order by sample values
    samplesObjArr.sort(function(a,b) {
      return b.sample_value - a.sample_value;
    })
    //console.log(samplesObjArr);

    let topTen=samplesObjArr.slice(0,10);
    console.log(Object.entries(topTen));

    var pie_data = [{
      labels: topTen.map(o => o.otu_id),
      values: topTen.map(o => o.sample_value),
      hovertext: topTen.map(o => o.otu_label),
      type: 'pie',
      marker: {colors: [
        'rgba(255, 155, 150, .5)', 
        'rgba(182, 108, 109, .5)',
        'rgba(203,  51,  59, .5)', 
        'rgba(186,  12,  47, .5)',
        'rgba(239,  96, 121, .5)', 
        'rgba(224,  62,  82, .5)',
        'rgba(157,  34,  53, .5)',
        'rgba(164,  52,  58, .5)',
        'rgba(182,  90, 101, .5)',
        'rgba(221, 135, 141, .5)',
    ]}
    }];

    var pieLayout = {
      title: `<b>Top 10 OTU - Pie Chart</b>`,
      height: 500,
      width: 500
    };
    
    Plotly.newPlot("pie", pie_data, pieLayout);


    // Build a Bubble Chart using the sample data
    let bubble_data =[];
    bubble_data = [{
      x: response.otu_ids,
      y: response.sample_values,
      hovertext: response.otu_labels,
      mode : 'markers',
      marker: {
        size: response.sample_values,
        color: response.otu_ids
      }
    }];

    let bubbleLayout = {
      title: '<b>Sample Values by OTU - Bubble Chart</b>',
      xaxis: {title: 'OTU ID'},
      yaxis: {title: 'Sample Values'}
    }

    Plotly.newPlot("bubble", bubble_data, bubbleLayout);

  })// d3.json end;
}

function init() {
  // Grab a reference to the dropdown select element
  var selector = d3.select("#selDataset");

  // Use the list of sample names to populate the select options
  d3.json("/names").then((sampleNames) => {
    sampleNames.forEach((sample) => {
      selector
        .append("option")
        .text(sample)
        .property("value", sample);
    });

    // Use the first sample from the list to build the initial plots
    const firstSample = sampleNames[0];
    buildCharts(firstSample);
    buildMetadata(firstSample);
  });
}

function optionChanged(newSample) {
  // Fetch new data each time a new sample is selected
  buildCharts(newSample);
  buildMetadata(newSample);
}

// Initialize the dashboard
init();
