var Global = {};

const app = new Vue({
  el: '#app',
  data: {
    mapboxLoaded: false,
    election: null,
    selectedContestID: 7,
    activePrecinct: null,
    activeHoverLocation: null,
    popupClicked: false,
    colors: ["#00697F","#AD005C","#129400","#D34C00","#3E2F5B"],
    colorsByCandidate: {}
  },
  computed: {
    legend: function(){
      var self = this;
      if(!self.election){ return []; }

      var candidates = self.election.candidates.filter(function(candidate){
        return self.colorsByCandidate[candidate.Id] != null && candidate.ContestId == self.selectedContestID;
      });

      var i = 1;
      var over = false;
      var result = candidates.map(function(candidate){
        if(i <= self.colors.length){
          candidate.color = self.colorsByCandidate[candidate.Id];
        } else {
          over = true;
        }
        i++;
        return candidate;
      });

      if(over){
        result.push({
          'Description': 'Other',
          'color': '#999999'
        });
      }
      return result;
    },
    contestOptions: function(){
      return this.election.contests.map(function(contest){
        return { title: contest.Description.replace('MEMBER, ','').replace('DISTRICT 5','D5'), value: contest.Id };
      });
    },
    contest: function(){
      if(!this.election || !this.selectedContestID){ return null; }
      var self = this;
      return this.election.contests.filter(function(contest){
        return contest.Id == self.selectedContestID;
      })[0];
    },
    activePrecinctResults: function(){
      if(!this.activePrecinct){ return null; }

      return { precinct: this.activePrecinct, candidates: this.resultsForPrecinctInCurrentContest(this.activePrecinct.properties.pid) };
    }
  },
  methods: {
    mapLoaded: function(map) {

      map.addSource("precincts",{
          "type": "geojson",
          "data": {
            "type": "FeatureCollection",
            "features": []
          }
        });

        var beneath = 'road-label';

      map.addLayer({
        'id': 'precincts',
        'type': 'fill',
        'source': 'precincts',
        'layout': {},
        'paint': {
          'fill-color': ["get","color"],
          'fill-opacity': ['get','breakpointPercent']
          //'fill-opacity': ["/",["get","winner_percent"],100]
        },
        'filter': ["==","hasContest",true]
      },beneath);

      map.addLayer({
        'id': 'precinct_lines',
        'type': 'line',
        'source': 'precincts',
        'layout': {},
        'paint': {
          'line-color': ["get","color"],
          'line-width': .75,
          'line-opacity': ["+",["get","breakpointPercent"],0.25]
          //'fill-opacity': ["/",["get","winner_percent"],100]
        },
        'filter': ["==","hasContest",true]
      },beneath);

      map.addLayer({
        'id': 'precinct_selected_fill',
        'type': 'fill',
        'source': 'precincts',
        'layout': {},
        'paint': {
          'fill-color': ["get","color"],
          'fill-opacity': 1
          //'fill-opacity': ["/",["get","winner_percent"],100]
        },
        'filter': ["==","pid","-1"]
      },beneath);

      map.addLayer({
        'id': 'precinct_selected_line',
        'type': 'line',
        'source': 'precincts',
        'layout': {},
        'paint': {
          'line-color': ["get","color"],
          'line-width': 3,
          'line-opacity': 1
        },
        'filter': ["==","pid","-1"]
      },beneath);

      Global.map = map;
      this.mapboxLoaded = true;
    },
    mapMouseMove: function(map, e){
      if(!this.popupClicked){
        this.activePrecinct = this.getPrecinctAtPosition(map,e);
        this.activeHoverLocation = this.activePrecinct ? [e.lngLat.lng, e.lngLat.lat] : null;
      }
    },
    mapClick: function(map, e){
      if(this.popupClicked){
        this.popupClicked = false;
        this.activePrecinct = null;
        this.activeHoverLocation = null;
      } else {
        this.activePrecinct = this.getPrecinctAtPosition(map,e);
        this.activeHoverLocation = this.activePrecinct ? [e.lngLat.lng, e.lngLat.lat] : null;
        this.popupClicked = this.activePrecinct != null;
      }
    },
    getPrecinctAtPosition: function(map,e){
      if(!map){ return null; }

      var radius = 2;

      var features = map.queryRenderedFeatures(
        [[e.point.x - radius / 2, e.point.y - radius / 2],
        [e.point.x + radius / 2, e.point.y + radius / 2]],{ layers: ['precincts'] });
      if(features && features.length > 0){
        return features[0];
      } else {
        return null;
      }
    },
    updateContest: function(){
      if(!this.contest){ return; }

      var self = this;
      var winner_percents = [];
      var precinct_winners = {};
      var winner_percents_by_winner = {};

      var features = this.election.precincts.filter(function(precinct){
          return precinct.geometry;
        }).map(function(precinct){
        var feature = precinct.geometry;

        if(!feature.properties){ feature.properties = {}; }
        feature.properties.pid = precinct.Id;
        feature.properties.name = precinct.Description;

        if(precinct.Contests && precinct.Contests[self.contest.Id]){
          feature.properties.hasContest = true;

          var winner_percent = 0;

          Object.keys(precinct.Contests[self.contest.Id]).forEach(function(key){

            if(key != "total"){
              var percent = precinct.Contests[self.contest.Id][key] / precinct.Contests[self.contest.Id]["total"];
              percent = percent * 100;

              if(percent > winner_percent){
                feature.properties.winner = key;
                winner_percent = percent;
              }
              feature.properties[self.contest.Id + "_" + key] = percent;
            }
          });

          if(feature.properties.winner){
            feature.properties.winner_percent = feature.properties[self.contest.Id + "_" + feature.properties.winner];
            winner_percents.push(feature.properties.winner_percent);

            if(!winner_percents_by_winner[feature.properties.winner]){
              winner_percents_by_winner[feature.properties.winner] = [];
            }
            winner_percents_by_winner[feature.properties.winner].push(feature.properties.winner_percent);
            if(!precinct_winners[feature.properties.winner]){
              precinct_winners[feature.properties.winner] = 0;
            }
            precinct_winners[feature.properties.winner]++;
          }
        } else {
          feature.properties.hasContest = false;
        }

        return feature;
      }).filter(function(feature){
        return feature.properties.hasContest;
      })

      var num_classes = 4;
      winner_percents = winner_percents.filter(function(percent){
        return percent != undefined;
      });
      var classifier = new geostats(winner_percents)
      var jenksResult = classifier.getJenks2(num_classes);
      var jenksResult_by_winner = {};



      Object.keys(winner_percents_by_winner).forEach(function(winner){
        var percents = winner_percents_by_winner[winner].length;
        if(percents.length > 1){
          var classifier_for_winner = new geostats(winner_percents_by_winner[winner]);
          var jenks = classifier_for_winner.getJenks2(num_classes);
          jenksResult_by_winner[winner] = jenks;
        } else {
          jenksResult_by_winner[winner] = jenksResult;
        }
      });

      var percent_min = .28;
      var percent_max = .84;

      var i = 0;

      self.colorsByCandidate = {};

      var candidateArray = Object.keys(precinct_winners).map(function(precinct_winner){
        return { Id: precinct_winner, count: precinct_winners[precinct_winner] };
      });

      candidateArray.sort(function(a,b){
        return b.count - a.count;
      })

      candidateArray.forEach(function(c){
        if(self.colors[i]){
          self.colorsByCandidate[c.Id] = self.colors[i] ? self.colors[i] : "#cccccc";
        }
        i++;
      })

      for(var i = 0; i < features.length; i++){
        var feature = features[i];
        var winner = feature.properties.winner;
        var breakpoint = 0;

        if(winner && jenksResult_by_winner[winner]){
          for(var x = 0; x < jenksResult_by_winner[winner].length - 1; x++){
            if(feature.properties.winner_percent >= jenksResult_by_winner[winner][x]){
              breakpoint = x;
            }
          }

          var fullPercent = (breakpoint / (jenksResult.length - 2));
          features[i].properties.breakpointPercent = percent_min + ((percent_max - percent_min) * fullPercent);
        }

        features[i].properties.color = self.colorsByCandidate[feature.properties.winner] ? self.colorsByCandidate[feature.properties.winner] : "#999999";
      }

      var geoJson = {
        "type": "FeatureCollection",
        "features": features
      }

      Global.map.getSource("precincts").setData(geoJson);
    },
    resultsForPrecinctInCurrentContest: function(pid){
      var self = this;
      var precinct = this.election.precincts.filter(function(p){ return p.Id == pid; })[0];
      if(!precinct){ return []; }

      var contest = precinct.Contests[this.selectedContestID];
      if(!contest){ return []; }

      var results = [];
      var total = contest["total"];

      Object.keys(contest).forEach(function(cid){
        if(cid == "total"){ return; }

        var candidate = self.election.candidates.filter(function(candidate){
          return candidate.Id == cid;
        })[0];

        results.push({
          name: candidate.Description,
          id: candidate.Id,
          votes: contest[cid],
          percent: (Math.round((contest[cid] / total) * 10000) / 100)
        });
      });

      results.sort(function(a,b){
        return b.percent - a.percent;
      });

      results.push({
        name: "Total",
        id: "total",
        votes: total,
        percent: 100,
        isTotal: true
      });

      results[0].winner = true;

      return results;
    }
  },
  mounted: function(){
    var self = this;
    fetch('https://us-central1-sf-elections.cloudfunctions.net/electionDataURL?election=03-2020').then(function(result){
      return result.json();
    }).then(function(json){
      return fetch(json.url);
    }).then(function(result){
      return result.json();
    }).then(function(json){
      self.election = json;
    });
  },
  watch: {
    activePrecinct: function(){
      var pid = this.activePrecinct ? this.activePrecinct.properties.pid : -1;

      //Global.map.setFilter('precinct_selected_fill',["==",["get","pid"],pid]);
      Global.map.setFilter('precinct_selected_line',["==",["get","pid"],pid]);
    },
    mapboxLoaded: function(){
      if(this.mapboxLoaded && this.election){
        this.updateContest();
      }
    },
    election: function(){
      if(this.mapboxLoaded && this.election){
        this.updateContest();
      }
    }
  }
});
