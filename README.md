# SF Election Results Processor/Viewer

This repo contains two elements:
* A node app that processes SF election data, matching ballots with precinct shapes
* A simple viewer web app, built in Vue, which displays the aforementioned data.

Note that this web app only calculates first-choice votes, not ranked votes.

Also, thanks to [dbaron/sf-elections-rcv](https://github.com/dbaron/sf-elections-rcv) which I referenced in making this.

## Instructions for processing and viewing election data

1. Run ```npm install``` in the ```processor``` directory to install dependencies.

2. Get an election JSON zip file ready. You can get them at the [SF Elections website.](https://sfelections.sfgov.org/november-5-2019-election-results-detailed-reports)

3. You may want to make sure your precinct shape geojson is up-to-date. It's included here as ```precincts.geojson``` in the ```processor``` directory. I got this from [DataSF](https://data.sfgov.org/City-Management-and-Ethics/Election-Precincts-Current-Defined-2012/fhns-n8qp) – just click "Export", then select "GeoJSON."

4. Run ```node index.js ./dir/to/election_data.zip``` and wait

5. Place ```output.json``` in the ```data``` sub-directory in the ```viewer``` directory as ```11-05-19.json`` – you may change this filename in ```main.js```.

6. To run the viewer locally, you'll just need a simple server running. For example, on macOS, head to the ```viewer``` directory in Terminal and run ```python -m SimpleHTTPServer 8080``` and you'll be able to view the web app at http://0.0.0.0:8080 in your browser.

Let me know if you have any questions!
