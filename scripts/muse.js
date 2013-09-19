var Muse = Muse || {};

var Filters = Muse.Filters = {
  'lowpass' : 0,
  'highpass' : 1,
  'bandpass' : 2,
  'lowshelf' : 3,
  'highshelf' : 4,
  'peaking' : 5,
  'notch' : 6,
  'allpass' : 7
};

var Selectors = Muse.Selectors = {
  distortion : $('#distortion'),
  bass : $('#bass'),
  treble : $('#treble'),
  delay : $('#delay'),
  gain : $('#gain')
};

var Core = Muse.Core = {
  context : new window.webkitAudioContext(),

  createNode : function(type, freq, Q, gain) {
    var node = Muse.Core.context.createBiquadFilter();

    node.type = Muse.Filters[type.toLowerCase()];
    node.frequency.value = freq;
    node.Q.value = Q;
    node.gain.value = gain;

    return node;
  },

  createDelayNode : function(time)  {
    var delay = Muse.Core.context.createDelayNode(10);

    delay.delayTime.value = time;

    return delay;
  },

  distortionForm : function(samples, amount) {
    if (typeof amount === 'undefined') { amount = 0.1; }

    var k = 2 * amount/ (1 - amount),
        curve = new Float32Array(samples);

    for (var i = 0; i < samples; i++) {
      var x = (i - 0) * (1 - (-1)) / (samples - 0) + (-1);
      curve[i] = (1 + k) * x / (1+ k * Math.abs(x));
    }

    return curve;
  }

};

var Guitar = Muse.Guitar = {

  nodes : {
    distortion : Muse.Core.context.createWaveShaper(),
    bass : Muse.Core.createNode('lowshelf', 440, 0, Muse.Selectors.bass),
    treble : Muse.Core.createNode('highshelf', 1700, 0, Muse.Selectors.treble),
    delay : Muse.Core.createDelayNode(0),
    gain : Muse.Core.context.createGainNode()
  },

  eventBindings : function()  {
    var that = this;
    console.log('eventBindings');

    Muse.Selectors.gain.dial({'change': function (v) {
      that.nodes.gain.gain.value = v / 100;
    }});

    Muse.Selectors.distortion.dial({'change': function (v) {
      that.nodes.distortion.curve = Muse.Core.distortionForm(Muse.Core.context.sampleRate, v / 100);
    }});

    Muse.Selectors.bass.dial({'change': function (v) {
      that.nodes.bass.gain.value = v / 100;
    }});

    Muse.Selectors.treble.dial({'change': function (v) {
      that.nodes.treble.gain.value = v / 100;
    }});
  },

  init : function() {
    $('.panel__equalizer').bars();
    this.eventBindings();
  },

  streaming : function(stream) {
    var guitar = Muse.Core.context.createMediaStreamSource(stream);

    Muse.Guitar.nodes.gain.gain.value = $('#gain').val() / 100;

    Muse.Guitar.nodes.distortion.curve = Muse.Core.distortionForm(Muse.Core.context.sampleRate)

    guitar.connect(Muse.Guitar.nodes.distortion);
    Muse.Guitar.nodes.distortion.connect(Muse.Guitar.nodes.bass);
    Muse.Guitar.nodes.bass.connect(Muse.Guitar.nodes.treble);
    Muse.Guitar.nodes.treble.connect(Muse.Guitar.nodes.delay);
    Muse.Guitar.nodes.delay.connect(Muse.Guitar.nodes.gain);
    Muse.Guitar.nodes.gain.connect(Muse.Core.context.destination)
  }

};

var Equalizer = Muse.Equalizer = {

  nodes : [],

  filter : 'bandpass',

  band : [],

  init : function(band) {
    this.band = band;
    this.createEquializerNode();
    this.createEquializer();
  },

  createEquializerNode : function() {
    var filter = null;

    for(var i = 0; i < this.band.length; i++)  {
      filter = Muse.Core.context.createBiquadFilter()
      filter.type = Muse.Filters[this.filter];
      filter.frequency.value = this.band[i];
      filter.Q.value = 1;
      filter.gain.value = 1;

      this.nodes.push(filter);
    }
  },

  createEquializer : function() {
    for(var i = 0, j = 1; j < this.nodes.length; i++, j++)  {
      this.nodes[i].connect(this.nodes[j]);
    }
  },

  modifyFrequency : function(band, freq)  {
    this.nodes[band].frequency.value = freq;
  },

  endPoint : function(start)  {
    if(start) {
      return this.nodes[0];
    }else {
      return this.nodes[this.nodes.length - 1];
    }
  }

};

// console.log("testing");

// Muse.Equalizer.init([1000,3000,4000,5000,6000]);

// /* Equalizer Testing. */
// var request = new XMLHttpRequest(),
//     sound = {};

// sound.source = Muse.Core.context.createBufferSource();
// sound.volume = Muse.Core.context.createGain();
// sound.volume.gain.value = 5;

// sound.source.connect(sound.volume);
// sound.volume.connect(Muse.Equalizer.endPoint(true));
// Muse.Equalizer.endPoint(false).connect(Muse.Core.context.destination);
// sound.source.loop = true;

// /* XHR Request to get the sound. */
// request.open("GET", "http://localhost:9000/sounds/bgscore.mp3", true);
// request.responseType = "arraybuffer";
// request.onload = function(e) {

//   var buffer = Muse.Core.context.createBuffer(this.response, false);
// console.log(buffer);
//   sound.buffer = buffer;
//   sound.source.buffer = sound.buffer;
//   sound.source.start(Muse.Core.context.currentTime);
// };
// request.send();

