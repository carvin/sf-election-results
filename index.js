const fs = require('fs-extra');
const JSZip = require('jszip');

const filename = process.argv[2];
const contest = process.argv[3];
const candidate = process.argv[4];

var election;
var precincts;

loadJsonFilesFromZip(filename,
  [
    'BallotTypeManifest.json',
    'BallotTypeContestManifest.json',
    'CandidateManifest.json',
    'Configuration.json',
    'ContestManifest.json',
    'CountingGroupManifest.json',
    'CvrExport.json',
    'PartyManifest.json',
    'PrecinctPortionManifest.json',
    'TabulatorManifest.json'
  ]).then(function(result){
    election = result;
    return fs.readJson('./precincts.geojson');
}).then(function(result){
    precincts = result;

    console.log(JSON.stringify(election.CvrExport[1]));
    var precinctPortionIdForVote = election.CvrExport[1].Original.PrecinctPortionId;
    var precinctPortionForVote = election.PrecinctPortionManifest.filter(function(x){ return x.Id == precinctPortionIdForVote; })[0];
    console.log(precinctPortionForVote.Description);
    console.log(precincts.features[0]);
    var geometry = precincts.features.filter(function(feature){
      return precinctPortionForVote.Description.indexOf(" " + feature.properties.prec_2012) > -1
            || precinctPortionForVote.Description.indexOf("/" + feature.properties.prec_2012) > -1
    })[0];
    console.log(geometry.properties.neighrep);
});

function loadJsonFilesFromZip(zipFile,filenames){
  var loaded = 0;
  var result = {};

  return new Promise(function(resolve,reject){
    fs.readFile(filename, function(err, data) {
      JSZip.loadAsync(data)
      .then(function(zip) {
        filenames.forEach(function(filename){
          var prettyName = filename.split('.')[0];

          zip
          .file(filename)
          .async("text").then(function(stringResult){
            loaded++;
            var json = JSON.parse(stringResult);
            if(json.List){ json = json.List; }
            if(json.Sessions){ json = json.Sessions; }
            result[prettyName] = json;
            console.log("Loaded " + prettyName);
            if(loaded == filenames.length){
              resolve(result);
            }
          })
        });
      });
    });

  });
}
