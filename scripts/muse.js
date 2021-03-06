/**
 * Muse Module.
 * @namespace Muse
 */
var Muse = Muse || {};

/**
 * Filter Module.
 * @module Filter
 */
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

/**
 * Dom Selecter Module.
 * @module Selector.
 */
var Selectors = Muse.Selectors = {
  distortion : $('#distortion'),
  bass : $('#bass'),
  treble : $('#treble'),
  delay : $('#delay'),
  gain : $('#gain')
};

/**
 * Core Module.
 * @module Core
 */
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

/**
 * Guitar Module.
 * @module Guitar
 */
var Guitar = Muse.Guitar = {

  delay : false,

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

    Muse.Selectors.delay.dial({'change': function (v) {
      that.nodes.delay.delayTime.value = v/10;
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