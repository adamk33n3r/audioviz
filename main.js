var canvas = document.querySelector('#oscilloscope');
var canvasCtx = canvas.getContext('2d');
//var canvas2 = document.querySelector('#frequency');
var waveformCanvas = document.querySelector('#waveform');
var waveformCtx = waveformCanvas.getContext('2d');
var barCtx = canvas.getContext('2d');


var analyser;
var freqAnalyser;
var freqAnalyser2;
var source;
var playbackRate = 1;
var volume = 0.75;

waveformCanvas.addEventListener('click', function (event) {
  var x = event.offsetX;
  var y = event.offsetY;
  console.log('Clicked here:', x, y);
  var percent = x / waveformCanvas.width;
  console.log('Percentage:', percent);
  source.stop();
  createAudioSource(source.buffer);
  source.connect(analyser);
  source.connect(freqAnalyser);
  source.connect(freqAnalyser2);
  console.log('Playing at', percent* source.buffer.duration);
  source.start(0, percent * source.buffer.duration);
});

function createAudioSource(buffer) {
  var audioElement = new Audio(URL.createObjectURL(file));
  audioCtx.createMediaElementSource(audioElement);
  source = audioCtx.createBufferSource();
  source.buffer = buffer;
}

function speedUp() {
  playbackRate+=0.1;
  source.playbackRate.value = playbackRate;
}
function speedDown() {
  playbackRate-=0.1;
  source.playbackRate.value = playbackRate;
}

var gainNode;
function changeVolume(val) {
  volume = val;
  gainNode.gain.value = volume;
}

function drawLine(ctx, startX, startY, endX, endY, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.stroke();
  ctx.restore();
}

function drawBar(ctx, x, y, width, height, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width, height);
  ctx.restore();
}


var audioCtx = new (window.AudioContext || window.webkitAudioContext)();

var input = document.querySelector('input');
input.addEventListener('change', function (data) {
  if (source) {
    source.stop(0);
  }

  console.log('change', data);
  var file = data.target.files[0];
  var reader = new FileReader;
  reader.onload = function () {
    var buffer = reader.result;
    audioCtx.decodeAudioData(buffer)
    .then(function (buffer) {
      console.log('buffer', buffer);
      createAudioSource(buffer);


      var buff = buffer.getChannelData(0);
      // TODO: merge stereo channels
      // signal[i] = (fb[2*i] + fb[2*i+1]) / 2;
      // https://developer.mozilla.org/en-US/docs/Archive/Misc_top_level/Visualizing_Audio_Spectrum
      var step = Math.floor((buffer.duration * buffer.sampleRate) / 1000);

      waveformCtx.clearRect(0, 0, waveformCanvas.width, waveformCanvas.height);
      for (var i = 0; i < buff.length; i+=step) {
        var height = (buff[i] * 100);
        drawBar(waveformCtx, i/step, 100, 1, height, 'red');
      }


      // FFT_SIZE = 8192;
      // function getFrequencies(start) {
      //   frqRes = buffer.sampleRate / FFT_SIZE;
      //   //console.log(frqRes);
      //   var slice = buff.slice(start, start + FFT_SIZE);

      //   var im = new Array(slice.length);
      //   im.fill(0);
      //   miniFFT(slice, im);


      //   // Get first half because set isn't imaginary or something
      //   slice = slice.slice(0, slice.length / 2);
      //   canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
      //   step = Math.floor(slice.length / 1000);

      //   spectrum = [];
      //   for (var i = 0; i < slice.length; i++) {
      //     var d = Math.sqrt(slice[i] * slice[i] + im[i] * im[i]);
      //     //d = d < 1 ? 0 : 20 * Math.log(d);
      //     spectrum[i] = Math.min(d, 200);
      //   }
      //   for (var i = 0; i < spectrum.length; i++) {
      //     var height = (spectrum[i]);
      //     drawBar(canvasCtx, i/step, 400 - height, 1, height, 'blue');
      //   }
      // }





      analyser = audioCtx.createAnalyser();
      source.connect(analyser);
      gainNode = audioCtx.createGain();
      analyser.connect(gainNode);
      gainNode.gain.value = volume;
      gainNode.connect(audioCtx.destination);

      analyser.fftSize = 2048;
      var bufferLengthw = analyser.frequencyBinCount;
      var dataArrayw = new Uint8Array(bufferLengthw);

      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
      function draw() {
        drawVisual = requestAnimationFrame(draw);
        drawBars();
        drawWaveform();
        // Draw cursor
        var percent = audioCtx.currentTime / source.buffer.duration;
        console.log(percent);
        console.log(percent * waveformCanvas.width);
        drawBar(waveformCtx, percent * waveformCanvas.width, 0, 1, waveformCanvas.height, 'pink');
      }

      function drawWaveform() {
        analyser.getByteTimeDomainData(dataArrayw);
        canvasCtx.fillStyle = 'rgb(255, 255, 255)';
        //canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
        canvasCtx.lineWidth = 2;
        canvasCtx.strokeStyle = 'rgb(200, 200, 200)';
        canvasCtx.beginPath();
        var sliceWidth = canvas.width * 1.0 / bufferLengthw;
        var x = 0;
        for (var i = 0; i < bufferLengthw; i++) {
          var v = dataArrayw[i] / 255;
          var y = (canvas.height / 2) + (canvas.height / 4) * (v - 0.5);

          if ( i === 0) {
            canvasCtx.moveTo(x, y);
          } else {
            canvasCtx.lineTo(x, y);
          }

          x += sliceWidth;
        }

        canvasCtx.lineTo(canvas.width, canvas.height / 2);
        canvasCtx.stroke();

      }

      freqAnalyser = audioCtx.createAnalyser();
      freqAnalyser2 = audioCtx.createAnalyser();
      source.connect(freqAnalyser);
      source.connect(freqAnalyser2);
      freqAnalyser.fftSize = 8192;
      freqAnalyser2.fftSize = 256;
      freqAnalyser.maxDecibels = 0;
      freqAnalyser2.maxDecibels = 0;
      var bufferLength = freqAnalyser.frequencyBinCount;
      var bufferLength2 = freqAnalyser2.frequencyBinCount;
      var dataArray = new Uint8Array(bufferLength);
      var dataArray2 = new Uint8Array(bufferLength2);

      function drawBars() {
        freqAnalyser.getByteFrequencyData(dataArray);
        freqAnalyser2.getByteFrequencyData(dataArray2);

        barCtx.fillStyle = 'rgb(0, 0, 0)';
        barCtx.fillRect(0, 0, canvas.width, canvas.height);

        var barWidth = (canvas.width / bufferLength) * 2.5;
        var barWidth2 = (canvas.width / bufferLength2) * 2.5;
        var barHeight;
        var x = 0;
        for (var i = 0; i < bufferLength; i++) {
          barHeight = dataArray[i];
          barCtx.fillStyle = 'rgb(' + (barHeight + 100) + ', 50, 50)';
          barCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
          x += barWidth + 1;
        }
        x = 0;
        for (var i = 0; i < bufferLength2; i++) {
          barHeight = dataArray2[i];
          barCtx.fillStyle = 'rgb(' + (barHeight + 100) + ', 50, 50)';
          barCtx.fillRect(x, 0, barWidth2, barHeight);
          x += barWidth2 + 1;
        }
      }

      draw();




      //source.connect(audioCtx.destination);
      source.loop = false;
      source.playbackRate.value = playbackRate;
      source.start();





      return;
      var num = 0;
      var inter = setInterval(function () {
        getFrequencies(FFT_SIZE * num++);
      }, 100);
      setTimeout(function () {
        //clearInterval(inter);
      }, 2100);
    })
    .catch(function (error) {
      console.error('Error with decodng audio data', error);
    });
  };
  reader.readAsArrayBuffer(file);
});


var knob = document.getElementById('knob'),
circle = document.getElementById('pie'),
radius = parseInt(circle.getAttribute('r'), 10),
circumference = 2 * radius * Math.PI,
percentDisplay = document.querySelector('output');

knob.addEventListener('input', function () {
  var percentValue = (Math.abs(knob.value) / 100) * circumference;
  pie.style.strokeDasharray = percentValue + ' ' + circumference;
  percentDisplay.value = knob.value + '%';
});
