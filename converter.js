#!/usr/bin/env node

const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const ProgressBar = require('progress');
const path = require('path');
const fs = require('fs');

// Set ffmpeg path from the ffmpeg-static package
ffmpeg.setFfmpegPath(ffmpegPath);

// Get the file path from the command line arguments
const filePath = process.argv[2];

// Verify that the file path is provided
if (!filePath) {
  console.error('Please specify the path to the .ts file');
  process.exit(1);
}

// Verify that the file exists
if (!fs.existsSync(filePath)) {
  console.error('The file does not exist.');
  process.exit(1);
}

// Extract the directory and filename without extension
const directory = path.dirname(filePath);
const filename = path.basename(filePath, '.ts');

// Construct the output file path
const outputPath = path.join(directory, `${filename}.mp4`);

// Create a new progress bar instance and use shades_classic theme
const barOpts = {
  width: 20,
  total: 100,
  clear: true,
  complete: '=',
  incomplete: ' ',
  renderThrottle: 1,
  head: '>',
};
const bar = new ProgressBar('Converting [:bar] :percent :etas', barOpts);

// Convert the file using ffmpeg
ffmpeg(filePath)
  .on('progress', function (progress) {
    // Update the progress bar
    bar.update(progress.percent / 100);
  })
  .on('end', function () {
    bar.terminate();
    console.log(`Conversion finished: ${outputPath}`);
  })
  .on('error', function (err) {
    console.error('Error:', err.message);
  })
  .save(outputPath);
