const fs = require('fs-extra');
const JSZip = require('jszip');

const filename = process.argv[2];
const contest = process.argv[3];
const candidate = process.argv[4];

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
  console.log(JSON.stringify(result.CvrExport[1]));
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
