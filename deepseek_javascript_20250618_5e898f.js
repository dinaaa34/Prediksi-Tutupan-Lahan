Map.centerObject(roi,10);

//----Set title of application----//
var title = ui.Panel([
  ui.Label({
    value : "Land-cover Kabupaten Indramayu",
    style : {fontSize: '22px', fontWeight:"bold", color:"Navy"}
  })
  ]);
  
Map.add(title);

//----create panel at teh right side----//
var panel = ui.Panel();
panel.style().set({
    width : '300px'
  });
  
ui.root.add(panel);

//----add content in panel----//
panel.add(ui.Panel([
  ui.Label({
    value : "*Land-Cover Kabupaten Indramayu*",
    style : {fontSize: '16px', fontWeight:"bold", color:"Black"}
  }),
  ui.Label('Menggunakan dataset citra satelit Sentinel-2 resolusi 10 m dengan feature:'+
  ' B2, B3, B4, B5, B6, B7, B8, B11, B12, NDVI, NDVI_STD, NDWI_STD, BSI_STD' +
  ' Kelas tutupan lahan: badan air, pemukiman, sawah, kebun campuran, tambak, hutan' + 
  ' Total sample 1350 sampel' +
  ' proporsi train dan testing data: 60:40' +
  ' Studi area: Kabupaten Indramayu and temporal tahunan dari tahun 2019 - 2023.', 
  {fontWeight: 'none', fontSize: '11px', margin: '10px 5px'}),
  ui.Label({
    value : "select classification method",
    style : {fontSize: '12px', fontWeight:"bold", color:"Black"}
  }),
  ]));

//----add value to get for button----//  

var classifier_select = ui.Select({
  items: [{label:'RF', value:'RF'}, {label:'SVM', value:'SVM'}],
  onChange: function() {
   }
  });

//----add button tahun Land-Cover----//
var getvalueclass = ui.Button({
  label: 'Land-Cover',
  onClick: function() {
    if (classifier_select.getValue() === 'RF'){
      print('Anda pilih metode klasifikasi: ' + classifier_select.getValue());
      
      var title = ui.Panel([
      ui.Label({
        value : "Land-Cover Indramayu Metode RF",
        style : {fontSize: '22px', fontWeight:"bold", color:"Navy"}
      }) 
      ])////
    Map.clear();
    Map.add(title);    
    Map.addLayer(sample, {color: 'black'}, 'sample', false);
    Map.addLayer(dataset, {min: 0.0,max: 0.3,bands: ['B4', 'B3', 'B2'], }, 'RGB', false);
    
    print(dataset);
    
    //----LEGEND----//
    {
    var palette = [ 
      '3399FF', //(0)  badan air  /biru muda  
      'F27F7F', //(1)  pemukiman   /pink        
      'F1EE11', //(2)  sawah   /kuning 
      'E2752A', ///3)  kebun campuran /coklat
      '783f04', //(4)  Tambak  /biru tua        
      '08660A', //(5)  hutan /hijau
    ];  
    var names = ['Water','Settlement','Paddy Field','Bare Land', 'Shrimp','Forest',];
    
    // set position of panel
    var legend = ui.Panel({
      style: {
        position: 'bottom-left',
        padding: '8px 15px'
      }
    });
    
    var legendTitle = ui.Label({
      value: 'Legend',
      style: {
        fontWeight: 'bold',
        fontSize: '18px',
        margin: '0 0 4px 0',
        padding: '0'
        }
    });
    
    legend.add(legendTitle);
    
    var makeRow = function(color, name) {
     
          // Create the label that is actually the colored box.
          var colorBox = ui.Label({
            style: {
              backgroundColor: '#' + color,
              // Use padding to give the box height and width.
              padding: '8px',
              margin: '0 0 4px 0'
            }
          });
     
          // Create the label filled with the description text.
          var description = ui.Label({
            value: name,
            style: {margin: '0 0 4px 6px'}
          });
     
          // return the panel
          return ui.Panel({
            widgets: [colorBox, description],
            layout: ui.Panel.Layout.Flow('horizontal')
          });
    };
    
    for (var i = 0; i < 6; i++) {
      legend.add(makeRow(palette[i], names[i]));
      }  
    Map.add(legend);
    }

    //Samples for train and test data = sample yang digunakan 1000 titik from arcgis
    var samples = sample;
                  // .map(function(feat){return feat.buffer(30) }); /// gunakan fungsi buffer untuk memperbanyak sample
     
    // Variable info = nilai value tiap kelas penggunaan lahan 
    var LULC = [0, 1, 2, 3, 4, 5];
    var classNames = ['badan air', 'pemukiman', 'sawah', 'kebun campuran', 'tambak','hutan']; 
    var classPalette = ['047cb6', 'ff57e2', 'f8ff00', 'f8bb00', '8d4800','38761d'];
    //feature yang digunakan sebagai klasifkasi (disesuaikan band/feature apa saja yang akan digunakan)
    // var features = ['B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B11', 'B12', 'NDVI', 'NDVI_STD', 'NDWI_STD', 'BSI_STD'];
    var features = ['B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B11', 'B12', 'NDVI', 'NDWI', 'BSI'];
    //columns yang akan di extract di tabel CSV = untuk bisa dilihat di rapidMiner
    // var columns = ['B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B11', 'B12', 'NDVI', 'NDVI_STD', 'NDWI_STD', 'BSI_STD', 'LULC', 'sample'];
    var columns = ['B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B11', 'B12', 'NDVI', 'NDWI', 'BSI', 'LULC', 'sample'];
    
    // Split samples to train and test per class = sample yang sebanyak 1000 tersebut dibagi menajdi train data dan test data
    samples = ee.FeatureCollection(LULC.map(function(value){
      var features = samples.filter(ee.Filter.eq('LULC', value)).randomColumn();
      var train = features.filter(ee.Filter.lte('random', 0.6)).map(function(feat){ return feat.set('sample', 'train')});
      var test = features.filter(ee.Filter.gt('random', 0.6)).map(function(feat){ return feat.set('sample', 'test')});
      return train.merge(test);
    })).flatten();
    
    // Extract samples to get information feature per sample = output for CSV
    var extract = dataset.sampleRegions({
      collection: samples,
      scale: 20,
      properties: ['LULC', 'sample'] //this var had train and test that contain feature value and colom LULC, sample
    });
    
    // Train samples for classification = SVM and RF
    var train = extract.filter(ee.Filter.eq('sample', 'train'));
    print('Train sample size', train.size());
    var test = extract.filter(ee.Filter.eq('sample', 'test'));
    print('Test sample size', test.size());
    
    
    //Visualisasi titik train dan test
    Map.addLayer(train, {color: 'black'}, 'Training sample', false);
    Map.addLayer(test, {color: 'white'}, 'testing sample', false);
    
    // Random forest model
    var model = ee.Classifier.smileRandomForest(900);
      var model = model.train(train, 'LULC', features);
      var classified_image = dataset.classify(model);
    
      // Test model
      var testAccuracy = test.classify(model, 'predicted').errorMatrix('LULC', 'predicted');
      print('Confusion matrix RF Model', testAccuracy, 'Accuracy RF Model', testAccuracy.accuracy(), 'Kappa RF Model', testAccuracy.kappa());
      print("Consumer's accuracy", testAccuracy.consumersAccuracy());
      print("Producer's accuracy", testAccuracy.producersAccuracy());
    
      // Apply model
      var lc = dataset.classify(model, 'lulc').clip(roi).set('lulc_class_values', LULC, 'lulc_class_palette', classPalette, 'lulc_class_names', classNames);
      Map.addLayer(lc, {}, 'LULC_RF_Kabupaten_Indramayu_2023');
       
      ////RF_importance////
      var rf_dict = model.explain();
      print('Explain variable important',rf_dict);
      var rf_variable_importance = ee.Feature(null, ee.Dictionary(rf_dict).get('importance'));
       
      var rf_chart =
      ui.Chart.feature.byProperty(rf_variable_importance)
      .setChartType('ColumnChart')
      .setOptions({
      title: 'RF Variable Importance',
      legend: {position: 'none'},
      hAxis: {title: 'Bands'},
      vAxis: {title: 'Importance'}
      });
       
      // print(rf_chart);
      // Chart: Location and Plot
      rf_chart.style().set({
        position: 'bottom-right',
        width: '250px',
        height: '250px'
      });
      Map.add(rf_chart);
      
      //area calculate
      var lcArea = lc;
      
      print(lcArea, {}, 'Citra Hasil Klasifikasi RF');
      var classNames = lcArea.get('lulc_class_names');
      var classValues = lcArea.get('lulc_class_values');
      // print(classValues, {}, 'classValues');
      // print(classNames, {}, 'classNames');
      var dict = ee.Dictionary({ classNames: classNames, classValues: classValues });
      
      dict.evaluate(function(obj){
        var names = obj.classNames;
        var values = obj.classValues;
        var area = values.map(function(value, index){
          var featureArea = lcArea.eq(value).multiply(ee.Image.pixelArea().divide(10000)).reduceRegion({
            reducer: ee.Reducer.sum(),
            scale: 10,
            geometry: roi,
            bestEffort: true
            // print(featureArea);
          }).get('lulc');
       
          var list = ee.List([ names[index], ee.Number(featureArea).ceil(), 'Ha' ]);
          return list;
        });
        
        ee.List(area).evaluate(function(tableArea){
          tableArea.unshift(['Land cover', 'Area', 'Unit']);
          
          var chart = ui.Chart(tableArea, 'Table').setOptions({
            pageSize: 20
          });
          // print(chart);
          // Chart: Location and Plot
          chart.style().set({
          position: 'top-right',
          width: '200px',
          height: '200px'
           });
          Map.add(chart);
      });
      
      //Export image and samples
      Export.table.toDrive({
        collection: extract,
        fileFormat: 'CSV',
        selectors: columns,
        description: 'LULC_V3_RF_2020',
        folder: 'LULC_RF_V3_2020'
      });
    
       //Export image hasil klasifikasi to Google Drive
      Export.image.toDrive({
        image: lcArea,
        region: roi,
        description: 'LULC_V3_RF_2020',
        scale: 10
         
        });
        
      //Export image to an Earth Engine asset
      Export.image.toAsset({
        image: lcArea,
        region: roi,
        description: 'LULC_V3_RF_V3_2020',
        scale: 10
          
        });
    });
    
    }
  
    if (classifier_select.getValue() === 'SVM'){
      print('Anda pilih metode kalsifikasi: ' + classifier_select.getValue());
      
      var title = ui.Panel([
      ui.Label({
        value : "Land-Cover Indramayu Metode SVM",
        style : {fontSize: '22px', fontWeight:"bold", color:"Navy"}
      })
      ])////
    Map.clear();
    Map.add(title);    
    Map.addLayer(sample, {color: 'black'}, 'sample', false);
    Map.addLayer(dataset, {min: 0.0,max: 0.3,bands: ['B4', 'B3', 'B2'], }, 'RGB', false);
    
    print(dataset);
    
    //----LEGEND----//
    {
    var palette = [ 
      '3399FF', //(0)  badan air  /biru muda  
      'F27F7F', //(1)  pemukiman   /pink        
      'F1EE11', //(2)  sawah   /kuning 
      'E2752A', ///3)  kebun campuran /coklat
      '783f04', //(4)  Tambak  /biru tua        
      '08660A', //(5)  hutan /hijau
    ];  
    var names = ['Water','Settlement','Paddy Field','Bare Land', 'Shrimp','Forest',];
    
    // set position of panel
    var legend = ui.Panel({
      style: {
        position: 'bottom-left',
        padding: '8px 15px'
      }
    });
    
    var legendTitle = ui.Label({
      value: 'Legend',
      style: {
        fontWeight: 'bold',
        fontSize: '18px',
        margin: '0 0 4px 0',
        padding: '0'
        }
    });
    
    legend.add(legendTitle);
    
    var makeRow = function(color, name) {
     
          // Create the label that is actually the colored box.
          var colorBox = ui.Label({
            style: {
              backgroundColor: '#' + color,
              // Use padding to give the box height and width.
              padding: '8px',
              margin: '0 0 4px 0'
            }
          });
     
          // Create the label filled with the description text.
          var description = ui.Label({
            value: name,
            style: {margin: '0 0 4px 6px'}
          });
     
          // return the panel
          return ui.Panel({
            widgets: [colorBox, description],
            layout: ui.Panel.Layout.Flow('horizontal')
          });
    };
    
    for (var i = 0; i < 6; i++) {
      legend.add(makeRow(palette[i], names[i]));
      }  
    Map.add(legend);
    }
    
    //Samples for train and test data = sample yang digunakan 1000 titik from arcgis
    var samples = sample;
                  // .map(function(feat){return feat.buffer(30) }); /// gunakan fungsi buffer untuk memperbanyak sample
     
    // Variable info = nilai value tiap kelas penggunaan lahan 
    var LULC = [0, 1, 2, 3, 4, 5];
    var classNames = ['badan air', 'pemukiman', 'sawah', 'kebun campuran', 'tambak','hutan']; 
    var classPalette = ['047cb6', 'ff57e2', 'f8ff00', 'f8bb00', '8d4800','38761d'];
    //feature yang digunakan sebagai klasifkasi (disesuaikan band/feature apa saja yang akan digunakan)
    // var features = ['B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B11', 'B12', 'NDVI', 'NDVI_STD', 'NDWI_STD', 'BSI_STD'];
    var features = ['B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B11', 'B12', 'NDVI', 'NDWI', 'BSI'];
    //columns yang akan di extract di tabel CSV = untuk bisa dilihat di rapidMiner
    // var columns = ['B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B11', 'B12', 'NDVI', 'NDVI_STD', 'NDWI_STD', 'BSI_STD', 'LULC', 'sample'];
    var columns = ['B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B11', 'B12', 'NDVI', 'NDWI', 'BSI', 'LULC', 'sample'];
    
    // Split samples to train and test per class = sample yang sebanyak 1000 tersebut dibagi menajdi train data dan test data
    samples = ee.FeatureCollection(LULC.map(function(value){
      var features = samples.filter(ee.Filter.eq('LULC', value)).randomColumn();
      var train = features.filter(ee.Filter.lte('random', 0.6)).map(function(feat){ return feat.set('sample', 'train')});
      var test = features.filter(ee.Filter.gt('random', 0.6)).map(function(feat){ return feat.set('sample', 'test')});
      return train.merge(test);
    })).flatten();
    
    // Extract samples to get information feature per sample = output for CSV
    var extract = dataset.sampleRegions({
      collection: samples,
      scale: 20,
      properties: ['LULC', 'sample'] //sample ini udah ada train sama test dan LULC beisi value tiap penggunaan lahan
    });
    
    // Train samples for classification = SVM and RF
    var train = extract.filter(ee.Filter.eq('sample', 'train'));
    print('Train sample size', train.size());
    var test = extract.filter(ee.Filter.eq('sample', 'test'));
    print('Test sample size', test.size());
    
    //Visualisasi titik train dan test
    Map.addLayer(train, {color: 'black'}, 'Training sample', false);
    Map.addLayer(test, {color: 'white'}, 'testing sample', false);
    
    // SVM model
    var model = ee.Classifier.libsvm({kernelType: 'RBF', gamma: 1, cost: 10});
      var model = model.train(train, 'LULC', features);
      var classified_image = dataset.classify(model);
      
      // Test model
      var testAccuracy = test.classify(model, 'predicted').errorMatrix('LULC', 'predicted');
      print('Confusion matrix SVM Model', testAccuracy, 'Accuracy SVM Model', testAccuracy.accuracy(), 'Kappa SVM Model', testAccuracy.kappa());
      print("user's acc. SVM model", testAccuracy.consumersAccuracy());
      print("Producer's acc. SVM model", testAccuracy.producersAccuracy());
    
      // Apply model
      var lc = dataset.classify(model, 'lulc').clip(roi).set('lulc_class_values', LULC, 'lulc_class_palette', classPalette, 'lulc_class_names', classNames);
      
      //Visualisasi model
      Map.addLayer(lc, {}, 'LULC_SVM_Kabupaten_Indramayu_2023');
    
      ////SVM_importance////
      var svm_dict = model.explain();
      print('Explain:',svm_dict);
      var svm_variable_importance = ee.Feature(null, ee.Dictionary(svm_dict));
       
      var svm_chart =
      ui.Chart.feature.byProperty(svm_variable_importance)
      .setChartType('ColumnChart')
      .setOptions({
      title: 'Support Vector Machine Variable Importance',
      legend: {position: 'none'},
      hAxis: {title: 'Bands'},
      vAxis: {title: 'Importance'}
      });
       
      // print(svm_chart);
      // Chart: Location and Plot
      svm_chart.style().set({
        position: 'bottom-right',
        width: '250px',
        height: '250px'
      });
      Map.add(svm_chart);
    
      ////area calculate////
      var lcArea = lc;
      
      print(lcArea, {}, 'Citra Hasil Klasifikasi SVM 2023');
      var classNames = lcArea.get('lulc_class_names');
      var classValues = lcArea.get('lulc_class_values');
      // print(classValues, {}, 'classValues');
      // print(classNames, {}, 'classNames');
      var dict = ee.Dictionary({ classNames: classNames, classValues: classValues });
      
      dict.evaluate(function(obj){
        var names = obj.classNames;
        var values = obj.classValues;
        var area = values.map(function(value, index){
          var featureArea = lcArea.eq(value).multiply(ee.Image.pixelArea().divide(10000)).reduceRegion({
            reducer: ee.Reducer.sum(),
            scale: 10,
            geometry: roi,
            bestEffort: true
            // print(featureArea);
          }).get('lulc');
          
          var list = ee.List([ names[index], ee.Number(featureArea).ceil(), 'Ha' ]);
          return list;
        });
        
        ee.List(area).evaluate(function(tableArea){
          tableArea.unshift(['Land cover', 'Area', 'Unit']);
          
          var chart = ui.Chart(tableArea, 'Table').setOptions({
            pageSize: 20
          });
          // print(chart);
          // Chart: Location and Plot
          chart.style().set({
          position: 'top-right',
          width: '200px',
          height: '200px'
           });
          Map.add(chart);
        });
      });
    
      ////Export image and samples////
      Export.table.toDrive({
        collection: extract,
        fileFormat: 'CSV',
        selectors: columns,
        description: 'LULC_V3_SVM_V3_2020',
        folder: 'SVM_V3_2023'
      });
    
       //Export image hasil klasifikasi to Google Drive
        Export.image.toDrive({
        image: lcArea,
        region: roi,
        description: 'LULC_V3_SVM_V3_2020',
        scale: 10
          
        });
        
        //Export image to an Earth Engine asset
        Export.image.toAsset({
        image: lcArea,
        region: roi,
        description: 'LULC_V3_SVM_V3_2020',
        scale: 10
        
        });
          
    }

  
  }
});

panel.widgets().set(1, classifier_select);
panel.widgets().set(2, getvalueclass);