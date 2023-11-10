const dragDrop = require('drag-drop');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const ffprobePath = require('ffprobe-static').path;
const async = require('async');
const path = require('path');
const fs = require('fs');

// Create a queue with a concurrency of 2
const queue = async.queue((task, completed) => {
  const { file, progressBar, messageElement } = task;

  const outputPath = path.join(
    path.dirname(file.path),
    `${path.basename(file.path, '.ts')}.mp4`
  );

  ffmpeg(file.path)
    .output(outputPath)
    .on('progress', function (progress) {
      // Ensure progress.percent exists and is a number
      if (progress?.timemark) {
        // Electron's renderer process can update the UI directly
        const currentProgress = timemarkToSeconds(progress.timemark);
        progressBar.value = currentProgress;
      }
    })
    .on('end', function () {
      messageElement.textContent = 'Conversion finished!';
      messageElement.classList.remove('hidden');
      messageElement.classList.add('success');
      completed();
    })
    .on('error', function (err) {
      messageElement.textContent = 'Error: ' + err.message;
      messageElement.classList.remove('hidden');
      messageElement.classList.add('error');
      completed();
    })
    .run();
}, 2);

// Set ffmpeg path from the ffmpeg-static package
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

// Listen for the drop event
dragDrop('#drop_zone', function (files) {
  files.forEach((file, index) => {
    if (path.extname(file.path).toLowerCase() === '.ts') {
      const fileContainer = document.createElement('div');
      fileContainer.id = 'file-container-' + index;
      fileContainer.className = 'file-container';
      document.body.appendChild(fileContainer);

      const fileName = document.createElement('div');
      fileName.textContent = file.name;
      fileContainer.appendChild(fileName);

      const progressBar = document.createElement('progress');
      progressBar.className = 'file-progress';
      progressBar.value = 0;
      progressBar.max = 100;
      fileContainer.appendChild(progressBar);

      const messageElement = document.createElement('div');
      messageElement.className = 'message hidden';
      fileContainer.appendChild(messageElement);

      ffmpeg.ffprobe(file.path, function (err, metadata) {
        if (err) {
          alert('Error: ' + err.message);
          return;
        }

        const duration = metadata.format.duration; // Duration in seconds
        progressBar.max = duration; // Set the max value of the progress bar to the duration

        queue.push({ file, progressBar, messageElement });
      });
    } else {
      const messageElement = document.createElement('div');
      messageElement.textContent = 'Invalid file type. Please drop a .ts file.';
      messageElement.className = 'message error';
      document.body.appendChild(messageElement);
    }
  });
});

function timemarkToSeconds(timemark) {
  const parts = timemark.split(':');
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  const seconds = parseFloat(parts[2]);

  return hours * 3600 + minutes * 60 + seconds;
}

queue.drain(function () {
  alert('All conversion tasks have been processed.');
});
