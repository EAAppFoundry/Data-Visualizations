(function () {
  'use strict';

  var
    w = 450,
    h = 300,
    r = 100,
    ir = 45,
    textOffset = 14,
    tweenDuration = 250;

  var lines, valueLabels, nameLabels;
  var pieData = [];
  var oldPieData = [];
  var filteredPieData = [];

  // Calculate pie slices based on data
  var donut = d3.layout.pie().value(function (data) {
    return data.octetTotalCount;
  });

  // Calculate color from an ordinal scale
  var color = d3.scale.category20();

  // Draws the arcs
  var arc = d3.svg.arc()
    .startAngle(function (d) { return d.startAngle; })
    .endAngle(function (d) { return d.endAngle; })
    .innerRadius(ir)
    .outerRadius(r);

  ///////////////////////////////////////////////////////////
  // GENERATE FAKE DATA /////////////////////////////////////
  ///////////////////////////////////////////////////////////

  var arrayRange = 100000; //range of potential values for each item
  var arraySize;
  var streakerDataAdded;

  function fillArray() {
    return {
      port: "port",
      octetTotalCount: Math.ceil(Math.random() * (arrayRange))
    };
  }

  //////////
  // Create visualization and groups
  //////////

  var vis = d3.select('#target')
    .append('svg:svg')
    .attr('width', w)
    .attr('height', h);

  var arc_group = vis.append('svg:g')
    .attr('class', 'arc')
    .attr('transform', 'translate(' + (w / 2) + ',' + (h / 2) + ')');

  var paths = arc_group.append('svg:circle')
    .attr('fill', '#efefef')
    .attr('r', r);

  var updateInterval = window.setInterval(update, 3000);

  function update() {
    arraySize = Math.ceil(Math.random() * 10);
    streakerDataAdded = d3.range(arraySize).map(fillArray);

    oldPieData = filteredPieData;
    pieData = donut(streakerDataAdded);

    var totalOctets = 0;
    filteredPieData = pieData.filter(filterData);
    function filterData(element, index, array) {
      element.name = streakerDataAdded[index].port;
      element.value = streakerDataAdded[index].octetTotalCount;
      totalOctets += element.value;
      return (element.value > 0);
    }

    if (filteredPieData.length && oldPieData.length) {
      // remove placeholder
      arc_group.selectAll('circle').remove();

      paths = arc_group.selectAll('path').data(filteredPieData);
      paths.enter().append('svg:path')
        .attr('stroke', 'white')
        .attr('stroke-width', 0.5)
        .attr('fill', function (d, i) { return color(i); })
        .transition()
        .duration(tweenDuration)
        .attrTween('d', pieTween);

      paths
        .transition()
        .duration(tweenDuration)
        .attrTween('d', pieTween);

      paths.exit()
        .transition()
        .duration(tweenDuration)
        .attrTween('d', removePieTween)
        .remove();
    }
  }

  // Interpolate the arcs in data space.
  function pieTween(d, i) {
    var s0;
    var e0;
    if (oldPieData[i]) {
      s0 = oldPieData[i].startAngle;
      e0 = oldPieData[i].endAngle;
    } else if (!(oldPieData[i]) && oldPieData[i - 1]) {
      s0 = oldPieData[i - 1].endAngle;
      e0 = oldPieData[i - 1].endAngle;
    } else if (!(oldPieData[i - 1]) && oldPieData.length > 0) {
      s0 = oldPieData[oldPieData.length - 1].endAngle;
      e0 = oldPieData[oldPieData.length - 1].endAngle;
    } else {
      s0 = 0;
      e0 = 0;
    }
    var i = d3.interpolate({startAngle: s0, endAngle: e0}, {startAngle: d.startAngle, endAngle: d.endAngle});
    return function (t) {
      var b = i(t);
      return arc(b);
    };
  }

  function removePieTween(d, i) {
    var s0;
    var e0;
    s0 = 2 * Math.PI;
    e0 = 2 * Math.PI;
    var i = d3.interpolate({startAngle: d.startAngle, endAngle: d.endAngle}, {startAngle: s0, endAngle: e0});
    return function (t) {
      var b = i(t);
      return arc(b);
    };
  }

  update();
  update();
}());