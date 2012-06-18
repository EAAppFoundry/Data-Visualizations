(function () {
  'use strict';

  var
    w = 480,
    h = 300,
    r = 100,
    ir = 70,
    textOffset = 14,
    tweenDuration = 250;

  var lines, valueLabels, nameLabels, legendIndicators;
  var pieData = [];
  var oldPieData = [];
  var filteredPieData = [];

  // Calculate pie slices based on data
  var donut = d3.layout.pie().value(function (data) {
    return data.totalAmount;
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

  var advertisers = ['Avon', 'Coca-Cola', 'Wendy\'s', 'Dell Computer'];
  var agencies = ['Deutsh Inc', 'Conair Corporation', 'Arnold Worldwide', 'Argent Trading', 'Allscope Services'];
  var quarters = ['1Q10', '2Q10', '3Q10', '4Q10'];

  function fillArray() {
    var advertiser = advertisers[Math.floor((Math.random() * advertisers.length))];
    return {
      advertiser: advertiser,
      agency: agencies[Math.floor((Math.random() * agencies.length))],
      totalAmount: Math.floor((Math.random() * 150000) + 1),
      name: quarters[Math.floor((Math.random() * quarters.length))] + ' ' + advertiser
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
    .attr('transform', 'translate(' + ((w / 2) - r - 15) + ',' + ((h / 2) - (r / 2 - 10)) + ')');

  var label_group = vis.append('svg:g')
    .attr('class', 'label-group')
    .attr('transform', 'translate(270, -5)');

  var total_group = vis.append('svg:g')
    .attr('class', 'total-group')
    .attr('transform', 'translate(' + ((w / 2) - 115) + ',' + ((h / 2) - 40) + ')');

  var legend_group = vis.append('svg:g')
    .attr('transform', 'translate(270, -5)');

  var totalDollars = total_group.append('svg:text')
    .attr('class', 'total')
    .attr('dy', 7)
    .style('fill', '#666666')
    .attr('text-anchor', 'middle')
    .text('Loading...');

  var paths = arc_group.append('svg:circle')
    .attr('fill', '#efefef')
    .attr('r', r);

  function onCellEnter(d) {
    var self = d3.select(this);
    var currentFillColor = d3.hsl(self.attr('fill'));
    self.attr('data-fill-original', currentFillColor.toString());
    self.attr('fill', currentFillColor.brighter('.3'));
  }

  function onCellExit(d) {
    var self = d3.select(this);
    var originalFill = self.attr('data-fill-original');
    self.attr('fill', d3.hsl(originalFill));
  }

  function update() {
    arraySize = Math.ceil(Math.random() * 10);
    streakerDataAdded = d3.range(arraySize).map(fillArray);

    oldPieData = filteredPieData;
    pieData = donut(streakerDataAdded);

    var totalAmounts = 0;
    filteredPieData = pieData.filter(filterData);
    function filterData(element, index, array) {
      element.name = streakerDataAdded[index].name;
      element.value = streakerDataAdded[index].totalAmount;
      totalAmounts += element.value;
      return (element.value > 0);
    }

    var format = function (amt) { return '$' + d3.format(',.0f')(amt) };

    totalDollars.text(function () {
      return format(totalAmounts);
    });

    if (filteredPieData.length && oldPieData.length) {
      // remove placeholder
      arc_group.selectAll('circle').remove();

      if (valueLabels)
        valueLabels.remove();

      valueLabels = label_group.selectAll('text.value').data(filteredPieData)
        .attr('dy', function (d) { return 5; });

      var textDepth = 0;

      valueLabels.enter().append('svg:text')
        .attr('class', 'value')
        .attr('transform', function (d) {
          return 'translate(0,' + (textDepth += 20) + ')';
          textDepth += 20;
        })
        .attr('dy', 5)
        .style('fill', '#333333')
        .text(function (d) { return d.name + ' (' + format(d.value) + ')'; });

      textDepth = 0;

      if (legendIndicators)
        legendIndicators.remove();

      legendIndicators = legend_group.selectAll().data(filteredPieData)
        .attr('dy', function (d) { return 5; });

      legendIndicators.enter().append('svg:rect')
        .attr('rx', 3)
        .attr('ry', 3)
        .attr('x', -20)
        .attr('y', -7)
        .attr('width', 15)
        .attr('height', 15)
        .attr('transform', function (d) {
          return 'translate(0,' + (textDepth += 20) + ')';
        })
        .attr('stroke', function (d, i) { return d3.hsl(color(i)).darker(2); })
        .attr('stroke-width', 0.5)
        .style('fill', function (d, i) { return color(i); });

      paths = arc_group.selectAll('path').data(filteredPieData);
      paths.enter().append('svg:path')
        .on('click', function (d) { update(); })
        .on('mouseover', onCellEnter)
        .on('mouseout', onCellExit)
        .attr('stroke', function (d, i) { return d3.hsl(color(i)).darker(1); })
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