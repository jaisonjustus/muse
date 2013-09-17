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
    var delay = Muse.Core.context.createDelayNode();

    delay.delayTime.value = time;

    return delay;
  }
};

var Player = Muse.Player = {

  nodes : {
    distortion : Muse.Core.context.createWaveShaper(),
    bass : Muse.Core.createNode('lowshelf', 440, 0, 0),
    treble : Muse.Core.createNode('highshelf', 1700, 0, 0),
    delay : Muse.Core.createDelayNode(0),
    gain : Muse.Core.context.createGainNode()
  },

  init : function() {
    $('.panel__knob').knob();
  }

}