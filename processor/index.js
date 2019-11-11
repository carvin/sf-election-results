const fs = require('fs-extra');
const JSZip = require('jszip');
const turf = require('@turf/turf');

const filename = process.argv[2];
const contest = process.argv[3];
const candidate = process.argv[4];

var election;
var precinct_shapes;

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
    precinct_shapes = result;

    var ballots = [];

    console.log("Transforming data...");

    election.CvrExport.forEach(function(session){

      var entry = session.Modified ? session.Modified : session.Original;
      var precinct_id = entry.PrecinctPortionId;

      entry.Contests.forEach(function(contest){
        var ranks = [];
        
        contest.Marks.filter(function(mark){ return !mark.IsAmbiguous }).forEach(function(mark){
          ranks.push(mark);
        });

        ranks.sort(function(a,b){
          return a.Rank - b.Rank;
        });

        var choice;
        if(ranks.length > 0){
          var firstRankNum = ranks[0].Rank;
          var matching = ranks.filter(function(rank){
            return rank.Rank == firstRankNum
          });
          if(matching.length == 1){
            choice = ranks[0];
          }
        }


        var last_rank = 0;
        for (var i = 0; i < ranks.length; i++) {
            var rank = ranks[i];
            if (rank.Rank == last_rank) {
                last_rank = rank.Rank;
                ranks.splice(i - 1, ranks.length);
                ranks.push({ overvote: true });
                break;
            }
            last_rank = rank.Rank;
            // if (rank.Rank < last_rank) {
            //     break;
            // }

        }
        //
        ranks = ranks.filter(function(rank){
          return rank.overvote != true;
        });
        //
        // if(ranks.length > 0){
        //   ranks[0].isFirst = true;
        // }

        ballots.push({
          precinct: precinct_id,
          contest: contest.Id,
          ranks: ranks,
          choice: choice,
          counting_type: session.CountingGroupId
        });
      });
    });

    var precincts = election.PrecinctPortionManifest.map(function(precinct){
      precinct.geometry = shapeForPrecinct(election,precinct_shapes,precinct.Id);
      return precinct;
    });

    var final_geometries = [];

    precincts = precincts.map(function(precinct){
      precinct.Contests = {};

      var precinct_ballots = ballots.filter(function(ballot){
        return ballot.precinct == precinct.Id;
      });

      precinct_ballots.forEach(function(pb){
        if(!precinct.Contests[pb.contest]){ precinct.Contests[pb.contest] = {}; }

        // pb.ranks.forEach(function(rank){
        //   if(rank.overvote != true && rank.isFirst){
        //     if(!precinct.Contests[pb.contest][rank.CandidateId]){ precinct.Contests[pb.contest][rank.CandidateId] = 0; }
        //     if(!precinct.Contests[pb.contest]["total"]){ precinct.Contests[pb.contest]["total"] = 0; }
        //     precinct.Contests[pb.contest][rank.CandidateId]++;
        //     precinct.Contests[pb.contest]["total"]++;
        //   }
        // });

        if(pb.choice && pb.choice.CandidateId){
          if(!precinct.Contests[pb.contest][pb.choice.CandidateId]){ precinct.Contests[pb.contest][pb.choice.CandidateId] = 0; }
          if(!precinct.Contests[pb.contest]["total"]){ precinct.Contests[pb.contest]["total"] = 0; }
          precinct.Contests[pb.contest][pb.choice.CandidateId]++;
          precinct.Contests[pb.contest]["total"]++;
        }
      });

      return precinct;
    });

    var transformed = {
      contests: election.ContestManifest,
      candidates: election.CandidateManifest,
      counting_types: election.CountingGroupManifest,
      precincts: precincts
    };

    // console.log(transformed.precincts[0]);
    // console.log(transformed.precincts[1]);
    // console.log(transformed.precincts[2]);

    return fs.writeJson('./output.json',transformed);
}).then(function(){
  console.log("Done");
});

function shapeForPrecinct(election,precinct_shapes,precint_id){
  var precinctPortionForVote = election.PrecinctPortionManifest.filter(function(x){ return x.Id == precint_id; })[0];

  var geometry = precinct_shapes.features.filter(function(feature){
    return precinctPortionForVote.Description.indexOf(" " + feature.properties.prec_2012) > -1
          || precinctPortionForVote.Description.indexOf("/" + feature.properties.prec_2012) > -1
  });

  if(geometry.length > 1){
    geometry = turf.combine(turf.featureCollection(geometry)).features[0];
  } else {
    geometry = geometry[0];
  }

  return geometry;
}

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
