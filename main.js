var canvas = document.querySelector('#waveform');
var canvasCtx = canvas.getContext('2d');
//var canvas2 = document.querySelector('#frequency');
var barCtx = canvas.getContext('2d');


var source;
var playbackRate = 1;
var volume = 0.75;
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

var audio = document.createElement('audio');

audio.preload = 'auto';
audio.controls = true;
audio.autoplay = false;

var src = document.createElement('source');
src.src = 'test.mp3';
audio.appendChild(src);
//document.body.appendChild(audio);

var input = document.querySelector('input');
input.addEventListener('change', function (data) {
  if (source) {
    source.stop(0);
  }

  console.log('change', data);
  var file = data.target.files[0];
  var reader = new FileReader
  reader.onload = function () {
    var buffer = reader.result;
    audioCtx.decodeAudioData(buffer)
    .then(function (buffer) {
      console.log('buffer', buffer);
      source = audioCtx.createBufferSource();
      console.log(source);
      source.buffer = buffer;


      // var buff = buffer.getChannelData(0);
      // // TODO: merge stereo channels
      // // signal[i] = (fb[2*i] + fb[2*i+1]) / 2;
      // // https://developer.mozilla.org/en-US/docs/Archive/Misc_top_level/Visualizing_Audio_Spectrum
      // var step = Math.floor((buffer.duration * buffer.sampleRate) / 1000);

      // for (var i = 0; i < buff.length; i+=step) {
      //   var height = (buff[i] * 100);
      //   //drawBar(canvasCtx, i/step, 100, 1, height, 'red');
      // }


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





      var analyser = audioCtx.createAnalyser();
      source.connect(analyser);
      gainNode = audioCtx.createGain();
      analyser.connect(gainNode);
      gainNode.gain.value = 0.75;
      gainNode.connect(audioCtx.destination);

      analyser.fftSize = 2048;
      var bufferLengthw = analyser.frequencyBinCount;
      var dataArrayw = new Uint8Array(bufferLengthw);

      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
      function draw() {
        drawVisual = requestAnimationFrame(draw);
        drawBars();
        drawWaveform();
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

      var freqAnalyser = audioCtx.createAnalyser();
      var freqAnalyser2 = audioCtx.createAnalyser();
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
      source.start(0);





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

audio.load();
audio.currentTime = 13;
audio.volume = 1;
//audio.play();
console.log(audio);

function play() {
  audio.currentTime = 0.01;
  audio.volume = volume;

  setTimeout(function() { audio.play(); }, 1);
}
